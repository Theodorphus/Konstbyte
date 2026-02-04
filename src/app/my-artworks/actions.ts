'use server';

import prisma from '../../lib/prisma';
import { getCurrentUser } from '../../lib/auth';

export async function deleteArtworkAction(formData: FormData) {
  const user = await getCurrentUser();
  const artworkId = String(formData.get('artworkId') || '');
  if (!user || !artworkId) return;

  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
  if (!artwork || artwork.ownerId !== user.id) return;

  await prisma.artwork.delete({ where: { id: artworkId } });
}
