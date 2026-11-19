import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { checkResend } from '@/lib/resend-health';
import ChallengeAdmin from './ChallengeAdmin';
import ArtworksAdmin from './ArtworksAdmin';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Prisma } from '@prisma/client';

export const dynamic = "force-dynamic";

const ARTWORKS_PER_PAGE = 50;
const USERS_SHOWN = 50;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdmin(currentUser.email)) {
    redirect('/');
  }

  const t = await getTranslations('admin');
  const params = await searchParams;
  const q = (params.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  // Search by title or by the artist's name or email.
  const artworkWhere: Prisma.ArtworkWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { owner: { name: { contains: q, mode: 'insensitive' } } },
          { owner: { email: { contains: q, mode: 'insensitive' } } },
        ],
      }
    : {};

  const [users, userCount, artworks, artworkMatches, publishedCount, soldCount, paidOrderCount, challenges, resendHealth] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: USERS_SHOWN,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.user.count(),
    prisma.artwork.findMany({
      where: artworkWhere,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ARTWORKS_PER_PAGE,
      take: ARTWORKS_PER_PAGE,
      select: {
        id: true,
        title: true,
        price: true,
        imageUrl: true,
        removedByAdmin: true,
        owner: { select: { name: true, email: true } },
      },
    }),
    prisma.artwork.count({ where: artworkWhere }),
    prisma.artwork.count({ where: { isPublished: true, isSold: false } }),
    prisma.artwork.count({ where: { isSold: true } }),
    prisma.order.count({ where: { status: { in: ['paid', 'delivered', 'completed'] } } }),
    prisma.challenge.findMany({
      orderBy: { startsAt: 'desc' },
      take: 30,
      include: { _count: { select: { submissions: true } } },
    }),
    checkResend(),
  ]);
  const pageCount = Math.max(1, Math.ceil(artworkMatches / ARTWORKS_PER_PAGE));
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (n > 1) sp.set('page', String(n));
    const qs = sp.toString();
    return qs ? `/admin?${qs}` : '/admin';
  };
  const stats = [
    { label: 'Användare', value: userCount },
    { label: 'Verk till salu', value: publishedCount },
    { label: 'Sålda verk', value: soldCount },
    { label: 'Betalda ordrar', value: paidOrderCount },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('panel_title')}</h1>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-slate-200 bg-white p-3">
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className="text-xl font-semibold text-slate-900">{stat.value.toLocaleString('sv-SE')}</dd>
          </div>
        ))}
      </dl>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/payouts" className="rounded-full border border-slate-200 bg-white px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
          💸 Utbetalningar
        </Link>
        <Link href="/admin/testimonials" className="rounded-full border border-slate-200 bg-white px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
          💬 Omdömen
        </Link>
      </nav>
      <ChallengeAdmin
        initial={challenges.map(c => ({
          id: c.id,
          title: c.title,
          weekNumber: c.weekNumber,
          year: c.year,
          startsAt: c.startsAt.toISOString(),
          endsAt: c.endsAt.toISOString(),
          submissionCount: c._count.submissions,
        }))}
      />

      <section className="rounded-md border border-slate-200 p-4">
        <h2 className="text-lg font-medium">{t('resend_health')}</h2>
        <p className={`mt-2 text-sm ${resendHealth.ok ? 'text-emerald-700' : 'text-red-700'}`}>
          {t('status_label')} {resendHealth.ok ? t('status_ok') : t('status_error')} (HTTP {resendHealth.status})
        </p>
        <p className="mt-1 text-sm text-slate-600">{resendHealth.message || t('no_status_msg')}</p>
      </section>
      <form action="/admin" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Sök verk på titel, konstnär eller e-post"
          aria-label="Sök konstverk"
          className="h-9 min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 text-sm"
        />
        <button type="submit" className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700">
          Sök
        </button>
        {q && (
          <Link href="/admin" className="text-sm text-slate-600 underline">
            Rensa
          </Link>
        )}
        <span className="text-sm text-slate-500">{artworkMatches.toLocaleString('sv-SE')} verk</span>
      </form>
      <ArtworksAdmin
        key={`${q}|${page}`}
        initial={artworks.map(art => ({
          id: art.id,
          title: art.title,
          price: art.price,
          imageUrl: art.imageUrl,
          removedByAdmin: art.removedByAdmin,
          owner: {
            name: art.owner?.name || null,
            email: art.owner?.email || 'unknown@email.com',
          },
        }))}
      />
      {pageCount > 1 && (
        <nav aria-label="Sidor" className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-50">← Föregående</Link>}
          <span className="text-slate-600">Sida {page} av {pageCount}</span>
          {page < pageCount && <Link href={pageHref(page + 1)} className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-50">Nästa →</Link>}
        </nav>
      )}
      <section>
        <h2 className="text-lg font-medium">{t('users_section')}</h2>
        <p className="mt-1 text-sm text-slate-500">
          De {Math.min(USERS_SHOWN, userCount)} senaste av {userCount.toLocaleString('sv-SE')}
        </p>
        <ul className="mt-2 space-y-1">
          {users.map((u) => (
            <li key={u.id} className="text-sm">
              <Link href={`/users/${u.id}`} className="hover:underline">{u.name || 'Utan namn'}</Link>
              <span className="text-slate-500"> · {u.email} · {u.createdAt.toLocaleDateString('sv-SE')}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
