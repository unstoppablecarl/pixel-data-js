import type { BlendColor32, Color32 } from './_types'

export const sourceOverColor32: BlendColor32 = (src, dst) => {
  const a = (src >>> 24) & 0xFF
  if (a === 255) return src
  if (a === 0) return dst

  // Pattern: (src * a + dst * (255 - a)) >> 8
  // We process RB and G separately so they don't overflow into each other
  const rbMask = 0xFF00FF
  const gMask = 0x00FF00

  const sRB = src & rbMask
  const sG = src & gMask
  const dRB = dst & rbMask
  const dG = dst & gMask

  const invA = 255 - a

  const outRB = ((sRB * a + dRB * invA) >> 8) & rbMask
  const outG = ((sG * a + dG * invA) >> 8) & gMask

  // Re-pack with opaque alpha (or calculate combined alpha if needed)
  const outA = (a + (((dst >>> 24) & 0xFF) * invA >> 8))
  return ((outA << 24) | outRB | outG) >>> 0 as Color32
}

/**
 * Screen: Lightens the destination (inverse of Multiply).
 * Result = 1 - ((1 - Src) * (1 - Dst))
 */
export const screenColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math
  const br = 255 - (((255 - (src & 0xFF)) * (255 - dr)) >> 8)
  const bg = 255 - (((255 - ((src >> 8) & 0xFF)) * (255 - dg)) >> 8)
  const bb = 255 - (((255 - ((src >> 16) & 0xFF)) * (255 - db)) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * Linear Dodge (Additive): Simply adds the source to the destination.
 * Clamps at 255.
 */
export const linearDodgeColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math (Additive with clamping)
  const br = Math.min(255, (src & 0xFF) + dr)
  const bg = Math.min(255, ((src >> 8) & 0xFF) + dg)
  const bb = Math.min(255, ((src >> 16) & 0xFF) + db)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * Multiply: Darkens the destination based on the source color.
 * Result = (Src * Dst) / 255
 */
export const multiplyColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math
  const br = ((src & 0xFF) * dr) >> 8
  const bg = (((src >> 8) & 0xFF) * dg) >> 8
  const bb = (((src >> 16) & 0xFF) * db) >> 8

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * Difference: Subtracts the darker color from the lighter color.
 * Result = |Src - Dst|
 */
export const differenceColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math
  const br = Math.abs((src & 0xFF) - dr)
  const bg = Math.abs(((src >> 8) & 0xFF) - dg)
  const bb = Math.abs(((src >> 16) & 0xFF) - db)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * Hard Light: Decides Multiply vs Screen based on SOURCE brightness.
 * Acts like a harsh spotlight.
 */
export const hardLightColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math
  const br = sr < 128 ? (2 * sr * dr) >> 8 : 255 - (2 * (255 - sr) * (255 - dr) >> 8)
  const bg = sg < 128 ? (2 * sg * dg) >> 8 : 255 - (2 * (255 - sg) * (255 - dg) >> 8)
  const bb = sb < 128 ? (2 * sb * db) >> 8 : 255 - (2 * (255 - sb) * (255 - db) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * Color Burn: Darkens the destination to reflect the source color.
 */
export const colorBurnColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math (Avoid division by zero)
  const br = dr === 255 ? 255 : Math.max(0, 255 - ((255 - dr) << 8) / (sr || 1))
  const bg = dg === 255 ? 255 : Math.max(0, 255 - ((255 - dg) << 8) / (sg || 1))
  const bb = db === 255 ? 255 : Math.max(0, 255 - ((255 - db) << 8) / (sb || 1))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}
/**
 * Overlay: The classic "Contrast" mode.
 * Decides Multiply vs Screen based on DESTINATION brightness.
 */
export const overlayColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  // 1. Core Math
  const br = dr < 128 ? (2 * sr * dr) >> 8 : 255 - (2 * (255 - sr) * (255 - dr) >> 8)
  const bg = dg < 128 ? (2 * sg * dg) >> 8 : 255 - (2 * (255 - sg) * (255 - dg) >> 8)
  const bb = db < 128 ? (2 * sb * db) >> 8 : 255 - (2 * (255 - sb) * (255 - db) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 2. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const overwriteColor32: BlendColor32 = (src, dst) => src

export const COLOR_32_BLEND_MODES = {
  sourceOver: sourceOverColor32,
  screen: screenColor32,
  linearDodge: linearDodgeColor32,
  multiply: multiplyColor32,
  difference: differenceColor32,
  overlay: overlayColor32,
  hardLight: hardLightColor32,
  colorBurn: colorBurnColor32,
  overwrite: overwriteColor32,
}
