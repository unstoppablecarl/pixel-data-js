#!/usr/bin/env tsx
// scripts/compare-results.ts
// Reads two mitata JSON result files and prints a formatted comparison table.
// Usage: tsx benchmark/compare-results.ts <base.json> <compare.json> [baseName] [compareName]

import { readFileSync } from "fs";

// ─── Config ──────────────────────────────────────────────────────────────────

const THRESHOLD_WARN = 0.05; // 5%  slower → yellow
const THRESHOLD_BAD  = 0.15; // 15% slower → red
const THRESHOLD_GOOD = 0.05; // 5%  faster → green

// ─── Types ───────────────────────────────────────────────────────────────────

interface BenchStats {
  avg: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p99: number;
  p999: number;
}

interface MitataRun {
  stats: BenchStats & {
    samples?: number[];
    debug?: string;
    heap?: unknown;
    ticks?: number;
  };
  name?: string;
  args?: unknown;
}

interface MitataBenchmark {
  alias?: string;
  name?: string;
  runs: MitataRun[];
}

interface MitataResult {
  benchmarks?: MitataBenchmark[];
}

// ─── ANSI helpers ────────────────────────────────────────────────────────────

const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
} as const;

const bold   = (s: string) => `${c.bold}${s}${c.reset}`;
const dim    = (s: string) => `${c.dim}${s}${c.reset}`;
const red    = (s: string) => `${c.red}${s}${c.reset}`;
const green  = (s: string) => `${c.green}${s}${c.reset}`;
const yellow = (s: string) => `${c.yellow}${s}${c.reset}`;
const cyan   = (s: string) => `${c.cyan}${s}${c.reset}`;

// ─── Formatting ──────────────────────────────────────────────────────────────

function fmtNs(ns: number | undefined): string {
  if (ns == null)         return dim("n/a");
  if (ns < 1_000)         return `${ns.toFixed(2)} ns`;
  if (ns < 1_000_000)     return `${(ns / 1_000).toFixed(2)} µs`;
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(2)} ms`;
  return `${(ns / 1_000_000_000).toFixed(2)} s`;
}

function fmtDelta(ratio: number): string {
  const pct  = (ratio * 100).toFixed(2);
  const sign = ratio > 0 ? "+" : "";
  const str  = `${sign}${pct}%`;
  if (ratio > THRESHOLD_BAD)   return red(str);
  if (ratio > THRESHOLD_WARN)  return yellow(str);
  if (ratio < -THRESHOLD_GOOD) return green(str);
  return dim(str);
}

function fmtSpeedup(ratio: number): string {
  if (ratio < 1) return green(`${(1 / ratio).toFixed(2)}x faster`);
  if (ratio > 1) return red(`${ratio.toFixed(2)}x slower`);
  return dim("no change");
}

// ─── Parse mitata JSON output ─────────────────────────────────────────────────

function parseMitata(raw: MitataResult): Map<string, BenchStats> {
  const map = new Map<string, BenchStats>();

  for (const b of raw?.benchmarks ?? []) {
    const name = b.alias ?? b.runs?.[0]?.name;
    if (!name) continue;

    const stats = b.runs?.[0]?.stats;
    if (!stats?.avg) continue;

    map.set(name, {
      avg:  stats.avg,
      min:  stats.min,
      max:  stats.max,
      p25:  stats.p25,
      p50:  stats.p50,
      p75:  stats.p75,
      p99:  stats.p99,
      p999: stats.p999,
    });
  }

  return map;
}

// ─── Table printer ────────────────────────────────────────────────────────────

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function printTable(rows: string[][], headers: string[]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => stripAnsi(r[i] ?? "").length))
  );

  const pad = (s: string, w: number) =>
    s + " ".repeat(Math.max(0, w - stripAnsi(s).length));

  const line = (cells: string[]) =>
    "│ " + cells.map((cell, i) => pad(cell, widths[i]!)).join(" │ ") + " │";

  console.log("┌" + widths.map((w) => "─".repeat(w + 2)).join("┬") + "┐");
  console.log(line(headers.map(bold)));
  console.log("├" + widths.map((w) => "─".repeat(w + 2)).join("┼") + "┤");
  rows.forEach((r) => console.log(line(r)));
  console.log("└" + widths.map((w) => "─".repeat(w + 2)).join("┴") + "┘");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const [,, baseFile, compareFile, baseName = "base", compareName = "compare"] =
  process.argv;

if (!baseFile || !compareFile) {
  console.error(
    "Usage: tsx scripts/compare-results.ts <base.json> <compare.json> [baseName] [compareName]"
  );
  process.exit(1);
}

const baseData    = parseMitata(JSON.parse(readFileSync(baseFile,    "utf8")));
const compareData = parseMitata(JSON.parse(readFileSync(compareFile, "utf8")));

const allNames = new Set([...baseData.keys(), ...compareData.keys()]);

const rows: string[][] = [];
let regressions  = 0;
let improvements = 0;

for (const name of allNames) {
  const base    = baseData.get(name);
  const compare = compareData.get(name);

  if (!base && !compare) continue;

  if (!base) {
    rows.push([cyan(name), dim("missing"), fmtNs(compare?.avg), dim("—"), dim("new")]);
    continue;
  }
  if (!compare) {
    rows.push([cyan(name), fmtNs(base.avg), dim("missing"), dim("—"), dim("removed")]);
    continue;
  }

  const ratio = (compare.avg - base.avg) / base.avg;
  if (ratio > THRESHOLD_WARN)  regressions++;
  if (ratio < -THRESHOLD_GOOD) improvements++;

  rows.push([
    cyan(name),
    fmtNs(base.avg),
    fmtNs(compare.avg),
    fmtDelta(ratio),
    fmtSpeedup(compare.avg / base.avg),
  ]);
}

const headers = [
  "Benchmark",
  `${baseName} (avg)`,
  `${compareName} (avg)`,
  "Δ",
  "Summary",
];

console.log();
printTable(rows, headers);
console.log();

if (regressions > 0) {
  console.log(red(`⚠  ${regressions} regression(s) detected (>${(THRESHOLD_WARN * 100).toFixed(0)}% slower)`));
} else {
  console.log(green("✓  No regressions detected"));
}
if (improvements > 0) {
  console.log(green(`🚀 ${improvements} improvement(s) detected`));
}
console.log();
