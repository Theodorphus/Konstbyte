import { COMPANY } from '@/lib/company';

/** Shown on Swedish-only legal pages when the visitor uses the English site. */
export default function SwedishOnlyNotice({ locale }: { locale: string }) {
  if (locale !== 'en') return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      This page is only available in Swedish, and the Swedish text applies. Questions? Email{' '}
      <a href={`mailto:${COMPANY.email}`} className="font-semibold underline underline-offset-2">{COMPANY.email}</a>.
    </div>
  );
}
