import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hitLimit, tooManyRequests, HOUR } from '@/lib/rate-limit';
import { answerLanguage, groqChat } from '@/lib/groq';

// POST /api/ai/inspiration
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 });
    if (hitLimit(`ai-inspiration:${user.id}`, 30, HOUR)) return tooManyRequests();

    const body = await request.json().catch(() => ({}));
    const language = answerLanguage(body?.locale);
    const userPrompt =
      typeof body?.prompt === 'string' && body.prompt.trim()
        ? body.prompt.trim().slice(0, 1000)
        : language === 'English'
          ? 'Give me creative ideas for a painting'
          : 'Generera kreativa idéer för målning';

    const result = await groqChat({
      kind: 'text',
      tag: 'ai/inspiration',
      temperature: 0.9,
      maxTokens: 500,
      messages: [
        {
          role: 'system',
          content: `Du är en kreativ konstassistent på Konstbyte, en marknadsplats för konst. Ge 3–5 korta, konkreta och inspirerande idéer för konstverk utifrån användarens önskemål: motiv, teknik, färger och stämning. Håll dig till konst och kreativt skapande, och svara alltid på ${language}. Skriv ren text med en kort rubrik per idé, utan tabeller.`,
        },
        { role: 'user', content: userPrompt },
      ],
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.status === 503 ? 'AI-tjänsten är inte konfigurerad.' : 'AI-anrop misslyckades.' },
        { status: result.status },
      );
    }
    return NextResponse.json({ inspiration: result.text });
  } catch (err) {
    console.error('[ai/inspiration]', err);
    return NextResponse.json({ error: 'AI-anrop misslyckades.' }, { status: 500 });
  }
}
