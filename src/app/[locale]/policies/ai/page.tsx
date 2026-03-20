import PolicyLayout, { PolicySection, PolicyList, PolicyNote } from '../PolicyLayout';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'AI-policy — Konstbyte',
  description: 'Hur Konstbyte använder AI och vad du bör tänka på när du tolkar AI-genererade resultat.',
};

export default async function AIPolicyPage() {
  const t = await getTranslations('policies');
  return (
    <PolicyLayout
      title={t('ai_title')}
      icon="🤖"
      subtitle={t('ai_subtitle')}
      lastUpdated="mars 2025"
    >
      <PolicyNote>
        <strong>Viktigt:</strong> AI-genererade värderingar och inspirationsresultat är uppskattningar och inspiration — inte professionella bedömningar. Konstbyte ansvarar inte för beslut du fattar baserat på AI-output.
      </PolicyNote>

      <PolicySection title="1. Vilka AI-verktyg erbjuder vi?">
        <p>Konstbyte erbjuder för närvarande två AI-baserade verktyg:</p>
        <PolicyList items={[
          'AI-värdering av konstverk: Ger en uppskattad prisintervall baserat på bild och metadata du anger',
          'AI-inspiration för konst: Genererar kreativa beskrivningar och inspirationstext för konstverk',
        ]} />
        <p>
          Verktygen drivs av stora språkmodeller (LLM) och bildanalys via externa AI-tjänster. Resultaten är probabilistiska och inte deterministiska — samma indata kan ge olika utdata vid olika tillfällen.
        </p>
      </PolicySection>

      <PolicySection title="2. Vad AI-resultaten är — och inte är">
        <p><strong className="text-slate-800">AI-resultaten är:</strong></p>
        <PolicyList items={[
          'Inspiration och vägledning för att bilda sig en uppfattning',
          'En utgångspunkt för vidare research och diskussion',
          'Baserade på träningsdata som kan vara begränsad, föråldrad eller partisk',
        ]} />

        <p className="pt-1"><strong className="text-slate-800">AI-resultaten är inte:</strong></p>
        <PolicyList items={[
          'Professionella eller juridiskt bindande värderingar',
          'Certifierade eller auktoriserade konstbedömningar',
          'Garanti för ett verks äkthet, ursprung eller skick',
          'Investeringsrådgivning eller finansiella råd',
        ]} />
      </PolicySection>

      <PolicySection title="3. Konstbyttes ansvarsbegränsning">
        <p>
          Konstbyte ansvarar inte för:
        </p>
        <PolicyList items={[
          'Ekonomiska förluster baserade på AI-genererade värderingar',
          'Felaktiga, missvisande eller ofullständiga AI-resultat',
          'Beslut som fattas utifrån AI-output utan vidare verifiering',
          'Skillnader mellan AI-uppskattning och faktiskt marknadspris',
        ]} />
        <p>
          För professionella konstbedömningar rekommenderar vi auktoriserade konsthandlare, auktionshus eller certifierade värderingsmän.
        </p>
      </PolicySection>

      <PolicySection title="4. Användarens ansvar">
        <p>När du använder Konstbyttes AI-verktyg accepterar du att:</p>
        <PolicyList items={[
          'Tolka och verifiera alla resultat på egen hand',
          'Inte förlita dig på AI-output för ekonomiska eller juridiska beslut utan professionell rådgivning',
          'Inte använda resultaten som officiella värderingsintyg',
          'Informera eventuella köpare om att ett pris baseras på AI-uppskattning',
        ]} />
      </PolicySection>

      <PolicySection title="5. Data och integritet i AI-verktygen">
        <p>
          När du använder AI-verktygen skickas den information du anger (bilder, text, metadata) till vår AI-leverantör för bearbetning. Vi delar inte din identitet med AI-tjänsten.
        </p>
        <PolicyList items={[
          'Bilder och text du skickar till AI-verktygen lagras inte av Konstbyte',
          'Vi loggar inte din AI-historik kopplad till ditt konto',
          'AI-tjänsten kan använda anonymiserade frågor för att förbättra sin modell',
        ]} />
      </PolicySection>

      <PolicySection title="6. Etisk användning av AI">
        <p>
          Konstbyte strävar efter att använda AI på ett ansvarsfullt och transparent sätt. Vi är medvetna om AI:s begränsningar och kommunicerar dem tydligt i gränssnittet.
        </p>
        <p>
          Vi välkomnar feedback om AI-verktygen via{' '}
          <a href="mailto:konstbyte@gmail.com" className="underline underline-offset-2">konstbyte@gmail.com</a>.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
