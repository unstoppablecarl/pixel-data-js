import type { PixelData } from '../_types'
import { setPixelData } from './PixelData'

export type ReusablePixelData = ReturnType<typeof makeReusablePixelData>

/**
 * Creates a factory function that manages a single, reusable PixelData instance.
 * This is used to minimize garbage collection overhead by recycling the
 * underlying pixel buffer across multiple operations.
 * @returns A function that takes width and height and returns a pooled PixelData instance.
 */
export function makeReusablePixelData() {
  const pixelData = {
    w: 0,
    h: 0,
    data: null as unknown as Uint32Array,
    imageData: null as unknown as ImageData,
  }

  /**
   * Retrieves a PixelData instance of the requested dimensions.
   * If the requested dimensions differ from the cached instance, a new one is allocated.
   * @param width - The desired width in pixels.
   * @param height - The desired height in pixels.
   * @returns The cached PixelData object.
   */
  return function getReusablePixelData(width: number, height: number): PixelData {
    if (pixelData.w !== width || pixelData.h !== height) {
      setPixelData(pixelData, new ImageData(width, height))
    } else {
      pixelData.data.fill(0)
    }

    return pixelData
  }
}
