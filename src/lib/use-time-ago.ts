'use client';

import { useFormatter, useTranslations } from 'next-intl';

/** "5 minutes ago" / "för 5 minuter sedan" in the visitor's language; a date after a week. */
export function useTimeAgo() {
  const format = useFormatter();
  const t = useTranslations('community');
  return (iso: string) => {
    const date = new Date(iso);
    const seconds = (Date.now() - date.getTime()) / 1000;
    if (seconds < 60) return t('time_just_now');
    if (seconds < 7 * 86400) return format.relativeTime(date, new Date());
    return format.dateTime(date, { day: 'numeric', month: 'short' });
  };
}
