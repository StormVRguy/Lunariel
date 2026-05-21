# Angel Incubator — Autonomous Praying System

A reverent web app that listens to your spoken intention, generates a short Latin prayer with Gemini 2.5 Flash, then "sings" it as organ chords — one chord per word — in an endless loop until you give thanks.

## How it works

1. **LISTEN** — starts continuous speech recognition. The button reads "I'M LISTENING". Click again to stop; the full transcript is sent to the API.
2. **PRAY** — becomes active once the Latin prayer is ready. Plays organ chords for each word in a loop.
3. **THANK YOU** — stops the organ loop immediately.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A **Gemini API key** — get one at [aistudio.google.com](https://aistudio.google.com)
- **Chrome or Edge** for speech recognition (Web Speech API)

## Setup

```bash
# 1. Install all dependencies (root + workspaces)
npm install

# 2. Create the API env file
cp .env.example apps/api/.env
# Edit apps/api/.env and set GEMINI_API_KEY=<your key>

# 3. Start both servers (Vite on :5173, API on :3001)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome.

## Environment variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | `apps/api/.env` | Authenticates requests to Gemini 2.5 Flash |
| `PORT` | `apps/api/.env` (optional) | API server port (default `3001`) |
| `VITE_MOCK_PRAYER` | `apps/web/.env.local` (optional) | Set to `true` to skip Gemini and use a fixed Latin prayer — useful for UI development without an API key |

## Project structure

```
Angel_Incubator/
  apps/
    web/          Vite + React + TypeScript + Tone.js
      src/
        App.tsx
        components/PrayerControls.tsx   — UI and buttons
        hooks/useSpeechListen.ts        — Web Speech API toggle
        hooks/usePrayerSession.ts       — State machine (idle → listening → generating → prayerReady → singing)
        audio/organPlayer.ts            — Tone.js PolySynth loop
        audio/wordToChord.ts            — Deterministic word → organ chord mapping
    api/          Express + TypeScript
      src/
        index.ts                        — Server entry point
        routes/prayer.ts                — POST /api/prayer
        lib/gemini.ts                   — Gemini 2.5 Flash client
        lib/prompt.ts                   — System instruction + user prompt builder
```

## Browser support

| Browser | Speech recognition |
|---------|--------------------|
| Chrome / Edge | Full support |
| Safari | Partial (may require flag) |
| Firefox | Not supported |

## How chords are assigned

Each Latin word is hashed (djb2) to a root pitch class (C through B) and a chord quality (major / minor / diminished). The mapping is deterministic — the same word always produces the same chord every loop. Chords are played in the low organ register (octave 3) with a sine-wave synth, reverb, and low-pass filter to approximate a pipe organ.
