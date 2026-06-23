export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateBody(resetPasswordSchema, body);
    if ('error' in result) return result.error;
    const { token, password } = result.data;

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Token invalido ou expirado.' }, { status: 400 });
    }

    // Check expiration
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Token invalido ou expirado.' }, { status: 400 });
    }

    const email = verificationToken.identifier;

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete the used token
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro ao redefinir senha. Tente novamente.' }, { status: 500 });
  }
}
