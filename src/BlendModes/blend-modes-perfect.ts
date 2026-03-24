import type { BlendColor32, Color32 } from '../_types'
import { BaseBlendMode, overwriteBase } from './blend-modes'
import { makeBlendModeRegistry } from './BlendModeRegistry'

export const overwritePerfect = overwriteBase

export const sourceOverPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 255) return src
  if (sa === 0) return dst

  const da = (dst >>> 24) & 0xFF
  if (da === 0) return src

  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF
  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF

  const invA = 255 - sa
  // Exact division by 255 using bit-shifts
  // Formula: (v + 1 + (v >> 8)) >> 8
  const tR = (sr * sa + dr * invA)
  const r = (tR + 1 + (tR >> 8)) >> 8

  const tG = (sg * sa + dg * invA)
  const g = (tG + 1 + (tG >> 8)) >> 8

  const tB = (sb * sa + db * invA)
  const b = (tB + 1 + (tB >> 8)) >> 8

  const tA = (255 * sa + da * invA)
  const a = (tA + 1 + (tA >> 8)) >> 8

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

  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** (src * dst) / 255 */
export const multiplyPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF
  const dg = (dst >>> 8) & 0xFF
  const db = (dst >>> 16) & 0xFF
  const da = (dst >>> 24) & 0xFF

  const sr = src & 0xFF
  const sg = (src >>> 8) & 0xFF
  const sb = (src >>> 16) & 0xFF

  // Calculate base multiply result: (sr * dr) / 255
  const mR = sr * dr
  const br = (mR + 1 + (mR >> 8)) >> 8

  const mG = sg * dg
  const bg = (mG + 1 + (mG >> 8)) >> 8

  const mB = sb * db
  const bb = (mB + 1 + (mB >> 8)) >> 8

  // If fully opaque, return with full alpha
  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8

  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8

  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8

  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** 255 - (255-src)/dst */
export const colorBurnPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF
  const dg = (dst >>> 8) & 0xFF
  const db = (dst >>> 16) & 0xFF

  const sr = src & 0xFF
  const sg = (src >>> 8) & 0xFF
  const sb = (src >>> 16) & 0xFF

  // Color Burn Core Math: 255 - ((255 - dst) * 255 / src)
  // We use | 0 to truncate the division result immediately.
  const resR = dr === 255 ? 255 : sr === 0 ? 0 : 255 - (((255 - dr) * 255 / sr) | 0)
  const br = resR < 0 ? 0 : resR

  const resG = dg === 255 ? 255 : sg === 0 ? 0 : 255 - (((255 - dg) * 255 / sg) | 0)
  const bg = resG < 0 ? 0 : resG

  const resB = db === 255 ? 255 : sb === 0 ? 0 : 255 - (((255 - db) * 255 / sb) | 0)
  const bb = resB < 0 ? 0 : resB

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8

  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8

  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8

  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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

  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** src === 255 ? 255 : Math.min(255, (dst << 8) / (255 - src)) */
export const colorDodgePerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF
  const dg = (dst >>> 8) & 0xFF
  const db = (dst >>> 16) & 0xFF

  const sr = src & 0xFF
  const sg = (src >>> 8) & 0xFF
  const sb = (src >>> 16) & 0xFF

  // Color Dodge Core Math: (dst * 255) / (255 - src)
  // We use ternary checks to handle the sr === 255 division-by-zero guard.
  const resR = sr === 255 ? 255 : (dr * 255 / (255 - sr)) | 0
  const br = resR > 255 ? 255 : resR

  const resG = sg === 255 ? 255 : (dg * 255 / (255 - sg)) | 0
  const bg = resG > 255 ? 255 : resG

  const resB = sb === 255 ? 255 : (db * 255 / (255 - sb)) | 0
  const bb = resB > 255 ? 255 : resB

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  // Alpha Lerp inlined
  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8

  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8

  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8

  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** ((255 - dst) * ((src * dst) >> 8) + dst * (255 - (((255 - src) * (255 - dst)) >> 8))) >> 8 */
