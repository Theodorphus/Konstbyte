import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <h1 className="text-2xl font-bold text-slate-900">Betalning genomförd!</h1>
      <p className="text-slate-600">
        Tack för ditt köp. Konstnären kommer att packa och skicka ditt konstverk inom 1–2 arbetsdagar.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/profile/orders"
          className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 transition-colors"
        >
          Visa mina beställningar
        </Link>
        <Link
          href="/artworks"
          className="px-5 py-2.5 rounded-md border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
        >
          Fortsätt handla
        </Link>
      </div>
    </div>
  );
}
