'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const DISMISS_KEY = 'missing-name-banner-dismissed';
// Pages that already ask for a name themselves.
const HIDDEN_ON = ['/profile/edit', '/artworks/new'];

/**
 * Reminds signed-in users without a name to add one — otherwise their artworks,
 * posts and messages show up as "Anonym".
 */
export default function MissingNameBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!session?.user || session.user.name?.trim() || dismissed || HIDDEN_ON.includes(pathname)) {
    return null;
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Storage blocked — the banner just comes back on the next page load.
    }
  }

  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm text-amber-950 sm:px-6">
        <p className="flex-1 min-w-[16rem]">{t('missing_name_text')}</p>
        <Link
          href="/profile/edit"
          className="rounded-full bg-amber-400 px-3.5 py-1 font-semibold text-slate-950 hover:bg-amber-300 transition-colors"
        >
          {t('missing_name_cta')}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('missing_name_dismiss')}
          className="rounded p-1 text-amber-900/70 hover:bg-amber-100 hover:text-amber-950"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
