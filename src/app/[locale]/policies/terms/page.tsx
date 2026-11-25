import PolicyLayout, { PolicySection, PolicyList, PolicyNote } from '../PolicyLayout';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { COMPANY, COMPANY_LINE } from '@/lib/company';
import { PLATFORM_FEE_PERCENT } from '@/lib/payout';

export const metadata = {
  title: 'Användarvillkor',
  description: 'Läs Konstbytes användarvillkor för köp, försäljning och användning av plattformen.',
};

const mail = (
  <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-2">{COMPANY.email}</a>
);

export default async function TermsPage() {
  const t = await getTranslations('policies');
  return (
    <PolicyLayout
      title={t('terms_title')}
      icon="📋"
      subtitle={t('terms_subtitle')}
      lastUpdated="november 2026"
    >
      <PolicyNote>
        <strong>Viktigt:</strong> Konstbyte är en marknadsplats. Köp sker mellan köpare och säljare, och Konstbyte är inte part i köpen. Konstbyte tar emot betalningen för säljarens räkning, men ansvarar inte för konstverken, beskrivningarna eller leveranserna.
      </PolicyNote>

      <PolicySection title="1. Om Konstbyte">
        <p>
          Konstbyte är en digital marknadsplats där konstnärer och andra säljare kan lägga upp och sälja konst, och där köpare kan köpa den.
        </p>
        <p>
          Konstbyte.se ägs och drivs av {COMPANY_LINE}. Frågor skickar du till {mail}.
        </p>
      </PolicySection>

      <PolicySection title="2. Konto">
        <PolicyList items={[
          'Du måste vara minst 18 år eller ha målsmans godkännande.',
          'Uppgifterna du lämnar ska vara korrekta och hållas uppdaterade.',
          'Du ansvarar för din inloggning och för det som görs via ditt konto.',
          'Varje person får ha ett (1) konto om inget annat avtalats.',
          'Konton som används för bedrägeri, spam eller lagöverträdelser stängs.',
        ]} />
      </PolicySection>

      <PolicySection title="3. Konstbytes roll vid köp">
        <p>
          Köpeavtalet ingås mellan köparen och säljaren. Konstbyte är inte säljare eller köpare, och företräder ingen av dem i köpet.
        </p>
        <p>
          Konstbyte tar emot betalningen för säljarens räkning via Stripe och håller den tills köparen har bekräftat att verket har kommit fram, eller i högst 14 dagar efter att verket skickades. Sedan betalas pengarna ut till säljaren, efter avdrag för Konstbytes avgift på {PLATFORM_FEE_PERCENT} % och Stripes betalavgift. Vid betalning gäller också Stripes villkor.
        </p>
        <p>
          För köp gäller även{' '}
          <Link href="/kopvillkor" className="underline underline-offset-2">köpvillkoren</Link>.
        </p>
      </PolicySection>

      <PolicySection title="4. Säljarens ansvar">
        <p>Som säljare ansvarar du för allt som rör det du säljer. Det betyder att:</p>
        <PolicyList items={[
          'du anger korrekt om du säljer som privatperson eller som företag, och håller uppgiften aktuell. Säljer du i en verksamhet, till exempel med enskild firma, ska du ange företag och fylla i företagets uppgifter.',
          'du ansvarar för följderna om uppgiften är fel, även om köparen då har rätt till mer än du har uppgett.',
          'du äger verket eller har rätt att sälja det, och bilder och beskrivning stämmer.',
          'du packar verket ordentligt, skickar det inom rimlig tid och ansvarar för frakten och för verket under frakten, i den mån lagen eller ditt avtal med köparen lägger risken på dig.',
          'du som företag ansvarar för köparens ångerrätt, reklamationer och den information köparen har rätt till enligt konsumentlagarna. Det ansvaret ligger inte på Konstbyte.',
          'du själv deklarerar dina inkomster och betalar skatt och eventuell moms.',
        ]} />
        <p>
          <strong>Återbetalningar och bestridanden belastar dig.</strong> Får köparen pengarna tillbaka, till exempel på grund av ångerrätt, fel på verket, utebliven leverans eller ett kortbestridande hos banken, är det du som står för beloppet och för de avgifter Stripe tar ut för bestridandet. Konstbyte får behålla pengar som inte har betalats ut, dra beloppet från dina kommande utbetalningar och dra tillbaka redan utbetalda belopp från ditt Stripe-konto. Räcker inte det betalar du mellanskillnaden till Konstbyte inom 14 dagar efter att du har fått ett krav. Vinner Konstbyte ett bestridande får du tillbaka det som drogs.
        </p>
        <p>
          <strong>Ersättning till Konstbyte.</strong> Får Konstbyte krav från någon annan för att du har brutit mot dessa villkor eller mot lagen, till exempel genom att sälja ett verk du inte har rätt att sälja, göra intrång i någons upphovsrätt, lämna fel uppgifter eller inte leverera ett sålt verk, ska du ersätta Konstbyte för den skada och de kostnader det leder till, inklusive rimliga kostnader för juridisk hjälp.
        </p>
      </PolicySection>

      <PolicySection title="5. Köparens ansvar">
        <PolicyList items={[
          'Läs annonsen noga, och fråga säljaren innan du köper om något är oklart. I annonsen står det om säljaren är privatperson eller företag, vilket avgör vilka rättigheter du har.',
          'Kontrollera verket när det kommer, och meddela säljaren och Konstbyte om något är fel innan du bekräftar mottagandet.',
          'Ångerrätt, reklamationer och andra krav som rör verket riktar du till säljaren.',
          'När du har bekräftat mottagandet betalas pengarna ut till säljaren, och Konstbyte kan inte längre stoppa betalningen.',
        ]} />
      </PolicySection>

      <PolicySection title="6. Innehåll och upphovsrätt">
        <p>
          Du ansvarar för allt innehåll du laddar upp, till exempel texter och bilder. Genom att ladda upp innehåll intygar du att du har rätt att använda det och att det inte gör intrång i någon annans rättigheter.
        </p>
        <PolicyList items={[
          'Du behåller upphovsrätten till ditt eget material.',
          'Du ger Konstbyte en icke-exklusiv rätt att visa ditt innehåll på plattformen och använda bilder av dina verk för att marknadsföra dem, till exempel i sociala medier, så länge verket är publicerat.',
          'Material som laddas upp utan tillstånd tas bort.',
        ]} />
      </PolicySection>

      <PolicySection title="7. Förbjudet innehåll och moderering">
        <PolicyList items={[
          'Förfalskningar eller konstverk du inte har rätt att sälja',
          'Olagligt, hotfullt, trakasserande, diskriminerande eller sexuellt explicit innehåll',
          'Innehåll som vilseleder köpare om ett verks ursprung, äkthet eller skick',
          'Spam, automatiserade konton eller manipulation av omdömen',
          'Försök att kringgå plattformsavgiften genom att handla utanför plattformen',
          'Personuppgifter om andra utan deras samtycke',
        ]} />
        <p>
          Konstbyte kan ta bort innehåll och stänga konton som bryter mot villkoren. Tar vi bort något du har lagt upp får du veta varför och hur du kan invända.
        </p>
      </PolicySection>

      <PolicySection title="8. Tjänstens tillgänglighet">
        <p>
          Tjänsten tillhandahålls i befintligt skick. Vi arbetar för att den ska fungera väl, men garanterar inte att den alltid är tillgänglig eller fri från fel. Vi kan ändra, begränsa eller avveckla delar av tjänsten.
        </p>
      </PolicySection>

      <PolicySection title="9. Ansvarsbegränsning">
        <p>I den utsträckning lagen tillåter ansvarar Konstbyte inte för:</p>
        <PolicyList items={[
          'konstverkens äkthet, skick, värde eller beskrivning',
          'leveranser, förseningar eller skador under transport',
          'att en säljare inte levererar eller en köpare inte betalar',
          'tvister mellan köpare och säljare',
          'innehåll som användare laddar upp',
          'indirekta skador, till exempel inkomstbortfall eller utebliven vinst',
          'fel hos tredje part, till exempel fraktbolag eller Stripe',
          'driftstopp, tekniska fel eller förlust av data',
          'händelser utanför vår kontroll, till exempel strejk, myndighetsbeslut, naturhändelser eller omfattande störningar i internet- eller betaltjänster (force majeure)',
        ]} />
        <p>
          Konstbytes sammanlagda ansvar är begränsat till den plattformsavgift Konstbyte har fått för det köp som kravet gäller. Gäller kravet inte ett visst köp är ansvaret begränsat till de avgifter du har betalat till Konstbyte under de senaste 12 månaderna.
        </p>
        <p>
          Begränsningarna gäller inte om Konstbyte har orsakat skadan med uppsåt eller genom grov vårdslöshet, och de inskränker inte de rättigheter du har enligt tvingande lag.
        </p>
      </PolicySection>

      <PolicySection title="10. Ändringar av villkoren">
        <p>
          Konstbyte kan uppdatera dessa villkor. Vid väsentliga ändringar meddelas registrerade användare via e-post. Fortsätter du att använda tjänsten efter en ändring godkänner du de nya villkoren.
        </p>
      </PolicySection>

      <PolicySection title="11. Tillämplig lag och tvister">
        <p>
          Dessa villkor lyder under svensk lag. Tvister mellan köpare och säljare löser de med varandra. Tvister med Konstbyte försöker vi i första hand lösa i godo. Konsumenter kan vända sig till Allmänna reklamationsnämnden (ARN), och i övrigt prövas tvister av allmän domstol.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
