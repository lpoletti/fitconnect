import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Esqueceu a senha — FitConnect',
  description: 'Recupere a senha da sua conta FitConnect.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
