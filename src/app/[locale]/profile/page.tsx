import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import SafeImage from '@/components/SafeImage';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatSek } from '@/lib/currency';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

// --- Badge logic ---
type Badge = { icon: string; label: string; color: string };

function computeBadges({
  artworkCount, postCount, challengeCount, favoriteCount, followerCount,
}: {
  artworkCount: number; postCount: number; challengeCount: number;
  favoriteCount: number; followerCount: number;
}, labels: Record<string, string>): Badge[] {
  const badges: Badge[] = [];
  if (artworkCount >= 1)  badges.push({ icon: '🎨', label: labels.artist,       color: 'bg-amber-50 border-amber-200 text-amber-800' });
  if (artworkCount >= 5)  badges.push({ icon: '⭐', label: labels.activeArtist,  color: 'bg-yellow-50 border-yellow-200 text-yellow-800' });
  if (artworkCount >= 20) badges.push({ icon: '🏅', label: labels.masterArtist,  color: 'bg-orange-50 border-orange-200 text-orange-800' });
  if (postCount >= 1)     badges.push({ icon: '💬', label: labels.community,     color: 'bg-sky-50 border-sky-200 text-sky-800' });
  if (postCount >= 10)    badges.push({ icon: '🗣️', label: labels.activeVoice,   color: 'bg-indigo-50 border-indigo-200 text-indigo-800' });
  if (challengeCount >= 1) badges.push({ icon: '🏆', label: labels.competitor,  color: 'bg-violet-50 border-violet-200 text-violet-800' });
  if (favoriteCount >= 5) badges.push({ icon: '❤️', label: labels.artLover,     color: 'bg-rose-50 border-rose-200 text-rose-800' });
  if (followerCount >= 10) badges.push({ icon: '👥', label: labels.influencer,  color: 'bg-emerald-50 border-emerald-200 text-emerald-800' });
  return badges;
}

