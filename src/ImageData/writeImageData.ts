import { MaskType } from '../_types'
import { makeClippedBlit, resolveBlitClipping } from '../Internal/resolveClipping'

const SCRATCH_BLIT = makeClippedBlit()

/**
 * Writes image data from a source to a target with support for clipping and alpha masking.
 *
 * @param target - The destination ImageData to write to.
 * @param source - The source ImageData to read from.
 * @param x - The x-coordinate in the target where drawing starts.
 * @param y - The y-coordinate in the target where drawing starts.
 * @param sx - The x-coordinate in the source to start copying from.
 * @param sy - The y-coordinate in the source to start copying from.
 * @param sw - The width of the rectangle to copy.
 * @param sh - The height of the rectangle to copy.
 * @param mask - An optional Uint8Array mask (0-255). 0 is transparent, 255 is opaque.
 * @param maskType - type of mask
 */
export function writeImageData(
  target: ImageData,
  source: ImageData,
  x: number,
  y: number,
  sx: number = 0,
  sy: number = 0,
  sw: number = source.width,
  sh: number = source.height,
  mask: Uint8Array | null = null,
  maskType: MaskType = MaskType.BINARY,
): void {
  const dstW = target.width
  const dstH = target.height
  const dstData = target.data
  const srcW = source.width
  const srcData = source.data

  const clip = resolveBlitClipping(
    x, y, sx, sy, sw, sh,
    dstW, dstH, srcW, source.height,
    SCRATCH_BLIT,
  )

  if (!clip.inBounds) return

  const {
    x: dstX,
    y: dstY,
    sx: srcX,
    sy: srcY,
    w: copyW,
    h: copyH,
  } = clip

  const useMask = !!mask

  for (let row = 0; row < copyH; row++) {
    const currentDstY = dstY + row
    const currentSrcY = srcY + row

    const dstStart = (currentDstY * dstW + dstX) * 4
    const srcStart = (currentSrcY * srcW + srcX) * 4

    if (useMask && mask) {
      for (let ix = 0; ix < copyW; ix++) {
        const mi = currentSrcY * srcW + (srcX + ix)
        const alpha = mask[mi]

        if (alpha === 0) {
          continue
        }

        const di = dstStart + (ix * 4)
        const si = srcStart + (ix * 4)

        if (maskType === MaskType.BINARY || alpha === 255) {
          dstData[di] = srcData[si]
          dstData[di + 1] = srcData[si + 1]
          dstData[di + 2] = srcData[si + 2]
          dstData[di + 3] = srcData[si + 3]
        } else {
          const a = alpha / 255
          const invA = 1 - a

          dstData[di] = srcData[si] * a + dstData[di] * invA
          dstData[di + 1] = srcData[si + 1] * a + dstData[di + 1] * invA
          dstData[di + 2] = srcData[si + 2] * a + dstData[di + 2] * invA
          dstData[di + 3] = srcData[si + 3] * a + dstData[di + 3] * invA
        }
      }
    } else {
      const byteLen = copyW * 4
      const sub = srcData.subarray(srcStart, srcStart + byteLen)
      dstData.set(sub, dstStart)
    }
  }
}
