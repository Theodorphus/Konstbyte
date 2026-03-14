import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import ClientLayout from './ClientLayout';

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
  title: {
    default: 'Konstbyte — Marknadsplats för konst',
    template: '%s | Konstbyte',
  },
  description: 'Köp och sälj original konst direkt från svenska konstnärer. Hitta målningar, teckningar, skulpturer och mer på Konstbyte.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_METADATA_BASE || 'https://konstbyte.se'),
  openGraph: {
    title: 'Konstbyte — Marknadsplats för konst',
    description: 'Köp och sälj original konst direkt från svenska konstnärer. Hitta målningar, teckningar, skulpturer och mer på Konstbyte.',
    url: process.env.NEXT_PUBLIC_METADATA_BASE || 'https://konstbyte.se',
    siteName: 'Konstbyte',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Konstbyte — Marknadsplats för konst' }],
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Konstbyte — Marknadsplats för konst',
    description: 'Köp och sälj original konst direkt från svenska konstnärer.',
    images: ['/og-image.png'],
  },
};

const currentYear = new Date().getFullYear();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Konstbyte",
            "url": process.env.NEXT_PUBLIC_METADATA_BASE || 'http://localhost:3000',
            "logo": `${process.env.NEXT_PUBLIC_METADATA_BASE || 'http://localhost:3000'}/favicon.svg`,
            "sameAs": [
              "https://facebook.com/konstbyte",
              "https://instagram.com/konstbyte",
              "https://twitter.com/konstbyte"
            ],
            "contactPoint": [{
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": "konstbyte@gmail.com",
              "availableLanguage": "sv"
            }]
          }) }}
        />
      </head>
      <body className="bg-[#f6f2ea] text-slate-900 antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-slate-900 px-3 py-2 rounded">
          Hoppa till innehåll
        </a>
        <div className="min-h-screen flex flex-col">
            <ClientLayout>
              <main id="main" role="main" className="flex-1 max-w-7xl mx-auto w-full p-6">
                {children}
              </main>
            </ClientLayout>
          <footer role="contentinfo" className="border-t border-slate-200/70 bg-gradient-to-b from-white via-[#f7f3ec] to-[#efe7da] text-slate-700">
            <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
              {/* Top row */}
              <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] text-sm mb-12">
                {/* Brand */}
                <div className="space-y-4">
                  <div className="font-display text-xl font-semibold tracking-wide flex items-center gap-2 text-slate-900">
                    🎨 Konstbyte
                  </div>
                  <p className="text-slate-600 leading-relaxed max-w-xs">
                    Ett svenskt community där kreatörer växer tillsammans. Köp och sälj unika verk direkt från konstnärer.
                  </p>
                  <div className="space-y-1 text-slate-500 text-xs">
                    <p>📧 konstbyte@gmail.com</p>
                    <p>📍 Göteborg, Sverige</p>
                  </div>
                </div>

                {/* Marknadsplats */}
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Marknadsplats</div>
                  <ul className="space-y-2.5 text-slate-600">
                    <li><Link href="/artworks" className="hover:text-slate-900 transition-colors">Alla konstverk</Link></li>
                    <li><Link href="/artworks?category=Målning" className="hover:text-slate-900 transition-colors">Målningar</Link></li>
                    <li><Link href="/artworks?category=Skulptur" className="hover:text-slate-900 transition-colors">Skulpturer</Link></li>
                    <li><Link href="/join" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors">Bli konstnär →</Link></li>
                    <li><Link href="/ai/value-art" className="hover:text-slate-900 transition-colors">AI-värdering</Link></li>
                  </ul>
                </div>

                {/* Community & Information kombinerat */}
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Community</div>
                  <ul className="space-y-2.5 text-slate-600">
                    <li><Link href="/community" className="hover:text-slate-900 transition-colors">Diskussioner</Link></li>
                    <li><Link href="/feed" className="hover:text-slate-900 transition-colors">Flöde</Link></li>
                    <li><Link href="/users" className="hover:text-slate-900 transition-colors">Hitta konstnärer</Link></li>
                    <li><Link href="/utmaning" className="hover:text-slate-900 transition-colors">Utmaningar</Link></li>
                  </ul>
                </div>

                {/* Information & Policies */}
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Information</div>
                  <ul className="space-y-2.5 text-slate-600">
                    <li><Link href="/om-oss" className="hover:text-slate-900 transition-colors">Om Konstbyte</Link></li>
                    <li><Link href="/hur-det-fungerar" className="hover:text-slate-900 transition-colors">Hur det fungerar</Link></li>
                    <li><Link href="/avgifter" className="hover:text-slate-900 transition-colors">Avgifter & priser</Link></li>
                    <li><Link href="/policies/faq" className="hover:text-slate-900 transition-colors">Vanliga frågor</Link></li>
                    <li><Link href="/policies/terms" className="hover:text-slate-900 transition-colors">Användarvillkor</Link></li>
                    <li><Link href="/policies/privacy" className="hover:text-slate-900 transition-colors">Integritetspolicy</Link></li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-slate-200/70 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
                <span>© {currentYear} Konstbyte.se. Alla rättigheter förbehållna.</span>
                <span className="font-medium text-slate-500">Bara 5% i plattformsavgift — trygg betalning med Stripe.</span>
              </div>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}

