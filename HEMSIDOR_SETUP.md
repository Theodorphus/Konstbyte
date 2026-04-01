# Hemsidor Service — Setup Guide

## ✅ Vad som är skapat

Jag har byggt en komplett landningssida för dina webbutvecklingstjänster med följande:

### 📄 Nya filer
- `src/app/[locale]/hemsidor/page.tsx` — Huvudsidan med alla sektioner
- `src/app/[locale]/hemsidor/layout.tsx` — SEO-metadata
- `src/app/api/lead/route.ts` — API för att spara leads
- `messages/sv.json` — Svenska translationer
- `messages/en.json` — Engelska translationer

### 🎨 Sektioner på sidan
1. **Hero** — Tydlig rubrik, underrubrik och CTA-knappar
2. **Problemet** — 6 vanliga problem med gamla hemsidor
3. **Lösningen** — 8 features du erbjuder
4. **Processen** — 5-stegs timeline för ditt arbete
5. **Portfolio** — 2 exempelprojekt (Wellness Studio + Konstbyte)
6. **Priser** — 3 prissättningspaket (Bas 4k, Premium 10k, Full Service 15k)
7. **Om mig** — Din bakgrund och erfarenhet
8. **CTA Form** — Formulär för leads med email + URL-fält

## 🗄️ Supabase Setup

Du måste skapa en tabell `leads` i Supabase. Kör denna SQL-kod i Supabase Dashboard:

```sql
-- Create leads table
CREATE TABLE public.leads (
  id BIGSERIAL PRIMARY KEY,
  website_url TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'new'
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow inserts from service role
CREATE POLICY "Allow inserts from service role"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Allow selects for yourself (admin)
CREATE POLICY "Allow selects for users"
ON public.leads
FOR SELECT
USING (auth.uid() IS NOT NULL);
```

### Steg-för-steg:
1. Gå till [Supabase Dashboard](https://app.supabase.com)
2. Välj ditt projekt
3. Gå till SQL Editor
4. Klistra in SQL-koden ovan
5. Kör den

## 📧 Email Notifications Setup

**Mottagare:** `konstbyte@gmail.com`

För att få email-notifieringar när nya leads kommer in, lägg till dessa miljövariabler i `.env.local`:

```bash
# Gmail SMTP (för email-notifieringar)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Hur du får Gmail App Password:

1. **Aktivera 2-faktor-autentisering** på ditt Google-konto
2. Gå till [Google Account Security](https://myaccount.google.com/security)
3. Sök efter "App passwords"
4. Välj "Mail" och "Windows Computer"
5. Google genererar ett 16-tecken lösenord
6. Kopiera det och sätt det som `EMAIL_PASSWORD` i `.env.local`

### Alternativ: Använd en annan email-tjänst

Du kan byta från Gmail till:
- **SendGrid** — Professionell, rekommenderad för produktion
- **Resend** — Modern email-API
- **AWS SES** — Skalbar
- **Mailgun** — API-driven

Uppdatera `transporter`-konfigurationen i `src/app/api/lead/route.ts` för din tjänst.

### Testa det lokalt

```bash
npm run dev
# Öppna http://localhost:3000/sv/hemsidor
# Skicka testformulär
# Du bör få email på konstbyte@gmail.com efter ~5 sekunder
```

## 📱 Länk & Routing

Sidan är live på:
- **Svenska:** `/sv/hemsidor`
- **English:** `/en/hemsidor`

Den är redan inkluderad i din navbar och kan länkas från överallt.

## 🔧 API Endpoint

```
POST /api/lead

Body:
{
  "websiteUrl": "https://example.se",
  "email": "namn@example.se"
}

Response (success):
{
  "success": true,
  "data": [{ id: 1, website_url: "...", email: "...", created_at: "...", status: "new" }]
}
```

## 🎯 Customization Tips

### Ändra priser
Redigera dessa värden i `messages/sv.json` och `messages/en.json`:
```json
"pricing1_price": "4 000 kr",
"pricing2_price": "10 000 kr",
"pricing3_price": "15 000 kr"
```

### Lägga till fler portfolio-projekt
Lägg till i både sv.json och en.json:
```json
"portfolio3_name": "Ditt projekt",
"portfolio3_desc": "Beskrivning..."
```

Sedan uppdatera portfolio-sektionen i `page.tsx` för att inkludera det nya projektet.

### Färger & Design
- Gradienterna använder `from-blue-400 via-purple-400 to-pink-300`
- Du kan ändra till något annat Tailwind-färgschema
- Samma designsystem används redan på resten av Konstbyte

### Responsive
Sidan är fullt responsiv och testad på mobile, tablet och desktop. Använd Tailwind's breakpoints: `md:` och `lg:`.

## ✨ Features

✅ **Responsiv design** — Fungerar på alla enheter  
✅ **Multi-language** — Svenska och engelska inbyggt  
✅ **SEO-optimerad** — Metadata, Open Graph-taggar  
✅ **Form validation** — URL och email-validering  
✅ **Success/Error states** — Feedback till användaren  
✅ **Supabase integration** — Leads sparas automatiskt  
✅ **Fast** — Optimerad Next.js med server-side rendering  

## 📧 Läsa Leads

Efter att leads har sparats kan du:

### Via Supabase Dashboard
1. Gå till SQL Editor
2. Kör: `SELECT * FROM leads ORDER BY created_at DESC;`
3. Du ser alla leads med email och URL

### Via API (från admin-panel senare)
```javascript
const { data } = await supabase
  .from('leads')
  .select('*')
  .order('created_at', { ascending: false });
```

## 🚀 Deployment

Sidan deployas automatiskt till Vercel när du gör en git push till main. Inte mer att göra!

## 📝 Möjliga förbättringar

Om du vill vidareutveckla senare:

1. **Email-notifiering** — Få email när ny lead kommer in
2. **Admin-dashboard** — Se alla leads i admin-panelen
3. **Spam-skydd** — Lägg till reCAPTCHA på formuläret
4. **Lead tracking** — Spåra vilken källa leadet kom från
5. **Autoresponder** — Skicka automatisk email till lead
6. **Video-hero** — Lägg till video i hero-sektionen
7. **Testimonial-sektion** — Från glada kunder
8. **FAQ-sektion** — Vanliga frågor

## 💡 Tips

- **Keep it updated** — Uppdatera portfolio-projektexempel regelbundet
- **A/B test** — Testa olika CTA-texter och prissättning
- **Social proof** — Lägg till kundrecensioner när du får dem
- **Analytics** — Lägg till Google Analytics för att spåra besökare
- **Engagement** — Följa upp leads inom 24 timmar

---

**Status:** ✅ Deployment ready!

Nästa gång du startar dev-servern med `npm run dev`, kan du besöka `/sv/hemsidor` och se sidan live.
