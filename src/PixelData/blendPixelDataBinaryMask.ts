import type { BinaryMask, Color32, IPixelData, PixelBlendMaskOptions } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendPixelDataBinaryMask(
  dst: IPixelData,
  src: IPixelData,
  binaryMask: BinaryMask,
  opts: PixelBlendMaskOptions,
) {
  const {
    x: targetX = 0,
    y: targetY = 0,
    sx: sourceX = 0,
    sy: sourceY = 0,
    w: width = src.width,
    h: height = src.height,
    alpha: globalAlpha = 255,
    blendFn = sourceOverPerfect,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0) return

  let x = targetX
  let y = targetY
  let sx = sourceX
  let sy = sourceY
  let w = width
  let h = height

  // 1. Source Clipping
  if (sx < 0) {
    x -= sx
    w += sx
    sx = 0
  }
  if (sy < 0) {
    y -= sy
    h += sy
    sy = 0
  }
  w = Math.min(w, src.width - sx)
  h = Math.min(h, src.height - sy)

  // 2. Destination Clipping
  if (x < 0) {
    sx -= x
    w += x
    x = 0
  }
  if (y < 0) {
    sy -= y
    h += y
    y = 0
  }

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)

  if (actualW <= 0 || actualH <= 0) return

  // 3. Coordinate Displacement for Mask Sync
  // dx/dy represents how far the clipped start is from the requested start.
  // This is the stable way to align the mask across all clipping permutations.
  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0

  const dst32 = dst.data32
  const src32 = src.data32
  const dw = dst.width
  const sw = src.width
  const mPitch = binaryMask.w
  const maskData = binaryMask.data

  let dIdx = (y * dw + x) | 0
  let sIdx = (sy * sw + sx) | 0
  let mIdx = ((my + dy) * mPitch + (mx + dx)) | 0

  const dStride = (dw - actualW) | 0
  const sStride = (sw - actualW) | 0
  const mStride = (mPitch - actualW) | 0

  const skipVal = invertMask ? 1 : 0
  const isOpaque = globalAlpha === 255
  const isOverwrite = blendFn.isOverwrite || false

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      // Binary Mask Check (Earliest exit)
      if (maskData[mIdx] === skipVal) {
        dIdx++
        sIdx++
        mIdx++
        continue
      }

      const srcCol = src32[sIdx] as Color32
      const srcAlpha = srcCol >>> 24

      // Source Alpha Check
      if (srcAlpha === 0 && !isOverwrite) {
        dIdx++
        sIdx++
        mIdx++
        continue
      }

      let finalCol = srcCol
      if (!isOpaque) {
        // Rounding-corrected global alpha application
        const a = (srcAlpha * globalAlpha + 128) >> 8
        if (a === 0 && !isOverwrite) {
          dIdx++
          sIdx++
          mIdx++
          continue
        }
        finalCol = ((srcCol & 0x00ffffff) | (a << 24)) >>> 0 as Color32
      }

      dst32[dIdx] = blendFn(finalCol, dst32[dIdx] as Color32)

      dIdx++
      sIdx++
      mIdx++
    }
    dIdx += dStride
    sIdx += sStride
    mIdx += mStride
  }
}
