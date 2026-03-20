"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: 'sv' | 'en') {
    if (next === locale) return;
    startTransition(() => {
      // Strip current /en prefix if present, then add if needed
      const stripped = pathname.startsWith('/en') ? pathname.slice(3) || '/' : pathname;
      const newPath = next === 'en' ? `/en${stripped === '/' ? '' : stripped}` : stripped;
      router.push(newPath);
    });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
      <button
        onClick={() => switchLocale('sv')}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-full transition-all duration-150 ${
          locale === 'sv'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        SV
      </button>
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-full transition-all duration-150 ${
          locale === 'en'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        EN
      </button>
    </div>
  );
}
