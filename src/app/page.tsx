"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../components/ui/button';

const categories = [
  { name: 'Målning', emoji: '🎨', href: '/artworks?category=Målning' },
  { name: 'Skulptur', emoji: '🗿', href: '/artworks?category=Skulptur' },
  { name: 'Fotografi', emoji: '📷', href: '/artworks?category=Fotografi' },
  { name: 'Digital konst', emoji: '💻', href: '/artworks?category=Digital konst' },
  { name: 'Illustration', emoji: '✏️', href: '/artworks?category=Illustration' },
  { name: 'Mixed media', emoji: '🎭', href: '/artworks?category=Mixed media' },
];

const testimonials = [
  {
    name: 'Emma Andersson',
    role: 'Konstnär',
    content: 'Konstbyte har verkligen hjälpt mig att nå fler köpare. Plattformen är enkel att använda och communityn är fantastisk!',
    avatar: '👩‍🎨'
  },
  {
    name: 'Johan Karlsson',
    role: 'Konstsamlare',
    content: 'Jag har hittat så många unika verk här som jag aldrig skulle ha upptäckt annars. AI-värderingen är också riktigt användbar!',
    avatar: '👨‍💼'
  },
  {
    name: 'Sara Lundberg',
    role: 'Hobbykonstnär',
    content: 'Från att börja som hobby till att sälja mitt första verk - Konstbyte gjorde det möjligt! Tack för denna plattform!',
    avatar: '👩‍🎤'
  },
];

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
          <div className="h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 md:py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-orange-300/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-yellow-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-44 h-44 bg-purple-300/25 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 items-center">
            <div className="space-y-8 animate-fade-in-up relative z-10">
              <div>
                <p className="text-sm font-semibold text-orange-200 mb-3 tracking-wider">KONSTBYTE.SE</p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-white drop-shadow-lg">
                  Sveriges nya<br />
                  konstmarknadsplats
                </h1>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md">
                  Upptäck unik konst, följ konstnärer, delta i community och få AI-driven 
                  värdering av dina verk. Allt på ett ställe.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 bg-white text-orange-600 hover:bg-orange-50">
                  <Link href="/artworks">Utforska konst 🎨</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm">
                  <Link href="/artworks/new">Säll din konst</Link>
                </Button>
              </div>

              {/* Stats */}
              {data && (
                <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <div className="text-2xl md:text-3xl font-bold text-orange-700 mb-1">{data.stats.totalArtworks}+</div>
                    <div className="text-xs md:text-sm text-orange-800">Konstverk</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <div className="text-2xl md:text-3xl font-bold text-pink-700 mb-1">{data.stats.totalUsers}+</div>
                    <div className="text-xs md:text-sm text-pink-800">Användare</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    <div className="text-2xl md:text-3xl font-bold text-purple-700 mb-1">{data.stats.totalPosts}+</div>
                    <div className="text-xs md:text-sm text-purple-800">Inlägg</div>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block z-10">
              <div className="grid grid-cols-2 gap-4">
                {data?.featuredArtworks.slice(0, 4).map((artwork, idx) => (
                  <Link
                    key={artwork.id}
                    href={`/artworks/${artwork.id}`}
                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group backdrop-blur-sm bg-white/10 ${
                      idx === 0 ? 'transform translate-y-4' : idx === 3 ? 'transform -translate-y-4' : ''
                    }`}
                  >
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="font-semibold text-sm">{artwork.title}</p>
                        <p className="text-xs">{artwork.price} kr</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        {/* How it Works Section */}
        <section className="space-y-8 py-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Hur det fungerar</h2>
            <p className="text-slate-600 text-base md:text-lg">Kom igång med Konstbyte på bara några minuter</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-semibold">Skapa konto</h3>
              <p className="text-slate-600">
                Registrera dig gratis och skapa din profil. Ingen kreditkortsinformation krävs.
              </p>
            </div>
            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-semibold">Ladda upp konst</h3>
              <p className="text-slate-600">
                Ta foto av ditt verk, sätt ett pris och få AI-hjälp med värdering om du vill.
              </p>
            </div>
            <div className="text-center space-y-4 group">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-semibold">Börja sälja</h3>
              <p className="text-slate-600">
                Ditt verk syns direkt för tusentals konstälskare. Säker betalning via Stripe.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-3xl p-8 md:p-12 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Varför välja Konstbyte?</h2>
            <p className="text-slate-700 text-base md:text-lg">Vi gör konsthandel enkelt och tillgängligt för alla</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-lg font-semibold mb-2">Låga avgifter</h3>
              <p className="text-slate-600">Endast 3% provision - behåll mer av din försäljning</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Säker betalning</h3>
              <p className="text-slate-600">Alla transaktioner hanteras säkert via Stripe</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI-verktyg</h3>
              <p className="text-slate-600">Få intelligent värdering och inspiration för dina verk</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-semibold mb-2">Aktivt community</h3>
              <p className="text-slate-600">Anslut med andra konstnärer och konstälskare</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-semibold mb-2">Mobilvänlig</h3>
              <p className="text-slate-600">Perfekt optimerad för alla enheter och skärmstorlekar</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105">
              <div className="text-4xl mb-3">🇸🇪</div>
              <h3 className="text-lg font-semibold mb-2">Svensk plattform</h3>
              <p className="text-slate-600">Skapad för svenska konstnärer och samlare</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎨</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-orange-900">Upptäck konst</h3>
            <p className="text-sm md:text-base text-orange-800">
              Tusentals unika konstverk från talangfulla konstnärer.
            </p>
          </div>
          <div className="bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-pink-300 rounded-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-pink-900">Följ konstnärer</h3>
            <p className="text-sm md:text-base text-pink-800">
              Få uppdateringar från dina favoriter direkt i flödet.
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 border-2 border-purple-300 rounded-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-purple-900">AI-värdering</h3>
            <p className="text-sm md:text-base text-purple-800">
              Intelligent prisuppskattning på dina konstverk.
            </p>
          </div>
          <div className="bg-gradient-to-br from-teal-100 to-emerald-100 border-2 border-teal-300 rounded-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💬</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-teal-900">Community</h3>
            <p className="text-sm md:text-base text-teal-800">
              Dela och diskutera konst med likasinnade.
            </p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Utforska kategorier</h2>
            <p className="text-slate-600 text-base md:text-lg">Hitta konst som passar just din stil</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.map((category, idx) => {
              const colors = [
                'hover:border-orange-500 hover:bg-orange-50 group-hover:text-orange-600',
                'hover:border-pink-500 hover:bg-pink-50 group-hover:text-pink-600',
                'hover:border-purple-500 hover:bg-purple-50 group-hover:text-purple-600',
                'hover:border-yellow-500 hover:bg-yellow-50 group-hover:text-yellow-600',
                'hover:border-rose-500 hover:bg-rose-50 group-hover:text-rose-600',
                'hover:border-teal-500 hover:bg-teal-50 group-hover:text-teal-600',
              ];
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className={`bg-white border-2 border-slate-200 rounded-xl p-4 md:p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105 group ${colors[idx]}`}
                >
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3 group-hover:scale-125 transition-transform">{category.emoji}</div>
                  <div className="text-sm md:text-base font-semibold text-slate-800 transition-colors">{category.name}</div>
                </Link>
              );
            })}
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
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-md">
                        ❤️ {artwork._count.favorites}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 truncate group-hover:text-orange-600 transition-colors">{artwork.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">{artwork.price} kr</span>
                        <Link 
                          href={`/users/${artwork.owner.id}`}
                          className="text-sm text-slate-600 hover:text-orange-600 transition-colors font-medium"
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

        {/* Testimonials Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Vad säger våra användare?</h2>
            <p className="text-slate-600 text-base md:text-lg">Hör från konstnärer och samlare som använder Konstbyte</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white border rounded-xl p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div className="mt-4 flex gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(star => <span key={star}>⭐</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-8 md:p-16 text-white text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-pink-300/30 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-orange-300/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Redo att börja?</h2>
            <p className="text-lg md:text-xl mb-8 text-orange-50">
              Gå med i Sveriges växande konstcommunity idag - helt kostnadsfritt!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="default" asChild className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                <Link href="/artworks/new">Ladda upp konst</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-white/10 border-2 border-white text-white hover:bg-white hover:text-orange-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                <Link href="/users">Hitta konstnärer</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm md:text-base text-orange-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>100% gratis att börja</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Ingen provision på försäljning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>AI-värdering inkluderat</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
