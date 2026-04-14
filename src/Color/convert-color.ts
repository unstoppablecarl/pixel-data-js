// Convert 0xAABBGGRR to #RRGGBBAA
import type { Color32, CssRGBA } from './_color-types'

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
export function color32ToCssRGBAString(color: Color32): string {
  const r = color & 0xFF
  const g = (color >>> 8) & 0xFF
  const b = (color >>> 16) & 0xFF
  const a = (color >>> 24) & 0xFF

  const alpha = Number((a / 255).toFixed(3))

  return `rgba(${r},${g},${b},${alpha})`
}

export function color32ToCssRGBA(color: Color32): CssRGBA {
  const r = color & 0xFF
  const g = (color >>> 8) & 0xFF
  const b = (color >>> 16) & 0xFF
  const a = (color >>> 24) & 0xFF

  return {
    r,
    g,
    b,
    a: a / 255,
  } as CssRGBA
}

export function cssRGBAToColor32({ r, g, b, a }: CssRGBA): Color32 {
  return (((a * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}
