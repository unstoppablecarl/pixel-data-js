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
/**
 * Converts standard ImageData into an IndexedImage format.
 */
export function makeIndexedImage(imageData: ImageData): IndexedImage {
  const width = imageData.width
  const height = imageData.height

  // Use a 32-bit view to read pixels as packed integers (usually ABGR or RGBA)
  const rawData = new Uint32Array(imageData.data.buffer)
  const indexedData = new Int32Array(rawData.length)
  const colorMap = new Map<number, number>()

  const transparentColor = 0
  const transparentPalletIndex = 0

  // Initialize palette with normalized transparent color
  colorMap.set(transparentColor, transparentPalletIndex)

  for (let i = 0; i < rawData.length; i++) {
    const pixel = rawData[i]!

    // Check if the pixel is fully transparent
    const alpha = (pixel >>> 24) & 0xFF
    const isTransparent = alpha === 0
    const colorKey = isTransparent ? transparentColor : pixel

    let id = colorMap.get(colorKey)

    if (id === undefined) {
      // Use the current length as the next ID to ensure sequence
      id = colorMap.size
      colorMap.set(colorKey, id)
    }

    indexedData[i] = id
  }

  const palette = new Uint32Array(colorMap.keys())
  return {
    width,
    height,
    data: indexedData,
    transparentPalletIndex,
    palette,
  }
}
