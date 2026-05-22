#!/usr/bin/env node
/**
 * `evoke lunariel` → npm run dev at the monorepo root.
 * Linked into node_modules/.bin after `npm install`.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const spirit = process.argv[2];

if (spirit !== "lunariel") {
  console.error("Usage: evoke lunariel");
  console.error("  Run from the Angel Incubator repo root after npm install.");
  process.exit(1);
}

const cwd = process.cwd();
if (path.resolve(cwd) !== path.resolve(ROOT)) {
  console.error("evoke lunariel must be run from the project root:");
  console.error(`  ${ROOT}`);
  process.exit(1);
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npm, ["run", "dev"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
