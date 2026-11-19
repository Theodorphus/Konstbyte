import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import prisma from '@/lib/prisma';

// GET /api/og/[id] — the preview image shown when an artwork link is shared
// (Facebook, Messenger, iMessage, X, LinkedIn, …). It must be PNG/JPEG: those
// sites ignore SVG. The artwork is fetched and embedded as a JPEG data URL so
// any upload format (WebP, HEIC-converted, …) renders.

const SIZE = { width: 1200, height: 630 };

async function artworkAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize(560, 560, { fit: 'inside', withoutEnlargement: false })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { title: true, price: true, imageUrl: true, isPublished: true, owner: { select: { name: true } } },
  });
  if (!artwork || !artwork.isPublished) return new Response('Not found', { status: 404 });

  const image = artwork.imageUrl ? await artworkAsDataUrl(artwork.imageUrl) : null;
  const title = artwork.title.length > 70 ? `${artwork.title.slice(0, 67)}…` : artwork.title;
  const price = `${Math.round(artwork.price).toLocaleString('sv-SE')} kr`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #7c2d12 100%)',
          padding: '35px 60px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            width: 560,
            height: 560,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f4',
            borderRadius: 16,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" style={{ maxWidth: 560, maxHeight: 560, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: 120 }}>🎨</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 56, flex: 1 }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: '#f8fafc', lineHeight: 1.15 }}>{title}</div>
          <div style={{ fontSize: 30, color: '#cbd5e1', marginTop: 20 }}>{artwork.owner.name || 'Konstnär på Konstbyte'}</div>
          <div style={{ fontSize: 40, color: '#fbbf24', marginTop: 36, fontWeight: 700 }}>{price}</div>
          <div style={{ fontSize: 28, color: '#f8fafc', marginTop: 48, display: 'flex', alignItems: 'center' }}>
            🎨 Konstbyte
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    },
  );
}
