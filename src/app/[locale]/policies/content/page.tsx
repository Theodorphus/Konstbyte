import PolicyLayout, { PolicySection, PolicyList, PolicyNote } from '../PolicyLayout';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Innehållspolicy — Konstbyte',
  description: 'Riktlinjer för vilket innehåll som är tillåtet att ladda upp och publicera på Konstbyte.',
};

export default async function ContentPolicyPage() {
  const t = await getTranslations('policies');
  return (
    <PolicyLayout
      title={t('content_title')}
      icon="🖼️"
      subtitle={t('content_subtitle')}
      lastUpdated="mars 2025"
    >
      <PolicyNote>
        Du ansvarar fullt ut för allt innehåll du laddar upp. Brott mot innehållspolicyn kan leda till borttagning av innehåll och avstängning av konto — utan förvarning.
      </PolicyNote>

      <PolicySection title="1. Ditt ansvar som uppladdare">
        <p>
          När du publicerar innehåll på Konstbyte intygar du att:
        </p>
        <PolicyList items={[
          'Du är upphovsperson till verket, eller har rätt att sälja/publicera det',
          'Innehållet inte gör intrång i annans upphovsrätt, varumärke eller personliga rättigheter',
          'Bilder och beskrivningar är sanningsenliga och inte vilseledande',
          'Du tar fullt ansvar för eventuella rättsliga anspråk kopplade till ditt innehåll',
        ]} />
      </PolicySection>

      <PolicySection title="2. Tillåtet innehåll">
        <p>Konstbyte välkomnar:</p>
        <PolicyList items={[
          'Original konstverk du själv har skapat',
          'Konstverk du äger och har rätt att sälja vidare',
          'Professionella och tydliga bilder som korrekt representerar verket',
          'Ärliga och informativa beskrivningar av material, teknik och tillstånd',
          'Konst av alla stilar och medium: målningar, foton, skulpturer, digitalt, textil med mera',
        ]} />
      </PolicySection>

      <PolicySection title="3. Förbjudet innehåll">
        <p>Följande är inte tillåtet på Konstbyte:</p>
        <PolicyList items={[
          'Förfalskningar eller kopior presenterade som original',
          'Upphovsrättsskyddat material som du inte har rätt att sälja eller publicera',
          'Stötande, diskriminerande eller hatfullt innehåll',
          'Explicit sexuellt eller pornografiskt innehåll',
          'Våldsamt, chockerande eller skadligt material',
          'Privatpersoners bilder eller personuppgifter publicerade utan deras samtycke',
          'Vilseledande information om ett verks ursprung, ålder eller tillhörighet',
          'Reklam eller spam utan koppling till konstnärlig försäljning',
        ]} />
      </PolicySection>

      <PolicySection title="4. Upphovsrätt">
        <p>
          Upphovsrätten till ditt material förblir hos dig. Genom att ladda upp ger du Konstbyte en icke-exklusiv, royaltyfri licens att visa och marknadsföra ditt innehåll på plattformen och i sociala medier.
        </p>
        <p>
          Om du anser att ditt upphovsrättsligt skyddade material publicerats på Konstbyte utan ditt tillstånd, kontakta oss omgående på{' '}
          <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">konstbyte@gmail.com</a>{' '}
          med en beskrivning av situationen och ditt krav.
        </p>
      </PolicySection>

      <PolicySection title="5. AI-genererat innehåll">
        <p>
          Konstverk och bilder skapade med hjälp av AI-verktyg är välkomna på Konstbyte, förutsatt att:
        </p>
        <PolicyList items={[
          'Du tydligt märker dem som AI-assisterade i beskrivningen',
          'Du inte gör anspråk på att verket är skapade helt av en människa om det inte stämmer',
          'Det AI-genererade materialet inte kränker tredje parts upphovsrätt',
        ]} />
      </PolicySection>

      <PolicySection title="6. Anmälningar och åtgärder">
        <p>
          Ser du innehåll som verkar bryta mot dessa riktlinjer? Kontakta oss på{' '}
          <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">konstbyte@gmail.com</a>.
          Vi granskar alla anmälningar och agerar om vi bedömer att ett brott har skett.
        </p>
        <p>
          Beroende på allvaret kan vi:
        </p>
        <PolicyList items={[
          'Ta bort specifikt innehåll utan förvarning',
          'Tillfälligt begränsa kontots funktioner',
          'Permanent stänga av kontot',
          'Vidarebefordra information till myndigheter vid misstanke om brott',
        ]} />
      </PolicySection>
    </PolicyLayout>
  );
}
