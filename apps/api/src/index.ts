import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (three levels up from apps/api/src/)
config({ path: resolve(__dirname, "../../../.env") });
// Also try a local apps/api/.env as fallback
config({ path: resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import intercessionRouter from "./routes/intercession.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
}));
app.use(express.json({ limit: "25mb" }));

// Primary intercession route
app.use("/api/intercession", intercessionRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[Lunariel:API] Guardian is listening on http://localhost:${PORT}`);
});
