import { getCurrentUser } from '@/lib/auth';
import { hitLimit, tooManyRequests, HOUR } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (hitLimit(`ai:${user.id}`, 30, HOUR)) return tooManyRequests('Du har använt AI-assistenten mycket den senaste timmen. Försök igen senare.');

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "GROQ API-nyckel saknas. Lägg till GROQ_API_KEY i miljövariabler.",
        },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.length > 4000) {
      return Response.json(
        { error: "Ogiltig request. Fältet 'prompt' måste vara en textsträng." },
        { status: 400 }
      );
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      }
    );

    const completion = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("[ai] Groq error", groqResponse.status, completion?.error?.message);
      return Response.json({ error: "AI-anrop misslyckades." }, { status: 502 });
    }

    return Response.json({
      output: completion?.choices?.[0]?.message?.content ?? "",
    });
  } catch (error: unknown) {
    console.error("[ai]", error);
    return Response.json(
      { error: "AI-anrop misslyckades." },
      { status: 502 }
    );
  }
}
