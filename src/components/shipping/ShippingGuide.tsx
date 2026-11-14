import { getTranslations } from 'next-intl/server';

const CARRIERS = [
  { name: 'PostNord', href: 'https://www.postnord.se/' },
  { name: 'DHL', href: 'https://www.dhl.com/se-sv/home.html' },
  { name: 'Instabox', href: 'https://instabox.com/sv-se/' },
];

/** Step-by-step help for artists who have never shipped anything sold online. */
export default async function ShippingGuide({ open }: { open: boolean }) {
  const t = await getTranslations('seller.shipping_guide');

  const steps = [
    { icon: '📦', title: t('pack_title'), body: t('pack_body') },
    { icon: '🏷️', title: t('label_title'), body: t('label_body'), carriers: true },
    { icon: '🏪', title: t('drop_title'), body: t('drop_body') },
    { icon: '🔢', title: t('tracking_title'), body: t('tracking_body') },
  ];

  return (
    <details open={open} className="group bg-amber-50 border border-amber-200 rounded-2xl">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4">
        <span className="font-semibold text-slate-900">🚚 {t('title')}</span>
        <span className="text-sm text-amber-800 group-open:hidden">{t('show')}</span>
        <span className="text-sm text-amber-800 hidden group-open:inline">{t('hide')}</span>
      </summary>

      <ol className="px-5 pb-5 space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-amber-300 text-sm font-semibold text-amber-900 flex items-center justify-center">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-slate-900">
                {step.icon} {step.title}
              </p>
              <p className="text-sm text-slate-600 mt-0.5">{step.body}</p>
              {step.carriers && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {CARRIERS.map((c) => (
                    <a
                      key={c.name}
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full bg-white border border-amber-300 text-sm text-slate-800 hover:bg-amber-100 transition-colors"
                    >
                      {c.name} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="px-5 pb-5 text-xs text-slate-500">{t('insurance_note')}</p>
    </details>
  );
}
