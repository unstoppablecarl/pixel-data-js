import type { BinaryMask, Color32, ColorBlendMaskOptions, IPixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

/**
 * Blends a solid color into a target pixel buffer using a binary mask.
 *
 * @remarks
 * If the width (`w`) or height (`h`) are omitted from the options, they will safely
 * default to the dimensions of the provided mask to prevent out-of-bounds memory access.
 *
 * @param dst - The destination {@link IPixelData32} buffer to modify.
 * @param color - The solid color to apply.
 * @param mask - The mask defining the per-pixel opacity of the target area.
 * @param opts - Configuration options including placement coordinates, bounds, global alpha, and mask offsets.
 * @returns true if any pixels were actually modified.
 */
export function blendColorPixelDataBinaryMask(
  dst: IPixelData32,
  color: Color32,
  mask: BinaryMask,
  opts: ColorBlendMaskOptions = {},
): boolean {
  const targetX = opts.x ?? 0
  const targetY = opts.y ?? 0
  let w = opts.w ?? mask.w
  let h = opts.h ?? mask.h
  const globalAlpha = opts.alpha ?? 255
  const blendFn = opts.blendFn ?? sourceOverPerfect
  const mx = opts.mx ?? 0
  const my = opts.my ?? 0
  const invertMask = opts.invertMask ?? false

  if (globalAlpha === 0) return false

  const baseSrcAlpha = (color >>> 24)
  const isOverwrite = (blendFn as any).isOverwrite || false

  if (baseSrcAlpha === 0 && !isOverwrite) return false

  let x = targetX
  let y = targetY

  if (x < 0) {
    w += x
    x = 0
  }

  if (y < 0) {
    h += y
    y = 0
  }

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)

  if (actualW <= 0 || actualH <= 0) return false

  let baseColorWithGlobalAlpha = color

  if (globalAlpha < 255) {
    const a = (baseSrcAlpha * globalAlpha + 128) >> 8
    if (a === 0 && !isOverwrite) return false
    baseColorWithGlobalAlpha = ((color & 0x00ffffff) | (a << 24)) >>> 0 as Color32
  }

  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0
  const dst32 = dst.data32
  const dw = dst.width
  const mPitch = mask.w
  const maskData = mask.data
  let dIdx = (y * dw + x) | 0
  let mIdx = ((my + dy) * mPitch + (mx + dx)) | 0

  const dStride = (dw - actualW) | 0
  const mStride = (mPitch - actualW) | 0
  const skipVal = invertMask ? 1 : 0
  let didChange = false

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      if (maskData[mIdx] === skipVal) {
        dIdx++
        mIdx++
        continue
      }

      const current = dst32[dIdx] as Color32
      const next = blendFn(baseColorWithGlobalAlpha, current)

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
