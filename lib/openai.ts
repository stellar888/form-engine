import { type AstroContext } from "@/lib/astrology";
import { type OracleCard } from "@/lib/oracle";

type ReadingInput = {
  firstName: string;
  card: OracleCard;
  astro: AstroContext;
};

function fallbackReading({ firstName, card, astro }: ReadingInput): string {
  return [
    `${firstName}, today's energy is anchored in ${card.title}.`,
    card.readingNotes,
    `Astro context now: Sun in ${astro.sunSign}, Moon in ${astro.moonSign} (${astro.localTimestamp}, ${astro.timezone}).`,
    "Take one grounded action from this message today, and one gentle action that honors your heart."
  ].join("\n\n");
}

export async function generatePersonalizedReading(input: ReadingInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return fallbackReading(input);
  }

  const prompt = [
    "You are writing a short, poetic but clear oracle reading.",
    "Constraints:",
    "- 170 to 240 words.",
    "- 2 short paragraphs max.",
    "- Warm, mystical, grounded tone.",
    "- Personalize by first name.",
    "- Use card symbolism and reading notes faithfully.",
    "- Include current Sun and Moon sign context naturally, no bullet list.",
    "- Avoid fear language and deterministic claims.",
    "- End with one practical next step sentence.",
    "",
    `First name: ${input.firstName}`,
    `Card title: ${input.card.title}`,
    `Card description: ${input.card.description}`,
    `Card reading notes: ${input.card.readingNotes}`,
    `Card questions: ${input.card.questions.join(" | ")}`,
    `Card energies: chakra=${input.card.relatedEnergies.chakra}, planet=${input.card.relatedEnergies.planet}, sign=${input.card.relatedEnergies.sign}`,
    `Current astrology: Sun in ${input.astro.sunSign}, Moon in ${input.astro.moonSign}`,
    `Local timestamp: ${input.astro.localTimestamp} (${input.astro.timezone})`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 420
    })
  });

  if (!response.ok) {
    return fallbackReading(input);
  }

  const json = (await response.json()) as {
    output_text?: string;
  };

  const text = json.output_text?.trim();
  return text && text.length > 0 ? text : fallbackReading(input);
}
