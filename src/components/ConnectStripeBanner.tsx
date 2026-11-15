import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Nudges sellers to connect Stripe. Without it their sales fall back to a
 * manual payout that an admin has to handle.
 */
export default async function ConnectStripeBanner({
  user,
  className = '',
}: {
  user: { stripeAccountId: string | null; stripeOnboardingDone: boolean } | null;
  className?: string;
}) {
  if (!user || (user.stripeAccountId && user.stripeOnboardingDone)) return null;
  const t = await getTranslations('seller');
  const started = Boolean(user.stripeAccountId);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">💳 {t('connect_banner_title')}</p>
        <p className="text-sm text-slate-600 mt-0.5">{t('connect_banner_body')}</p>
      </div>
      <Link
        href="/seller/payouts"
        className="flex-shrink-0 text-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        {started ? t('connect_continue_button') : t('connect_button')}
      </Link>
    </div>
  );
}
