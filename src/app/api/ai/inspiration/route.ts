import { NextResponse } from 'next/server';

// POST /api/ai/inspiration
export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI-tjänsten är inte konfigurerad.' }, { status: 503 });
    }

    const body = await request.json();
    const userPrompt = body?.prompt ?? 'Generera kreativa idéer för målning';

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
      return NextResponse.json({ error: completion?.error?.message ?? 'AI-anrop misslyckades.' }, { status: res.status });
    }

    const inspiration = completion.choices?.[0]?.message?.content ?? '';
    return NextResponse.json({ inspiration });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
