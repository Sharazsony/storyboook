import { logger } from "./logger";

export interface ExtractedEvent {
  event_type: "quiz" | "viva" | "exam" | "presentation" | "assignment" | "other";
  title: string;
  date: string | null;
  confidence: number;
}

export async function extractEventsFromText(
  text: string,
  announcementDate: string
): Promise<ExtractedEvent[]> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    logger.warn("GROQ_API_KEY not set, skipping AI extraction");
    return [];
  }

  const prompt = `You are an academic event extractor. Extract ALL academic events mentioned in the announcement below.

Announcement was posted on: ${announcementDate}
Use this date to resolve partial dates like "27 oct" → use the same year as the announcement.

Return ONLY a valid JSON array, no extra text. Each item:
{
  "event_type": "quiz" | "viva" | "exam" | "presentation" | "assignment" | "other",
  "title": "short descriptive title (e.g. 'Punctuation Quiz', 'Expository Essay Assignment')",
  "date": "YYYY-MM-DD or null if no date mentioned",
  "confidence": 0.0-1.0
}

Rules:
- Extract EVERY distinct academic event (a single announcement may have multiple)
- event_type: quiz (any test/quiz), exam (major exam), viva (oral exam/viva voce), presentation, assignment (homework/submission/essay), other
- date: resolve month names, ordinals (1st, 2nd), and weekday hints using the announcement date for the year
- If no academic event at all, return []
- Only include events with confidence >= 0.4

Announcement text:
${text}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, "Groq API error");
      return [];
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) return [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedEvent[];
    return Array.isArray(parsed) ? parsed.filter((e) => e.confidence >= 0.4) : [];
  } catch (err) {
    logger.error({ err }, "Failed to extract events via Groq");
    return [];
  }
}
