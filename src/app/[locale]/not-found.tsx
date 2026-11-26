import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('not_found');
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-6 h-48 w-48">
        <Image src="/images/not-found.webp" alt="" fill sizes="192px" className="object-contain" />
      </div>
      <h1 className="font-display text-5xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-2">{t('title')}</p>
      <p className="text-slate-500 mb-8 max-w-md">
        {t('desc')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          {t('home')}
        </Link>
        <Link
          href="/artworks"
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          {t('browse')}
        </Link>
      </div>
    </div>
  );
}
