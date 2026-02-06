const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { payments: true, artwork: true }
    });
    if (!orders || orders.length === 0) {
      console.log('No paid orders found.');
    } else {
      console.log('Recent paid orders:');
      for (const o of orders) {
        console.log('---');
        console.log(`orderId: ${o.id}`);
        console.log(`artworkId: ${o.artworkId} (${o.artwork?.title || 'n/a'})`);
        console.log(`buyerId: ${o.buyerId}`);
        console.log(`amount: ${o.amount}`);
        console.log(`createdAt: ${o.createdAt}`);
        console.log(`payments: ${o.payments.map(p => p.stripeId).join(', ')}`);
      }
    }
  } catch (e) {
    console.error('Failed to query DB:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
