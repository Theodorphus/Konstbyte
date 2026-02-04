# Konstbyte — Marketplace for Art

This repository is a starter Next.js 15 (App Router) TypeScript project for a marketplace called Konstbyte.se.

Features included in this scaffold:
- Next.js 15 with App Router
- TypeScript
- Prisma + PostgreSQL
- Stripe Checkout + Webhooks
- UploadThing for uploads
- AI integration (valuation + inspiration)
- NextAuth for authentication (stubs)
- Tailwind + basic shadcn-friendly setup

Quick start

1. Install dependencies:

```bash
npm install
```

2. Set environment variables using `.env.example`.

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start dev server:

```bash
npm run dev
```

What's next
- Implement UI components using shadcn patterns
- Complete NextAuth adapter + callbacks
- Wire UploadThing client + server
- Implement AI prompts and secure API usage
- Add tests and CI pipeline
