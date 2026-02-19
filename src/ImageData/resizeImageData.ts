/**
 * Non destructively resizes the {@link ImageData} buffer to new dimensions, optionally
 * offsetting the original content.
 * This operation creates a new buffer. It does not scale or stretch pixels;
 * instead, it crops or pads the image based on the new dimensions and
 * provides an offset for repositioning.
 *
 * @param current The source {@link ImageData} to resize.
 * @param newWidth The target width in pixels.
 * @param newHeight The target height in pixels.
 * @param offsetX The horizontal offset for placing the
 * original image within the new buffer.
 * @default 0
 * @param offsetY The vertical offset for placing the
 * original image within the new buffer.
 * @default 0
 *
 * @returns A new {@link ImageData} instance with the specified dimensions.
 *
 * @example
 * ```typescript
 * // Centers an 80x80 image in a new 100x100 buffer
 * const resized = resizeImageData(
 *   originalData,
 *   100,
 *   100,
 *   10,
 *   10
 * );
 * ```
 */
export function resizeImageData(
  current: ImageData,
  newWidth: number,
  newHeight: number,
  offsetX = 0,
  offsetY = 0,
): ImageData {
  const result = new ImageData(newWidth, newHeight)
  const {
    width: oldW,
    height: oldH,
    data: oldData,
  } = current
  const newData = result.data

  // Determine intersection of the old image (at offset) and new canvas bounds
  const x0 = Math.max(0, offsetX)
  const y0 = Math.max(0, offsetY)
  const x1 = Math.min(newWidth, offsetX + oldW)
  const y1 = Math.min(newHeight, offsetY + oldH)

  if (x1 <= x0 || y1 <= y0) {
    return result
  }

  const rowCount = y1 - y0
  const rowLen = (x1 - x0) * 4

  for (let row = 0; row < rowCount; row++) {
    const dstY = y0 + row
    const srcY = dstY - offsetY
    const srcX = x0 - offsetX

    const dstStart = (dstY * newWidth + x0) * 4
    const srcStart = (srcY * oldW + srcX) * 4

    newData.set(
      oldData.subarray(srcStart, srcStart + rowLen),
      dstStart,
    )
  }

  return result
}
