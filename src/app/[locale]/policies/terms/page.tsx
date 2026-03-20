import PolicyLayout, { PolicySection, PolicyList, PolicyNote } from '../PolicyLayout';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Användarvillkor — Konstbyte',
  description: 'Läs Konstbytes användarvillkor för köp, försäljning och användning av plattformen.',
};

export default async function TermsPage() {
  const t = await getTranslations('policies');
  return (
    <PolicyLayout
      title={t('terms_title')}
      icon="📋"
      subtitle={t('terms_subtitle')}
      lastUpdated="mars 2025"
    >
      <PolicyNote>
        <strong>Viktigt:</strong> Konstbyte tillhandahåller en plattform för köp och försäljning av konst. Vi är inte part i transaktioner mellan användare och tar inget ansvar för äktheten, värdet eller skicket på konstverk som listas på plattformen.
      </PolicyNote>

      <PolicySection title="1. Om Konstbyte">
        <p>
          Konstbyte är en digital marknadsplats där privatpersoner och konstnärer kan lista, köpa och sälja konst. Vi tillhandahåller infrastrukturen och tekniken — men är inte säljare, köpare, mellanhand eller ombud i någon transaktion.
        </p>
        <p>
          Konstbyte.se ägs och drivs av Konstbyte. Alla frågor kan riktas till{' '}
          <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">konstbyte@gmail.com</a>.
        </p>
      </PolicySection>

      <PolicySection title="2. Krav för att använda tjänsten">
        <PolicyList items={[
          'Du måste vara minst 18 år eller ha målsmans godkännande.',
          'Du måste registrera ett konto med korrekta och fullständiga uppgifter.',
          'Du ansvarar för att hålla ditt lösenord och konto säkert.',
          'Varje person får ha ett (1) konto om inget annat avtalats.',
          'Konton som används för bedrägeri, spam eller lagöverträdelser stängs omedelbart.',
        ]} />
      </PolicySection>

      <PolicySection title="3. Transaktioner och ansvar">
        <p>
          Alla köp och försäljningar sker direkt mellan användare. Konstbyte är inte part i dessa avtal.
        </p>
        <p>Konstbyte ansvarar inte för:</p>
        <PolicyList items={[
          'Äkthet, skick, värde eller korrekthet i beskrivning av konstverk',
          'Tvister eller meningsskiljaktigheter mellan köpare och säljare',
          'Ekonomiska förluster, direkta eller indirekta, till följd av transaktioner',
          'Leverans, förseningar eller skador under transport',
          'Om en säljare inte levererar ett sålt konstverk',
        ]} />
        <p>
          Vid betalning via Stripe gäller Stripes egna villkor. Konstbyte tar en plattformsavgift på 5 % vid genomförda köp.
        </p>
      </PolicySection>

      <PolicySection title="4. Säljarens ansvar">
        <PolicyList items={[
          'Du ansvarar för att dina konstverk är korrekt beskrivna och prissatta.',
          'Du får endast sälja konstverk du äger eller har rätt att sälja.',
          'Du ansvarar för att uppfylla din del av köpeavtalet med köparen.',
          'Felaktig eller vilseledande information kan leda till borttagning av konto.',
          'Du ansvarar för att deklarera inkomster i enlighet med svensk skattelagstiftning.',
        ]} />
      </PolicySection>

      <PolicySection title="5. Köparens ansvar">
        <PolicyList items={[
          'Du ansvarar för att kontrollera ett konstverk innan köp.',
          'Returrättigheter regleras i enlighet med distansavtalslagen och avtal med säljaren.',
          'Konstbyte kan inte driva in återbetalningar eller lösa tvister åt dig.',
          'Vid misstanke om bedrägeri bör du kontakta Konsumentverket eller polisen.',
        ]} />
      </PolicySection>

      <PolicySection title="6. Innehåll och upphovsrätt">
        <p>
          Du är ansvarig för allt innehåll du laddar upp — texter, bilder och annan media. Genom att ladda upp innehåll intygar du att du har rätt att använda det och att det inte kränker tredje parts rättigheter.
        </p>
        <PolicyList items={[
          'Du behåller upphovsrätten till ditt eget material.',
          'Du ger Konstbyte en icke-exklusiv licens att visa och distribuera ditt innehåll på plattformen.',
          'Upphovsrättsskyddat material som laddas upp utan tillstånd tas bort.',
        ]} />
      </PolicySection>

      <PolicySection title="7. Förbjudet innehåll och beteende">
        <PolicyList items={[
          'Förfalskningar eller konstverk du inte har rätt att sälja',
          'Olagligt, stötande eller kränkande innehåll',
          'Spam, automatiserade konton eller manipulation av omdömen',
          'Försök att kringgå plattformsavgiften genom att handla utanför plattformen',
          'Personuppgifter om andra användare utan deras samtycke',
        ]} />
      </PolicySection>

      <PolicySection title="8. Tjänstens tillgänglighet">
        <p>
          Vi strävar efter att hålla tjänsten tillgänglig dygnet runt men garanterar inte kontinuerlig, felfri drift. Konstbyte kan avbryta tjänsten tillfälligt för underhåll utan förvarning.
        </p>
        <p>
          Vi förbehåller oss rätten att ändra, begränsa eller avveckla delar av tjänsten utan föregående meddelande.
        </p>
      </PolicySection>

      <PolicySection title="9. Ändringar av villkoren">
        <p>
          Konstbyte kan uppdatera dessa villkor. Vid väsentliga ändringar meddelas registrerade användare via e-post. Fortsatt användning av tjänsten efter en uppdatering innebär att du godkänner de nya villkoren.
        </p>
      </PolicySection>

      <PolicySection title="10. Tillämplig lag">
        <p>
          Dessa villkor regleras av svensk lag. Tvister hänvisas i första hand till medling och i andra hand till allmän domstol i Göteborg.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
