import Link from 'next/link';
import React from 'react';

const policyLinks = [
  { href: '/policies/terms', label: 'Användarvillkor' },
  { href: '/policies/privacy', label: 'Integritetspolicy' },
  { href: '/policies/ai', label: 'AI-policy' },
  { href: '/policies/content', label: 'Innehållspolicy' },
  { href: '/policies/faq', label: 'Vanliga frågor' },
];

interface PolicyLayoutProps {
  title: string;
  subtitle?: string;
  icon: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function PolicyLayout({
  title,
  subtitle,
  icon,
  lastUpdated,
  children,
}: PolicyLayoutProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-10">

      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Tillbaka
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Konstbyte</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
          </div>
        </div>
        {subtitle && <p className="text-slate-500 text-sm leading-relaxed">{subtitle}</p>}
        {lastUpdated && (
          <p className="text-xs text-slate-400">Senast uppdaterad: {lastUpdated}</p>
        )}
      </div>

      {/* Sibling policy nav */}
      <div className="flex flex-wrap gap-2">
        {policyLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200" />

      {/* Content */}
      <div className="space-y-10 text-sm text-slate-700 leading-relaxed">
        {children}
      </div>

      {/* Footer note */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-slate-500 leading-relaxed">
        Har du frågor om dessa villkor? Kontakta oss på{' '}
        <a href="mailto:konstbyte@gmail.com" className="text-slate-700 underline underline-offset-2">
          konstbyte@gmail.com
        </a>
      </div>
    </div>
  );
}

// ─── Reusable section components ──────────────────────────────────────────────

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PolicyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-xs leading-relaxed">
      {children}
    </div>
  );
}
