import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { COMPANY, COMPANY_LINE } from '@/lib/company';
import { PLATFORM_FEE_PERCENT } from '@/lib/payout';

export const metadata = { title: 'Köpvillkor' };

const mail = (
  <a href={`mailto:${COMPANY.email}`} className="underline text-blue-600">
    {COMPANY.email}
  </a>
);

export default async function KopvillkorPage() {
  const t = await getTranslations('policies');
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10 text-slate-800">
      <div>
        <p className="text-sm text-slate-500 mb-1">{t('last_updated')} november 2026</p>
        <h1 className="text-3xl font-bold">{t('kopvillkor_title')}</h1>
        <p className="mt-3 text-slate-600">
          Dessa köpvillkor gäller när du köper ett konstverk via Konstbyte. Läs dem innan du betalar. Genom att gå vidare till betalning godkänner du villkoren.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-2">
        <h2 className="text-lg font-bold text-slate-900">Du köper av konstnären, inte av Konstbyte</h2>
        <p className="text-slate-700">
          Köpeavtalet ingås mellan dig och konstnären som säljer verket. Konstbyte är inte säljare och inte part i köpet. Konstbyte tillhandahåller marknadsplatsen och tar emot betalningen för säljarens räkning.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Vem du köper av</h2>
        <p>
          Säljaren är konstnären som har lagt upp verket. Säljaren ansvarar för verket, för att beskrivningen stämmer och för att verket skickas till dig.
        </p>
        <p>
          Konstbyte drivs av {COMPANY_LINE}, e-post {mail}. Konstbyte tar emot betalningen för säljarens räkning via Stripe och betalar ut den till säljaren enligt punkt 4.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Privatperson eller företag</h2>
        <p>
          I annonsen och i kassan står det om säljaren säljer som privatperson eller som företag. Uppgiften kommer från säljaren, och säljaren ansvarar för att den stämmer. Det avgör vilka rättigheter du har:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>
            <strong>Köp från en privatperson:</strong> köplagen gäller. Konsumentlagarna, till exempel ångerrätten, gäller inte.
          </li>
          <li>
            <strong>Köp från ett företag:</strong> konsumentköplagen och lagen om distansavtal och avtal utanför affärslokaler gäller. Rättigheterna har du gentemot säljaren. Företagets namn och organisationsnummer finns i orderbekräftelsen och på ordersidan.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Priser och avgifter</h2>
        <p>
          Säljaren sätter priset. Priset anges i svenska kronor och är det du betalar för verket, inklusive eventuell moms. Frakten visas i kassan innan du betalar. Har säljaren valt att frakten ska överenskommas bestämmer ni den direkt med varandra.
        </p>
        <p>
          Du betalar inga avgifter till Konstbyte. Konstbytes avgift på {PLATFORM_FEE_PERCENT} % betalas av säljaren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Betalning</h2>
        <p>
          Du betalar via Stripe med kort, Klarna, Apple Pay, Google Pay eller de andra betalsätt som visas i kassan. Konstbyte håller betalningen tills du har bekräftat att verket har kommit fram, eller automatiskt 14 dagar efter att säljaren har markerat verket som skickat. Då betalas pengarna ut till säljaren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Leverans</h2>
        <p>
          Säljaren packar och skickar verket och ansvarar för leveranstiden. Konstbyte hanterar inte verket och är inte part i avtalet med fraktbolaget.
        </p>
        <p>
          Köper du av ett företag står säljaren för risken för verket tills du har tagit emot det. Köper du av en privatperson gäller köplagen: skickas verket går risken som huvudregel över till dig när säljaren har lämnat det till fraktbolaget, om ni inte har kommit överens om något annat.
        </p>
        <p>
          Försenade, skadade eller borttappade paket tar du i första hand upp med säljaren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Kontrollera verket när det kommer</h2>
        <p>
          Öppna paketet och kontrollera verket så snart du har fått det, innan du bekräftar mottagandet på ordersidan. Är verket skadat eller fel, eller kommer det inte fram, kontaktar du säljaren och meddelar Konstbyte på {mail} innan du bekräftar.
        </p>
        <p>
          Så länge betalningen hålls kvar kan Konstbyte efter eget beslut stoppa utbetalningen och betala tillbaka till dig, till exempel om säljaren inte skickar verket. Konstbyte betalar aldrig tillbaka mer än det som hålls kvar för köpet och ersätter dig inte för säljarens åtaganden.
        </p>
        <p>
          När du har bekräftat mottagandet, eller 14 dagar efter att verket skickades, betalas pengarna ut och kan inte längre stoppas. Krav på grund av fel riktar du då direkt till säljaren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Ångerrätt</h2>
        <p>
          <strong>Köp från ett företag:</strong> du har 14 dagars ångerrätt från den dag du tog emot verket. Meddela säljaren inom fristen, till exempel via meddelandefunktionen. Du kan använda Konsumentverkets standardblankett för ångerrätt. Skicka sedan tillbaka verket inom 14 dagar. Du betalar returfrakten om säljaren inte erbjuder något annat, och verket ska vara väl förpackat. Säljaren ansvarar för att du får tillbaka pengarna. Återbetalningen görs via Konstbyte till samma betalsätt och belastar säljaren.
        </p>
        <p>
          Ångerrätten gäller inte verk som har tillverkats efter dina anvisningar eller fått en tydlig personlig prägel, till exempel beställda porträtt.
        </p>
        <p>
          <strong>Köp från en privatperson:</strong> det finns ingen lagstadgad ångerrätt. Säljaren kan erbjuda det frivilligt, och det är då en överenskommelse mellan er.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Fel på verket</h2>
        <p>
          Stämmer verket inte med beskrivningen, eller har det ett fel, vänder du dig till säljaren. Gör det inom skälig tid efter att du upptäckte felet.
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>
            <strong>Köp från ett företag:</strong> konsumentköplagen gäller. Du kan reklamera i upp till tre år, och en reklamation inom två månader från att du upptäckte felet räknas alltid som i rätt tid.
          </li>
          <li>
            <strong>Köp från en privatperson:</strong> köplagen gäller. Reklamera inom skälig tid, och senast två år efter att du tog emot verket.
          </li>
        </ul>
        <p>Konstbyte garanterar inte verkets äkthet, skick eller värde.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Konstbytes ansvar</h2>
        <p>
          Konstbyte ansvarar för att marknadsplatsen och betalningshanteringen sköts med omsorg. Konstbyte ansvarar inte för verket, säljarens uppgifter, leveransen eller något annat som säljaren har åtagit sig.
        </p>
        <p>
          Konstbytes sammanlagda ansvar mot dig är begränsat till den avgift som Konstbyte har fått för det köp som kravet gäller.
        </p>
        <p className="text-slate-600">
          Begränsningarna gäller inte om Konstbyte har orsakat skadan med uppsåt eller genom grov vårdslöshet, och de inskränker inte de rättigheter du har enligt tvingande lag.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Tvister</h2>
        <p>
          Tvister om verket löser du med säljaren. Har du köpt av ett företag kan du vända dig till Allmänna reklamationsnämnden (ARN). Konstbyte kan förmedla kontakt, men är inte part i tvisten och avgör den inte, utöver det som står i punkt 6.
        </p>
        <p>
          Dessa villkor lyder under svensk lag. Tvister med Konstbyte om Konstbytes egen tjänst kan prövas av ARN eller allmän domstol.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">11. Kontakt</h2>
        <p>
          Frågor om verket ställer du till säljaren via meddelandefunktionen. Frågor om betalningen eller om Konstbyte skickar du till {mail}. Se även{' '}
          <Link href="/policies/terms" className="underline text-blue-600">användarvillkoren</Link>.
        </p>
      </section>
    </div>
  );
}
