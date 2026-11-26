import { notFound } from 'next/navigation';

// Any address that matches no page shows our own 404 page in the visitor's
// language (without this, Next.js falls back to its plain default page).
export default function CatchAllPage() {
  notFound();
}
