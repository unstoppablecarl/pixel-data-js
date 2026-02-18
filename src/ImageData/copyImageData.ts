import type { ImageDataLike } from '../_types'

export function copyImageData({ data, width, height }: ImageDataLike): ImageData {
  return new ImageData(data.slice(), width, height)
}

export function copyImageDataLike({ data, width, height }: ImageDataLike): ImageDataLike {
  return {
    data: data.slice(),
    width,
    height,
  }
}
