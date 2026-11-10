import { APP_URL } from '@/lib/urls';
import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { isConnectAccountReady } from '../../../../lib/release-payout';

// POST /api/connect/onboard
// Starts (or resumes) Stripe onboarding so the artist can receive payouts.
// Returns { url } to Stripe's hosted onboarding, or to the Express dashboard
// once the account is already set up.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    let accountId = user.stripeAccountId;
    if (!accountId) {
      // Express: Stripe hosts onboarding + a simple dashboard for the artist.
      // Only the `transfers` capability is needed — Konstbyte takes the payment.
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'SE',
        email: user.email || undefined,
        capabilities: { transfers: { requested: true } },
        metadata: { konstbyteUserId: user.id },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    } else {
      const account = await stripe.accounts.retrieve(accountId);
      if (isConnectAccountReady(account)) {
        if (!user.stripeOnboardingDone) {
          await prisma.user.update({ where: { id: user.id }, data: { stripeOnboardingDone: true } });
        }
        // Already set up: Express accounts get a login link to their dashboard.
        if (account.type === 'express') {
          const login = await stripe.accounts.createLoginLink(accountId);
          return NextResponse.json({ url: login.url });
        }
        return NextResponse.json({ url: 'https://dashboard.stripe.com/' });
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/connect/return?refresh=1`,
      return_url: `${APP_URL}/api/connect/return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('[connect/onboard]', err);
    return NextResponse.json({ error: 'Kunde inte starta Stripe-kopplingen' }, { status: 500 });
  }
}
