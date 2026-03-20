'use client';

import { useState } from 'react';
import PolicyLayout from '../PolicyLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQSection {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: 'Köpa konst',
    icon: '🛒',
    items: [
      {
        question: 'Hur köper jag ett konstverk på Konstbyte?',
        answer: 'Hitta ett konstverk du gillar, klicka på det och sedan på "Lägg i varukorg". Betalning sker säkert via Stripe. Du kan betala med kort eller andra tillgängliga metoder.',
      },
      {
        question: 'Är det säkert att betala på Konstbyte?',
        answer: 'Ja. Alla betalningar hanteras av Stripe, en av världens ledande betaltjänster. Vi lagrar inga kortuppgifter på Konstbyte.',
      },
      {
        question: 'Vad händer om jag inte får mitt konstverk?',
        answer: 'Konstbyte är en plattform och är inte part i transaktioner. Vid problem bör du först kontakta säljaren via meddelanden. Om problemet kvarstår kan du kontakta Konsumentverket eller din bank för att bestrida betalningen.',
      },
      {
        question: 'Kan jag returnera ett köpt konstverk?',
        answer: 'Returrätten avgörs av avtalet mellan dig och säljaren. Enligt distansavtalslagen har du som konsument generellt 14 dagars ångerrätt vid köp från en näringsidkare. Kontakta säljaren direkt för att lösa retur.',
      },
      {
        question: 'Vad kostar det att köpa?',
        answer: 'Du betalar det pris säljaren satt. Inga extra avgifter läggs på för köparen — plattformsavgiften (5 %) dras från säljarens intäkt.',
      },
      {
        question: 'Hur vet jag att konstverket är äkta?',
        answer: 'Konstbyte kan inte garantera äkthet. Vi uppmanar dig att läsa beskrivningen noggrant, ställa frågor till konstnären och vid behov begära signaturer, certifikat eller annan dokumentation.',
      },
    ],
  },
  {
    title: 'Sälja konst',
    icon: '🎨',
    items: [
      {
        question: 'Hur säljer jag ett konstverk?',
        answer: 'Logga in, gå till "Lägg upp konst" i menyn och fyll i titel, pris, beskrivning och ladda upp en bild. Ditt verk publiceras direkt på marknadsplatsen.',
      },
      {
        question: 'Vad kostar det att sälja?',
        answer: 'Det kostar ingenting att lägga upp konstverk. Konstbyte tar en plattformsavgift på 5 % av försäljningspriset vid genomförda köp. Stripe tar ut en separat transaktionsavgift.',
      },
      {
        question: 'Hur och när får jag betalt?',
        answer: 'Betalningar hanteras via Stripe Connect. Du behöver koppla ett Stripe-konto i dina inställningar. Utbetalningar sker enligt Stripes schema, vanligtvis inom 2–7 bankdagar.',
      },
      {
        question: 'Kan jag sälja konst jag inte skapat själv?',
        answer: 'Ja, under förutsättning att du äger verket och har rätt att sälja det. Du ansvarar för att informera köparen om vad du säljer och att uppgifterna stämmer.',
      },
      {
        question: 'Vad händer om mitt konstverk inte säljs?',
        answer: 'Inget — ditt verk ligger kvar tills du väljer att ta bort det eller markera det som sålt. Det kostar ingenting att ha ett osålt verk publicerat.',
      },
      {
        question: 'Kan jag redigera eller ta bort ett publicerat konstverk?',
        answer: 'Ja. Gå till ditt konstverk och klicka på "Redigera". Du kan uppdatera pris, beskrivning och bilder, eller ta bort verket helt.',
      },
    ],
  },
  {
    title: 'AI-verktygen',
    icon: '🤖',
    items: [
      {
        question: 'Vad är AI-värderingen?',
        answer: 'AI-värderingen ger en uppskattad prisintervall baserat på en bild och information du anger om konstverket. Resultatet är en inspiration och utgångspunkt — inte en professionell eller juridiskt bindande värdering.',
      },
      {
        question: 'Hur exakt är AI-värderingen?',
        answer: 'AI-värderingen är en uppskattning baserad på träningsdata. Resultaten kan variera och bör inte användas som enda grund för prissättning eller köpbeslut. Konstbyte ansvarar inte för fel i AI-output.',
      },
      {
        question: 'Vad är AI-inspirationsverktyget?',
        answer: 'Det genererar kreativa beskrivningar och inspirationstext för konstverk. Det kan hjälpa dig skriva en säljande produkttext eller hitta ord för din konststil.',
      },
      {
        question: 'Sparas mina bilder när jag använder AI-verktygen?',
        answer: 'Nej. Bilder och text du skickar till AI-verktygen lagras inte av Konstbyte. Informationen skickas till vår AI-leverantör för bearbetning och raderas sedan.',
      },
      {
        question: 'Är AI-resultaten upphovsrättsligt skyddade?',
        answer: 'AI-genererat text- och bildinnehåll har oklart rättsläge i Sverige. Vi rekommenderar att du bearbetar och anpassar resultaten för att skapa unikt och eget material.',
      },
    ],
  },
  {
    title: 'Konto & säkerhet',
    icon: '🔐',
    items: [
      {
        question: 'Hur skapar jag ett konto?',
        answer: 'Klicka på "Logga in" och välj att logga in med Google. Kontot skapas automatiskt vid första inloggningen.',
      },
      {
        question: 'Kan jag byta e-postadress?',
        answer: 'Din e-postadress är kopplad till ditt Google-konto och kan inte ändras direkt i Konstbyte. Kontakta oss om du behöver hjälp.',
      },
      {
        question: 'Hur raderar jag mitt konto?',
        answer: 'Kontakta oss på konstbyte@gmail.com med en radering förfrågan. Vi raderar ditt konto och dina personuppgifter inom 30 dagar, med undantag för transaktionsdata.',
      },
      {
        question: 'Är mina meddelanden privata?',
        answer: 'Meddelanden är synliga för dig och den du kommunicerar med. Konstbyte-personal kan i undantagsfall granska meddelanden vid misstanke om bedrägeri eller brott mot villkoren.',
      },
      {
        question: 'Vad händer med mina bilder och konstverk om jag raderar mitt konto?',
        answer: 'Dina uppladdade bilder och konstverk raderas tillsammans med kontot. Genomförda transaktioner och orderhistorik sparas enligt bokföringslagen.',
      },
    ],
  },
  {
    title: 'Vanliga problem',
    icon: '🔧',
    items: [
      {
        question: 'Jag kan inte logga in — vad gör jag?',
        answer: 'Prova att rensa webbläsarens cache och cookies. Kontrollera att du loggar in med rätt Google-konto. Kontakta oss på konstbyte@gmail.com om problemet kvarstår.',
      },
      {
        question: 'Min bild laddas inte upp — varför?',
        answer: 'Bilder måste vara i JPG, PNG eller WebP-format och max 5 MB. Kontrollera filstorleken och formatet. Vid kvarstående problem, kontakta oss.',
      },
      {
        question: 'Betalningen gick igenom men jag fick inget kvitto — vad gör jag?',
        answer: 'Stripe skickar ett kvitto automatiskt till din e-post. Kolla skräpposten. Om du fortfarande inte fått något, kontakta konstbyte@gmail.com med ordernumret.',
      },
      {
        question: 'Jag ser ett konstverk som verkar bryta mot reglerna — hur anmäler jag?',
        answer: 'Skicka ett e-postmeddelande till konstbyte@gmail.com med en länk till konstverket och en kort beskrivning av problemet. Vi granskar alla anmälningar.',
      },
      {
        question: 'Mitt konstverk visas inte i sökresultaten — varför?',
        answer: 'Kontrollera att verket är markerat som publicerat och inte "ej till salu". Sökindexeringen kan ta några minuter. Kontakta oss om problemet kvarstår.',
      },
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 py-3.5 text-left text-sm font-medium text-slate-800 hover:text-slate-900 transition-colors"
            aria-expanded={openIndex === i}
          >
            <span>{item.question}</span>
            <svg
              className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {openIndex === i && (
            <div className="pb-4 text-sm text-slate-600 leading-relaxed pl-0.5">
              {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQPage() {
  const t = useTranslations('policies');
  return (
    <PolicyLayout
      title={t('faq_title')}
      icon="💬"
      subtitle={t('faq_subtitle')}
    >
      <div className="space-y-8">
        {faqData.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50">
              <span className="text-lg">{section.icon}</span>
              <h2 className="text-sm font-semibold text-slate-800">{section.title}</h2>
            </div>
            <div className="px-5">
              <FAQAccordion items={section.items} />
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 text-center space-y-3">
        <p className="text-sm font-medium text-amber-900">{t('faq_not_found_title')}</p>
        <p className="text-sm text-amber-800">{t('faq_not_found_msg')}</p>
        <Link
          href="mailto:konstbyte@gmail.com"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
        >
          {t('faq_write')}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </PolicyLayout>
  );
}
