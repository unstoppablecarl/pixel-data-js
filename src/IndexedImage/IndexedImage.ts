import type { Color32 } from '../Color/_color-types'
import type { IndexedImage } from './_indexedImage-types'

export function makeIndexedImage(
  width: number,
  height: number,
  data: Uint32Array,
  palette: Uint32Array,
  transparentPalletIndex: number,
): IndexedImage {
  return {
    w: width,
    h: height,
    data,
    palette,
    transparentPalletIndex,
  }
}

export function makeIndexedImageFromImageDataRaw(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): IndexedImage {
  const buffer = data.buffer
  const rawData = new Uint32Array(buffer)
  const indexedData = new Uint32Array(rawData.length)
  const colorMap = new Map<number, number>()
  const transparentColor = 0
  const transparentPalletIndex = 0

  // Initialize palette with normalized transparent color
  colorMap.set(transparentColor, transparentPalletIndex)

  for (let i = 0; i < rawData.length; i++) {
    const pixel = rawData[i] as number
    const alpha = (pixel >>> 24) & 0xFF
    const isTransparent = alpha === 0
    const colorKey = isTransparent ? transparentColor : (pixel >>> 0)

    let id = colorMap.get(colorKey)

    if (id === undefined) {
      id = colorMap.size
      colorMap.set(colorKey, id)
    }

    indexedData[i] = id
  }

  const palette = Uint32Array.from(colorMap.keys())

  return makeIndexedImage(
    width,
    height,
    indexedData,
    palette,
    transparentPalletIndex,
  )
}

export function makeIndexedImageFromImageData(imageData: ImageData): IndexedImage {
  return makeIndexedImageFromImageDataRaw(imageData.data, imageData.width, imageData.height)
}

export function getIndexedImageColor(target: IndexedImage, x: number, y: number): Color32 {
  const index = x + y * target.w
  const paletteIndex = target.data[index]

  return target.palette[paletteIndex] as Color32
}
