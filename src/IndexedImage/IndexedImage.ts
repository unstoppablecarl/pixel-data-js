/**
 * Compressed data format for image processing optimization.
 * Representing an image as a grid of palette indices rather than raw RGBA values
 * significantly reduces memory overhead and optimizes pattern matching logic.
 */
export type IndexedImage = {
  /** The width of the image in pixels. */
  width: number;
  /** The height of the image in pixels. */
  height: number;
  /**
   * A flat array of indices where each value points to a color in the palette.
   * Accessible via the formula: `index = x + (y * width)`.
   */
  data: Int32Array;
  /**
   * A palette of packed 32-bit colors (ABGR).
   */
  palette: Uint32Array;
  /**
   * The specific index in the palette that represents a fully transparent pixel.
   */
  transparentPalletIndex: number;
};

/**
 * Converts standard ImageData into an IndexedImage format.
 */
export function makeIndexedImage(imageData: ImageData): IndexedImage;
export function makeIndexedImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): IndexedImage;
export function makeIndexedImage(
  imageOrData: ImageData | Uint8ClampedArray,
  width?: number,
  height?: number,
): IndexedImage {
  const isImageData = 'width' in imageOrData
  const actualWidth = isImageData ? imageOrData.width : (width as number)
  const actualHeight = isImageData ? imageOrData.height : (height as number)
  const buffer = isImageData ? imageOrData.data.buffer : imageOrData.buffer

  // Use a 32-bit view to read pixels as packed integers (unsigned)
  const rawData = new Uint32Array(buffer)
  const indexedData = new Int32Array(rawData.length)
  const colorMap = new Map<number, number>()

  const transparentColor = 0
  const transparentPalletIndex = 0

  // Initialize palette with normalized transparent color
  colorMap.set(transparentColor, transparentPalletIndex)

  for (let i = 0; i < rawData.length; i++) {
    const pixel = rawData[i]!

    // Check if the pixel is fully transparent (Alpha channel is highest byte)
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

  return {
    width: actualWidth,
    height: actualHeight,
    data: indexedData,
    transparentPalletIndex,
    palette,
  }
}
