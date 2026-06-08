export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe, STRIPE_PLAN_CONFIG } from '@/lib/stripe';
import { getPlanLimits } from '@/lib/plans';
import { sendNotificationEmail, buildEmailTemplate } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      // For development without webhook secret
      event = JSON.parse(body);
    }

    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const professorId = session.metadata?.professorId;
        const planKey = session.metadata?.planKey;
        const billing = session.metadata?.billing || 'monthly';

        if (professorId && planKey) {
          const planLimits = getPlanLimits(planKey);
          await prisma.professor.update({
            where: { id: professorId },
            data: {
              plan: planKey,
              maxStudents: planLimits.maxStudents,
              stripeSubscriptionId: session.subscription as string,
              stripeBillingCycle: billing,
            },
          });
          console.log(`Professor ${professorId} upgraded to ${planKey} (${billing})`);

          // Send confirmation email
          try {
            const prof = await prisma.professor.findUnique({
              where: { id: professorId },
              include: { user: { select: { email: true, name: true } } },
            });
            if (prof?.user?.email) {
              sendNotificationEmail({
                notificationId: process.env.NOTIF_ID_CONFIRMAO_DE_PAGAMENTO || '',
                recipientEmail: prof.user.email,
                subject: 'Pagamento confirmado - FitConnect',
                htmlBody: buildEmailTemplate('Pagamento Confirmado!', `
                  <p style="color: #4b5563;">Olá ${prof.user.name || ''}!</p>
                  <p style="color: #4b5563;">Seu pagamento foi processado com sucesso. Seu plano <strong>${planLimits.name}</strong> já está ativo!</p>
                  <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
                    <p style="color: #166534; margin: 5px 0;"><strong>Plano:</strong> ${planLimits.name}</p>
                    <p style="color: #166534; margin: 5px 0;"><strong>Alunos ativos:</strong> até ${planLimits.maxStudents}</p>
                    <p style="color: #166534; margin: 5px 0;"><strong>Cobrança:</strong> ${billing === 'annual' ? 'Anual' : 'Mensal'}</p>
                  </div>
                  <p style="color: #4b5563;">Obrigado por confiar no FitConnect! 💪</p>
                `),
              }).catch(() => {});
            }
          } catch (e) {
            console.error('Error sending payment confirmation:', e);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const professorId = subscription.metadata?.professorId;

        if (professorId && subscription.status === 'active') {
          // Subscription renewed or updated
          console.log(`Subscription active for professor ${professorId}`);
        } else if (professorId && ['past_due', 'unpaid'].includes(subscription.status)) {
          console.log(`Subscription ${subscription.status} for professor ${professorId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const professorId = subscription.metadata?.professorId;

        if (professorId) {
          await prisma.professor.update({
            where: { id: professorId },
            data: {
              plan: 'free',
              maxStudents: 2,
              stripeSubscriptionId: null,
              stripeBillingCycle: null,
            },
          });
          console.log(`Professor ${professorId} downgraded to free (subscription canceled)`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed for invoice ${invoice.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
