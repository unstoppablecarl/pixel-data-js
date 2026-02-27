import type { BlendColor32, Color32 } from '../_types'
import { BlendMode, type BlendModeIndex, type BaseBlendToIndexGetter, type BaseIndexToBlendGetter } from './blend-modes'

export const overwriteFast: BlendColor32 = (src, _dst) => src

export const sourceOverFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 255) return src
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const da = (dst >>> 24) & 0xFF

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (sr * sa + dr * invA) >> 8
  const g = (sg * sa + dg * invA) >> 8
  const b = (sb * sa + db * invA) >> 8
  const a = (255 * sa + da * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const darkenFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const br = sr < dr ? sr : dr
  const bg = sg < dg ? sg : dg
  const bb = sb < db ? sb : db

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** (src * dst) / 255 */
export const multiplyFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  // Consistent floor rounding for all channels
  const br = (sr * dr) >> 8
  const bg = (sg * dg) >> 8
  const bb = (sb * db) >> 8

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + da * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** 255 - (255-src)/dst */
export const colorBurnFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const br = dr === 255 ? 255 : sr === 0 ? 0 : Math.max(0, 255 - (((255 - dr) << 8) / sr) | 0)
  const bg = dg === 255 ? 255 : sg === 0 ? 0 : Math.max(0, 255 - (((255 - dg) << 8) / sg) | 0)
  const bb = db === 255 ? 255 : sb === 0 ? 0 : Math.max(0, 255 - (((255 - db) << 8) / sb) | 0)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + da * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src + dst - 255 */
export const linearBurnFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  // Math: Base + Blend - 255 (clamped to 0)
  const brU = dr + sr - 255
  const bgU = dg + sg - 255
  const bbU = db + sb - 255

  const br = brU < 0 ? 0 : brU
  const bg = bgU < 0 ? 0 : bgU
  const bb = bbU < 0 ? 0 : bbU

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const darkerFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

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
export const lightenFast: BlendColor32 = (src, dst) => {
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
export const screenFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const br = 255 - (((255 - (src & 0xFF)) * (255 - dr)) >> 8)
  const bg = 255 - (((255 - ((src >>> 8) & 0xFF)) * (255 - dg)) >> 8)
  const bb = 255 - (((255 - ((src >>> 16) & 0xFF)) * (255 - db)) >> 8)

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
export const colorDodgeFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = sr === 255 ? 255 : Math.min(255, ((dr << 8) / (255 - sr)) | 0)
  const bg = sg === 255 ? 255 : Math.min(255, ((dg << 8) / (255 - sg)) | 0)
  const bb = sb === 255 ? 255 : Math.min(255, ((db << 8) / (255 - sb)) | 0)

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
export const linearDodgeFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const brU = (src & 0xFF) + dr
  const bgU = ((src >>> 8) & 0xFF) + dg
  const bbU = ((src >>> 16) & 0xFF) + db

  const br = brU > 255 ? 255 : brU
  const bg = bgU > 255 ? 255 : bgU
  const bb = bbU > 255 ? 255 : bbU

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const lighterFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

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
export const overlayFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

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

/** ((255 - dst) * ((src * dst) >> 8) + dst * (255 - (((255 - src) * (255 - dst)) >> 8))) >> 8 */
export const softLightFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

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
export const hardLightFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

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
export const vividLightFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = sr < 128 ? (sr === 0 ? 0 : Math.max(0, 255 - (((255 - dr) << 8) / (2 * sr)) | 0)) : (sr === 255 ? 255 : Math.min(255, ((dr << 8) / (2 * (255 - sr))) | 0))
  const bg = sg < 128 ? (sg === 0 ? 0 : Math.max(0, 255 - (((255 - dg) << 8) / (2 * sg)) | 0)) : (sg === 255 ? 255 : Math.min(255, ((dg << 8) / (2 * (255 - sg))) | 0))
  const bb = sb < 128 ? (sb === 0 ? 0 : Math.max(0, 255 - (((255 - db) << 8) / (2 * sb)) | 0)) : (sb === 255 ? 255 : Math.min(255, ((db << 8) / (2 * (255 - sb))) | 0))

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
export const linearLightFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const brU = dr + 2 * sr - 255
  const bgU = dg + 2 * sg - 255
  const bbU = db + 2 * sb - 255

  const br = brU < 0 ? 0 : brU > 255 ? 255 : brU
  const bg = bgU < 0 ? 0 : bgU > 255 ? 255 : bgU
  const bb = bbU < 0 ? 0 : bbU > 255 ? 255 : bbU

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
export const pinLightFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = sr < 128 ? (dr < 2 * sr ? dr : 2 * sr) : (dr > 2 * sr - 256 ? dr : 2 * sr - 256)
  const bg = sg < 128 ? (dg < 2 * sg ? dg : 2 * sg) : (dg > 2 * sg - 256 ? dg : 2 * sg - 256)
  const bb = sb < 128 ? (db < 2 * sb ? db : 2 * sb) : (db > 2 * sb - 256 ? db : 2 * sb - 256)

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
export const hardMixFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = (sr < 128 ? (sr === 0 ? 0 : Math.max(0, 255 - (((255 - dr) << 8) / (2 * sr)) | 0)) : (sr === 255 ? 255 : Math.min(255, ((dr << 8) / (2 * (255 - sr))) | 0))) < 128 ? 0 : 255
  const bg = (sg < 128 ? (sg === 0 ? 0 : Math.max(0, 255 - (((255 - dg) << 8) / (2 * sg)) | 0)) : (sg === 255 ? 255 : Math.min(255, ((dg << 8) / (2 * (255 - sg))) | 0))) < 128 ? 0 : 255
  const bb = (sb < 128 ? (sb === 0 ? 0 : Math.max(0, 255 - (((255 - db) << 8) / (2 * sb)) | 0)) : (sb === 255 ? 255 : Math.min(255, ((db << 8) / (2 * (255 - sb))) | 0))) < 128 ? 0 : 255

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
export const differenceFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const brD = (src & 0xFF) - dr
  const bgD = ((src >>> 8) & 0xFF) - dg
  const bbD = ((src >>> 16) & 0xFF) - db

  const br = brD < 0 ? -brD : brD
  const bg = bgD < 0 ? -bgD : bgD
  const bb = bbD < 0 ? -bbD : bbD

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
export const exclusionFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

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
export const subtractFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const brU = dr - sr
  const bgU = dg - sg
  const bbU = db - sb

  const br = brU < 0 ? 0 : brU
  const bg = bgU < 0 ? 0 : bgU
  const bb = bbU < 0 ? 0 : bbU

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
export const divideFast: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = sr === 0 ? 255 : Math.min(255, ((dr << 8) / sr) | 0)
  const bg = sg === 0 ? 255 : Math.min(255, ((dg << 8) / sg) | 0)
  const bb = sb === 0 ? 255 : Math.min(255, ((db << 8) / sb) | 0)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) >> 8
  const g = (bg * sa + dg * invA) >> 8
  const b = (bb * sa + db * invA) >> 8
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const FAST_BLENDER_REGISTRY = [
  [BlendMode.overwrite, overwriteFast],
  [BlendMode.sourceOver, sourceOverFast],

  [BlendMode.darken, darkenFast],
  [BlendMode.multiply, multiplyFast],
  [BlendMode.colorBurn, colorBurnFast],
  [BlendMode.linearBurn, linearBurnFast],
  [BlendMode.darkerColor, darkerFast],

  [BlendMode.lighten, lightenFast],
  [BlendMode.screen, screenFast],
  [BlendMode.colorDodge, colorDodgeFast],
  [BlendMode.linearDodge, linearDodgeFast],
  [BlendMode.lighterColor, lighterFast],

  [BlendMode.overlay, overlayFast],
  [BlendMode.softLight, softLightFast],
  [BlendMode.hardLight, hardLightFast],
  [BlendMode.vividLight, vividLightFast],
  [BlendMode.linearLight, linearLightFast],
  [BlendMode.pinLight, pinLightFast],
  [BlendMode.hardMix, hardMixFast],

  [BlendMode.difference, differenceFast],
  [BlendMode.exclusion, exclusionFast],
  [BlendMode.subtract, subtractFast],
  [BlendMode.divide, divideFast],
] as const

export type RegisteredFastBlender = typeof FAST_BLENDER_REGISTRY[number][1]
export type FastBlendModeIndex = BlendModeIndex & { readonly __brandBlendModeIndex: unique symbol }

export const FAST_BLEND_MODES: BlendColor32[] = []

for (const [index, blend] of FAST_BLENDER_REGISTRY) {
  FAST_BLEND_MODES[index as FastBlendModeIndex] = blend
}

export const FAST_BLEND_TO_INDEX = new Map<RegisteredFastBlender, FastBlendModeIndex>(
  FAST_BLENDER_REGISTRY.map((entry, index) => {
    return [
      entry[1],
      index as FastBlendModeIndex,
    ]
  }),
) as BaseBlendToIndexGetter<FastBlendModeIndex, RegisteredFastBlender>

export const INDEX_TO_FAST_BLEND = new Map<FastBlendModeIndex, RegisteredFastBlender>(
  FAST_BLENDER_REGISTRY.map((entry, index) => {
    return [
      index as FastBlendModeIndex,
      entry[1],
    ]
  }),
) as BaseIndexToBlendGetter<FastBlendModeIndex, RegisteredFastBlender>

export type FastBlendModes = {
  [K in keyof typeof BlendMode]: RegisteredFastBlender
}

export const FAST_BLEND_MODE_BY_NAME: FastBlendModes = {
  overwrite: overwriteFast,
  sourceOver: sourceOverFast,
  darken: darkenFast,
  multiply: multiplyFast,
  colorBurn: colorBurnFast,
  linearBurn: linearBurnFast,
  darkerColor: darkerFast,
  lighten: lightenFast,
  screen: screenFast,
  colorDodge: colorDodgeFast,
  linearDodge: linearDodgeFast,
  lighterColor: lighterFast,
  overlay: overlayFast,
  softLight: softLightFast,
  hardLight: hardLightFast,
  vividLight: vividLightFast,
  linearLight: linearLightFast,
  pinLight: pinLightFast,
  hardMix: hardMixFast,
  difference: differenceFast,
  exclusion: exclusionFast,
  subtract: subtractFast,
  divide: divideFast,
} as const
