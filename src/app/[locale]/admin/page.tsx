import prisma from '@/lib/prisma';
import { formatSek } from '@/lib/currency';
import ChallengeAdmin from './ChallengeAdmin';
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const t = await getTranslations('admin');
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const [users, artworks, challenges, resendHealth] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.artwork.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.challenge.findMany({
      orderBy: { startsAt: 'desc' },
      include: { _count: { select: { submissions: true } } },
    }),
    fetch(`${appUrl}/api/health/resend`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        return {
          ok: response.ok,
          status: response.status,
          ...data
        };
      })
      .catch((error) => ({
        ok: false,
        status: 500,
        message: error instanceof Error ? error.message : t('error_fetch')
      }))
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t('panel_title')}</h1>
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
      <section>
        <h2 className="text-lg font-medium">{t('artworks_section')}</h2>
        <ul className="mt-2 space-y-1">
          {artworks.map((art) => (
            <li key={art.id} className="text-sm">
              {art.title} — {formatSek(art.price)}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-medium">{t('users_section')}</h2>
        <ul className="mt-2 space-y-1">
          {users.map((u) => (
            <li key={u.id} className="text-sm">{u.email}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
