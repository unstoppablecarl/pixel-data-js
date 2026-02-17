import type { Color32, ImageDataLike } from '../_types'

export function makeImageDataColor32Adapter(imageData: ImageDataLike) {
  const data32 = new Uint32Array(imageData.data.buffer)

  function inBounds(x: number, y: number) {
    return x < 0 || x >= imageData.width || y < 0 || y >= imageData.height
  }

  function setPixel(
    x: number,
    y: number,
    color: Color32,
  ): void {
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return
    data32[y * imageData.width + x] = color
  }

  function getPixel(
    x: number,
    y: number,
  ): Color32 | undefined {
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return

    return data32[y * imageData.width + x] as Color32
  }

  return {
    inBounds,
    imageData,
    data32,
    setPixel,
    getPixel,
  }
}

