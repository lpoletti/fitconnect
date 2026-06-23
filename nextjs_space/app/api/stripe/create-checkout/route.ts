export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, STRIPE_PLAN_CONFIG } from '@/lib/stripe';
import { checkoutSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const result = validateBody(checkoutSchema, body);
    if ('error' in result) return result.error;
    const { planKey, billing } = result.data;

    const config = STRIPE_PLAN_CONFIG[planKey]!;

    const professor = await prisma.professor.findUnique({
      where: { id: session.user.professorId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!professor) {
      return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = professor.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: professor.user.email ?? undefined,
        name: professor.user.name ?? undefined,
        metadata: { professorId: professor.id },
      });
      customerId = customer.id;
      await prisma.professor.update({
        where: { id: professor.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const lookupKey = billing === 'annual'
      ? config.annualPriceLookup
      : config.monthlyPriceLookup;

    // Look up the price by lookup_key
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      // Auto-create the product and price if they don't exist
      const product = await stripe.products.create({
        name: `FitConnect ${config.plan.toUpperCase()}`,
        metadata: { plan: config.plan },
      });

      const unitAmount = billing === 'annual'
        ? (config.plan === 'pro10' ? 2990 : config.plan === 'pro50' ? 4990 : 7990)
        : (config.plan === 'pro10' ? 3990 : config.plan === 'pro50' ? 5990 : 8990);

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: unitAmount,
        currency: 'brl',
        recurring: {
          interval: billing === 'annual' ? 'year' : 'month',
        },
        lookup_key: lookupKey,
      });

      prices.data.push(price);
    }

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      success_url: `${origin}/professor/plano?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/professor/plano?canceled=true`,
      metadata: {
        professorId: professor.id,
        planKey: config.plan,
        billing: billing || 'monthly',
      },
      subscription_data: {
        metadata: {
          professorId: professor.id,
          planKey: config.plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 });
  }
}
