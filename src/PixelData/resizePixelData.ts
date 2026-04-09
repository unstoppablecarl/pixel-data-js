import type { MutablePixelData32, PixelData32 } from './_pixelData-types'

/**
 * Non-destructively resizes the {@link PixelData32} buffer to new dimensions, optionally
 * offsetting the original content.
 * This operation creates a new buffer. It does not scale or stretch pixels;
 * instead, it crops or pads the image based on the new dimensions.
 *
 * @param target - The source pixel data to resize.
 * @param newWidth - The target width in pixels.
 * @param newHeight - The target height in pixels.
 * @param offsetX - The horizontal offset for placing the original image.
 * @param offsetY - The vertical offset for placing the original image.
 * @param out - output object
 * @returns A new {@link PixelData32} object with the specified dimensions.
 */
export function resizePixelData(
  target: PixelData32,
  newWidth: number,
  newHeight: number,
  offsetX = 0,
  offsetY = 0,
  out?: MutablePixelData32,
): PixelData32 {
  const newData = new Uint32Array(newWidth * newHeight)
  const {
    w: oldW,
    h: oldH,
    data: oldData,
  } = target

  const result = out ?? {} as MutablePixelData32
  result.w = newWidth
  result.h = newHeight
  result.data = newData

  // Determine intersection of the old image (at offset) and new canvas bounds
  const x0 = Math.max(0, offsetX)
  const y0 = Math.max(0, offsetY)
  const x1 = Math.min(newWidth, offsetX + oldW)
  const y1 = Math.min(newHeight, offsetY + oldH)

  if (x1 <= x0 || y1 <= y0) {
    return result
  }

  const copyW = x1 - x0
  const copyH = y1 - y0

  // Optimization: If we are copying the full width of both buffers,
  // we can perform a single bulk 1D copy.
  if (copyW === oldW && copyW === newWidth && offsetX === 0) {
    const srcStart = (y0 - offsetY) * oldW
    const dstStart = y0 * newWidth
    const len = copyW * copyH

    newData.set(oldData.subarray(srcStart, srcStart + len), dstStart)
    return result
  }

  // Standard row-by-row copy
  for (let row = 0; row < copyH; row++) {
    const dstY = y0 + row
    const srcY = dstY - offsetY
    const srcX = x0 - offsetX

    const dstStart = dstY * newWidth + x0
    const srcStart = srcY * oldW + srcX
    const chunk = oldData.subarray(srcStart, srcStart + copyW)

    newData.set(chunk, dstStart)
  }

  return result
}
