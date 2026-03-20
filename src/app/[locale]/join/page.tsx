import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'join' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    openGraph: {
      title: t('meta_og_title'),
      description: t('meta_og_description'),
      images: ['/og-image.png'],
    },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'join' });

  const benefits = t.raw('benefits') as Array<{ icon: string; title: string; desc: string }>;
  const steps = t.raw('steps') as Array<{ num: string; title: string; desc: string }>;
  const testimonials = t.raw('testimonials') as Array<{ quote: string; name: string; role: string; color: string }>;

  return (
    <div className="space-y-24 pb-24">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 shadow-2xl shadow-rose-300/30 -mx-0">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/30 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="relative px-8 py-20 md:px-16 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/20 bg-white/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-700 font-medium backdrop-blur-sm mb-6">
            {t('hero_badge')}
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-slate-900 leading-[1.05] mb-6">
            {t('hero_heading')}
          </h1>
          <p className="text-lg md:text-xl text-slate-700/90 max-w-2xl mx-auto leading-relaxed mb-10">
            {t('hero_subtext')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-9 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('hero_cta_primary')}
            </Link>
            <Link
              href="/artworks"
              className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-9 py-4 text-base font-semibold text-slate-900 backdrop-blur-sm hover:bg-white/75 transition-all"
            >
              {t('hero_cta_secondary')}
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-600/80">{t('hero_footnote')}</p>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">{t('benefits_label')}</p>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900">{t('benefits_heading')}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl bg-white/90 border border-stone-200/80 p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="text-3xl mb-4">{b.icon}</div>
              <h3 className="font-semibold text-base text-slate-900 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl bg-white/90 border border-stone-200/70 p-8 md:p-12 shadow-sm">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">{t('how_label')}</p>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900">{t('how_heading')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col gap-3">
              <span className="font-display text-5xl font-bold text-slate-100 leading-none">{s.num}</span>
              <h3 className="font-semibold text-lg text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">{t('testimonials_label')}</p>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900">{t('testimonials_heading')}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className={`rounded-2xl bg-gradient-to-br ${item.color} p-7 border border-white/60 shadow-sm`}>
              <p className="text-slate-700 leading-relaxed text-sm mb-5">"{item.quote}"</p>
              <div>
                <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 p-10 md:p-16 text-center shadow-xl shadow-rose-300/20">
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/30 blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-600/80 mb-3">{t('cta_label')}</p>
            <h2 className="font-display text-3xl md:text-5xl text-slate-900 mb-4 leading-tight">
              {t('cta_heading')}
            </h2>
            <p className="text-slate-700 max-w-lg mx-auto text-base mb-8">{t('cta_subtext')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-9 py-4 text-base font-semibold text-white shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {t('cta_primary')}
              </Link>
              <Link
                href="/utmaning"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-9 py-4 text-base font-semibold text-slate-900 backdrop-blur-sm hover:bg-white/75 transition-all"
              >
                {t('cta_secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
