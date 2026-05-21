import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION, buildTextPrompt, AUDIO_USER_PROMPT } from "./prompt.js";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenerativeAI(key);
  }
  return client;
}

function getModel() {
  return getClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
  });
}

/** Generate prayer from a plain-text transcript (fallback / mock mode). */
export async function generateLatinPrayerFromText(transcript: string): Promise<string> {
  const result = await getModel().generateContent(buildTextPrompt(transcript));
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/** Generate prayer directly from a base64-encoded audio recording.
 *  Gemini listens to the entire recording and composes the prayer in one step.
 */
export async function generateLatinPrayerFromAudio(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  const result = await getModel().generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Audio,
      },
    },
    AUDIO_USER_PROMPT,
  ]);
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}
