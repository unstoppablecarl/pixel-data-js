export type ReusableImageData = ReturnType<typeof makeReusableImageData>

/**
 * Creates a factory function that manages a single, reusable ImageData instance.
 * This is used to minimize garbage collection overhead by recycling the
 * underlying pixel buffer across multiple operations.
 * @returns A function that takes width and height and returns a pooled ImageData instance.
 */
export function makeReusableImageData() {
  let imageData: ImageData | null = null

  /**
   * Retrieves an ImageData instance of the requested dimensions.
   * If the requested dimensions differ from the cached instance, a new one is allocated.
   * @param width - The desired width in pixels.
   * @param height - The desired height in pixels.
   * @returns The cached or newly allocated ImageData object.
   */
  return function getReusableImageData(width: number, height: number) {
    const hasInstance = !!imageData
    const widthMatches = hasInstance && imageData!.width === width
    const heightMatches = hasInstance && imageData!.height === height

    if (!widthMatches || !heightMatches) {
      imageData = new ImageData(width, height)
    }

    return imageData!
  }
}
