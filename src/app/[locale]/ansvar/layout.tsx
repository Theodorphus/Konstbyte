import SwedishOnlyNotice from '@/components/SwedishOnlyNotice';

// The legal texts are written in Swedish only; tell English visitors so.
export default async function SwedishLegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <SwedishOnlyNotice locale={locale} />
      {children}
    </>
  );
}
