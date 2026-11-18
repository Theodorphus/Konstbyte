import prisma from './prisma';

// Keeps the weekly challenge going without anyone having to remember it. The
// daily cron calls ensureWeeklyChallenge(): if no challenge is running or
// scheduled, one is created for the current week (Monday–Sunday, Swedish time)
// from the themes below. Challenges an admin creates take precedence.

type Theme = { sv: [string, string, string]; en: [string, string, string] };

// [title, description, theme prompt]
export const THEMES: Theme[] = [
  { sv: ['Mitt fönster', 'Skapa ett verk av utsikten från ett fönster du känner väl.', 'Det kan vara hemma, på jobbet eller i minnet. Fånga ljuset, årstiden eller stämningen.'],
    en: ['My window', 'Create a piece showing the view from a window you know well.', 'At home, at work or from memory. Capture the light, the season or the mood.'] },
  { sv: ['Bara tre färger', 'Gör ett verk med högst tre färger.', 'Begränsningen är poängen. Svart och vitt räknas som färger.'],
    en: ['Only three colours', 'Make a piece using no more than three colours.', 'The limit is the point. Black and white count as colours.'] },
  { sv: ['Svensk natur', 'Skildra svensk natur, från fjäll till skärgård.', 'Realistiskt, abstrakt eller drömskt – välj en plats som betyder något för dig.'],
    en: ['Swedish nature', 'Depict Swedish nature, from mountains to archipelago.', 'Realistic, abstract or dreamlike – pick a place that means something to you.'] },
  { sv: ['Självporträtt', 'Gör ett självporträtt.', 'Det behöver inte likna dig. Visa hur du känner dig den här veckan.'],
    en: ['Self-portrait', 'Make a self-portrait.', 'It does not have to look like you. Show how you feel this week.'] },
  { sv: ['Vardagsföremål', 'Gör ett vanligt föremål till huvudperson.', 'En kaffekopp, en nyckel, ett par skor. Låt det vardagliga bli konst.'],
    en: ['Everyday object', 'Make an ordinary object the star.', 'A coffee cup, a key, a pair of shoes. Turn the everyday into art.'] },
  { sv: ['Natt', 'Skapa ett verk som utspelar sig på natten.', 'Mörker, stadsljus, stjärnor eller sömnlöshet – tolka natten fritt.'],
    en: ['Night', 'Create a piece set at night.', 'Darkness, city lights, stars or sleeplessness – interpret the night freely.'] },
  { sv: ['Rörelse', 'Fånga rörelse i ett stillastående verk.', 'Dans, vind, vatten eller trafik. Hur får man en bild att röra sig?'],
    en: ['Movement', 'Capture movement in a still piece.', 'Dance, wind, water or traffic. How do you make an image move?'] },
  { sv: ['Ett minne', 'Gör ett verk av ett minne.', 'Ett barndomsminne, en resa eller ett ögonblick du aldrig glömmer.'],
    en: ['A memory', 'Turn a memory into a piece.', 'A childhood memory, a journey or a moment you never forget.'] },
  { sv: ['Djur', 'Skildra ett djur.', 'Husdjur, vilda djur eller fantasidjur – i din egen stil.'],
    en: ['Animals', 'Depict an animal.', 'Pets, wild animals or imaginary creatures – in your own style.'] },
  { sv: ['Staden', 'Skapa ett verk om staden.', 'Gator, hus, människor eller ljud. Din stad eller en du drömmer om.'],
    en: ['The city', 'Create a piece about the city.', 'Streets, buildings, people or sounds. Your city or one you dream of.'] },
  { sv: ['Abstrakt känsla', 'Gör ett abstrakt verk som uttrycker en känsla.', 'Välj en känsla – glädje, oro, längtan – och visa den bara med form och färg.'],
    en: ['Abstract feeling', 'Make an abstract piece that expresses a feeling.', 'Pick a feeling – joy, worry, longing – and show it only with shape and colour.'] },
  { sv: ['Vatten', 'Skapa ett verk där vatten spelar huvudrollen.', 'Hav, regn, en vattenpöl eller ett glas vatten.'],
    en: ['Water', 'Create a piece where water plays the lead.', 'Sea, rain, a puddle or a glass of water.'] },
  { sv: ['Mönster', 'Gör ett verk byggt på mönster.', 'Upprepning, rytm och struktur. Inspirationen kan komma från textil, natur eller arkitektur.'],
    en: ['Patterns', 'Make a piece built on patterns.', 'Repetition, rhythm and structure. Find inspiration in textiles, nature or architecture.'] },
  { sv: ['Årstiden just nu', 'Skildra årstiden som pågår just nu.', 'Vad ser, hör och känner du utanför dörren den här veckan?'],
    en: ['This season', 'Depict the season happening right now.', 'What do you see, hear and feel outside your door this week?'] },
  { sv: ['Händer', 'Gör ett verk där händer står i centrum.', 'Händer som arbetar, vilar, håller om eller skapar.'],
    en: ['Hands', 'Make a piece centred on hands.', 'Hands that work, rest, hold or create.'] },
  { sv: ['Miniatyr', 'Skapa ett riktigt litet verk.', 'Högst 15 × 15 cm, eller en liten detalj i ett större format.'],
    en: ['Miniature', 'Create a really small piece.', 'At most 15 × 15 cm, or a tiny detail in a larger format.'] },
  { sv: ['Ljus och skugga', 'Utforska ljus och skugga.', 'Starka kontraster, mjukt motljus eller en enda lampa i ett mörkt rum.'],
    en: ['Light and shadow', 'Explore light and shadow.', 'Strong contrasts, soft backlight or a single lamp in a dark room.'] },
  { sv: ['Drömmar', 'Gör ett verk inspirerat av en dröm.', 'Surrealistiskt, mjukt eller konstigt – låt logiken vila.'],
    en: ['Dreams', 'Make a piece inspired by a dream.', 'Surreal, soft or strange – let logic rest.'] },
  { sv: ['Mat', 'Skildra mat eller en måltid.', 'Ett stilleben, en middag med vänner eller din favoriträtt.'],
    en: ['Food', 'Depict food or a meal.', 'A still life, a dinner with friends or your favourite dish.'] },
  { sv: ['Återbruk', 'Skapa ett verk av återbrukat material.', 'Kartong, tidningar, tyg eller sådant som annars skulle slängas.'],
    en: ['Reuse', 'Create a piece from reused materials.', 'Cardboard, newspapers, fabric or things that would otherwise be thrown away.'] },
  { sv: ['Musik', 'Gör ett verk som en låt eller ett ljud.', 'Välj en låt och låt den styra färger och former.'],
    en: ['Music', 'Make a piece that feels like a song or a sound.', 'Pick a song and let it guide the colours and shapes.'] },
  { sv: ['Hemma', 'Skildra vad hemma betyder för dig.', 'Ett rum, en person, en doft eller en plats.'],
    en: ['Home', 'Depict what home means to you.', 'A room, a person, a smell or a place.'] },
  { sv: ['En linje', 'Gör ett verk med en enda sammanhängande linje.', 'Lyft inte pennan – eller tolka linjen fritt i annan teknik.'],
    en: ['One line', 'Make a piece with a single continuous line.', 'Do not lift the pen – or interpret the line freely in another medium.'] },
  { sv: ['Väder', 'Fånga ett väder.', 'Storm, dimma, snö eller värmebölja.'],
    en: ['Weather', 'Capture a kind of weather.', 'Storm, fog, snow or heatwave.'] },
];

