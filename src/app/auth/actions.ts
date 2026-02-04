'use server';

import { signIn } from 'next-auth/react';

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  if (!email) {
    return { ok: false, error: 'Email krävs' };
  }

  await signIn('email', {
    email,
    redirect: true,
    callbackUrl: '/'
  });

  return { ok: true };
}
