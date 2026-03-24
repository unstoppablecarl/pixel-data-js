import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const BENCH_RESULTS_DIR = resolve(__dirname, '../.bench-results')
export const BENCH_RUNNERS_DIR = resolve(__dirname, './runners')

export const THRESHOLD_WARN = 0.05 // 5% slower → yellow
export const THRESHOLD_BAD = 0.15 // 15% slower → red
export const THRESHOLD_GOOD = 0.05 // 5% faster → green
