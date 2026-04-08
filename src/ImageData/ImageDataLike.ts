import type { ImageDataLike } from './_ImageData-types'

export function makeImageDataLike(width: number, height: number, data?: Buffer): ImageDataLike {
  const size = width * height * 4
  const buffer = data
    ? new Uint8ClampedArray(data.buffer, data.byteOffset, size)
    : new Uint8ClampedArray(size)
  return {
    width,
    height,
    data: buffer,
  }
}
