import type { ImageDataLike } from '../_types'

export function uInt32ArrayToImageData(
  data: Uint32Array,
  width: number,
  height: number,
): ImageData {
  const buffer = data.buffer as ArrayBuffer
  const byteOffset = data.byteOffset
  const byteLength = data.byteLength
  const clampedArray = new Uint8ClampedArray(buffer, byteOffset, byteLength)
  return new ImageData(clampedArray, width, height)
}

export function uInt32ArrayToImageDataLike(
  data: Uint32Array,
  width: number,
  height: number,
): ImageDataLike {
  const buffer = data.buffer
  const byteOffset = data.byteOffset
  const byteLength = data.byteLength
  const clampedArray = new Uint8ClampedArray(buffer, byteOffset, byteLength)
  return {
    width,
    height,
    data: clampedArray,
  }
}
