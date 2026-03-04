import { NextRequest, NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const { searchParams } = new URL(request.url);
  const isRefresh = searchParams.get('refresh') === '1';

  const user = await getCurrentUser();
  if (!user?.stripeAccountId) {
    return NextResponse.redirect(`${appUrl}/profile?connect=error`);
  }

  if (isRefresh) {
    // Re-generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${appUrl}/api/connect/return?refresh=1`,
      return_url: `${appUrl}/api/connect/return`,
      type: 'account_onboarding',
    });
    return NextResponse.redirect(accountLink.url);
  }

  // Verify onboarding is complete
  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  if (account.charges_enabled && account.details_submitted) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeOnboardingDone: true },
    });
    return NextResponse.redirect(`${appUrl}/profile?connect=success`);
  }

  return NextResponse.redirect(`${appUrl}/profile?connect=incomplete`);
}
