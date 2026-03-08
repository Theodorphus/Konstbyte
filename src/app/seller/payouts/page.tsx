import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { formatSek } from '../../../lib/currency';

export const dynamic = 'force-dynamic';

function StatusPill({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-green-100 text-green-700 border-green-200">
        Utbetald
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">
      Väntar
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-600">
      {method === 'bank' ? 'Banköverföring' : 'Swish'}
    </span>
  );
}

export default async function SellerPayoutsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  const payouts = await prisma.payout.findMany({
    where: { sellerId: user.id },
    include: {
      order: {
        select: {
          id: true,
          createdAt: true,
          artwork: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.sellerPayoutAmount, 0);

  const pendingCount = payouts.filter((p) => p.status === 'pending').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mina utbetalningar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Översikt över dina utbetalningar från Konstbyte
          </p>
        </div>
        <Link href="/profile" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← Profil
        </Link>
      </div>

      {/* Summary */}
      {payouts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">Totalt utbetalt</p>
            <p className="text-2xl font-bold text-green-800">{formatSek(totalPaidOut)}</p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">Inväntar utbetalning</p>
              <p className="text-2xl font-bold text-amber-800">{pendingCount} order</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {payouts.length === 0 && (
        <div className="py-20 text-center space-y-3">
          <div className="text-4xl">💸</div>
          <p className="text-slate-500">Du har inga utbetalningar ännu.</p>
          <p className="text-xs text-stone-400">
            Utbetalningar skapas när Konstbyte bekräftar att köparen betalat och verket levererats.
          </p>
          <Link
            href="/seller/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Visa mina sålda verk
          </Link>
        </div>
      )}

      {/* Payout list */}
      <div className="space-y-4">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {payout.order.artwork?.title ?? 'Konstverk'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order #{payout.order.id.slice(-8).toUpperCase()} ·{' '}
                  {new Date(payout.order.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
              <StatusPill status={payout.status} />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-sm border-t border-stone-100 pt-4">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Ordertotal</p>
                <p className="font-semibold text-slate-800">{formatSek(payout.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">
                  Provision ({Math.round(payout.commissionRate * 100)}%)
                </p>
                <p className="font-semibold text-red-600">−{formatSek(payout.commissionAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Din utbetalning</p>
                <p className="font-bold text-green-700">{formatSek(payout.sellerPayoutAmount)}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 pt-1 text-xs text-stone-400">
              <MethodBadge method={payout.method} />
              {payout.completedAt && (
                <span>
                  Utbetald{' '}
                  {new Date(payout.completedAt).toLocaleDateString('sv-SE', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
              )}
              {payout.adminNote && (
                <span className="italic">· {payout.adminNote}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
