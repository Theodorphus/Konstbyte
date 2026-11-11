import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hitLimit, tooManyRequests, HOUR } from '@/lib/rate-limit';

// POST /api/ai/inspiration
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (hitLimit(`ai-inspiration:${user.id}`, 30, HOUR)) return tooManyRequests();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI-tjänsten är inte konfigurerad.' }, { status: 503 });
    }

    const body = await request.json();
    const userPrompt = typeof body?.prompt === 'string' && body.prompt.trim()
      ? body.prompt.slice(0, 1000)
      : 'Generera kreativa idéer för målning';

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Du är en kreativ konstassistent som ger korta, inspirerande prompts.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 300,
      }),
    });

    const completion = await res.json();
    if (!res.ok) {
      console.error('[ai/inspiration] Groq error', res.status, completion?.error?.message);
      return NextResponse.json({ error: 'AI-anrop misslyckades.' }, { status: 502 });
    }

    const inspiration = completion.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ inspiration });
  } catch (err) {
    console.error('[ai/inspiration]', err);
    return NextResponse.json({ error: 'AI-anrop misslyckades.' }, { status: 500 });
  }
}
