"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../components/ui/button';

interface Artwork {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  owner: {
    id: string;
    name: string | null;
  };
  _count: {
    favorites: number;
  };
}

interface Post {
  id: string;
  content: string;
  likes: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
  };
  _count: {
    comments: number;
  };
}

interface HomepageData {
  stats: {
    totalUsers: number;
    totalArtworks: number;
    totalPosts: number;
  };
  featuredArtworks: Artwork[];
  recentArtworks: Artwork[];
  recentPosts: Post[];
}

export default function Home() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const res = await fetch('/api/homepage');
      if (res.ok) {
        const homeData = await res.json();
        setData(homeData);
      }
    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just nu';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m sedan`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h sedan`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d sedan`;
    return postDate.toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <div className="py-12 space-y-20">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-slate-200 rounded-lg"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div>
                <p className="text-sm font-semibold text-blue-600 mb-3">KONSTBYTE.SE</p>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                  Sveriges nya<br />
                  konstmarknadsplats
                </h1>
                <p className="text-xl text-slate-700 leading-relaxed">
                  Upptäck unik konst, följ konstnärer, delta i community och få AI-driven 
                  värdering av dina verk. Allt på ett ställe.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="text-lg px-8 py-6">
                  <Link href="/artworks">Utforska konst 🎨</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                  <Link href="/artworks/new">Säll din konst</Link>
                </Button>
              </div>

              {/* Stats */}
              {data && (
                <div className="flex gap-8 pt-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{data.stats.totalArtworks}+</div>
                    <div className="text-sm text-slate-600">Konstverk</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{data.stats.totalUsers}+</div>
                    <div className="text-sm text-slate-600">Användare</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600">{data.stats.totalPosts}+</div>
                    <div className="text-sm text-slate-600">Inlägg</div>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {data?.featuredArtworks.slice(0, 4).map((artwork, idx) => (
                  <div 
                    key={artwork.id} 
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-xl ${
                      idx === 0 ? 'transform translate-y-4' : idx === 3 ? 'transform -translate-y-4' : ''
                    }`}
                  >
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        {/* Features */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="bg-white border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-3">Upptäck konst</h3>
            <p className="text-slate-600">
              Utforska tusentals unika konstverk från talangfulla konstnärer över hela Sverige.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-3">Följ konstnärer</h3>
            <p className="text-slate-600">
              Följ dina favoritkonstnärer och få uppdateringar om nya verk direkt i ditt flöde.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-3">AI-värdering</h3>
            <p className="text-slate-600">
              Få intelligent prisuppskattning på dina konstverk med vårt AI-drivna verktyg.
            </p>
          </div>
        </section>

        {/* Featured Artworks */}
        {data && data.featuredArtworks.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Mest populära</h2>
                <p className="text-slate-600">De mest älskade konstverken just nu</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/artworks">Se alla →</Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.featuredArtworks.map((artwork) => (
                <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group">
                  <div className="bg-white border rounded-xl overflow-hidden hover:shadow-xl transition-all">
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        🤍 {artwork._count.favorites}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 truncate">{artwork.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{artwork.price} kr</span>
                        <Link 
                          href={`/users/${artwork.owner.id}`}
                          className="text-sm text-slate-600 hover:text-slate-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          av {artwork.owner.name || 'Anonym'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Artworks */}
        {data && data.recentArtworks.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Nyligen tillagda</h2>
                <p className="text-slate-600">De senaste konstverken på plattformen</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/artworks">Visa fler →</Link>
              </Button>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {data.recentArtworks.map((artwork) => (
                <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group">
                  <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-square bg-slate-100">
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate mb-1">{artwork.title}</h3>
                      <div className="text-lg font-bold">{artwork.price} kr</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Community Section */}
        {data && data.recentPosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Från communityn</h2>
                <p className="text-slate-600">Senaste diskussionerna och inspirationen</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/community">Gå till community →</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.recentPosts.slice(0, 4).map((post) => (
                <Link key={post.id} href="/community" className="group">
                  <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                        {post.author.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="font-semibold truncate">{post.author.name || 'Anonym'}</div>
                        <div className="text-sm text-slate-500">{formatDate(post.createdAt)}</div>
                      </div>
                    </div>
                    <p className="text-slate-700 line-clamp-3 mb-4">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post._count.comments}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Redo att börja?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Gå med i Sveriges växande konstcommunity idag
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
              <Link href="/artworks/new">Ladda upp konst</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 bg-white/10 border-white text-white hover:bg-white/20">
              <Link href="/users">Hitta konstnärer</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
