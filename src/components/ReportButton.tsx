'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  type: 'artwork' | 'post' | 'comment' | 'user' | 'submission';
  id: string;
  className?: string;
};

/** Small "Report" link that opens a form and emails the report to the admins. */
export default function ReportButton({ type, id, className }: Props) {
  const t = useTranslations('report');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, reason }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }

  function close() {
    setOpen(false);
    setReason('');
    setState('idle');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50'}
      >
        {t('button')}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900">{t('title')}</h2>
            {state === 'sent' ? (
              <>
                <p className="mt-3 text-sm text-slate-600">{t('thanks')}</p>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={close} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    {t('close')}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={submit}>
                <p className="mt-2 text-sm text-slate-600">{t('intro')}</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  required
                  minLength={5}
                  placeholder={t('placeholder')}
                  className="mt-3 w-full resize-none rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                {state === 'error' && <p className="mt-2 text-sm text-red-600">{t('error')}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={close} className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-slate-700">
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={state === 'sending' || reason.trim().length < 5}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {state === 'sending' ? t('sending') : t('send')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
