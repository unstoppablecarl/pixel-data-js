import { type AlphaMask, type MergeAlphaMasksOptions } from '../_types'

/**
 * Merges 2 alpha masks values are 0-255
 */
export function mergeAlphaMasks(
  dst: AlphaMask,
  src: AlphaMask,
  opts: MergeAlphaMasksOptions,
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = 0,
    h: height = 0,
    alpha: globalAlpha = 255,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (width <= 0) return
  if (height <= 0) return
  if (globalAlpha === 0) return

  const dstData = dst.data
  const srcData = src.data
  const srcWidth = src.w
  const dstWidth = dst.w

  const startX = Math.max(0, -targetX, -mx)
  const startY = Math.max(0, -targetY, -my)

  const endX = Math.min(width, dstWidth - targetX, srcWidth - mx)
  const endY = Math.min(height, dst.h - targetY, src.h - my)

  if (startX >= endX) return
  if (startY >= endY) return

  for (let iy = startY; iy < endY; iy++) {
    const dy = targetY + iy
    const sy = my + iy

    let dIdx = dy * dstWidth + targetX + startX
    let sIdx = sy * srcWidth + mx + startX

    for (let ix = startX; ix < endX; ix++) {
      const rawM = srcData[sIdx]
      // Unified logic branch inside the hot path
      const effectiveM = invertMask ? 255 - rawM : rawM

      let weight = 0

      if (effectiveM === 0) {
        weight = 0
      } else if (effectiveM === 255) {
        weight = globalAlpha
      } else if (globalAlpha === 255) {
        weight = effectiveM
      } else {
        weight = (effectiveM * globalAlpha + 128) >> 8
      }

      if (weight !== 255) {
        if (weight === 0) {
          dstData[dIdx] = 0
        } else {
          const da = dstData[dIdx]

          if (da === 255) {
            dstData[dIdx] = weight
          } else if (da !== 0) {
            dstData[dIdx] = (da * weight + 128) >> 8
          }
        }
      }

      sIdx++
      dIdx++
    }
  }
}
