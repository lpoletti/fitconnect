export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const professor = await prisma.professor.findUnique({
      where: { id: session.user.professorId },
    });

    if (!professor?.stripeCustomerId) {
      return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: professor.stripeCustomerId,
      return_url: `${origin}/professor/plano`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json({ error: 'Erro ao abrir portal de cobrança' }, { status: 500 });
  }
}
