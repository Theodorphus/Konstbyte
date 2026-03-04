# Konstbyte — Marketplace for Art

This repository is a starter Next.js 15 (App Router) TypeScript project for a marketplace called Konstbyte.se.

Features included in this scaffold:
- Next.js 15 with App Router
- TypeScript
- Prisma + PostgreSQL
- Stripe Checkout + Webhooks
- UploadThing for uploads
- OpenAI integration (AI valuation + inspiration)
- NextAuth for authentication (stubs)
- Tailwind + basic shadcn-friendly setup

Quick start

1. Install dependencies:

```bash
npm install
```

2. Set environment variables using `.env.example`.


   For Google login, set at least:

   - `NEXTAUTH_URL=http://localhost:3000`
   - `NEXTAUTH_SECRET=<random-long-secret>`
   - `GOOGLE_CLIENT_ID=<from-google-cloud>`
   - `GOOGLE_CLIENT_SECRET=<from-google-cloud>`

  For email login without Google (magic link via Resend):

  - `RESEND_API_KEY=<your-resend-api-key>`
  - `EMAIL_FROM="Konstbyte <onboarding@yourdomain.com>"`

3. Configure Google OAuth in Google Cloud Console:

   - Create/select a project.
   - Go to **APIs & Services → OAuth consent screen** and complete app info.
   - Go to **Credentials → Create credentials → OAuth client ID**.
   - Choose **Web application**.
   - Add Authorized redirect URI:
     - `http://localhost:3000/api/auth/callback/google`
   - For production, add:
     - `https://your-domain.se/api/auth/callback/google`

   Configure Resend for email login:

   - Create an API key in Resend.
   - Verify your sending domain/address in Resend.
   - Use the same verified sender in `EMAIL_FROM`.

   Configure Vercel for production auth:

   - In Vercel → Project → Settings → Environment Variables, set:
     - `NEXTAUTH_URL=https://your-domain.se`
     - `NEXTAUTH_SECRET=<same-value-as-local-or-new-strong-secret>`
     - `RESEND_API_KEY=<your-resend-api-key>`
     - `EMAIL_FROM="Konstbyte <no-reply@your-domain.se>"`
   - Ensure `no-reply@your-domain.se` is verified in Resend.
   - Redeploy after updating env vars.

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start dev server:

```bash
npm run dev
```

What's next
- Implement UI components using shadcn patterns
- Complete NextAuth adapter + callbacks
- Wire UploadThing client + server
- Implement OpenAI prompts and secure API usage
- Add tests and CI pipeline
