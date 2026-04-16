import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AiPage() {
  const t = await getTranslations('ai');

  const tools = [
    {
      href: '/ai/value-art',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      title: t('value_art_title'),
      description: t('value_art_desc'),
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      href: '/ai/inspiration',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      ),
      title: t('inspiration_title'),
      description: t('inspiration_desc'),
      iconBg: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-slate-400">
          <span className="w-6 h-px bg-slate-300" />
          Konstbyte AI
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="text-base text-slate-500 max-w-xl leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      {/* Tool cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.iconBg}`}>
              {tool.icon}
            </div>
            <div className="space-y-1.5 flex-1">
              <h2 className="font-semibold text-slate-900 text-base">{tool.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{tool.description}</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-400 group-hover:text-slate-700 transition-colors">
              {t('open')}
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
