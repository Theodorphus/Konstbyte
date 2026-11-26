import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getCurrentUser } from './auth';
import { isAdmin } from './admin';

// Page guards for signed-in areas. They only decide what a visitor sees: the
// data itself is protected by the API routes, which check the session too.

/** Sign-in page in the visitor's language, coming back to `returnTo` afterwards. */
export async function redirectToSignIn(returnTo: string): Promise<never> {
  const locale = await getLocale();
  const back = locale === routing.defaultLocale ? returnTo : `/${locale}${returnTo}`;
  return redirect({ href: `/auth/signin?callbackUrl=${encodeURIComponent(back)}`, locale });
}

/** Sends a signed-out visitor to sign in, and back to `returnTo` afterwards. */
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) return redirectToSignIn(returnTo);
  return user;
}

/** Admin pages: anyone else is sent to the start page. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    redirect({ href: '/', locale: await getLocale() });
  }
  return user!;
}
