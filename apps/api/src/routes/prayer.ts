import { Router, Request, Response } from "express";
import {
  generateLatinPrayerFromAudio,
  generateLatinPrayerFromText,
} from "../lib/gemini.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { audio, mimeType, transcript } = req.body as {
    audio?: string;
    mimeType?: string;
    transcript?: string;
  };

  try {
    let prayer: string;

    if (audio && mimeType) {
      // Primary path: full audio recording → Gemini multimodal
      prayer = await generateLatinPrayerFromAudio(audio, mimeType);
    } else if (typeof transcript === "string" && transcript.trim().length > 0) {
      // Fallback / mock mode: plain text transcript
      prayer = await generateLatinPrayerFromText(transcript);
    } else {
      res.status(400).json({ error: "Provide either { audio, mimeType } or { transcript }" });
      return;
    }

    res.json({ prayer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[prayer] Gemini error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
