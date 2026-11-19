import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { alternatesFor } from '@/lib/seo';

const EMAIL = 'webbdevstudio@gmail.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('meta_description'),
    alternates: alternatesFor(locale, '/kontakt'),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  const shortcuts = [
    { href: '/profile/orders', title: t('about_order_title'), text: t('about_order_text') },
    { href: '/policies/faq', title: t('faq_title'), text: t('faq_text') },
    { href: '/avgifter', title: t('fees_title'), text: t('fees_text') },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('title')}</p>
        <h1 className="font-display text-4xl text-slate-900">{t('contact_us')}</h1>
        <p className="text-base text-slate-600 leading-relaxed">{t('intro')}</p>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{t('email_label')}</p>
          <a href={`mailto:${EMAIL}`} className="font-display text-2xl text-slate-900 underline-offset-4 hover:underline break-all">
            {EMAIL}
          </a>
        </div>
        <p className="text-sm text-slate-500">{t('response_time')}</p>
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          {t('write_email')}
        </a>
        <p className="text-sm text-slate-500">{t('location')}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">{t('shortcuts_title')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-2xl border border-stone-200/80 bg-white/90 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900 text-sm">{s.title}</p>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{s.text}</p>
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-500">{t('report_hint')}</p>
      </div>
    </div>
  );
}
