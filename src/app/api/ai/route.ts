import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
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

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Ogiltig request. Fältet 'prompt' måste vara en textsträng." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({
      output: completion.choices[0].message.content,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Okänt fel vid AI-anrop";

    return Response.json(
      {
        error: "AI-anrop misslyckades.",
        details: message,
      },
      { status: 502 }
    );
  }
}
