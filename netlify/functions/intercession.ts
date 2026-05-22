import type { Handler, HandlerEvent } from "@netlify/functions";
import { receivePetition } from "intercession-handler";
import type { PetitionPayload } from "lunariel-core";
import { LOG_PREFIX } from "lunariel-core";

function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = process.env.ALLOWED_ORIGIN ?? origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = corsHeaders(event.headers.origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let payload: PetitionPayload;
  try {
    payload = JSON.parse(event.body ?? "{}") as PetitionPayload;
  } catch {
    return {
      statusCode: 400,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  if (
    !(payload.audio && payload.mimeType) &&
    !(typeof payload.transcript === "string" && payload.transcript.trim().length > 0)
  ) {
    return {
      statusCode: 400,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "The petition could not be received. Provide { audio, mimeType } or { transcript }.",
      }),
    };
  }

  try {
    const result = await receivePetition(payload);
    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${LOG_PREFIX.discernment} Intercession failed:`, message);
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: message }),
    };
  }
};
