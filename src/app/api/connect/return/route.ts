import { APP_URL } from '@/lib/urls';
import { NextRequest, NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { isConnectAccountReady } from '../../../../lib/release-payout';

const PAYOUTS_PAGE = `${APP_URL}/seller/payouts`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isRefresh = searchParams.get('refresh') === '1';

  const user = await getCurrentUser();
  if (!user?.stripeAccountId) {
    return NextResponse.redirect(`${PAYOUTS_PAGE}?connect=error`);
  }

  try {
    if (isRefresh) {
      // The onboarding link expired — generate a fresh one
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${APP_URL}/api/connect/return?refresh=1`,
        return_url: `${APP_URL}/api/connect/return`,
        type: 'account_onboarding',
      });
      return NextResponse.redirect(accountLink.url);
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    if (isConnectAccountReady(account)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeOnboardingDone: true },
      });
      return NextResponse.redirect(`${PAYOUTS_PAGE}?connect=success`);
    }
    return NextResponse.redirect(`${PAYOUTS_PAGE}?connect=incomplete`);
  } catch (err) {
    console.error('[connect/return]', err);
    return NextResponse.redirect(`${PAYOUTS_PAGE}?connect=error`);
  }
}
