'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">⚠️</div>
      <h1 className="font-display text-4xl font-bold text-slate-900 mb-4">Något gick fel</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        Ett oväntat fel uppstod. Försök igen eller kontakta oss om problemet kvarstår.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Försök igen
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Till startsidan
        </a>
      </div>
    </div>
  );
}
