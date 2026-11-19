import { redirect } from '@/i18n/navigation';

// Old address for editing an artwork; the full editor lives at /artworks/[id]/edit.
export default async function OldEditArtworkPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect({ href: `/artworks/${id}/edit`, locale });
}
