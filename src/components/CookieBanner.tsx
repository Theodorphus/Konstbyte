"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie-notice-accepted";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie-information"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-slate-600 leading-relaxed">
          Vi använder nödvändiga sessionskakor för att hålla dig inloggad. Vi använder inga spårnings- eller marknadsföringskakor.{" "}
          <Link href="/policies/privacy" className="underline underline-offset-2 hover:text-slate-900 transition-colors">
            Läs mer
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/40"
        >
          Förstått
        </button>
      </div>
    </div>
  );
}
