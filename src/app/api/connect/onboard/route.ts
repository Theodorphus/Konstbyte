import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Create Stripe account if not already done
  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      email: user.email || undefined,
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/connect/return?refresh=1`,
    return_url: `${appUrl}/api/connect/return`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
