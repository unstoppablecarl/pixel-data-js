import type { BinaryMask, Color32, PixelBlendMaskOptions, PixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendPixelDataBinaryMask(
  target: PixelData32,
  src: PixelData32,
  binaryMask: BinaryMask,
  opts?: PixelBlendMaskOptions,
): boolean {
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const sourceX = opts?.sx ?? 0
  const sourceY = opts?.sy ?? 0
  const width = opts?.w ?? src.width
  const height = opts?.h ?? src.height
  const globalAlpha = opts?.alpha ?? 255
  const blendFn = opts?.blendFn ?? sourceOverPerfect
  const mx = opts?.mx ?? 0
  const my = opts?.my ?? 0
  const invertMask = opts?.invertMask ?? false

  if (globalAlpha === 0) return false

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

  const actualW = Math.min(w, target.width - x)
  const actualH = Math.min(h, target.height - y)

  if (actualW <= 0 || actualH <= 0) return false

  // 3. Coordinate Displacement for Mask Sync
  // dx/dy represents how far the clipped start is from the requested start.
  // This is the stable way to align the mask across all clipping permutations.
  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0

  const dst32 = target.data32
  const src32 = src.data32
  const dw = target.width
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
  let didChange = false

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

      const current = dst32[dIdx] as Color32
      const next = blendFn(finalCol, dst32[dIdx] as Color32)

      if (current !== next) {
        dst32[dIdx] = next
        didChange = true
      }

      dIdx++
      sIdx++
      mIdx++
    }
    dIdx += dStride
    sIdx += sStride
    mIdx += mStride
  }

  return didChange
}
