import { PixelData } from '../../src'

export function uInt32ArrayToPixelData(
  data: Uint32Array,
  width: number,
  height: number,
): PixelData {
  const buffer = data.buffer as ArrayBuffer
  const byteOffset = data.byteOffset
  const byteLength = data.byteLength
  const clampedArray = new Uint8ClampedArray(buffer, byteOffset, byteLength)
  const imageData = new ImageData(clampedArray, width, height)

  return new PixelData(imageData)
}
