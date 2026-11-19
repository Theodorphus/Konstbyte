'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Shown only when the root layout itself crashes, so it renders its own <html>
// and can't rely on the site's CSS.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="sv">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f7f3ec', color: '#0f172a' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, margin: '0 0 12px' }}>Något gick fel</h1>
          <p style={{ margin: '0 0 24px', color: '#475569' }}>Ett oväntat fel uppstod. Ladda om sidan eller försök igen om en stund.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload is intentional here */}
          <a href="/" style={{ padding: '10px 20px', borderRadius: 8, background: '#0f172a', color: '#fff', textDecoration: 'none' }}>
            Till startsidan
          </a>
        </main>
      </body>
    </html>
  );
}
