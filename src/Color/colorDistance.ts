import type { Color32 } from './_color-types'

export function colorDistance(a: Color32, b: Color32): number {
  const dr = (a & 0xFF) - (b & 0xFF)
  const dg = ((a >>> 8) & 0xFF) - ((b >>> 8) & 0xFF)
  const db = ((a >>> 16) & 0xFF) - ((b >>> 16) & 0xFF)
  const da = ((a >>> 24) & 0xFF) - ((b >>> 24) & 0xFF)
  return dr * dr + dg * dg + db * db + da * da
}
