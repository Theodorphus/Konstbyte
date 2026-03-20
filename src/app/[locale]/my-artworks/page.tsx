import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteArtworkAction } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function MyArtworksPage() {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations('my_artworks'),
  ]);

  if (!user) {
    return <div className="text-slate-600">{t('sign_in_required')}</div>;
  }

  const artworks = await prisma.artwork.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} className="mb-2" />
      <ul className="space-y-2">
        {artworks.map((art) => (
          <li key={art.id}>
            <Card>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <span>{art.title}</span>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/my-artworks/${art.id}`}>{t('edit')}</Link>
                  </Button>
                  <form action={deleteArtworkAction}>
                    <input type="hidden" name="artworkId" value={art.id} />
                    <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200">
                      {t('delete')}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
