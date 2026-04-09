import type { ImageDataLike } from './_ImageData-types'

export function copyImageData(source: ImageDataLike): ImageData {
  const dataCopy = new Uint8ClampedArray(source.data)

  return new ImageData(dataCopy, source.width, source.height)
}

export function copyImageDataLike({ data, width, height }: ImageDataLike): ImageDataLike {
  return {
    data: data.slice(),
    width,
    height,
  }
}
