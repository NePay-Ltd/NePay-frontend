#!/usr/bin/env node
/**
 * run-tests.mjs
 *
 * Wraps `vitest run` and appends a clear summary line:
 *   ✅  Test Files   4 passed  |  0 failed  (4 total)
 *   ✅  Tests       70 passed  |  0 failed  (70 total)
 *
 * Usage: node run-tests.mjs [--watch]
 */

import { spawnSync } from "child_process";

const isWatch = process.argv.includes("--watch");
const vitestArgs = isWatch ? ["vitest"] : ["vitest", "run"];

const result = spawnSync("npx", vitestArgs, {
  stdio: ["inherit", "pipe", "pipe"],
  encoding: "utf8",
  env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: "true", FORCE_COLOR: "1" },
});

const raw = (result.stdout ?? "") + (result.stderr ?? "");

// Print everything vitest printed
process.stdout.write(raw);

// ── Parse the summary lines ─────────────────────────────────────────────────
// Vitest prints lines like:
//   " Test Files  4 passed (4)"
//   "      Tests  70 passed (70)"
// Strip ANSI codes first so the regex matches cleanly
const cleanRaw = raw.replace(/\x1B\[\d+m/g, "");

const fileMatch  = cleanRaw.match(/Test Files\s+(\d+)\s+passed\s+\((\d+)\)/);
const testsMatch = cleanRaw.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
const failMatch  = cleanRaw.match(/Tests.*?(\d+)\s+failed/);
const fileFailMatch = cleanRaw.match(/Test Files.*?(\d+)\s+failed/);

if (fileMatch || testsMatch) {
  const filesPassed = parseInt(fileMatch?.[1] ?? "0");
  const filesTotal  = parseInt(fileMatch?.[2] ?? "0");
  const filesFailed = parseInt(fileFailMatch?.[1] ?? "0");

  const testsPassed = parseInt(testsMatch?.[1] ?? "0");
  const testsTotal  = parseInt(testsMatch?.[2] ?? "0");
  const testsFailed = parseInt(failMatch?.[1] ?? "0");

  const allOk = filesFailed === 0 && testsFailed === 0;

  const GREEN  = "\x1b[32m";
  const RED    = "\x1b[31m";
  const BOLD   = "\x1b[1m";
  const DIM    = "\x1b[2m";
  const RESET  = "\x1b[0m";

  const icon        = allOk ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`;
  const passedColor = GREEN;
  const failedColor = (n) => n > 0 ? RED : DIM;

  const filesLine = [
    `  ${icon}  ${BOLD}Test Files${RESET}`,
    `  ${passedColor}${filesPassed} passed${RESET}`,
    `  ${failedColor(filesFailed)}${filesFailed} failed${RESET}`,
    `  ${DIM}(${filesTotal} total)${RESET}`,
  ].join("  |");

  const testsLine = [
    `  ${icon}  ${BOLD}Tests     ${RESET}`,
    `  ${passedColor}${testsPassed} passed${RESET}`,
    `  ${failedColor(testsFailed)}${testsFailed} failed${RESET}`,
    `  ${DIM}(${testsTotal} total)${RESET}`,
  ].join("  |");

  console.log("\n" + "─".repeat(60));
  console.log(filesLine);
  console.log(testsLine);
  console.log("─".repeat(60) + "\n");
}

process.exit(result.status ?? 0);
