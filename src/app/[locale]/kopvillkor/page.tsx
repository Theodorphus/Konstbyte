import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Köpvillkor – Konstbyte' };

export default async function KopvillkorPage() {
  const t = await getTranslations('policies');
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10 text-slate-800">
      <div>
        <p className="text-sm text-slate-500 mb-1">{t('last_updated')} mars 2026</p>
        <h1 className="text-3xl font-bold">{t('kopvillkor_title')}</h1>
        <p className="mt-3 text-slate-600">
          Dessa köpvillkor gäller för alla köp som genomförs via Konstbyte. Genom att slutföra ett köp godkänner du villkoren nedan.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Konstbyttes roll</h2>
        <p>
          Konstbyte är en digital marknadsplats som förmedlar kontakt mellan köpare och konstnärer. Konstbyte är <strong>inte</strong> säljare av konstverken. Varje konstverk säljs av den konstnär som har lagt upp det, och konstnären är den juridiska säljaren i varje transaktion.
        </p>
        <p>
          Konstbyte tillhandahåller teknisk plattform och betalningshantering via Stripe. Pengarna hanteras av Konstbyte och betalas ut manuellt till konstnären efter att köpet bekräftats.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Priser och avgifter</h2>
        <p>
          Priserna på konstverken sätts av respektive konstnär och anges i svenska kronor (SEK) inklusive moms, om inget annat anges. Konstbyte tar en plattformsavgift om 3 % av försäljningspriset, vilket redan är inräknat i det pris du ser som köpare.
        </p>
        <p>
          Eventuell frakt tillkommer och kommuniceras separat.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Betalning</h2>
        <p>
          Betalning sker via Stripe Checkout och du kan betala med de kortbetalningsmetoder som erbjuds vid betalning. Betalningen dras direkt vid köptillfället.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Leverans</h2>
        <p>
          Leveransen sköts av konstnären. Uppskattad leveranstid är 3–5 arbetsdagar inom Sverige efter att konstnären skickat verket. Konstbyte ansvarar inte för förseningar, skador eller förluster som uppstår under transport, men kan bistå med att medla vid problem.
        </p>
        <p>
          Konstnären ansvarar för att paketera verket omsorgsfullt. Vid skada under frakt ska du kontakta konstnären i första hand och Konstbyte för stöd.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Ångerrätt</h2>
        <p>
          Du har rätt att ångra ditt köp inom <strong>14 dagar</strong> från det att du tagit emot varan, i enlighet med distans- och hemförsäljningslagen (2005:59). Ångerrätten gäller under förutsättning att varan återlämnas i ursprungligt skick.
        </p>
        <p>
          För att utöva din ångerrätt kontaktar du konstnären direkt. Returfrakten bekostas normalt av köparen, om inte annat avtalats.
        </p>
        <p>
          Observera att ångerrätten inte gäller för konstverk som är specialtillverkade eller tydligt personliga.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Reklamation</h2>
        <p>
          Om du anser att ett konstverk är felaktigt levererat, skadat eller inte stämmer överens med beskrivningen ska du i första hand kontakta konstnären. Konstbyte kan på begäran medla i tvisten, men är inte skyldig att ersätta köparen för konstnärens åtaganden.
        </p>
        <p>
          Reklamation ska göras inom skälig tid efter att felet upptäckts, dock senast tre år från köpet.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Ansvarsbegränsning</h2>
        <p>
          Konstbyte ansvarar inte för konstverkets kvalitet, äkthet, konstnärens leveransförmåga eller skador som uppstår under transport. Konstbytes maximala ansvar gentemot köparen är begränsat till det belopp som betalats för det aktuella köpet.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Tillämplig lag</h2>
        <p>
          Dessa köpvillkor lyder under svensk lag. Tvister ska i första hand lösas i godo, i andra hand prövas av Allmänna reklamationsnämnden (ARN) eller av allmän domstol.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Kontakt</h2>
        <p>
          Frågor om ett köp riktas i första hand till konstnären. Kan du inte lösa ärendet kontaktar du Konstbyte på{' '}
          <a href="mailto:hej@konstbyte.se" className="underline text-blue-600">hej@konstbyte.se</a>.
        </p>
      </section>
    </div>
  );
}
