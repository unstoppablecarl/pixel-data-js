import p from 'picocolors'
import { THRESHOLD_BAD, THRESHOLD_GOOD, THRESHOLD_WARN } from '../bench.config'

export function formatNs(ns: number | undefined): string {
  if (ns == null) return p.gray('n/a')
  if (ns < 1_000) return `${ns.toFixed(2)} ns`
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(2)} µs`
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(2)} ms`

  return `${(ns / 1_000_000_000).toFixed(2)} s`
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes == null) return p.gray('—')
  if (bytes < 1024) return `${bytes.toFixed(2)} b`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} kb`

  return `${(bytes / (1024 * 1024)).toFixed(2)} mb`
}

export function formatDelta(ratio: number | null): string {
  if (ratio === null) return p.gray('—')

  const pct = (ratio * 100).toFixed(2)
  const sign = ratio > 0 ? '+' : ''
  const str = `${sign}${pct}%`

  if (ratio > THRESHOLD_BAD) return p.red(str)
  if (ratio > THRESHOLD_WARN) return p.yellow(str)
  if (ratio < -THRESHOLD_GOOD) return p.green(str)

  return p.gray(str)
}

export function formatSpeedup(ratio: number): string {
  if (ratio < 1) return p.green(`${(1 / ratio).toFixed(2)}x faster`)
  if (ratio > 1) return p.red(`${ratio.toFixed(2)}x slower`)

  return p.gray('no change')
}
