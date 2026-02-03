import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';
import prisma from '../../lib/prisma';
import { deleteArtworkAction } from './actions';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default async function MyArtworksPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="text-slate-600">Logga in för att hantera dina konstverk.</div>;
  }

  const artworks = await prisma.artwork.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mina konstverk</h1>
      <ul className="space-y-2">
        {artworks.map((art) => (
          <li key={art.id}>
            <Card>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <span>{art.title}</span>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/my-artworks/${art.id}`}>Redigera</Link>
                  </Button>
                  <form action={deleteArtworkAction}>
                    <input type="hidden" name="artworkId" value={art.id} />
                    <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200">
                      Ta bort
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
