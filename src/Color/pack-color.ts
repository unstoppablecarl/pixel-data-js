import type { Color32, RGBA } from './_color-types'

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

// uses a scratch arg for memory perf. be careful about re-use.
export function unpackColorTo(packed: Color32, scratch = SCRATCH_RGBA): RGBA {
  scratch.r = (packed >>> 0) & 0xFF
  scratch.g = (packed >>> 8) & 0xFF
  scratch.b = (packed >>> 16) & 0xFF
  scratch.a = (packed >>> 24) & 0xFF
  return scratch
}
