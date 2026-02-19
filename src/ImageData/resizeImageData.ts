/** Non destructively resize an ImageData object */
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
