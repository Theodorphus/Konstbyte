import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Plattformens roll och ansvarsbegränsning – Konstbyte' };

export default async function AnsvarPage() {
  const t = await getTranslations('policies');
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10 text-slate-800">
      <div>
        <p className="text-sm text-slate-500 mb-1">{t('last_updated')} mars 2026</p>
        <h1 className="text-3xl font-bold">{t('ansvar_title')}</h1>
        <p className="mt-3 text-slate-600">
          Denna sida förklarar tydligt vad Konstbyte är, vad vi gör – och vad vi inte gör.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-2">
        <h2 className="text-lg font-bold text-slate-900">Konstbyte är inte part i köpeavtalet</h2>
        <p className="text-slate-700">
          När du köper ett konstverk på Konstbyte ingår du ett avtal med konstnären – inte med Konstbyte. Vi förmedlar kontakten och hanterar betalningen, men köpeavtalet gäller mellan dig som köpare och konstnären som säljare.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Vad Konstbyte tillhandahåller</h2>
        <ul className="list-disc list-inside space-y-2 text-slate-700">
          <li><strong>Teknisk plattform</strong> – möjligheten att ladda upp, visa och köpa konstverk online.</li>
          <li><strong>Betalningslösning</strong> – säker betalning via Stripe. Pengarna tas emot av Konstbyte och betalas manuellt ut till konstnären efter bekräftad leverans.</li>
          <li><strong>Viss support</strong> – vi kan svara på frågor och vid behov bistå som medlare om problem uppstår mellan köpare och säljare.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Vad Konstbyte inte ansvarar för</h2>
        <ul className="list-disc list-inside space-y-2 text-slate-700">
          <li><strong>Verkens skick och äkthet</strong> – konstnären ansvarar för att verket stämmer med beskrivningen.</li>
          <li><strong>Leverans</strong> – konstnären ansvarar för att skicka verket. Konstbyte är inte ansvariga för förseningar eller skador under transport.</li>
          <li><strong>Äganderätt</strong> – Konstbyte äger inte konstverken och hanterar dem inte fysiskt.</li>
          <li><strong>Tvister mellan köpare och säljare</strong> – om en tvist uppstår är det i första hand köparen och konstnären som ska lösa den.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Medling</h2>
        <p>
          Konstbyte kan på begäran bistå som neutral part om en tvist uppstår. Vi kan hjälpa till att kommunicera och föreslå lösningar, men kan inte garantera ett visst utfall och är inte skyldiga att ersätta någon part för konstnärens eller köparens handlande.
        </p>
        <p>
          Kontakta oss på{' '}
          <a href="mailto:hej@konstbyte.se" className="underline text-blue-600">hej@konstbyte.se</a>{' '}
          om du behöver hjälp med ett ärende.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Ansvarsbegränsning</h2>
        <p>
          Konstbyttes ansvar är alltid begränsat till de avgifter du faktiskt betalat till Konstbyte (plattformsprovision) för den aktuella transaktionen. Vi ersätter aldrig:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>indirekta skador eller följdskador</li>
          <li>inkomstbortfall eller utebliven vinst</li>
          <li>skador som beror på tredje parts handlande (t.ex. fraktbolag, konstnär eller köpare)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Tillämpllig lag</h2>
        <p>
          Svensk lag gäller. Tvister prövas av Allmänna reklamationsnämnden (ARN) i första hand, och allmän domstol i andra hand.
        </p>
      </section>
    </div>
  );
}
