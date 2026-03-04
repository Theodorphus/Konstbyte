import { getCurrentUser } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import SafeImage from '../../../components/SafeImage';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { formatSek } from '../../../lib/currency';
import StatusCard from '../../../components/StatusCard';
import { PageHeader } from '../../../components/PageHeader';

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <PageHeader title="Mina beställningar" className="mb-4" />
        <StatusCard
          icon="🔐"
          title="Inloggning krävs"
          message="Du måste logga in för att se dina beställningar."
          actions={
            <>
              <Button asChild>
                <Link href="/auth/signin">Logga in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Skapa konto</Link>
              </Button>
            </>
          }
        />
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: { 
      artwork: {
        include: {
          owner: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mina beställningar"
        description="Översikt över dina köp"
        className="mb-2"
      >
        <Button variant="outline" asChild>
          <Link href="/artworks">Fortsätt handla</Link>
        </Button>
      </PageHeader>
      {orders.length === 0 ? (
        <StatusCard
          icon="🧾"
          title="Inga beställningar ännu"
          message="Du har inte gjort några köp än."
          actions={
            <Button asChild>
              <Link href="/artworks">Utforska konstverk</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status === 'completed' ? 'Slutförd' :
                     order.status === 'pending' ? 'Väntande' :
                     order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative">
                    <SafeImage
                      src={order.artwork.imageUrl}
                      alt={order.artwork.title}
                      fill
                      className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{order.artwork.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      av {order.artwork.owner.name || 'Anonym konstnär'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{formatSek(order.amount)}</span>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/artworks/${order.artwork.id}`}>
                          Visa konstverk
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
