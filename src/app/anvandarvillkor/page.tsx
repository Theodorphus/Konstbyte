export const metadata = { title: 'Användarvillkor – Konstbyte' };

export default function AnvandarvillkorPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10 text-slate-800">
      <div>
        <p className="text-sm text-slate-500 mb-1">Senast uppdaterad: mars 2026</p>
        <h1 className="text-3xl font-bold">Användarvillkor</h1>
        <p className="mt-3 text-slate-600">
          Dessa användarvillkor gäller för alla som skapar ett konto på Konstbyte. Genom att registrera dig godkänner du villkoren nedan.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Om Konstbyte</h2>
        <p>
          Konstbyte är en digital marknadsplats för köp och försäljning av konstverk. Plattformen riktar sig till konstnärer som vill sälja sina verk och till privatpersoner och företag som vill köpa konst.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Konto och registrering</h2>
        <p>
          För att kunna köpa eller sälja konst på Konstbyte behöver du skapa ett konto. Du ansvarar för att:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>uppgifterna du lämnar är korrekta och hålls uppdaterade</li>
          <li>ditt lösenord och dina inloggningsuppgifter förvaras säkert</li>
          <li>aktivitet som sker via ditt konto är ditt ansvar</li>
        </ul>
        <p>
          Konstbyte förbehåller sig rätten att stänga konton som innehåller felaktig information eller vid misstanke om missbruk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Att sälja på Konstbyte</h2>
        <p>
          Som konstnär på Konstbyte godkänner du att:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>du har rätt att sälja de verk du lägger upp – de är dina egna originalskapelser eller verk du har licens att sälja</li>
          <li>bilder och beskrivningar är rättvisande och inte vilseledande</li>
          <li>du ansvarar för att packa och skicka verk i enlighet med den information du anger</li>
          <li>du förstår att Konstbyte tar en provision om 5 % på varje försäljning</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Förbjudet innehåll</h2>
        <p>Det är inte tillåtet att ladda upp eller sprida innehåll som:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>gör intrång i upphovsrätt, varumärken eller andra immateriella rättigheter</li>
          <li>är olagligt, hotfullt, trakasserande eller diskriminerande</li>
          <li>innehåller pornografiskt eller sexuellt explicit material</li>
          <li>är avsett att vilseleda köpare om ett verks ursprung, äkthet eller skick</li>
        </ul>
        <p>
          Konstbyte kan ta bort innehåll som bryter mot dessa regler och stänga berörda konton, utan föregående varsel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Immaterialrätt</h2>
        <p>
          Konstnären behåller upphovsrätten till sina verk. Genom att ladda upp ett verk på Konstbyte ger du plattformen rätt att visa bilden i marknadsföringssyfte, t.ex. i sociala medier eller på Konstbyttes hemsida. Denna rätt gäller så länge verket är publicerat på plattformen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Konstbyttes ansvar</h2>
        <p>
          Konstbyte tillhandahåller en teknisk plattform och är inte part i avtalet mellan köpare och säljare. Konstbyte ansvarar inte för:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>tvister som uppstår mellan köpare och säljare</li>
          <li>utebliven eller försenad leverans</li>
          <li>skador på verk under transport</li>
          <li>indirekta skador, inkomstbortfall eller följdskador</li>
        </ul>
        <p>
          Konstbyttes maximala ansvar är begränsat till vad användaren betalat i avgifter till Konstbyte under de senaste 12 månaderna.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Ändringar i villkoren</h2>
        <p>
          Konstbyte kan uppdatera dessa villkor. Vid väsentliga ändringar meddelas du via e-post eller vid inloggning. Fortsatt användning av plattformen efter en ändring innebär att du godkänner de nya villkoren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Tillämplig lag och tvistlösning</h2>
        <p>
          Dessa villkor lyder under svensk lag. Tvister prövas i första hand av Allmänna reklamationsnämnden (ARN) och i andra hand av allmän domstol med Stockholms tingsrätt som första instans.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Kontakt</h2>
        <p>
          Kontakta oss på{' '}
          <a href="mailto:hej@konstbyte.se" className="underline text-blue-600">hej@konstbyte.se</a>{' '}
          vid frågor om dessa villkor.
        </p>
      </section>
    </div>
  );
}
