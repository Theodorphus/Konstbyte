import Link from 'next/link';

export default function AiPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI‑verktyg</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/ai/value-art" className="border rounded p-4">
          <h2 className="font-semibold">AI‑värdering</h2>
          <p className="text-sm text-slate-600">Få en uppskattning av värdet.</p>
        </Link>
        <Link href="/ai/inspiration" className="border rounded p-4">
          <h2 className="font-semibold">Inspiration</h2>
          <p className="text-sm text-slate-600">Skapa nya idéer och motiv.</p>
        </Link>
      </div>
    </div>
  );
}
