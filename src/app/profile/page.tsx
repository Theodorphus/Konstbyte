import { getCurrentUser } from '../../lib/auth';
import prisma from '../../lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Image from 'next/image';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <p className="text-slate-600">Du måste logga in för att se din profil.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/auth/signin">Logga in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Skapa konto</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [artworks, orders, posts, favorites, followersCount, followingCount] = await Promise.all([
    prisma.artwork.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { artwork: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { 
        artwork: {
          include: {
            owner: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.follow.count({
      where: { followingId: user.id }
    }),
    prisma.follow.count({
      where: { followerId: user.id }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Min profil</h1>
          <p className="text-slate-600 mt-1">{user.name || user.email}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/profile/edit">Redigera profil</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mina konstverk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{artworks.length}</div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/my-artworks">Hantera</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mina köp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orders.length}</div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/profile/orders">Visa</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Community-inlägg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{posts.length}</div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/community">Till community</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Favoriter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{favorites.length}</div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/favorites">Visa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Följare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{followersCount}</div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/users/${user.id}/followers`}>Visa följare</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Följer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{followingCount}</div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/users/${user.id}/following`}>Visa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {artworks.length === 0 && orders.length === 0 && posts.length === 0 && favorites.length === 0 ? (
              <p className="text-sm text-slate-500">Ingen aktivitet ännu.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {artworks.slice(0, 1).map(art => (
                  <div key={art.id} className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400">🎨</span>
                    Lade upp <Link href={`/artworks/${art.id}`} className="text-blue-600 hover:underline">{art.title}</Link>
                  </div>
                ))}
                {orders.slice(0, 1).map(order => (
                  <div key={order.id} className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400">🛒</span>
                    Köpte <span className="font-medium">{order.artwork.title}</span>
                  </div>
                ))}
                {favorites.slice(0, 2).map(fav => (
                  <div key={fav.id} className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400">❤️</span>
                    Sparade <Link href={`/artworks/${fav.artwork.id}`} className="text-blue-600 hover:underline">{fav.artwork.title}</Link>
                  </div>
                ))}
                {posts.slice(0, 1).map(post => (
                  <div key={post.id} className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400">💬</span>
                    Skapade ett inlägg i community
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Senaste konstverk</CardTitle>
          </CardHeader>
          <CardContent>
            {artworks.length === 0 ? (
              <p className="text-sm text-slate-600">Du har inte lagt upp några konstverk än.</p>
            ) : (
              <div className="space-y-3">
                {artworks.slice(0, 3).map(art => (
                  <Link key={art.id} href={`/artworks/${art.id}`} className="block">
                    <div className="flex gap-3 p-2 hover:bg-slate-50 rounded">
                      <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                          <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
                        </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{art.title}</div>
                        <div className="text-sm text-slate-600">{art.price} SEK</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/artworks/new">Lägg upp nytt konstverk</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Senaste köp</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Du har inte gjort några köp än.</p>
                <Button asChild>
                  <Link href="/artworks">Utforska konstverk</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map(order => (
                  <div key={order.id} className="flex gap-3 p-2 border rounded">
                    <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                      <Image src={order.artwork.imageUrl} alt={order.artwork.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{order.artwork.title}</div>
                      <div className="text-sm text-slate-600">{order.amount} SEK</div>
                      <div className="text-xs text-slate-500 capitalize">{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sparade favoriter</CardTitle>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Du har inga sparade favoriter ännu.</p>
              <Button asChild>
                <Link href="/artworks">Upptäck konstverk</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {favorites.slice(0, 4).map(fav => (
                  <Link key={fav.id} href={`/artworks/${fav.artwork.id}`} className="group">
                    <div className="aspect-square bg-slate-100 rounded overflow-hidden mb-2 relative">
                      <Image
                        src={fav.artwork.imageUrl}
                        alt={fav.artwork.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-xs font-medium truncate">{fav.artwork.title}</div>
                    <div className="text-xs text-slate-500">{fav.artwork.price} SEK</div>
                  </Link>
                ))}
              </div>
              {favorites.length > 4 && (
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/favorites">Visa alla ({favorites.length})</Link>
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