const TZ = 'Europe/Stockholm';

/** Stockholm's offset from UTC (ms) at a given instant. */
function stockholmOffset(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant of 00:00 Stockholm time on the given calendar date. */
function stockholmMidnight(year: number, month: number, day: number): Date {
  const guess = new Date(Date.UTC(year, month, day));
  return new Date(guess.getTime() - stockholmOffset(guess));
}

/** ISO week number and week-year of a calendar date. */
export function isoWeek(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { week: Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7), year: d.getUTCFullYear() };
}

/** Monday 00:00 → next Monday 00:00 (Stockholm) for the week containing `now`. */
export function currentWeek(now: Date) {
  const local = new Date(now.getTime() + stockholmOffset(now));
  const dow = local.getUTCDay() || 7;
  const monday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (dow - 1)));
  const y = monday.getUTCFullYear(), m = monday.getUTCMonth(), d = monday.getUTCDate();
  const startsAt = stockholmMidnight(y, m, d);
  const endsAt = new Date(stockholmMidnight(y, m, d + 7).getTime() - 1000); // Sunday 23:59:59
  return { startsAt, endsAt, ...isoWeek(y, m, d) };
}

export async function ensureWeeklyChallenge(now = new Date()): Promise<string | null> {
  // Something is running or already scheduled: leave it alone.
  const upcoming = await prisma.challenge.findFirst({ where: { endsAt: { gt: now } }, select: { id: true } });
  if (upcoming) return null;

  const { startsAt, endsAt, week, year } = currentWeek(now);
  // Don't repeat the themes of the last few challenges.
  const recent = await prisma.challenge.findMany({ orderBy: { startsAt: 'desc' }, take: 8, select: { title: true } });
  const used = new Set(recent.map((c) => c.title));
  const offset = (year * 53 + week) % THEMES.length;
  const theme =
    [...THEMES.slice(offset), ...THEMES.slice(0, offset)].find((t) => !used.has(t.sv[0])) ?? THEMES[offset];

  try {
    const created = await prisma.challenge.create({
      data: {
        title: theme.sv[0], description: theme.sv[1], themePrompt: theme.sv[2],
        titleEn: theme.en[0], descriptionEn: theme.en[1], themePromptEn: theme.en[2],
        weekNumber: week, year, startsAt, endsAt,
      },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
    // A challenge for this week already exists (e.g. an admin's that ended early).
    if ((err as { code?: string }).code === 'P2002') return null;
    throw err;
  }
}
