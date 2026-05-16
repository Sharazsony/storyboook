import { logger } from "./logger";

export interface ExtractedEvent {
  event_type: "quiz" | "viva" | "exam" | "presentation" | "assignment" | "other";
  date: string | null;
  confidence: number;
}

export async function extractEventFromText(text: string): Promise<ExtractedEvent | null> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    logger.warn("GROQ_API_KEY not set, skipping AI extraction");
    return null;
  }

  const prompt = `Extract structured academic events from this text.

Return ONLY valid JSON with no extra text:
{
  "event_type": "quiz | viva | exam | presentation | assignment | other",
  "date": "YYYY-MM-DD or null",
  "confidence": 0-1
}

Rules:
- event_type must be one of: quiz, viva, exam, presentation, assignment, other
- date must be a specific date in YYYY-MM-DD format or null if no date found
- confidence is a number between 0 and 1 indicating how certain you are
- Only extract if there is actually an academic event mentioned
- If there is no academic event, return {"event_type": "other", "date": null, "confidence": 0.1}
- Current year context: 2026

Text:
${text}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "Groq API error");
      return null;
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as ExtractedEvent;
    return parsed;
  } catch (err) {
    logger.error({ err }, "Failed to extract event via Groq");
    return null;
  }
}
