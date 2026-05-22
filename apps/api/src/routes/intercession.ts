/**
 * Intercession route — the API endpoint for Lunariel's prayer cycle.
 *
 * Accepts a spoken petition (audio) or text fallback,
 * runs it through the Discernment Filter and Prayer Forge,
 * and returns a structured intercession result.
 */
import { Router, Request, Response } from "express";
import { receivePetition } from "intercession-handler";
import type { PetitionPayload } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const payload = req.body as PetitionPayload;

  if (
    !(payload.audio && payload.mimeType) &&
    !(typeof payload.transcript === "string" && payload.transcript.trim().length > 0)
  ) {
    res.status(400).json({
      error: "The petition could not be received. Provide { audio, mimeType } or { transcript }.",
    });
    return;
  }

  try {
    const result = await receivePetition(payload);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${LOG_PREFIX.discernment} Intercession failed:`, message);
    res.status(500).json({ error: message });
  }
});

export default router;
