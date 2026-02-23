import type { BlendColor32, Color32 } from './_types'

export const overwriteColor32: BlendColor32 = (src, dst) => src

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
  const da = (dst >>> 24) & 0xFF

  const outRB = ((sRB * a + dRB * invA) >> 8) & rbMask
  const outG = ((sG * a + dG * invA) >> 8) & gMask

  // Re-pack with opaque alpha (or calculate combined alpha if needed)
  const outA = (a + (((dst >>> 24) & 0xFF) * invA >> 8))
  return ((outA << 24) | outRB | outG) >>> 0 as Color32
}

/** Math.min(src, dst) */
export const darkenColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const br = Math.min(src & 0xFF, dst & 0xFF)
  const bg = Math.min((src >> 8) & 0xFF, (dst >> 8) & 0xFF)
  const bb = Math.min((src >> 16) & 0xFF, (dst >> 16) & 0xFF)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const dr = dst & 0xFF
  const dg = (dst >> 8) & 0xFF
  const db = (dst >> 16) & 0xFF

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** (src * dst) / 255 */
export const multiplyColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  const br = ((src & 0xFF) * dr + 128) >> 8
  const bg = (((src >> 8) & 0xFF) * dg) >> 8
  const bb = (((src >> 16) & 0xFF) * db) >> 8

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** 255 - (255-src)/dst */
export const colorBurnColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  const br = dr === 255 ? 255 : Math.max(0, 255 - ((255 - dr) << 8) / (sr || 1))
  const bg = dg === 255 ? 255 : Math.max(0, 255 - ((255 - dg) << 8) / (sg || 1))
  const bb = db === 255 ? 255 : Math.max(0, 255 - ((255 - db) << 8) / (sb || 1))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src + dst - 255 */
export const linearBurnColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  // Math: Base + Blend - 255 (clamped to 0)
  const br = Math.max(0, dr + sr - 255)
  const bg = Math.max(0, dg + sg - 255)
  const bb = Math.max(0, db + sb - 255)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const darkerColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  // 1. Calculate Luminosity (Photoshop Weights: R:0.3, G:0.59, B:0.11)
  // Scaled by 256 for integer math: 77, 151, 28
  const lumSrc = (sr * 77 + sg * 151 + sb * 28)
  const lumDst = (dr * 77 + dg * 151 + db * 28)

  // 2. Selection Logic
  // Pick the perceptually darker pixel
  let br, bg, bb
  if (lumSrc < lumDst) {
    br = sr
    bg = sg
    bb = sb
  } else {
    br = dr
    bg = dg
    bb = db
  }

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // 3. Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.max(src, dst) */
export const lightenColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const br = Math.max(src & 0xFF, dst & 0xFF)
  const bg = Math.max((src >> 8) & 0xFF, (dst >> 8) & 0xFF)
  const bb = Math.max((src >> 16) & 0xFF, (dst >> 16) & 0xFF)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const dr = dst & 0xFF
  const dg = (dst >> 8) & 0xFF
  const db = (dst >> 16) & 0xFF

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * 255 - ((255 - src) * (255 - dst))
 */
