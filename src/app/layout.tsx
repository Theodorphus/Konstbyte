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
      <body className="bg-amber-50 text-slate-900 antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-slate-900 px-3 py-2 rounded">Hoppa till innehåll</a>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main id="main" role="main" className="flex-1 max-w-7xl mx-auto w-full p-6">{children}</main>
          <footer role="contentinfo" className="border-t bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr] text-sm mb-8">
                <div className="space-y-3">
                  <div className="text-lg font-bold flex items-center gap-2">
                    🎨 Konstbyte.se
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    Sveriges nya marknadsplats för konst. Köp och sälj unika verk direkt från konstnärer.
                  </p>
                  <p className="text-white/60">📧 konstbyte@gmail.com</p>
                  <p className="text-white/60">📍 Göteborg, Sverige</p>
                  <div className="flex gap-3 pt-2">
                    <a href="#" aria-label="Facebook" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                      📘
                    </a>
                    <a href="#" aria-label="Instagram" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                      📷
                    </a>
                    <a href="#" aria-label="Twitter" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                      🐦
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-orange-300">Marknadsplats</div>
                  <ul className="space-y-2 text-white/80">
                    <li><Link href="/artworks" className="hover:text-white transition-colors">Alla konstverk</Link></li>
                    <li><Link href="/artworks?category=Målning" className="hover:text-white transition-colors">Målningar</Link></li>
                    <li><Link href="/artworks?category=Skulptur" className="hover:text-white transition-colors">Skulpturer</Link></li>
                    <li><Link href="/ai/value-art" className="hover:text-white transition-colors">AI‑värdering</Link></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-pink-300">Community</div>
                  <ul className="space-y-2 text-white/80">
                    <li><Link href="/community" className="hover:text-white transition-colors">Diskussioner</Link></li>
                    <li><Link href="/feed" className="hover:text-white transition-colors">Ditt flöde</Link></li>
                    <li><Link href="/users" className="hover:text-white transition-colors">Hitta konstnärer</Link></li>
                    <li><Link href="/favorites" className="hover:text-white transition-colors">Favoriter</Link></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-purple-300">Information</div>
                  <ul className="space-y-2 text-white/80">
                    <li><Link href="/om-oss" className="hover:text-white transition-colors">Om Konstbyte</Link></li>
                    <li><Link href="/hur-det-fungerar" className="hover:text-white transition-colors">Hur det fungerar</Link></li>
                    <li><Link href="/avgifter" className="hover:text-white transition-colors">Avgifter & Priser</Link></li>
                    <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakta oss</Link></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/60">
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
