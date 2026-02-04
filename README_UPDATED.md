# Konstbyte

Konstbyte — marknadsplats för konst built with Next.js (App Router), TypeScript, Tailwind CSS and Prisma.

Quick start

Prerequisites
- Node.js 18+ (v20 recommended)
- npm (or pnpm)
- A PostgreSQL database and `DATABASE_URL` set in `.env`

Install

```bash
npm install
npx prisma generate
```

Environment

Create a `.env` file (example):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_METADATA_BASE=http://localhost:3000
# optional: comma-separated admin emails for admin pages
ADMIN_EMAILS=you@example.com
```

Run database migration (creates `Testimonial` table):

```bash
npx prisma migrate dev --name add_testimonials
```

Run locally

```bash
npm run dev
# open http://localhost:3000
```

Build for production

```bash
npm run build
npm run start
```

Useful commands

- Lint: `npx eslint src --ext .ts,.tsx`
- Regenerate Prisma client: `npx prisma generate`
- Apply migrations (production): `npx prisma migrate deploy`

Notes

- Admin UI: `/admin/testimonials` — protect by setting `ADMIN_EMAILS` in `.env`.
- Testimonials are persisted via Prisma in the `Testimonial` table.
- Images use Next.js `Image` with SVG blur placeholders for hero and thumbnails.

Pushing

The repo is configured with an `origin` remote. To push:

```bash
git push origin main
```

If you want, I can add a small seed script to migrate existing `data/testimonials.json` into the DB and create a CI workflow.
