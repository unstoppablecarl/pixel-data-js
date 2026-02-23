/**
 * Compressed data format for image processing optimization.
 * Representing an image as a grid of palette indices rather than raw RGBA values
 * significantly reduces memory overhead and optimizes pattern matching logic.
 */
export type IndexedImage = {
  /** The width of the image in pixels. */
  width: number,
  /** The height of the image in pixels. */
  height: number,
  /**
   *  A flat array of indices where each value points to a color in the palette.
   * Accessible via the formula: `index = x + (y * width)`.
   */
  data: Int32Array,
  /**
   * A flattened Uint8Array of RGBA values.
   * Every 4 bytes represent one color: `[r, g, b, a]`.
   */
  palette: Uint8Array,
  /**
   * The specific index in the palette that represents a fully transparent pixel.
   * All pixels with an alpha value of 0 are normalized to this index.
   */
  transparentPalletIndex: number,
}

/**
 * Converts standard ImageData into an IndexedImage format.
 * This process normalizes all transparent pixels into a single palette entry
 * and maps all unique RGBA colors to sequential integer IDs.
 * @param imageData - The raw ImageData from a canvas or image source.
 * @returns An IndexedImage object containing the index grid and color palette.
 */
export function makeIndexedImage(imageData: ImageData): IndexedImage {
  const width = imageData.width
  const height = imageData.height
  const rawData = imageData.data
  const indexedData = new Int32Array(rawData.length / 4)
  const colorMap = new Map<string, number>()
  const tempPalette: number[] = []

  const transparentKey = '0,0,0,0'
  const transparentPalletIndex = 0

  // Initialize palette with normalized transparent color at index 0
  colorMap.set(transparentKey, transparentPalletIndex)
  tempPalette.push(0)
  tempPalette.push(0)
  tempPalette.push(0)
  tempPalette.push(0)

  for (let i = 0; i < indexedData.length; i++) {
    const r = rawData[i * 4]!
    const g = rawData[i * 4 + 1]!
    const b = rawData[i * 4 + 2]!
    const a = rawData[i * 4 + 3]!

    let key: string
    if (a === 0) {
      key = transparentKey
    } else {
      key = `${r},${g},${b},${a}`
    }

    let id = colorMap.get(key)

    if (id === undefined) {
      id = colorMap.size
      tempPalette.push(r)
      tempPalette.push(g)
      tempPalette.push(b)
      tempPalette.push(a)
      colorMap.set(key, id)
    }

    indexedData[i] = id
  }

  const palette = new Uint8Array(tempPalette)

  return {
    width,
    height,
    data: indexedData,
    transparentPalletIndex,
    palette,
  }
}
