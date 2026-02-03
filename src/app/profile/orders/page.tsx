import { getCurrentUser } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <p className="text-slate-600">Du måste logga in för att se dina beställningar.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/auth/signin">Logga in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Skapa konto</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mina beställningar</h1>
          <p className="text-slate-600 mt-1">Översikt över dina köp</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/artworks">Fortsätt handla</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-slate-600">Du har inte gjort några köp än.</p>
            <Button asChild>
              <Link href="/artworks">Utforska konstverk</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id}>
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
                  <div className="w-24 h-24 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={order.artwork.imageUrl} 
                      alt={order.artwork.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{order.artwork.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      av {order.artwork.owner.name || 'Anonyme konstnär'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{order.amount} SEK</span>
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
