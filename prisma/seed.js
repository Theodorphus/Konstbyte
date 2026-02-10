const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const users = [
  { email: 'anna.lind@konstbyte.test', name: 'Anna Lind' },
  { email: 'erik.nyberg@konstbyte.test', name: 'Erik Nyberg' },
  { email: 'mira.sand@konstbyte.test', name: 'Mira Sand' },
  { email: 'sofia.ek@konstbyte.test', name: 'Sofia Ek' },
  { email: 'leo.holm@konstbyte.test', name: 'Leo Holm' },
];

const artworks = [
  {
    title: 'Stillhet i sepia',
    description: 'Mjuka toner och lager av handgjorda texturer.',
    price: 2400,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'malningar',
  },
  {
    title: 'Vinterljus',
    description: 'Fotografi med kallt ljus och långsam rytm.',
    price: 1800,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'fotografi',
  },
  {
    title: 'Vågform',
    description: 'Skulptur i keramik med mjuka linjer.',
    price: 3200,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'skulpturer',
  },
  {
    title: 'Röd horisont',
    description: 'Målning i akryl med varm färgskala.',
    price: 2100,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'malningar',
  },
  {
    title: 'Blå timmen',
    description: 'Digitalt collage med grafisk precision.',
    price: 1500,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'digital',
  },
  {
    title: 'Granit',
    description: 'Stramt grafiskt tryck med djup och kontrast.',
    price: 1900,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'digital',
  },
  {
    title: 'Morgonraster',
    description: 'Fotografi med repetitiv geometri och dimma.',
    price: 1700,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'fotografi',
  },
  {
    title: 'Lerjord',
    description: 'Skulptur inspirerad av nordiska landskap.',
    price: 3500,
    imageUrl: '/weinstock-brush-96240.jpg',
    category: 'skulpturer',
  },
];

const posts = [
  'Testar nya pigment i ateljén. Någon som har tips på hållbara papper?',
  'Är det fler som jobbar med textil just nu? Jag letar efter nya färgbad.',
  'Publicerade precis min första serie här. Tar gärna feedback!',
  'Tips: fotografera i indirekt dagsljus för mjukare skuggor.',
  'Söker inspirationskällor för minimalistiska collage. Dela gärna!',
];

const comments = [
  'Jag använder bomullspapper från Hahnemühle, fungerar toppen.',
  'Snyggt! Testa att dra ned kontrasten lite så kommer formerna fram.',
  'Jag blandar ull och lin för mjukare struktur.',
  'Tack för tipset! Testade i dag och resultatet blev mycket bättre.',
  'Kolla in vintage-arkiv, det finns fina collage att inspireras av.',
];

async function main() {
  const createdUsers = [];

  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: { email: user.email, name: user.name },
    });
    createdUsers.push(record);
  }

  const ownerIds = createdUsers.map((user) => user.id);

  for (let i = 0; i < artworks.length; i += 1) {
    const ownerId = ownerIds[i % ownerIds.length];
    const artwork = artworks[i];

    const exists = await prisma.artwork.findFirst({
      where: { title: artwork.title, ownerId },
    });

    if (!exists) {
      await prisma.artwork.create({
        data: {
          ...artwork,
          ownerId,
          isPublished: true,
        },
      });
    }
  }

  for (let i = 0; i < posts.length; i += 1) {
    const authorId = ownerIds[i % ownerIds.length];
    const content = posts[i];

    const exists = await prisma.post.findFirst({
      where: { content, authorId },
    });

    if (!exists) {
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });

      const commentAuthorId = ownerIds[(i + 1) % ownerIds.length];
      const commentText = comments[i % comments.length];

      await prisma.comment.create({
        data: {
          content: commentText,
          authorId: commentAuthorId,
          postId: post.id,
        },
      });
    }
  }

  if (ownerIds.length >= 2) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: ownerIds[0],
          followingId: ownerIds[1],
        },
      },
      update: {},
      create: {
        followerId: ownerIds[0],
        followingId: ownerIds[1],
      },
    });

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: ownerIds[1],
          followingId: ownerIds[2 % ownerIds.length],
        },
      },
      update: {},
      create: {
        followerId: ownerIds[1],
        followingId: ownerIds[2 % ownerIds.length],
      },
    });
  }

  if (ownerIds.length >= 3) {
    const likedPost = await prisma.post.findFirst({
      where: { authorId: ownerIds[0] },
      orderBy: { createdAt: 'desc' },
    });

    if (likedPost) {
      const updatedLikes = Math.max(1, (likedPost.likes || 0) + 2);
      await prisma.post.update({
        where: { id: likedPost.id },
        data: { likes: updatedLikes },
      });
    }
  }

  if (ownerIds.length >= 2) {
    const favoriteArtwork = await prisma.artwork.findFirst({
      where: { ownerId: ownerIds[0] },
      orderBy: { createdAt: 'desc' },
    });

    if (favoriteArtwork) {
      await prisma.favorite.upsert({
        where: {
          userId_artworkId: {
            userId: ownerIds[1],
            artworkId: favoriteArtwork.id,
          },
        },
        update: {},
        create: {
          userId: ownerIds[1],
          artworkId: favoriteArtwork.id,
        },
      });
    }
  }

  if (ownerIds.length >= 4) {
    const otherArtwork = await prisma.artwork.findFirst({
      where: { ownerId: ownerIds[2] },
      orderBy: { createdAt: 'desc' },
    });

    if (otherArtwork) {
      await prisma.favorite.upsert({
        where: {
          userId_artworkId: {
            userId: ownerIds[3],
            artworkId: otherArtwork.id,
          },
        },
        update: {},
        create: {
          userId: ownerIds[3],
          artworkId: otherArtwork.id,
        },
      });
    }
  }

  if (ownerIds.length >= 2) {
    const notificationUserId = ownerIds[0];
    const senderId = ownerIds[1];

    const exists = await prisma.notification.findFirst({
      where: {
        userId: notificationUserId,
        type: 'follow',
        message: 'Erik Nyberg började följa dig',
      },
    });

    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          type: 'follow',
          message: 'Erik Nyberg började följa dig',
          link: `/users/${senderId}`,
        },
      });

      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          type: 'like',
          message: 'Någon gillade ditt konstverk “Stillhet i sepia”',
          link: '/artworks',
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
