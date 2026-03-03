import type { Color32 } from '../_types'

/**
 * Represents an image using a palette-based indexing system.
 * Instead of storing 4 bytes (RGBA) per pixel, this class stores a single index
 * into a color palette. This format is optimized for memory efficiency and
 * high-speed pattern matching or recoloring operations.
 */
export class IndexedImage {
  /** The width of the image in pixels. */
  public readonly width: number
  /** The height of the image in pixels. */
  public readonly height: number
  /** Flat array of palette indices. Index = x + (y * width). */
  public readonly data: Int32Array
  /** The palette of unique 32-bit colors (ABGR/RGBA packed) found in the image. */
  public readonly palette: Uint32Array
  /** The specific index in the palette reserved for fully transparent pixels. */
  public readonly transparentPalletIndex: number

  /**
   * @param width - Image width.
   * @param height - Image height.
   * @param data - The indexed pixel data.
   * @param palette - The array of packed colors.
   * @param transparentPalletIndex - The index representing alpha 0.
   */
  constructor(
    width: number,
    height: number,
    data: Int32Array,
    palette: Uint32Array,
    transparentPalletIndex: number,
  ) {
    this.width = width
    this.height = height
    this.data = data
    this.palette = palette
    this.transparentPalletIndex = transparentPalletIndex
  }

  /**
   * Creates an IndexedImage from standard browser ImageData.
   * @param imageData - The source ImageData to convert.
   * @returns A new IndexedImage instance.
   */
  static fromImageData(imageData: ImageData): IndexedImage {
    return IndexedImage.fromRaw(imageData.data, imageData.width, imageData.height)
  }

  /**
   * Creates an IndexedImage from a raw byte buffer and dimensions.
   * Any pixel with an alpha channel of 0 is normalized to the transparent palette index.
   * @param data - Raw RGBA byte data.
   * @param width - Image width.
   * @param height - Image height.
   * @returns A new IndexedImage instance.
   */
  static fromRaw(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): IndexedImage {
    const buffer = data.buffer
    const rawData = new Uint32Array(buffer)
    const indexedData = new Int32Array(rawData.length)
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

    return new IndexedImage(
      width,
      height,
      indexedData,
      palette,
      transparentPalletIndex,
    )
  }

  /**
   * Retrieves the 32-bit packed color value at the given coordinates.
   * @param x - X coordinate.
   * @param y - Y coordinate.
   * @returns The packed color from the palette.
   */
  public getColorAt(x: number, y: number): Color32 {
    const index = x + y * this.width
    const paletteIndex = this.data[index]

    return this.palette[paletteIndex] as Color32
  }
}