// --- Stat card ---
function StatCard({ href, icon, label, value, accent, viewText }: {
  href: string; icon: React.ReactNode; label: string; value: number; accent?: string; viewText: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className={`rounded-2xl border bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accent ?? 'border-stone-200/80'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-lg group-hover:bg-amber-50 transition-colors">
            {icon}
          </div>
          <span className="font-display text-3xl font-semibold text-slate-900 leading-none tabular-nums">{value}</span>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5 group-hover:text-amber-700 transition-colors">{viewText}</p>
      </div>
    </Link>
  );
}

export default async function ProfilePage() {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations('profile'),
  ]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-200 mx-auto flex items-center justify-center text-2xl">🎨</div>
        <h1 className="font-display text-2xl text-slate-900">{t('sign_in_to_view')}</h1>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link href="/auth/signin">{t('sign_in_btn')}</Link></Button>
          <Button variant="outline" asChild><Link href="/auth/register">{t('register_btn')}</Link></Button>
        </div>
      </div>
    );
  }

  const [
    fullUser,
    artworks,
    orders,
    soldOrders,
    posts,
    favorites,
    followersCount,
    followingCount,
    challengeCount,
    pendingShipCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, image: true, bio: true },
    }),
    prisma.artwork.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { artwork: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.order.count({
      where: { sellerId: user.id, status: { in: ['paid', 'delivered', 'completed'] } },
    }),
    prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { artwork: { include: { owner: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.challengeSubmission.count({ where: { artistId: user.id } }),
    prisma.order.count({
      where: { sellerId: user.id, shippingStatus: 'not_shipped', status: { in: ['paid', 'delivered', 'completed'] } },
    }),
  ]);

  const initial = (user.name || user.email || '?')[0].toUpperCase();
  const badges = computeBadges({
    artworkCount: artworks.length,
    postCount: posts.length,
    challengeCount,
    favoriteCount: favorites.length,
    followerCount: followersCount,
  }, {
    artist: t('artist_badge'),
    activeArtist: t('active_artist_badge'),
    masterArtist: t('master_artist_badge'),
    community: t('community_badge'),
    activeVoice: t('active_voice_badge'),
    competitor: t('competitor_badge'),
    artLover: t('art_lover_badge'),
    influencer: t('influencer_badge'),
  });

  const gradients = [
    'from-amber-300 via-rose-300 to-sky-300',
    'from-violet-400 via-fuchsia-300 to-amber-300',
    'from-emerald-300 via-sky-300 to-violet-300',
    'from-rose-300 via-orange-200 to-yellow-300',
  ];
  const bannerGradient = gradients[(user.id.charCodeAt(0) ?? 0) % gradients.length];
  const viewMore = t('view_more');

  return (
    <div className="space-y-8 pb-16">

      {/* Banner + profil */}
      <div className="relative">
        {/* Banner */}
        <div className={`h-32 md:h-44 rounded-3xl bg-gradient-to-br ${bannerGradient} shadow-sm`} />

        {/* Profilkort */}
        <div className="relative -mt-6 mx-0 z-10 rounded-2xl bg-white border border-stone-200/70 shadow-sm px-6 pb-6 pt-14">
          {/* Avatar */}
          <div className="absolute -top-10 left-6 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center flex-shrink-0">
            {fullUser?.image ? (
              <SafeImage src={fullUser.image} alt={t('profile_picture_alt')} fill className="object-cover" />
            ) : (
              <span className="font-display text-3xl font-semibold text-stone-500">{initial}</span>
            )}
          </div>

          {/* Namn + redigera-knapp */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl md:text-3xl text-slate-900 truncate leading-tight">
                {user.name || user.email}
              </h1>
              {user.name && <p className="text-sm text-slate-400 truncate mt-0.5">{user.email}</p>}
              {fullUser?.bio ? (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-lg">{fullUser.bio}</p>
              ) : (
                <Link href="/profile/edit" className="mt-2 inline-block text-xs text-slate-400 hover:text-amber-700 transition-colors">
                  {t('add_bio')}
                </Link>
              )}
            </div>
            <Button variant="outline" asChild className="flex-shrink-0 border-stone-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 mt-1">
              <Link href="/profile/edit">{t('edit_profile')}</Link>
            </Button>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map(b => (
                <span key={b.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${b.color}`}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="font-display text-xl text-slate-900 mb-4">{t('stats')}</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard href="/my-artworks" icon="🎨" label={t('artworks_stat')} value={artworks.length} viewText={viewMore} />
          <StatCard href="/profile/orders" icon="🛒" label={t('purchases_stat')} value={orders.length} viewText={viewMore} />
          <StatCard href="/seller/orders" icon="💰" label={t('sold_stat')} value={soldOrders}
            accent={pendingShipCount > 0 ? 'border-orange-200' : undefined} viewText={viewMore} />
          <StatCard href="/community" icon="💬" label={t('posts_stat')} value={posts.length} viewText={viewMore} />
          <StatCard href="/favorites" icon="❤️" label={t('favorites_stat')} value={favorites.length} viewText={viewMore} />
          <StatCard href={`/users/${user.id}/followers`} icon="👥" label={t('followers_stat')} value={followersCount} viewText={viewMore} />
          <StatCard href={`/users/${user.id}/following`} icon="➡️" label={t('following_stat')} value={followingCount} viewText={viewMore} />
          <StatCard href="/utmaning" icon="🏆" label={t('challenge_entries_stat')} value={challengeCount} viewText={viewMore} />
        </div>
        {pendingShipCount > 0 && (
          <Link href="/seller/orders"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors">
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">{pendingShipCount}</span>
            {t('pending_ship', { count: pendingShipCount })}
          </Link>
        )}
      </div>

      {/* Mina konstverk grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-slate-900">{t('my_artworks')}</h2>
          <Link href="/artworks/new" className="text-xs font-semibold text-amber-700 hover:text-amber-600 transition-colors">
            {t('add_artwork')}
          </Link>
        </div>
        {artworks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-10 text-center">
            <div className="text-4xl mb-3">🖼️</div>
            <p className="font-semibold text-slate-700 mb-1">{t('no_artworks')}</p>
            <p className="text-sm text-slate-500 mb-5">{t('no_artworks_sub')}</p>
            <Button asChild>
              <Link href="/artworks/new">{t('upload_artwork')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map(art => (
              <div key={art.id} className="group rounded-2xl bg-white/90 ring-1 ring-slate-200/70 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                  <SafeImage src={art.imageUrl} alt={art.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  {art.isSold && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">{t('sold_badge')}</span>
                    </div>
                  )}
                  {!art.isPublished && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-slate-800/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{t('unpublished_badge')}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 truncate leading-snug">{art.title}</h3>
                  <p className="font-display text-sm font-semibold text-slate-700 mt-0.5">{formatSek(art.price)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(art.createdAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/artworks/${art.id}`}
                      className="flex-1 text-center text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                      {t('view')}
                    </Link>
                    <Link href={`/artworks/${art.id}/edit`}
                      className="flex-1 text-center text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                      {t('edit_link')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Community-inlägg */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-slate-900">{t('recent_posts')}</h2>
            <Link href="/community" className="text-xs font-semibold text-amber-700 hover:text-amber-600 transition-colors">
              {t('new_post_link')}
            </Link>
          </div>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm text-slate-600 mb-4">{t('no_posts_text')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/community">{t('no_posts_community')}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="rounded-2xl bg-white/90 border border-stone-200/80 p-4 shadow-sm">
                  <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{post.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(post.createdAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
              <Link href="/community"
                className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 transition-colors">
                {t('community_all')}
              </Link>
            </div>
          )}
        </div>

        {/* Senaste köp */}
        <div>
          <h2 className="font-display text-xl text-slate-900 mb-4">{t('recent_purchases')}</h2>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm text-slate-600 mb-4">{t('no_purchases')}</p>
              <Button asChild>
                <Link href="/artworks">{t('explore_artworks')}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Link key={order.id} href={`/artworks/${order.artwork.id}`} className="group flex gap-3 p-3 rounded-2xl bg-white/90 border border-stone-200/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                    <SafeImage src={order.artwork.imageUrl} alt={order.artwork.title} fill className="object-cover group-hover:scale-[1.05] transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{order.artwork.title}</p>
                    <p className="text-sm text-slate-500">{formatSek(order.amount)}</p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{order.status}</p>
                  </div>
                </Link>
              ))}
              <Link href="/profile/orders" className="block text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 transition-colors">
                {t('purchases_all')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Favoriter */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-slate-900">{t('saved_favorites')}</h2>
          {favorites.length > 0 && (
            <Link href="/favorites" className="text-xs font-semibold text-amber-700 hover:text-amber-600 transition-colors">
              {t('view_all_count', { count: favorites.length })}
            </Link>
          )}
        </div>
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-10 text-center">
            <div className="text-4xl mb-3">❤️</div>
            <p className="font-semibold text-slate-700 mb-1">{t('no_favorites')}</p>
            <p className="text-sm text-slate-500 mb-5">{t('no_favorites_sub')}</p>
            <Button asChild>
              <Link href="/artworks">{t('add_favorites')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {favorites.map(fav => (
              <Link key={fav.id} href={`/artworks/${fav.artwork.id}`} className="group">
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative mb-1.5">
                  <SafeImage src={fav.artwork.imageUrl} alt={fav.artwork.title} fill className="object-cover group-hover:scale-[1.05] transition-transform duration-300" />
                </div>
                <p className="text-xs font-medium text-slate-800 truncate">{fav.artwork.title}</p>
                <p className="text-xs text-slate-400">{formatSek(fav.artwork.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
