#!/usr/bin/env bash
# bench-run.sh — build and benchmark a single branch, saving results to JSON
# Usage: ./benchmark/bench-run.sh [branch]
#   branch  Branch to benchmark (default: current branch)
#
# Example:
#   ./benchmark/bench-run.sh feature/my-optimisation
#   ./benchmark/bench-run.sh main

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
BENCH_SCRIPT="${BENCH_SCRIPT:-benchmark/run-benchmarks.ts}"
RESULTS_DIR="${RESULTS_DIR:-.bench-results}"
RESULTS_PREFIX="${RESULTS_PREFIX:-results}"
BUILD_CMD="${BUILD_CMD:-npm run build}"
RUNNER="${RUNNER:-}"

# ─── Helpers ─────────────────────────────────────────────────────────────────
red()    { printf '\033[31m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

detect_runner() {
  if [[ -n "$RUNNER" ]]; then echo "$RUNNER"; return; fi
  if command -v bun &>/dev/null;  then echo "bun";  return; fi
  if command -v tsx &>/dev/null;  then echo "tsx";  return; fi
  if command -v npx &>/dev/null;  then echo "npx tsx"; return; fi
  red "ERROR: No TS runner found. Install bun, tsx, or ensure npx is available." >&2
  exit 1
}

# ─── Main ─────────────────────────────────────────────────────────────────────
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD)
TARGET_BRANCH="${1:-$CURRENT_BRANCH}"
SAFE_BRANCH="${TARGET_BRANCH//\//-}"
OUTPUT_FILE="$RESULTS_DIR/${RESULTS_PREFIX}-${SAFE_BRANCH}.json"
RUNNER=$(detect_runner)

bold "═══════════════════════════════════════════"
bold " Benchmark Run: $TARGET_BRANCH"
bold " Output: $OUTPUT_FILE"
bold "═══════════════════════════════════════════"

# Stash if needed
stashed=false
if ! git diff --quiet || ! git diff --cached --quiet; then
  yellow "Stashing uncommitted changes..."
  git stash push -m "bench-run: auto stash" --include-untracked
  stashed=true
fi

original_branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD)
git checkout "$TARGET_BRANCH" --quiet

echo "Installing dependencies..."
npm install --silent 2>/dev/null || true

echo "Building..."
$BUILD_CMD

echo "Running benchmarks..."
mkdir -p "$RESULTS_DIR"
BENCH_OUTPUT="$OUTPUT_FILE" $RUNNER "$BENCH_SCRIPT"

# Restore
git checkout "$original_branch" --quiet
if [[ "$stashed" == "true" ]]; then
  yellow "Restoring stashed changes..."
  git stash pop
fi

bold "Done → $OUTPUT_FILE"
