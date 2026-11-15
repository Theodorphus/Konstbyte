'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Confirming receipt releases the artist's payout and can't be undone, so the
 * buyer gets a second step before the form is submitted.
 */
export default function ConfirmReceivedButton({ orderId }: { orderId: string }) {
  const t = useTranslations('orders');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
      >
        <span>✅</span> {t('mark_received')}
      </button>
    );
  }

  return (
    <form
      action={`/api/orders/${orderId}/receive`}
      method="POST"
      onSubmit={() => setSubmitting(true)}
      className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-900">{t('confirm_received_title')}</p>
      <p className="text-sm text-slate-600">{t('confirm_received_body')}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? t('confirm_received_sending') : t('confirm_received_yes')}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => setConfirming(false)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          {t('confirm_received_cancel')}
        </button>
      </div>
    </form>
  );
}
