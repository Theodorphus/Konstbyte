# Lighthouse helper

Kort instruktion för att köra Lighthouse-scriptet som finns i den här mappen.

Förutsättningar:
- Node.js installerat
- Kör `npm install` i projektets rot för att säkerställa att `lighthouse` och `chrome-launcher` (och `puppeteer` om du vill) finns.

Exempel — kör via npm-script från projektets rot:

```bash
npm run lighthouse
```

Eller direkt med valfri URL och utfil:

```bash
node tools/run-lighthouse.js http://localhost:3000 my-report.json
```

Rapporten sparas till filen som angetts (standard: `lighthouse-report.json`).

Signalhantering och städning av Chrome-processen sker automatiskt i skriptet.

Säkerhets- och miljövariabler
- Sätt hemliga värden (t.ex. `STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET`) i en lokal `.env.local`-fil eller i din CI/CD-sekretesshantering.
- Projektet innehåller `.env.local.example` som mall. Kopiera den till `.env.local` och fyll i värdena — **lägg aldrig riktiga hemligheter i chatt eller i commits**.
- `.gitignore` utesluter `.env*.local` så att lokala nycklar inte råkar committas.

Exempel (Windows PowerShell) för att skapa `.env.local` lokalt:

```powershell
"STRIPE_SECRET_KEY=sk_test_your_key_here" | Out-File -Encoding utf8 .env.local
"STRIPE_WEBHOOK_SECRET=whsec_your_webhook_key" | Out-File -Encoding utf8 -Append .env.local
"NEXTAUTH_URL=http://localhost:3000" | Out-File -Encoding utf8 -Append .env.local
```

För produktion: lagra dessa hemligheter i din deploymentsplattform (Vercel, Netlify, etc.) och använd deras secret manager.
