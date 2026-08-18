import { SITE_URL } from '@/lib/urls';
import './globals.css';
import React from 'react';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { getLocale } from 'next-intl/server';

const displayFont = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Konstbyte",
            "url": SITE_URL,
            "logo": `${SITE_URL}/favicon.svg`,
            "contactPoint": [{
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": "konstbyte@gmail.com",
              "availableLanguage": [locale === 'en' ? 'en' : 'sv'],
            }]
          }) }}
        />
      </head>
      <body className="bg-[#f6f2ea] text-slate-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
