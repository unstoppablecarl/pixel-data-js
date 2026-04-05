import type { AlphaMask, Color32, ColorBlendMaskOptions, PixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

/**
 * Blends a solid color into a target pixel buffer using an alpha mask.
 *
 * @remarks
 * If the width (`w`) or height (`h`) are omitted from the options, they will safely
 * default to the dimensions of the provided mask to prevent out-of-bounds memory access.
 *
 * @param target - The destination {@link PixelData32} buffer to modify.
 * @param color - The solid color to apply.
 * @param mask - The mask defining the per-pixel opacity of the target area.
 * @param opts - Configuration options including placement coordinates, bounds, global alpha, and mask offsets.
 * @returns true if any pixels were actually modified.
 */
export function blendColorPixelDataAlphaMask(
  target: PixelData32,
  color: Color32,
  mask: AlphaMask,
  opts?: ColorBlendMaskOptions,
): boolean {
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const w = opts?.w ?? mask.w
  const h = opts?.h ?? mask.h
  const globalAlpha = opts?.alpha ?? 255
  const blendFn = opts?.blendFn ?? sourceOverPerfect
  const mx = opts?.mx ?? 0
  const my = opts?.my ?? 0
  const invertMask = opts?.invertMask ?? false

  if (globalAlpha === 0) return false

  const baseSrcAlpha = (color >>> 24)
  const isOverwrite = (blendFn as any).isOverwrite || false

  if (baseSrcAlpha === 0 && !isOverwrite) return false

  let x = targetX
  let y = targetY
  let actualW = w
  let actualH = h

  if (x < 0) {
    actualW += x
    x = 0
  }

  if (y < 0) {
    actualH += y
    y = 0
  }

  actualW = Math.min(actualW, target.w - x)
  actualH = Math.min(actualH, target.h - y)

  if (actualW <= 0 || actualH <= 0) return false

  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0

  const dst32 = target.data32
  const dw = target.w
  const mPitch = mask.w
  const maskData = mask.data

  let dIdx = (y * dw + x) | 0
  let mIdx = ((my + dy) * mPitch + (mx + dx)) | 0

  const dStride = (dw - actualW) | 0
  const mStride = (mPitch - actualW) | 0
  const isOpaque = globalAlpha === 255
  const colorRGB = color & 0x00ffffff
  let didChange = false

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const mVal = maskData[mIdx]
      const effM = invertMask ? 255 - mVal : mVal

      if (effM === 0) {
        dIdx++
        mIdx++
        continue
      }

      let weight = globalAlpha

      if (isOpaque) {
        weight = effM
      } else if (effM !== 255) {
        weight = (effM * globalAlpha + 128) >> 8
      }

      if (weight === 0) {
        dIdx++
        mIdx++
        continue
      }

      let finalCol = color

      if (weight < 255) {
        const a = (baseSrcAlpha * weight + 128) >> 8
        if (a === 0 && !isOverwrite) {
          dIdx++
          mIdx++
          continue
        }
        finalCol = ((colorRGB | (a << 24)) >>> 0) as Color32
      }

      const current = dst32[dIdx] as Color32
      const next = blendFn(finalCol, current)

      if (current !== next) {
        dst32[dIdx] = next
        didChange = true
      }

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }

  return didChange
}
