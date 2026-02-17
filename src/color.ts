import type { Color32, RGBA } from './_types'

/**
 * Packs RGBA into a 32-bit integer compatible with
 * Little-Endian Uint32Array views on ImageData.
 */
export function packColor(r: number, g: number, b: number, a: number): Color32 {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export function packRGBA({ r, g, b, a }: RGBA): Color32 {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const unpackRed = (packed: Color32): number => (packed >>> 0) & 0xFF
export const unpackGreen = (packed: Color32): number => (packed >>> 8) & 0xFF
export const unpackBlue = (packed: Color32): number => (packed >>> 16) & 0xFF
export const unpackAlpha = (packed: Color32): number => (packed >>> 24) & 0xFF

export function unpackColor(packed: Color32): RGBA {
  return {
    r: (packed >>> 0) & 0xFF,
    g: (packed >>> 8) & 0xFF,
    b: (packed >>> 16) & 0xFF,
    a: (packed >>> 24) & 0xFF,
  }
}

const SCRATCH_RGBA: RGBA = { r: 0, g: 0, b: 0, a: 0 }

// uses a scratch arg for memory perf. Be careful about re-use.
export function unpackColorTo(packed: Color32, scratch = SCRATCH_RGBA): RGBA {
  scratch.r = (packed >>> 0) & 0xFF
  scratch.g = (packed >>> 8) & 0xFF
  scratch.b = (packed >>> 16) & 0xFF
  scratch.a = (packed >>> 24) & 0xFF
  return scratch
}

export function colorDistance(a: Color32, b: Color32): number {
  const dr = (a & 0xFF) - (b & 0xFF)
  const dg = ((a >>> 8) & 0xFF) - ((b >>> 8) & 0xFF)
  const db = ((a >>> 16) & 0xFF) - ((b >>> 16) & 0xFF)
  const da = ((a >>> 24) & 0xFF) - ((b >>> 24) & 0xFF)
  return dr * dr + dg * dg + db * db + da * da
}

export function lerpColor32(a: Color32, b: Color32, t: number): Color32 {
  const r = (a & 0xFF) + t * ((b & 0xFF) - (a & 0xFF))
  const g = ((a >>> 8) & 0xFF) + t * (((b >>> 8) & 0xFF) - ((a >>> 8) & 0xFF))
  const b_ = ((a >>> 16) & 0xFF) + t * (((b >>> 16) & 0xFF) - ((a >>> 16) & 0xFF))
  const a_ = ((a >>> 24) & 0xFF) + t * (((b >>> 24) & 0xFF) - ((a >>> 24) & 0xFF))

  return packColor(r, g, b_, a_)
}

// Convert 0xAABBGGRR to #RRGGBBAA
export function color32ToHex(color: Color32): string {
  const r = (color & 0xFF).toString(16).padStart(2, '0')
  const g = ((color >>> 8) & 0xFF).toString(16).padStart(2, '0')
  const b = ((color >>> 16) & 0xFF).toString(16).padStart(2, '0')
  const a = ((color >>> 24) & 0xFF).toString(16).padStart(2, '0')
  return `#${r}${g}${b}${a}`
}

/**
 * Converts a 32-bit integer (0xAABBGGRR) to a CSS rgba() string.
 * Example: 0xFF0000FF -> "rgba(255,0,0,1)"
 */
export function color32ToCssRGBA(color: Color32): string {
  const r = color & 0xFF
  const g = (color >>> 8) & 0xFF
  const b = (color >>> 16) & 0xFF
  const a = (color >>> 24) & 0xFF

  const alpha = Number((a / 255).toFixed(3))

  return `rgba(${r},${g},${b},${alpha})`
}
