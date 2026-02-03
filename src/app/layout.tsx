import './globals.css';
import React from 'react';
import NavBar from '../components/NavBar';

export const metadata = {
  title: 'Konstbyte',
  description: 'Marknadsplats för konst'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1 max-w-7xl mx-auto w-full p-6">{children}</main>
          <footer className="border-t py-10 px-6 bg-slate-50">
            <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr] text-sm">
              <div className="space-y-2">
                <div className="text-base font-semibold">Konstbyte.se</div>
                <p className="text-slate-600">
                  Sveriges nya marknadsplats för konst. Köp och sälj unika verk direkt från konstnärer.
                </p>
                <p className="text-slate-500">konstbyte@gmail.com</p>
                <p className="text-slate-500">Göteborg, Sverige</p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Marknadsplats</div>
                <ul className="space-y-1 text-slate-600">
                  <li><a href="/artworks">Alla konstverk</a></li>
                  <li><a href="/artworks?category=malningar">Målningar</a></li>
                  <li><a href="/artworks?category=skulpturer">Skulpturer</a></li>
                  <li><a href="/ai/value-art">AI‑värdering</a></li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Community</div>
                <ul className="space-y-1 text-slate-600">
                  <li><a href="/community">Diskussioner</a></li>
                  <li><a href="/community?filter=senaste">Senaste inlägg</a></li>
                  <li><a href="/community?filter=konstnarer">Konstnärsprofiler</a></li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Information</div>
                <ul className="space-y-1 text-slate-600">
                  <li><a href="/om-oss">Om Konstbyte</a></li>
                  <li><a href="/hur-det-fungerar">Hur det fungerar</a></li>
                  <li><a href="/avgifter">Avgifter & Priser</a></li>
                  <li><a href="/kontakt">Kontakta oss</a></li>
                </ul>
              </div>
            </div>
            <div className="max-w-5xl mx-auto text-xs text-slate-500 mt-8 flex flex-col gap-1">
              <span>© 2026 Konstbyte.se. Alla rättigheter förbehållna.</span>
              <span>Plattformsavgift: 3% på alla försäljningar. Säker betalning med Stripe.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
