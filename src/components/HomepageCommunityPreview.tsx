import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import prisma from '../lib/prisma';
import { getTranslations } from 'next-intl/server';

function timeAgo(date: Date, t: Awaited<ReturnType<typeof getTranslations>>) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return t('time_just_now');
  if (diff < 3600) return t('time_minutes_ago', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('time_hours_ago', { count: Math.floor(diff / 3600) });
  return t('time_days_ago', { count: Math.floor(diff / 86400) });
}

function AvatarCircle({ name, image, email }: { name: string | null; image: string | null; email: string | null }) {
  const initials = name?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? '?';
  if (image) {
    return (
      <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
        <Image src={image} alt={name ?? 'User'} fill sizes="36px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-stone-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-stone-700">
      {initials}
    </div>
  );
}

export default async function HomepageCommunityPreview() {
  const t = await getTranslations('community');

  let posts: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    author: { id: string; name: string | null; image: string | null; email: string | null };
    _count: { comments: number; reactions: number };
  }[] = [];

  try {
    posts = await prisma.post.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true, email: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  return (
    <section className="mt-28">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('preview_label')}</p>
          <h2 className="font-display mt-2 text-3xl md:text-4xl">{t('preview_latest')}</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">{t('preview_tagline')}</p>
        </div>
        <Link
          href="/community"
          className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
        >
          {t('view_all_posts')}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.id}
            href="/community"
            className="group block rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <AvatarCircle
                name={post.author.name}
                image={post.author.image}
                email={post.author.email}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {post.author.name ?? t('preview_anonymous')}
                </p>
                <p className="text-xs text-slate-400">{timeAgo(post.createdAt, t)}</p>
              </div>
            </div>

            {post.imageUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-stone-100 mb-3">
                <Image
                  src={post.imageUrl}
                  alt={t('post_image_alt')}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            )}

            <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
              {post.content}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              {post._count.reactions > 0 && <span>❤️ {post._count.reactions}</span>}
              {post._count.comments > 0 && <span>💬 {post._count.comments}</span>}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/community"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200"
        >
          {t('go_to_community_btn')}
        </Link>
      </div>
    </section>
  );
}
