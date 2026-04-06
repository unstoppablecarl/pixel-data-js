import type { MutablePixelData32, PixelData32 } from '../_types'

export function resampleUint32Array<T extends PixelData32, M extends MutablePixelData32>(
  srcData32: Uint32Array,
  srcW: number,
  srcH: number,
  factor: number,
  out?: M,
): T {
  const dstW = Math.max(1, (srcW * factor) | 0)
  const dstH = Math.max(1, (srcH * factor) | 0)
  const dstData = new Uint32Array(dstW * dstH)

  // Use the reciprocal to map back precisely
  const scaleX = srcW / dstW
  const scaleY = srcH / dstH

  for (let y = 0; y < dstH; y++) {
    const srcY = Math.min(srcH - 1, (y * scaleY) | 0)
    const srcRowOffset = srcY * srcW
    const dstRowOffset = y * dstW

    for (let x = 0; x < dstW; x++) {
      const srcX = Math.min(srcW - 1, (x * scaleX) | 0)

      dstData[dstRowOffset + x] = srcData32[srcRowOffset + srcX]!
    }
  }

  out = out ?? {} as M
  out.data = dstData
  out.w = dstW
  out.h = dstH

  return out as unknown as T
}
