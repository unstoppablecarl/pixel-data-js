import type { RGBA } from '../types'

export function getImageDataPixelAsRGBA(imageData: ImageData, x: number, y: number): RGBA {
  const index = (y * imageData.width + x) * 4

  return {
    r: imageData.data[index]!,
    g: imageData.data[index + 1]!,
    b: imageData.data[index + 2]!,
    a: imageData.data[index + 3]!,
  }
}

export function setImageDataPixelRGBA(imageData: ImageData, x: number, y: number, { r, g, b, a }: RGBA) {
  const index = (y * imageData.width + x) * 4
  imageData.data[index] = r
  imageData.data[index + 1] = g
  imageData.data[index + 2] = b
  imageData.data[index + 3] = a
}
