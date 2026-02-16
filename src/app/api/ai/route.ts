import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: "GROQ API-nyckel saknas. Lägg till GROQ_API_KEY i miljövariabler.",
      },
      { status: 500 }
    );
  }

  const groq = new Groq({ apiKey });
  const { prompt } = await req.json();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
  });

  return Response.json({
    output: completion.choices[0].message.content,
  });
}
