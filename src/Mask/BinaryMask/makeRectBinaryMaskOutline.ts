
import { type BinaryMask, MaskType } from '../_mask-types'

export function makeRectBinaryMaskOutline(
  w: number,
  h: number,
  scale = 1,
): BinaryMask {
  const rw = w * scale
  const rh = h * scale

  const outW = rw + 2
  const outH = rh + 2
  const outData = new Uint8Array(outW * outH)

  // Top edge
  outData.fill(1, 0, outW)

  // Bottom edge
  outData.fill(1, (outH - 1) * outW, outH * outW)

  // Left and Right edges
  for (let iy = 1; iy < outH - 1; iy++) {
    const rowStart = iy * outW
    outData[rowStart] = 1
    outData[rowStart + outW - 1] = 1
  }

  return {
    type: MaskType.BINARY,
    w: outW,
    h: outH,
    data: outData,
  }
}