export const softLightPerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const mR = (sr * dr)
  const scR = (255 - sr) * (255 - dr)
  const br = ((255 - dr) * ((mR + 1 + (mR >> 8)) >> 8) + dr * (255 - ((scR + 1 + (scR >> 8)) >> 8)) + 1 + (((255 - dr) * ((mR + 1 + (mR >> 8)) >> 8) + dr * (255 - ((scR + 1 + (scR >> 8)) >> 8))) >> 8)) >> 8

  const mG = (sg * dg)
  const scG = (255 - sg) * (255 - dg)
  const bg = ((255 - dg) * ((mG + 1 + (mG >> 8)) >> 8) + dg * (255 - ((scG + 1 + (scG >> 8)) >> 8)) + 1 + (((255 - dg) * ((mG + 1 + (mG >> 8)) >> 8) + dg * (255 - ((scG + 1 + (scG >> 8)) >> 8))) >> 8)) >> 8

  const mB = (sb * db)
  const scB = (255 - sb) * (255 - db)
  const bb = ((255 - db) * ((mB + 1 + (mB >> 8)) >> 8) + db * (255 - ((scB + 1 + (scB >> 8)) >> 8)) + 1 + (((255 - db) * ((mB + 1 + (mB >> 8)) >> 8) + db * (255 - ((scB + 1 + (scB >> 8)) >> 8))) >> 8)) >> 8

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

/** Math.abs(src - dst) */
export const differencePerfect: BlendColor32 = (src, dst) => {
  const sa = (src >>> 24) & 0xFF
  if (sa === 0) return dst

  const dr = dst & 0xFF, dg = (dst >>> 8) & 0xFF, db = (dst >>> 16) & 0xFF
  const sr = src & 0xFF, sg = (src >>> 8) & 0xFF, sb = (src >>> 16) & 0xFF

  const br = dr > sr ? dr - sr : sr - dr
  const bg = dg > sg ? dg - sg : sg - dg
  const bb = db > sb ? db - sb : sb - db

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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

  const r2 = dr * sr
  const br = dr + sr - (((r2 + r2) + 1 + ((r2 + r2) >> 8)) >> 8)

  const g2 = dg * sg
  const bg = dg + sg - (((g2 + g2) + 1 + ((g2 + g2) >> 8)) >> 8)

  const b2 = db * sb
  const bb = db + sb - (((b2 + b2) + 1 + ((b2 + b2) >> 8)) >> 8)

  if (sa === 255) return (0xFF000000 | (bb << 16) | (bg << 8) | br) >>> 0 as Color32

  const invA = 255 - sa
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

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
  const da = (dst >>> 24) & 0xFF

  const tR = br * sa + dr * invA
  const r = (tR + 1 + (tR >> 8)) >> 8
  const tG = bg * sa + dg * invA
  const g = (tG + 1 + (tG >> 8)) >> 8
  const tB = bb * sa + db * invA
  const b = (tB + 1 + (tB >> 8)) >> 8
  const tA = 255 * sa + da * invA
  const a = (tA + 1 + (tA >> 8)) >> 8

  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
}

export const BASE_PERFECT_BLEND_MODE_FUNCTIONS: Record<number, BlendColor32> = {
  [BaseBlendMode.overwrite]: overwritePerfect,
  [BaseBlendMode.sourceOver]: sourceOverPerfect,
  [BaseBlendMode.darken]: darkenPerfect,
  [BaseBlendMode.multiply]: multiplyPerfect,
  [BaseBlendMode.colorBurn]: colorBurnPerfect,
  [BaseBlendMode.linearBurn]: linearBurnPerfect,
  [BaseBlendMode.darkerColor]: darkerPerfect,

  [BaseBlendMode.lighten]: lightenPerfect,
  [BaseBlendMode.screen]: screenPerfect,
  [BaseBlendMode.colorDodge]: colorDodgePerfect,
  [BaseBlendMode.linearDodge]: linearDodgePerfect,
  [BaseBlendMode.lighterColor]: lighterPerfect,

  [BaseBlendMode.overlay]: overlayPerfect,
  [BaseBlendMode.softLight]: softLightPerfect,
  [BaseBlendMode.hardLight]: hardLightPerfect,
  [BaseBlendMode.vividLight]: vividLightPerfect,
  [BaseBlendMode.linearLight]: linearLightPerfect,
  [BaseBlendMode.pinLight]: pinLightPerfect,
  [BaseBlendMode.hardMix]: hardMixPerfect,

  [BaseBlendMode.difference]: differencePerfect,
  [BaseBlendMode.exclusion]: exclusionPerfect,
  [BaseBlendMode.subtract]: subtractPerfect,
  [BaseBlendMode.divide]: dividePerfect,
}

export function makePerfectBlendModeRegistry(name = 'perfect') {
  return makeBlendModeRegistry(BaseBlendMode, BASE_PERFECT_BLEND_MODE_FUNCTIONS, name)
}
