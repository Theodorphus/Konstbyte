'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link';

export default function HemsidorPage() {
  const t = useTranslations('hemsidor');
  const [formData, setFormData] = useState({ websiteUrl: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setStatus('success');
      setMessage(t('form_success'));
      setFormData({ websiteUrl: '', email: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : t('form_error'));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-blue-400 via-purple-400 to-pink-300 shadow-2xl shadow-purple-300/30 mb-20">
        <div className="absolute -right-12 -top-12 z-10 h-64 w-64 rounded-full bg-white/30 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 z-10 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="relative z-20 flex min-h-[520px] items-center px-8 py-16 md:min-h-[640px] md:px-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/20 bg-white/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-600/80 font-medium backdrop-blur-sm animate-fade-up">
              {t('hero_badge')}
            </span>
            <h1 className="font-display mt-7 text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.05] text-slate-900 animate-fade-up-delay">
              {t('hero_title')}
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-lg text-slate-700/90 leading-[1.75] animate-fade-up-delay">
              {t('hero_description')}
            </p>
            <div className="mt-12 flex flex-wrap gap-4 animate-fade-up-delay-2">
              <button
                onClick={() => document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-900/40"
              >
                {t('hero_cta')}
              </button>
              <a
                href="#processen"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/25 bg-white/50 px-8 py-3.5 text-sm font-semibold text-slate-900 backdrop-blur-sm transition-all duration-300 hover:bg-white/75 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                {t('learn_process')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problemet */}
      <section className="mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('problem_label')}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">{t('problem_title')}</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: '⏱️', title: t('problem1_title'), desc: t('problem1_desc') },
            { icon: '📊', title: t('problem2_title'), desc: t('problem2_desc') },
            { icon: '🎨', title: t('problem3_title'), desc: t('problem3_desc') },
            { icon: '🐌', title: t('problem4_title'), desc: t('problem4_desc') },
            { icon: '👥', title: t('problem5_title'), desc: t('problem5_desc') },
            { icon: '💰', title: t('problem6_title'), desc: t('problem6_desc') },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl border border-red-200/60 bg-red-50/40 p-6 flex flex-col gap-3">
              <div className="text-3xl">{item.icon}</div>
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lösningen */}
      <section className="mb-24 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-blue-50/60 to-purple-50/60 p-10 md:p-14">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('solution_label')}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">{t('solution_title')}</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '⚡', title: t('solution1_title'), desc: t('solution1_desc') },
            { icon: '💾', title: t('solution2_title'), desc: t('solution2_desc') },
            { icon: '🎯', title: t('solution3_title'), desc: t('solution3_desc') },
            { icon: '🚀', title: t('solution4_title'), desc: t('solution4_desc') },
            { icon: '📈', title: t('solution5_title'), desc: t('solution5_desc') },
            { icon: '✨', title: t('solution6_title'), desc: t('solution6_desc') },
            { icon: '💎', title: t('solution7_title'), desc: t('solution7_desc') },
            { icon: '⏰', title: t('solution8_title'), desc: t('solution8_desc') },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl border border-blue-200/60 bg-white/80 p-5 flex flex-col gap-3 backdrop-blur-sm">
              <div className="text-2xl">{item.icon}</div>
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Processen */}
      <section id="processen" className="mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('process_label')}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">{t('process_title')}</h2>
        </div>
        <div className="mt-12">
          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-300" />

            <div className="space-y-10 md:space-y-12">
              {[
                { step: '1', title: t('process1_title'), desc: t('process1_desc'), icon: '📋' },
                { step: '2', title: t('process2_title'), desc: t('process2_desc'), icon: '🎨' },
                { step: '3', title: t('process3_title'), desc: t('process3_desc'), icon: '⚙️' },
                { step: '4', title: t('process4_title'), desc: t('process4_desc'), icon: '🚀' },
                { step: '5', title: t('process5_title'), desc: t('process5_desc'), icon: '📞' },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 md:gap-8">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg relative z-10">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1 pt-2 md:pt-4">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('portfolio_label')}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">{t('portfolio_title')}</h2>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[
            { name: t('portfolio1_name'), desc: t('portfolio1_desc'), tech: 'Next.js, Tailwind, Supabase', url: 'https://bokning-taupe.vercel.app/' },
            { name: t('portfolio2_name'), desc: t('portfolio2_desc'), tech: 'Next.js, Prisma, Stripe', url: 'https://www.konstbyte.se/' },
          ].map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all block group"
            >
              <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-6 flex items-center justify-center text-slate-400 group-hover:from-blue-100 group-hover:to-purple-100 transition-colors">
                <span className="text-sm">Projektöversikt</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl text-slate-900 font-semibold">{item.name}</h3>
                  <p className="mt-3 text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
                <span className="text-xl flex-shrink-0 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tech.split(', ').map((tech, j) => (
                  <span key={j} className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Priser */}
      <section className="mb-24">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('pricing_label')}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">{t('pricing_title')}</h2>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              tier: t('pricing1_tier'),
              price: t('pricing1_price'),
              desc: t('pricing1_desc'),
              features: [
                t('pricing1_feature1'),
                t('pricing1_feature2'),
                t('pricing1_feature3'),
                t('pricing1_feature4'),
              ],
              cta: t('pricing_cta'),
              highlighted: false,
            },
            {
              tier: t('pricing2_tier'),
              price: t('pricing2_price'),
              desc: t('pricing2_desc'),
              features: [
                t('pricing2_feature1'),
                t('pricing2_feature2'),
                t('pricing2_feature3'),
                t('pricing2_feature4'),
                t('pricing2_feature5'),
              ],
              cta: t('pricing_cta'),
              highlighted: true,
            },
            {
              tier: t('pricing3_tier'),
              price: t('pricing3_price'),
              desc: t('pricing3_desc'),
              features: [
                t('pricing3_feature1'),
                t('pricing3_feature2'),
                t('pricing3_feature3'),
                t('pricing3_feature4'),
                t('pricing3_feature5'),
              ],
              cta: t('pricing_cta'),
              highlighted: false,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`rounded-3xl p-8 transition-all ${
                item.highlighted
                  ? 'border border-purple-400/60 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105'
                  : 'border border-slate-200/70 bg-white/80 shadow-md'
              }`}
            >
              {item.highlighted && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-400/40 px-3 py-1">
                  <span className="text-xs font-semibold text-purple-700">⭐ {t('pricing_popular')}</span>
                </div>
              )}
              <h3 className="font-display text-2xl text-slate-900 font-semibold">{item.tier}</h3>
              <div className="mt-4">
                <div className="text-4xl font-bold text-slate-900">{item.price}</div>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
              <ul className="mt-8 space-y-3">
                {item.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => document.getElementById('cta-form')?.scrollIntoView({ behavior: 'smooth' })}
                className={`mt-8 w-full py-3 rounded-full font-semibold transition-all ${
                  item.highlighted
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {item.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Om mig */}
      <section className="mb-24 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-amber-50/60 to-orange-50/60 p-10 md:p-14">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('about_label')}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl text-slate-900">{t('about_title')}</h2>
          <div className="mt-8 space-y-4 text-slate-700 leading-relaxed">
            <p>{t('about_para1')}</p>
            <p>{t('about_para2')}</p>
            <p>{t('about_para3')}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <div className="font-semibold text-slate-900">{t('about_education_title')}</div>
                <div className="text-sm text-slate-600">{t('about_education_desc')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💼</span>
              <div>
                <div className="font-semibold text-slate-900">{t('about_experience_title')}</div>
                <div className="text-sm text-slate-600">{t('about_experience_desc')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Form */}
      <section id="cta-form" className="mb-24 scroll-mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-400 via-purple-400 to-pink-300 p-10 md:p-14 shadow-2xl shadow-purple-300/30">
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/30 blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 h-32 w-80 -translate-x-1/2 rounded-full bg-white/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-slate-900 text-center">{t('cta_title')}</h2>
            <p className="mt-4 text-center text-slate-700/90 max-w-lg mx-auto">{t('cta_description')}</p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('form_url_label')}</label>
                <input
                  type="url"
                  placeholder={t('form_url_placeholder')}
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-900/40 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('form_email_label')}</label>
                <input
                  type="email"
                  placeholder={t('form_email_placeholder')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-slate-900/40 focus:border-transparent"
                />
              </div>

              {status === 'success' && (
                <div className="rounded-lg bg-green-100 border border-green-400 p-4 text-green-700">
                  ✓ {message}
                </div>
              )}
              {status === 'error' && (
                <div className="rounded-lg bg-red-100 border border-red-400 p-4 text-red-700">
                  ✗ {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:bg-slate-600 transition-all"
              >
                {status === 'loading' ? t('form_loading') : t('form_submit')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-700/75">
              {t('form_note')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
