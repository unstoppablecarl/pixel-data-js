#!/usr/bin/env bash
# bench-compare.sh — compare benchmark results for two branches
# Usage: ./benchmark/bench-compare.sh [compare-branch] [base-branch] [--clear]
#   compare-branch  Branch to compare (default: current branch)
#   base-branch     Branch to compare against (default: main)
#   --clear         Delete existing result files for both branches and re-run them
#
# Example:
#   ./benchmark/bench-compare.sh feature/my-optimisation main
#   ./benchmark/bench-compare.sh feature/my-optimisation main --clear

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
RESULTS_DIR="${RESULTS_DIR:-.bench-results}"
RESULTS_PREFIX="${RESULTS_PREFIX:-results}"
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

# ─── Parse args ───────────────────────────────────────────────────────────────
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD)
COMPARE_BRANCH="${1:-$CURRENT_BRANCH}"
BASE_BRANCH="${2:-main}"
CLEAR=false

for arg in "$@"; do
  if [[ "$arg" == "--clear" || "$arg" == "-c" ]]; then
    CLEAR=true
  fi
done

# ─── Main ─────────────────────────────────────────────────────────────────────
BASE_FILE="$RESULTS_DIR/${RESULTS_PREFIX}-${BASE_BRANCH//\//-}.json"
COMPARE_FILE="$RESULTS_DIR/${RESULTS_PREFIX}-${COMPARE_BRANCH//\//-}.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$CLEAR" == "true" ]]; then
  for file in "$BASE_FILE" "$COMPARE_FILE"; do
    if [[ -f "$file" ]]; then
      yellow "Clearing $file"
      rm "$file"
    fi
  done
  bash "$SCRIPT_DIR/bench-run.sh" "$BASE_BRANCH"
  bash "$SCRIPT_DIR/bench-run.sh" "$COMPARE_BRANCH"
fi

# Validate both result files exist
missing=false
if [[ ! -f "$BASE_FILE" ]]; then
  yellow "Missing results for '$BASE_BRANCH': $BASE_FILE"
  bash "$SCRIPT_DIR/bench-run.sh" "$BASE_BRANCH"

  missing=true
fi
if [[ ! -f "$COMPARE_FILE" ]]; then
  yellow "Missing results for '$COMPARE_BRANCH': $COMPARE_FILE"
  bash "$SCRIPT_DIR/bench-run.sh" "$COMPARE_BRANCH"

  missing=true
fi
if [[ "$missing" == "true" ]]; then exit 1; fi

bold "═══════════════════════════════════════════"
bold " Benchmark Comparison"
bold "  base:    $BASE_BRANCH"
bold "  compare: $COMPARE_BRANCH"
bold "═══════════════════════════════════════════"

RUNNER=$(detect_runner)
$RUNNER benchmark/compare-results.ts "$BASE_FILE" "$COMPARE_FILE" "$BASE_BRANCH" "$COMPARE_BRANCH"
