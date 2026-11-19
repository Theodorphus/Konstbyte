import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import { cancelCheckout } from '@/lib/cancel-checkout';

export const dynamic = 'force-dynamic';

export default async function CancelPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const [{ orderId }, t, user] = await Promise.all([searchParams, getTranslations('cancel'), getCurrentUser()]);

  // Free the artwork for other buyers right away (only the buyer's own order).
  const artworkId =
    orderId && user
      ? await cancelCheckout(orderId.slice(0, 100), user.id).catch((err) => {
          console.error('[cancel]', err);
          return null;
        })
      : null;

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6 px-4">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{t('payment_cancelled')}</h1>
      <p className="text-slate-600">{t('no_charge')}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {artworkId && (
          <Link
            href={`/artworks/${artworkId}`}
            className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
          >
            {t('back_to_artwork')}
          </Link>
        )}
        <Link
          href="/artworks"
          className={
            artworkId
              ? 'px-5 py-2.5 rounded-md border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors'
              : 'px-5 py-2.5 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors'
          }
        >
          {t('back_to_artworks')}
        </Link>
      </div>
    </div>
  );
}
