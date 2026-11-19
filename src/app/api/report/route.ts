import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { adminEmails } from '@/lib/admin';
import { escapeHtml, sendEmail } from '@/lib/email';
import { hitLimit, tooManyRequests, HOUR } from '@/lib/rate-limit';
import { APP_URL } from '@/lib/urls';

// POST /api/report — anyone can report content they think breaks the rules
// (EU Digital Services Act, art. 16). The report is emailed to the admins.

const TYPES = ['artwork', 'post', 'comment', 'user', 'submission'] as const;
type ReportType = (typeof TYPES)[number];

async function describe(type: ReportType, id: string): Promise<{ label: string; link: string } | null> {
  switch (type) {
    case 'artwork': {
      const a = await prisma.artwork.findUnique({ where: { id }, select: { title: true, owner: { select: { name: true } } } });
      return a && { label: `Konstverket "${a.title}" av ${a.owner.name ?? 'okänd'}`, link: `/artworks/${id}` };
    }
    case 'post': {
      const p = await prisma.post.findUnique({ where: { id }, select: { content: true, author: { select: { name: true } } } });
      return p && { label: `Inlägg av ${p.author.name ?? 'okänd'}: "${p.content.slice(0, 300)}"`, link: '/community' };
    }
    case 'comment': {
      const c = await prisma.comment.findUnique({ where: { id }, select: { content: true, author: { select: { name: true } } } });
      return c && { label: `Kommentar av ${c.author.name ?? 'okänd'}: "${c.content.slice(0, 300)}"`, link: '/community' };
    }
    case 'user': {
      const u = await prisma.user.findUnique({ where: { id }, select: { name: true } });
      return u && { label: `Profilen ${u.name ?? 'utan namn'}`, link: `/users/${id}` };
    }
    case 'submission': {
      const s = await prisma.challengeSubmission.findUnique({ where: { id }, select: { title: true, artist: { select: { name: true } } } });
      return s && { label: `Utmaningsbidraget "${s.title}" av ${s.artist.name ?? 'okänd'}`, link: '/utmaning' };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body?.type as ReportType;
    const id = typeof body?.id === 'string' ? body.id.slice(0, 100) : '';
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
    if (!TYPES.includes(type) || !id) return NextResponse.json({ error: 'Ogiltig anmälan' }, { status: 400 });
    if (reason.length < 5) return NextResponse.json({ error: 'Beskriv kort vad som är fel' }, { status: 400 });

    const user = await getCurrentUser();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (hitLimit(`report:${user?.id ?? ip}`, 10, HOUR)) return tooManyRequests();

    const target = await describe(type, id);
    if (!target) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });

    const reporter = user ? `${user.name ?? 'Utan namn'} (${user.email ?? 'ingen e-post'})` : 'Utloggad besökare';
    const url = `${APP_URL}${target.link}`;
    const html = `
      <h2>Ny anmälan på Konstbyte</h2>
      <p><strong>Vad:</strong> ${escapeHtml(target.label)}</p>
      <p><strong>Länk:</strong> <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
      <p><strong>Anledning:</strong><br>${escapeHtml(reason).replace(/\n/g, '<br>')}</p>
      <p><strong>Anmäld av:</strong> ${escapeHtml(reporter)}</p>
      <p style="color:#64748b;font-size:13px">Som admin kan du ta bort inlägg, kommentarer och utmaningsbidrag direkt på sidan, och konstverk under Admin.</p>`;

    const admins = adminEmails();
    if (admins.length === 0) {
      console.error('[report] ADMIN_EMAILS is not set — report not delivered', type, id);
      return NextResponse.json({ error: 'Anmälan kunde inte skickas' }, { status: 503 });
    }
    await Promise.all(admins.map((to) => sendEmail({ to, subject: `Anmälan: ${target.label.slice(0, 80)}`, html })));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[report]', error);
    return NextResponse.json({ error: 'Anmälan kunde inte skickas' }, { status: 500 });
  }
}
