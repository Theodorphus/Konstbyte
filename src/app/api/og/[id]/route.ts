import prisma from '../../../../lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const artwork = await prisma.artwork.findUnique({ where: { id }, include: { owner: true } });

  if (!artwork) {
    return new Response('Not found', { status: 404 });
  }

  const title = escapeXml(artwork.title);
  const author = escapeXml(artwork.owner?.name || 'Anonyme');
  const image = artwork.imageUrl;

  const svg = `<?xml version="1.0" encoding="utf-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#ff7a18" />
        <stop offset="100%" stop-color="#7c3aed" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
    <image href="${image}" x="60" y="80" width="460" height="460" preserveAspectRatio="xMidYMid slice" />
    <g transform="translate(560,160)">
      <text x="0" y="0" font-family="Inter, Arial, sans-serif" font-size="44" fill="#fff" font-weight="700">${title}</text>
      <text x="0" y="70" font-family="Inter, Arial, sans-serif" font-size="24" fill="#fff">Av ${author}</text>
    </g>
  </svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}
