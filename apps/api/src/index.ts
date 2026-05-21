import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (../../.. relative to apps/api/src/)
config({ path: resolve(__dirname, "../../../.env") });
// Also try the local apps/api/.env so either location works
config({ path: resolve(__dirname, "../.env") });
import express from "express";
import cors from "cors";
import prayerRouter from "./routes/prayer.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/prayer", prayerRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
