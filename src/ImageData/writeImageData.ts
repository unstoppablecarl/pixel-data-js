/**
 * Writes image data from a source to a target.
 *
 * @param target - The destination ImageData to write to.
 * @param source - The source ImageData to read from.
 * @param x - The x-coordinate in the target where drawing starts.
 * @param y - The y-coordinate in the target where drawing starts.
 */
export function writeImageData(
  target: ImageData,
  source: ImageData,
  x = 0,
  y = 0,
): void {
  const dstW = target.width
  const dstH = target.height
  const dst = target.data

  const srcW = source.width
  const srcH = source.height
  const src = source.data

  let dstX = x
  let dstY = y
  let srcX = 0
  let srcY = 0
  let copyW = srcW
  let copyH = srcH

  if (dstX < 0) {
    srcX = -dstX
    copyW += dstX
    dstX = 0
  }

  if (dstY < 0) {
    srcY = -dstY
    copyH += dstY
    dstY = 0
  }

  copyW = Math.min(copyW, dstW - dstX)
  copyH = Math.min(copyH, dstH - dstY)

  if (copyW <= 0 || copyH <= 0) return

  const isDstAligned = dst.byteOffset % 4 === 0
  const isSrcAligned = src.byteOffset % 4 === 0

  if (isDstAligned && isSrcAligned) {
    const dstLen32 = dst.byteLength / 4
    const dst32 = new Uint32Array(dst.buffer, dst.byteOffset, dstLen32)

    const srcLen32 = src.byteLength / 4
    const src32 = new Uint32Array(src.buffer, src.byteOffset, srcLen32)

    for (let row = 0; row < copyH; row++) {
      const dstStart = (dstY + row) * dstW + dstX
      const srcStart = (srcY + row) * srcW + srcX
      const chunk = src32.subarray(srcStart, srcStart + copyW)

      dst32.set(chunk, dstStart)
    }
  } else {
    const rowLen = copyW * 4

    for (let row = 0; row < copyH; row++) {
      const dstStart = ((dstY + row) * dstW + dstX) * 4
      const srcStart = ((srcY + row) * srcW + srcX) * 4
      const chunk = src.subarray(srcStart, srcStart + rowLen)

      dst.set(chunk, dstStart)
    }
  }
}
