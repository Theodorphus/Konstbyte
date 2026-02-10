import prisma from '../../lib/prisma';

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [users, artworks] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.artwork.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Adminpanel</h1>
      <section>
        <h2 className="text-lg font-medium">Konstverk</h2>
        <ul className="mt-2 space-y-1">
          {artworks.map((art) => (
            <li key={art.id} className="text-sm">
              {art.title} — {(art.price / 100).toFixed(2)} kr
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-medium">Användare</h2>
        <ul className="mt-2 space-y-1">
          {users.map((u) => (
            <li key={u.id} className="text-sm">{u.email}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
