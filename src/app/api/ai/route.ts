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
        }),
      }
    );

    const completion = await groqResponse.json();

    if (!groqResponse.ok) {
      const apiError =
        typeof completion?.error?.message === "string"
          ? completion.error.message
          : "Groq API returnerade ett fel.";

      return Response.json(
        {
          error: "AI-anrop misslyckades.",
          details: apiError,
        },
        { status: groqResponse.status }
      );
    }

    return Response.json({
      output: completion?.choices?.[0]?.message?.content ?? "",
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
