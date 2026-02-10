import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import NavBar from '../components/NavBar';

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
  title: 'Konstbyte',
  description: 'Marknadsplats för konst'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <meta property="og:title" content="Konstbyte" />
        <meta property="og:description" content="Marknadsplats för konst" />
        <meta property="og:image" content="/og-image.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-slate-900 px-3 py-2 rounded">Hoppa till innehåll</a>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main id="main" role="main" className="flex-1 max-w-7xl mx-auto w-full p-6">{children}</main>
          <footer role="contentinfo" className="border-t border-slate-200/70 bg-gradient-to-b from-white via-[#f7f3ec] to-[#efe7da] text-slate-700">
            <div className="max-w-7xl mx-auto px-6 py-14">
              <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr] text-sm mb-10">
                <div className="space-y-3">
                  <div className="font-display text-lg font-semibold tracking-wide flex items-center gap-2 text-slate-900">
                    🎨 Konstbyte
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Konstbyte — ett svenskt community för kreatörer. Köp och sälj unika verk direkt från konstnärer.
                  </p>
                  <p className="text-slate-500">📧 konstbyte@gmail.com</p>
                  <p className="text-slate-500">📍 Göteborg, Sverige</p>
                  <div className="flex gap-3 pt-2">
                    <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full border border-slate-200/70 bg-white/70 hover:bg-white flex items-center justify-center transition-colors">
                      📘
                    </a>
                    <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full border border-slate-200/70 bg-white/70 hover:bg-white flex items-center justify-center transition-colors">
                      📷
                    </a>
                    <a href="#" aria-label="Twitter" className="w-8 h-8 rounded-full border border-slate-200/70 bg-white/70 hover:bg-white flex items-center justify-center transition-colors">
                      🐦
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-slate-900">Marknadsplats</div>
                  <ul className="space-y-2 text-slate-600">
                    <li><Link href="/artworks" className="hover:text-slate-900 transition-colors">Alla konstverk</Link></li>
                    <li><Link href="/artworks?category=Målning" className="hover:text-slate-900 transition-colors">Målningar</Link></li>
                    <li><Link href="/artworks?category=Skulptur" className="hover:text-slate-900 transition-colors">Skulpturer</Link></li>
                    <li><Link href="/artworks/new" className="hover:text-slate-900 transition-colors">Bli konstnär</Link></li>
                    <li><Link href="/ai/value-art" className="hover:text-slate-900 transition-colors">AI‑värdering</Link></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-slate-900">Community</div>
                  <ul className="space-y-2 text-slate-600">
                    <li><Link href="/community" className="hover:text-slate-900 transition-colors">Diskussioner</Link></li>
                    <li><Link href="/community" className="hover:text-slate-900 transition-colors">Gå med i communityt</Link></li>
                    <li><Link href="/feed" className="hover:text-slate-900 transition-colors">Ditt flöde</Link></li>
                    <li><Link href="/users" className="hover:text-slate-900 transition-colors">Hitta konstnärer</Link></li>
                    <li><Link href="/favorites" className="hover:text-slate-900 transition-colors">Favoriter</Link></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-slate-900">Information</div>
                  <ul className="space-y-2 text-slate-600">
                    <li><Link href="/om-oss" className="hover:text-slate-900 transition-colors">Om Konstbyte</Link></li>
                    <li><Link href="/hur-det-fungerar" className="hover:text-slate-900 transition-colors">Hur det fungerar</Link></li>
                    <li><Link href="/hur-det-fungerar" className="hover:text-slate-900 transition-colors">Guider</Link></li>
                    <li><Link href="/avgifter" className="hover:text-slate-900 transition-colors">Avgifter & Priser</Link></li>
                    <li><Link href="/kontakt" className="hover:text-slate-900 transition-colors">Kontakta oss</Link></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-slate-200/70 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                <span>© 2026 Konstbyte.se. Alla rättigheter förbehållna.</span>
                <span>Plattformsavgift: 3% på alla försäljningar. Säker betalning med Stripe.</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