export const screenColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  const br = 255 - (((255 - (src & 0xFF)) * (255 - dr)) >> 8)
  const bg = 255 - (((255 - ((src >> 8) & 0xFF)) * (255 - dg)) >> 8)
  const bb = 255 - (((255 - ((src >> 16) & 0xFF)) * (255 - db)) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src === 255 ? 255 : Math.min(255, (dst << 8) / (255 - src)) */
export const colorDodgeColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = sr === 255 ? 255 : Math.min(255, (dr << 8) / (255 - sr))
  const bg = sg === 255 ? 255 : Math.min(255, (dg << 8) / (255 - sg))
  const bb = sb === 255 ? 255 : Math.min(255, (db << 8) / (255 - sb))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src + dst */
export const linearDodgeColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  const br = Math.min(255, (src & 0xFF) + dr)
  const bg = Math.min(255, ((src >> 8) & 0xFF) + dg)
  const bb = Math.min(255, ((src >> 16) & 0xFF) + db)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const lighterColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  // Calculate Luminosity (Photoshop uses Weights: R:0.3, G:0.59, B:0.11)
  // We use integer math (scaled by 256) for speed.
  const lumSrc = (sr * 77 + sg * 151 + sb * 28)
  const lumDst = (dr * 77 + dg * 151 + db * 28)

  // Selection Logic (Base result)
  let br, bg, bb
  if (lumSrc > lumDst) {
    br = sr
    bg = sg
    bb = sb
  } else {
    br = dr
    bg = dg
    bb = db
  }

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src < 128 ? (2 * src * dst) : (255 - 2 * (255 - src) * (255 - dst)) */
export const overlayColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  const br = dr < 128 ? (2 * sr * dr) >> 8 : 255 - (2 * (255 - sr) * (255 - dr) >> 8)
  const bg = dg < 128 ? (2 * sg * dg) >> 8 : 255 - (2 * (255 - sg) * (255 - dg) >> 8)
  const bb = db < 128 ? (2 * sb * db) >> 8 : 255 - (2 * (255 - sb) * (255 - db) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**  ((255 - dst) * ((src * dst) >> 8) + dst * (255 - (((255 - src) * (255 - dst)) >> 8))) >> 8 */
export const softLightColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = ((255 - dr) * ((sr * dr) >> 8) + dr * (255 - (((255 - sr) * (255 - dr)) >> 8))) >> 8
  const bg = ((255 - dg) * ((sg * dg) >> 8) + dg * (255 - (((255 - sg) * (255 - dg)) >> 8))) >> 8
  const bb = ((255 - db) * ((sb * db) >> 8) + db * (255 - (((255 - sb) * (255 - db)) >> 8))) >> 8

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** If src < 128 (50% gray), Multiply; otherwise, Screen */
export const hardLightColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = sr < 128 ? (2 * sr * dr) >> 8 : 255 - ((2 * (255 - sr) * (255 - dr)) >> 8)
  const bg = sg < 128 ? (2 * sg * dg) >> 8 : 255 - ((2 * (255 - sg) * (255 - dg)) >> 8)
  const bb = sb < 128 ? (2 * sb * db) >> 8 : 255 - ((2 * (255 - sb) * (255 - db)) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * If src < 128: Burn(dst, 2 * src)
 * If src >= 128: Dodge(dst, 2 * (src - 128))
 */
export const vividLightColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = sr < 128
    ? (sr === 0 ? 0 : Math.max(0, 255 - (((255 - dr) << 8) / (2 * sr))))
    : (sr === 255 ? 255 : Math.min(255, (dr << 8) / (2 * (255 - sr))))

  const bg = sg < 128
    ? (sg === 0 ? 0 : Math.max(0, 255 - (((255 - dg) << 8) / (2 * sg))))
    : (sg === 255 ? 255 : Math.min(255, (dg << 8) / (2 * (255 - sg))))

  const bb = sb < 128
    ? (sb === 0 ? 0 : Math.max(0, 255 - (((255 - db) << 8) / (2 * sb))))
    : (sb === 255 ? 255 : Math.min(255, (db << 8) / (2 * (255 - sb))))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** dst + 2 * src - 255 (Clamped to 0-255) */
export const linearLightColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = Math.max(0, Math.min(255, dr + 2 * sr - 255))
  const bg = Math.max(0, Math.min(255, dg + 2 * sg - 255))
  const bb = Math.max(0, Math.min(255, db + 2 * sb - 255))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src < 128 ? min(dst, 2 * src) : max(dst, 2 * (src - 128)) */
export const pinLightColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = sr < 128 ? Math.min(dr, 2 * sr) : Math.max(dr, 2 * (sr - 128))
  const bg = sg < 128 ? Math.min(dg, 2 * sg) : Math.max(dg, 2 * (sg - 128))
  const bb = sb < 128 ? Math.min(db, 2 * sb) : Math.max(db, 2 * (sb - 128))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** (Vivid Light logic forced to 0 or 255) */
export const hardMixColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = (sr < 128
    ? (sr === 0 ? 0 : Math.max(0, 255 - (((255 - dr) << 8) / (2 * sr))))
    : (sr === 255 ? 255 : Math.min(255, (dr << 8) / (2 * (255 - sr))))) < 128 ? 0 : 255

  const bg = (sg < 128
    ? (sg === 0 ? 0 : Math.max(0, 255 - (((255 - dg) << 8) / (2 * sg))))
    : (sg === 255 ? 255 : Math.min(255, (dg << 8) / (2 * (255 - sg))))) < 128 ? 0 : 255

  const bb = (sb < 128
    ? (sb === 0 ? 0 : Math.max(0, 255 - (((255 - db) << 8) / (2 * sb))))
    : (sb === 255 ? 255 : Math.min(255, (db << 8) / (2 * (255 - sb))))) < 128 ? 0 : 255

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.abs(src - dst) */
export const differenceColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF

  const br = Math.abs((src & 0xFF) - dr)
  const bg = Math.abs(((src >> 8) & 0xFF) - dg)
  const bb = Math.abs(((src >> 16) & 0xFF) - db)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** dst + src - ((dst * src) >> 7) */
export const exclusionColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = dr + sr - ((dr * sr) >> 7)
  const bg = dg + sg - ((dg * sg) >> 7)
  const bb = db + sb - ((db * sb) >> 7)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.max(0, dst - src) */
export const subtractColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = Math.max(0, dr - sr)
  const bg = Math.max(0, dg - sg)
  const bb = Math.max(0, db - sb)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** sr === 0 ? 255 : Math.min(255, (dr << 8) / sr) */
export const divideColor32: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF

  const br = sr === 0 ? 255 : Math.min(255, (dr << 8) / sr)
  const bg = sg === 0 ? 255 : Math.min(255, (dg << 8) / sg)
  const bb = sb === 0 ? 255 : Math.min(255, (db << 8) / sb)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

// The enum index IS the permanent ID.
// do not change the order, Adding to it is ok.
export enum BlendMode {
  overwrite,
  sourceOver,

  darken,
  multiply,
  colorBurn,
  linearBurn,
  darkerColor,

  lighten,
  screen,
  colorDodge,
  linearDodge,
  lighterColor,

  overlay,
  softLight,
  hardLight,
  vividLight,
  linearLight,
  pinLight,
  hardMix,

  difference,
  exclusion,
  subtract,
  divide,
}

const BLENDER_REGISTRY = [
  [BlendMode.overwrite, overwriteColor32],
  [BlendMode.sourceOver, sourceOverColor32],

  [BlendMode.darken, darkenColor32],
  [BlendMode.multiply, multiplyColor32],
  [BlendMode.colorBurn, colorBurnColor32],
  [BlendMode.linearBurn, linearBurnColor32],
  [BlendMode.darkerColor, darkerColor32],

  [BlendMode.lighten, lightenColor32],
  [BlendMode.screen, screenColor32],
  [BlendMode.colorDodge, colorDodgeColor32],
  [BlendMode.linearDodge, linearDodgeColor32],
  [BlendMode.lighterColor, lighterColor32],

  [BlendMode.overlay, overlayColor32],
  [BlendMode.softLight, softLightColor32],
  [BlendMode.hardLight, hardLightColor32],
  [BlendMode.vividLight, vividLightColor32],
  [BlendMode.linearLight, linearLightColor32],
  [BlendMode.pinLight, pinLightColor32],
  [BlendMode.hardMix, hardMixColor32],

  [BlendMode.difference, differenceColor32],
  [BlendMode.exclusion, exclusionColor32],
  [BlendMode.subtract, subtractColor32],
  [BlendMode.divide, divideColor32],
] as const

export type RegisteredBlender = typeof BLENDER_REGISTRY[number][1]
export type BlendModeIndex = number & { readonly __brandBlendModeIndex: unique symbol }

export const BLEND_MODES: BlendColor32[] = []

for (const [index, blend] of BLENDER_REGISTRY) {
  BLEND_MODES[index as BlendModeIndex] = blend
}

export const BLEND_TO_INDEX = new Map<RegisteredBlender, BlendModeIndex>(
  BLENDER_REGISTRY.map((entry, index) => {
    return [
      entry[1],
      index as BlendModeIndex,
    ]
  }),
) as {
  get: (blend: RegisteredBlender) => BlendModeIndex
}

export const INDEX_TO_BLEND = new Map<BlendModeIndex, RegisteredBlender>(
  BLENDER_REGISTRY.map((entry, index) => {
    return [
      index as BlendModeIndex,
      entry[1],
    ]
  }),
) as {
  get: (index: BlendModeIndex) => RegisteredBlender
}
