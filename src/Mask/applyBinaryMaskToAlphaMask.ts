import type { AlphaMask, ApplyMaskToPixelDataOptions, BinaryMask } from '../_types'

export function applyBinaryMaskToAlphaMask(
  alphaMaskDst: AlphaMask,
  binaryMaskSrc: BinaryMask,
  opts: ApplyMaskToPixelDataOptions = {},
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: reqWidth = 0,
    h: reqHeight = 0,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  const dstWidth = alphaMaskDst.w
  if (dstWidth <= 0) return
  if (binaryMaskSrc.data.length === 0) return
  const srcWidth = binaryMaskSrc.w
  if (srcWidth <= 0) return

  const dstHeight = (alphaMaskDst.data.length / dstWidth) | 0
  const srcHeight = (binaryMaskSrc.data.length / srcWidth) | 0

  if (dstHeight <= 0) return
  if (srcHeight <= 0) return

  const dstX0 = Math.max(0, targetX)
  const dstY0 = Math.max(0, targetY)
  const dstX1 = reqWidth > 0 ? Math.min(dstWidth, targetX + reqWidth) : dstWidth
  const dstY1 = reqHeight > 0 ? Math.min(dstHeight, targetY + reqHeight) : dstHeight

  if (dstX0 >= dstX1) return
  if (dstY0 >= dstY1) return

  const srcX0 = mx + (dstX0 - targetX)
  const srcY0 = my + (dstY0 - targetY)

  if (srcX0 >= srcWidth) return
  if (srcY0 >= srcHeight) return
  if (srcX0 + (dstX1 - dstX0) <= 0) return
  if (srcY0 + (dstY1 - dstY0) <= 0) return

  const iterW = Math.min(dstX1 - dstX0, srcWidth - srcX0)
  const iterH = Math.min(dstY1 - dstY0, srcHeight - srcY0)

  const srcData = binaryMaskSrc.data
  const dstData = alphaMaskDst.data

  let dstIdx = dstY0 * dstWidth + dstX0
  let srcIdx = srcY0 * srcWidth + srcX0

  if (invertMask) {
    for (let row = 0; row < iterH; row++) {
      const dstEnd = dstIdx + iterW
      let d = dstIdx
      let s = srcIdx

      while (d < dstEnd) {
        // inverted
        if (srcData[s] !== 0) {
          dstData[d] = 0
        }
        d++
        s++
      }

      dstIdx += dstWidth
      srcIdx += srcWidth
    }
  } else {
    for (let row = 0; row < iterH; row++) {
      const dstEnd = dstIdx + iterW
      let d = dstIdx
      let s = srcIdx

      while (d < dstEnd) {
        // If binary mask is empty, clear the alpha pixel.
        if (srcData[s] === 0) {
          dstData[d] = 0
        }
        d++
        s++
      }

      dstIdx += dstWidth
      srcIdx += srcWidth
    }
  }
}
