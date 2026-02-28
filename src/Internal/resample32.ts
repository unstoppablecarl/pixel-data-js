const resample32Scratch = {
  data: null as null | Int32Array,
  width: 0,
  height: 0,
}

type Resample32Result = { data: Int32Array; width: number; height: number }

export function resample32(
  srcData32: Uint32Array | Int32Array,
  srcW: number,
  srcH: number,
  factor: number,
): Resample32Result {
  const dstW = Math.max(1, (srcW * factor) | 0)
  const dstH = Math.max(1, (srcH * factor) | 0)
  const dstData = new Int32Array(dstW * dstH)

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

  resample32Scratch.data = dstData
  resample32Scratch.width = dstW
  resample32Scratch.height = dstH

  return resample32Scratch as Resample32Result
}
