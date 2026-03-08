import PolicyLayout, { PolicySection, PolicyList, PolicyNote } from '../PolicyLayout';

export const metadata = {
  title: 'Integritetspolicy — Konstbyte',
  description: 'Hur Konstbyte samlar in, använder och skyddar dina personuppgifter enligt GDPR.',
};

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Integritetspolicy"
      icon="🔒"
      subtitle="Vi tar din integritet på allvar. Här beskriver vi vilka uppgifter vi samlar in, varför och hur vi skyddar dem."
      lastUpdated="mars 2025"
    >
      <PolicyNote>
        Denna policy gäller för alla tjänster som tillhandahålls av Konstbyte och är utformad i enlighet med EU:s dataskyddsförordning (GDPR).
      </PolicyNote>

      <PolicySection title="1. Personuppgiftsansvarig">
        <p>
          Konstbyte är personuppgiftsansvarig för behandlingen av dina personuppgifter. Kontakta oss vid frågor:{' '}
          <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">konstbyte@gmail.com</a>
        </p>
      </PolicySection>

      <PolicySection title="2. Vilka uppgifter samlar vi in?">
        <p><strong className="text-slate-800">Kontouppgifter</strong></p>
        <PolicyList items={[
          'Namn och e-postadress vid registrering',
          'Profilbild (om du väljer att ladda upp en)',
          'Inloggningsuppgifter via Google OAuth (vi lagrar aldrig lösenord)',
        ]} />

        <p className="pt-1"><strong className="text-slate-800">Transaktionsdata</strong></p>
        <PolicyList items={[
          'Information om köp och försäljningar du genomför',
          'Betalningsinformation hanteras av Stripe — vi lagrar inga kortuppgifter',
          'Leveransadress om du anger en vid köp',
        ]} />

        <p className="pt-1"><strong className="text-slate-800">Innehåll du skapar</strong></p>
        <PolicyList items={[
          'Konstverk, beskrivningar och bilder du laddar upp',
          'Meddelanden du skickar till andra användare',
          'Inlägg och kommentarer i communityt',
        ]} />

        <p className="pt-1"><strong className="text-slate-800">Tekniska uppgifter</strong></p>
        <PolicyList items={[
          'IP-adress och enhetstyp vid inloggning',
          'Loggar för säkerhet och felsökning',
          'Sessionsdata i form av krypterade cookies',
        ]} />
      </PolicySection>

      <PolicySection title="3. Varför behandlar vi dina uppgifter?">
        <p>Vi behandlar dina uppgifter för att:</p>
        <PolicyList items={[
          'Tillhandahålla och förbättra Konstbyte-tjänsten (berättigat intresse / avtal)',
          'Hantera ditt konto och inloggning (avtal)',
          'Möjliggöra transaktioner och kommunikation mellan användare (avtal)',
          'Förebygga bedrägeri och säkerställa plattformens säkerhet (berättigat intresse)',
          'Skicka viktig information om din kontosäkerhet (berättigat intresse)',
          'Följa tillämpliga lagar och regler (rättslig förpliktelse)',
        ]} />
      </PolicySection>

      <PolicySection title="4. Hur länge sparar vi uppgifter?">
        <PolicyList items={[
          'Kontouppgifter: sparas tills du raderar ditt konto',
          'Transaktionsdata: 7 år för bokföringsändamål (lagstadgat krav)',
          'Meddelanden: sparas tills endera parten raderar kontot',
          'Tekniska loggar: 90 dagar',
          'Uppladdade bilder: tills du tar bort dem eller ditt konto stängs',
        ]} />
      </PolicySection>

      <PolicySection title="5. Delas dina uppgifter med tredje part?">
        <p>Vi säljer aldrig dina personuppgifter. Vi delar uppgifter med:</p>
        <PolicyList items={[
          'Stripe — för betalningshantering (Stripes integritetspolicy gäller)',
          'UploadThing — för lagring av bilder du laddar upp',
          'Neon (PostgreSQL) — databastjänst för Konstbyte',
          'Vercel — hosting av webbapplikationen',
          'Google (OAuth) — vid inloggning via Google-konto',
        ]} />
        <p>
          Alla tjänsteleverantörer behandlar data i enlighet med GDPR. Vi delar aldrig uppgifter i marknadsföringssyfte.
        </p>
      </PolicySection>

      <PolicySection title="6. Cookies och lokal lagring">
        <p>
          Konstbyte använder sessionsbaserade cookies för att hålla dig inloggad. Vi använder inga spårningscookies eller tredjepartscookies i marknadsföringssyfte.
        </p>
        <PolicyList items={[
          'Sessionscookie: nödvändig för inloggning, raderas när webbläsaren stängs',
          'CSRF-token: säkerhetscookie för att skydda formulär',
          'Inga analyscookies från Google Analytics eller liknande',
        ]} />
      </PolicySection>

      <PolicySection title="7. Dina rättigheter enligt GDPR">
        <p>Du har rätt att:</p>
        <PolicyList items={[
          'Få tillgång till de uppgifter vi har om dig (registerutdrag)',
          'Begära rättelse av felaktiga uppgifter',
          'Begära radering av dina uppgifter ("rätten att bli glömd")',
          'Invända mot behandling baserad på berättigat intresse',
          'Begära begränsning av behandling',
          'Dataportabilitet — få ut dina uppgifter i maskinläsbart format',
          'Lämna in klagomål till Integritetsskyddsmyndigheten (IMY)',
        ]} />
        <p>
          Kontakta oss på{' '}
          <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">konstbyte@gmail.com</a>{' '}
          för att utöva dina rättigheter. Vi svarar inom 30 dagar.
        </p>
      </PolicySection>

      <PolicySection title="8. Radering av konto">
        <p>
          Du kan begära att ditt konto raderas via inställningarna eller via e-post. Vi raderar dina personuppgifter inom 30 dagar, med undantag för transaktionsdata som måste sparas enligt bokföringslagen.
        </p>
      </PolicySection>

      <PolicySection title="9. Säkerhet">
        <p>
          Vi använder branschstandardiserade säkerhetsåtgärder för att skydda dina uppgifter, inklusive krypterad dataöverföring (HTTPS), säker lösenordshantering via OAuth och åtkomstkontroll på servernivå.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
