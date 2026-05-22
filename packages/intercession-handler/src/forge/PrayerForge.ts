/**
 * Prayer Forge — the Gemini client for composing Latin prayers.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FORGE_SYSTEM_INSTRUCTION,
  AUDIO_FORGE_PROMPT,
  buildTextForgePrompt,
} from "./prompts.js";
import type { IntercessionResult } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";

let geminiClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    geminiClient = new GoogleGenerativeAI(key);
  }
  return geminiClient;
}

function getForgeModel() {
  return getClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: FORGE_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];

  return raw.trim();
}

function parseForgeResponse(raw: string): IntercessionResult {
  console.log(`${LOG_PREFIX.prayerForge} Raw response (first 400 chars):`, raw.slice(0, 400));

  let data: unknown;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    console.error(`${LOG_PREFIX.prayerForge} Failed to parse JSON response:`, raw.slice(0, 400));
    throw new Error("The prayer could not be woven. The forge returned an unexpected form.");
  }

  const d = data as Record<string, unknown>;
  const prayer = typeof d.prayer === "string" ? d.prayer.trim() : "";
  const refrain = typeof d.refrain === "string" ? d.refrain.trim() : "";

  if (!prayer) throw new Error("The prayer text was empty.");
  if (!refrain) {
    const sentences = prayer.split(/[.!?]+/).filter((s) => s.trim());
    return {
      prayer,
      refrain: (sentences[sentences.length - 1] ?? prayer).trim() + ".",
      purifiedIntention: typeof d.purifiedIntention === "string" ? d.purifiedIntention : undefined,
      discernmentNotice: typeof d.discernmentNotice === "string" ? d.discernmentNotice : undefined,
    };
  }

  return {
    prayer,
    refrain,
    purifiedIntention: typeof d.purifiedIntention === "string" ? d.purifiedIntention : undefined,
    discernmentNotice: typeof d.discernmentNotice === "string" ? d.discernmentNotice : undefined,
  };
}

function checkFinishReason(result: Awaited<ReturnType<ReturnType<typeof getForgeModel>["generateContent"]>>): void {
  const candidate = result.response.candidates?.[0];
  const reason = candidate?.finishReason;
  if (reason && reason !== "STOP") {
    console.error(`${LOG_PREFIX.prayerForge} Unexpected finish reason: ${reason}`);
    if (reason === "MAX_TOKENS") {
      throw new Error("The prayer could not be woven: the forge ran out of space. Try a shorter petition.");
    }
    if (reason === "SAFETY") {
      throw new Error("The prayer could not be woven: the petition was blocked by safety filters.");
    }
    throw new Error(`The prayer could not be woven (finish reason: ${reason}).`);
  }
}

export async function composePrayerFromAudio(
  base64Audio: string,
  mimeType: string
): Promise<IntercessionResult> {
  console.log(`${LOG_PREFIX.prayerForge} Composing prayer from audio petition.`);
  const result = await getForgeModel().generateContent([
    { inlineData: { mimeType, data: base64Audio } },
    AUDIO_FORGE_PROMPT,
  ]);
  checkFinishReason(result);
  return parseForgeResponse(result.response.text());
}

export async function composePrayerFromText(
  transcript: string
): Promise<IntercessionResult> {
  console.log(`${LOG_PREFIX.prayerForge} Composing prayer from text petition.`);
  const result = await getForgeModel().generateContent(
    buildTextForgePrompt(transcript)
  );
  checkFinishReason(result);
  return parseForgeResponse(result.response.text());
}
