import type { BlendColor32, Color32 } from '../_types'
import type { BaseBlendToIndexGetter, BaseIndexToBlendGetter } from './blend-mode-getters'
import { BlendMode, type BlendModeIndex } from './blend-modes'

export const overwritePerfect: BlendColor32 = (src, _dst) => src

export const sourceOverPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 255) return src
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const da = (dst >>> 24) & 0xFF

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (sr * sa + dr * invA) / 255 | 0
  const g = (sg * sa + dg * invA) / 255 | 0
  const b = (sb * sa + db * invA) / 255 | 0
  const a = (255 * sa + da * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const darkenPerfect: BlendColor32 = (src, dst) => {
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

  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** (src * dst) / 255 */
export const multiplyPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  // Consistent floor rounding for all channels
  const br = (sr * dr / 255) | 0
  const bg = (sg * dg / 255) | 0
  const bb = (sb * db / 255) | 0
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + da * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** 255 - (255-src)/dst */
export const colorBurnPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const br = dr === 255 ? 255 : sr === 0 ? 0 : Math.max(0, (255 - (((255 - dr) * 255 / sr) | 0)))
  const bg = dg === 255 ? 255 : sg === 0 ? 0 : Math.max(0, (255 - (((255 - dg) * 255 / sg) | 0)))
  const bb = db === 255 ? 255 : sb === 0 ? 0 : Math.max(0, (255 - (((255 - db) * 255 / sb) | 0)))
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + da * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src + dst - 255 */
export const linearBurnPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  // Math: Base + Blend - 255 (clamped to 0)
  const brU = dr + sr - 255
  const br = brU < 0 ? 0 : brU
  const bgU = dg + sg - 255
  const bg = bgU < 0 ? 0 : bgU
  const bbU = db + sb - 255
  const bb = bbU < 0 ? 0 : bbU
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const darkerPerfect: BlendColor32 = (src, dst) => {
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
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.max(src, dst) */
export const lightenPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const br = (src & 0xFF) > dr ? (src & 0xFF) : dr
  const bg = ((src >>> 8) & 0xFF) > dg ? ((src >>> 8) & 0xFF) : dg
  const bb = ((src >>> 16) & 0xFF) > db ? ((src >>> 16) & 0xFF) : db

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32
  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * 255 - ((255 - src) * (255 - dst))
 */
export const screenPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const br = 255 - (((255 - (src & 0xFF)) * (255 - dr) / 255) | 0)
  const bg = 255 - (((255 - ((src >>> 8) & 0xFF)) * (255 - dg) / 255) | 0)
  const bb = 255 - (((255 - ((src >>> 16) & 0xFF)) * (255 - db) / 255) | 0)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa

  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src === 255 ? 255 : Math.min(255, (dst << 8) / (255 - src)) */
export const colorDodgePerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = sr === 255 ? 255 : Math.min(255, ((dr * 255 / (255 - sr)) | 0))
  const bg = sg === 255 ? 255 : Math.min(255, ((dg * 255 / (255 - sg)) | 0))
  const bb = sb === 255 ? 255 : Math.min(255, ((db * 255 / (255 - sb)) | 0))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src + dst */
export const linearDodgePerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const brU = (src & 0xFF) + dr
  const br = brU > 255 ? 255 : brU
  const bgU = ((src >>> 8) & 0xFF) + dg
  const bg = bgU > 255 ? 255 : bgU
  const bbU = ((src >>> 16) & 0xFF) + db
  const bb = bbU > 255 ? 255 : bbU

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const lighterPerfect: BlendColor32 = (src, dst) => {
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
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src < 128 ? (2 * src * dst) : (255 - 2 * (255 - src) * (255 - dst)) */
export const overlayPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const br = dr < 128 ? (2 * sr * dr / 255) | 0 : 255 - ((2 * (255 - sr) * (255 - dr) / 255) | 0)
  const bg = dg < 128 ? (2 * sg * dg / 255) | 0 : 255 - ((2 * (255 - sg) * (255 - dg) / 255) | 0)
  const bb = db < 128 ? (2 * sb * db / 255) | 0 : 255 - ((2 * (255 - sb) * (255 - db) / 255) | 0)
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** ((255 - dst) * ((src * dst) >> 8) + dst * (255 - (((255 - src) * (255 - dst)) >> 8))) >> 8 */
export const softLightPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const br = (((255 - dr) * ((sr * dr / 255) | 0) + dr * (255 - (((255 - sr) * (255 - dr) / 255) | 0))) / 255) | 0
  const bg = (((255 - dg) * ((sg * dg / 255) | 0) + dg * (255 - (((255 - sg) * (255 - dg) / 255) | 0))) / 255) | 0
  const bb = (((255 - db) * ((sb * db / 255) | 0) + db * (255 - (((255 - sb) * (255 - db) / 255) | 0))) / 255) | 0
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** If src < 128 (50% gray), Multiply; otherwise, Screen */
export const hardLightPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const br = sr < 128 ? (2 * sr * dr / 255) | 0 : 255 - ((2 * (255 - sr) * (255 - dr) / 255) | 0)
  const bg = sg < 128 ? (2 * sg * dg / 255) | 0 : 255 - ((2 * (255 - sg) * (255 - dg) / 255) | 0)
  const bb = sb < 128 ? (2 * sb * db / 255) | 0 : 255 - ((2 * (255 - sb) * (255 - db) / 255) | 0)
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/**
 * If src < 128: Burn(dst, 2 * src)
 * If src >= 128: Dodge(dst, 2 * (src - 128))
 */
export const vividLightPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const br = sr < 128 ? (sr === 0 ? 0 : Math.max(0, (255 - (((255 - dr) * 255 / (2 * sr)) | 0)))) : (sr === 255 ? 255 : Math.min(255, ((dr * 255 / (2 * (255 - sr))) | 0)))
  const bg = sg < 128 ? (sg === 0 ? 0 : Math.max(0, (255 - (((255 - dg) * 255 / (2 * sg)) | 0)))) : (sg === 255 ? 255 : Math.min(255, ((dg * 255 / (2 * (255 - sg))) | 0)))
  const bb = sb < 128 ? (sb === 0 ? 0 : Math.max(0, (255 - (((255 - db) * 255 / (2 * sb)) | 0)))) : (sb === 255 ? 255 : Math.min(255, ((db * 255 / (2 * (255 - sb))) | 0)))
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** dst + 2 * src - 255 (Clamped to 0-255) */
export const linearLightPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const brU = dr + 2 * sr - 255
  const br = brU < 0 ? 0 : brU > 255 ? 255 : brU
  const bgU = dg + 2 * sg - 255
  const bg = bgU < 0 ? 0 : bgU > 255 ? 255 : bgU
  const bbU = db + 2 * sb - 255
  const bb = bbU < 0 ? 0 : bbU > 255 ? 255 : bbU
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src < 128 ? min(dst, 2 * src) : max(dst, 2 * (src - 128)) */
export const pinLightPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF
  const dg = (dst >>> 8) & 0xFF
  const db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF
  const sg = (src >>> 8) & 0xFF
  const sb = (src >>> 16) & 0xFF

  const br = sr < 128 ? (dr < (sr << 1) ? dr : (sr << 1)) : (dr > ((sr - 128) << 1) ? dr : ((sr - 128) << 1))
  const bg = sg < 128 ? (dg < (sg << 1) ? dg : (sg << 1)) : (dg > ((sg - 128) << 1) ? dg : ((sg - 128) << 1))
  const bb = sb < 128 ? (db < (sb << 1) ? db : (sb << 1)) : (db > ((sb - 128) << 1) ? db : ((sb - 128) << 1))

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF
  const r = (br * sa + dr * invA + 128) / 255 | 0
  const g = (bg * sa + dg * invA + 128) / 255 | 0
  const b = (bb * sa + db * invA + 128) / 255 | 0
  const a = (255 * sa + da * invA + 128) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** (Vivid Light logic forced to 0 or 255) */
export const hardMixPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const br = (sr < 128 ? (sr === 0 ? 0 : Math.max(0, (255 - (((255 - dr) * 255 / (2 * sr)) | 0)))) : (sr === 255 ? 255 : Math.min(255, ((dr * 255 / (2 * (255 - sr))) | 0)))) < 128 ? 0 : 255
  const bg = (sg < 128 ? (sg === 0 ? 0 : Math.max(0, (255 - (((255 - dg) * 255 / (2 * sg)) | 0)))) : (sg === 255 ? 255 : Math.min(255, ((dg * 255 / (2 * (255 - sg))) | 0)))) < 128 ? 0 : 255
  const bb = (sb < 128 ? (sb === 0 ? 0 : Math.max(0, (255 - (((255 - db) * 255 / (2 * sb)) | 0)))) : (sb === 255 ? 255 : Math.min(255, ((db * 255 / (2 * (255 - sb))) | 0)))) < 128 ? 0 : 255
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.abs(src - dst) */
export const differencePerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF
  const dg = (dst >>> 8) & 0xFF
  const db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF
  const sg = (src >>> 8) & 0xFF
  const sb = (src >>> 16) & 0xFF

  const br = Math.abs(dr - sr)
  const bg = Math.abs(dg - sg)
  const bb = Math.abs(db - sb)

  if (sa === 255) {
    return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32
  }

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF
  const r = (br * sa + dr * invA + 128) / 255 | 0
  const g = (bg * sa + dg * invA + 128) / 255 | 0
  const b = (bb * sa + db * invA + 128) / 255 | 0
  const a = (255 * sa + da * invA + 128) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** dst + src - ((dst * src) >> 7) */
export const exclusionPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF
  const dg = (dst >>> 8) & 0xFF
  const db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF
  const sg = (src >>> 8) & 0xFF
  const sb = (src >>> 16) & 0xFF

  // Using >> 7 (divide by 128) instead of / 255
  // This is equivalent to (2 * s * d) / 256
  const br = dr + sr - ((dr * sr) >> 7)
  const bg = dg + sg - ((dg * sg) >> 7)
  const bb = db + sb - ((db * sb) >> 7)

  if (sa === 255) {
    return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32
  }

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + da * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.max(0, dst - src) */
export const subtractPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const brU = dr - sr
  const br = brU < 0 ? 0 : brU
  const bgU = dg - sg
  const bg = bgU < 0 ? 0 : bgU
  const bbU = db - sb
  const bb = bbU < 0 ? 0 : bbU
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** sr === 0 ? 255 : Math.min(255, (dr << 8) / sr) */
export const dividePerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const br = sr === 0 ? 255 : Math.min(255, ((dr * 255 / sr) | 0))
  const bg = sg === 0 ? 255 : Math.min(255, ((dg * 255 / sg) | 0))
  const bb = sb === 0 ? 255 : Math.min(255, ((db * 255 / sb) | 0))
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const r = (br * sa + dr * invA) / 255 | 0
  const g = (bg * sa + dg * invA) / 255 | 0
  const b = (bb * sa + db * invA) / 255 | 0
  const a = (255 * sa + ((dst >>> 24) & 0xFF) * invA) / 255 | 0

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const PERFECT_BLENDER_REGISTRY = [
  [BlendMode.overwrite, overwritePerfect],
  [BlendMode.sourceOver, sourceOverPerfect],

  [BlendMode.darken, darkenPerfect],
  [BlendMode.multiply, multiplyPerfect],
  [BlendMode.colorBurn, colorBurnPerfect],
  [BlendMode.linearBurn, linearBurnPerfect],
  [BlendMode.darkerColor, darkerPerfect],

  [BlendMode.lighten, lightenPerfect],
  [BlendMode.screen, screenPerfect],
  [BlendMode.colorDodge, colorDodgePerfect],
  [BlendMode.linearDodge, linearDodgePerfect],
  [BlendMode.lighterColor, lighterPerfect],

  [BlendMode.overlay, overlayPerfect],
  [BlendMode.softLight, softLightPerfect],
  [BlendMode.hardLight, hardLightPerfect],
  [BlendMode.vividLight, vividLightPerfect],
  [BlendMode.linearLight, linearLightPerfect],
  [BlendMode.pinLight, pinLightPerfect],
  [BlendMode.hardMix, hardMixPerfect],

  [BlendMode.difference, differencePerfect],
  [BlendMode.exclusion, exclusionPerfect],
  [BlendMode.subtract, subtractPerfect],
  [BlendMode.divide, dividePerfect],
] as const

export type RegisteredPerfectBlender = typeof PERFECT_BLENDER_REGISTRY[number][1]

export const PERFECT_BLEND_MODES: BlendColor32[] = []
for (const [index, blend] of PERFECT_BLENDER_REGISTRY) {
  PERFECT_BLEND_MODES[index as BlendModeIndex] = blend
}

export const PERFECT_BLEND_TO_INDEX = new Map(
  PERFECT_BLENDER_REGISTRY.map((entry, index) => {
    return [
      entry[1],
      index as BlendModeIndex,
    ]
  }),
) as BaseBlendToIndexGetter<RegisteredPerfectBlender>

export const INDEX_TO_PERFECT_BLEND = new Map(
  PERFECT_BLENDER_REGISTRY.map((entry, index) => {
    return [
      index as BlendModeIndex,
      entry[1],
    ]
  }),
) as BaseIndexToBlendGetter<RegisteredPerfectBlender>

export type PerfectBlendModes = {
  [K in keyof typeof BlendMode]: RegisteredPerfectBlender
}

export const PERFECT_BLEND_MODE_BY_NAME: PerfectBlendModes = {
  overwrite: overwritePerfect,
  sourceOver: sourceOverPerfect,
  darken: darkenPerfect,
  multiply: multiplyPerfect,
  colorBurn: colorBurnPerfect,
  linearBurn: linearBurnPerfect,
  darkerColor: darkerPerfect,
  lighten: lightenPerfect,
  screen: screenPerfect,
  colorDodge: colorDodgePerfect,
  linearDodge: linearDodgePerfect,
  lighterColor: lighterPerfect,
  overlay: overlayPerfect,
  softLight: softLightPerfect,
  hardLight: hardLightPerfect,
  vividLight: vividLightPerfect,
  linearLight: linearLightPerfect,
  pinLight: pinLightPerfect,
  hardMix: hardMixPerfect,
  difference: differencePerfect,
  exclusion: exclusionPerfect,
  subtract: subtractPerfect,
  divide: dividePerfect,
} as const
