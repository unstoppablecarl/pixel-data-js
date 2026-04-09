import type { Rect } from '../Rect/_rect-types'
import type { ImageDataLike } from './_ImageData-types'
import { extractImageDataBuffer } from './extractImageDataBuffer'

/**
 * Extracts a specific rectangular region of pixels from a larger {@link ImageDataLike}
 * source into a new {@link Uint8ClampedArray}.
 *
 * This is a "read-only" operation that returns a copy of the pixel data.
 *
 * @param imageData - The source image data to read from.
 * @param rect - A rect defining the region to extract.
 * @returns A buffer containing the RGBA pixel data of the region.
 */
export function extractImageData(
  imageData: ImageDataLike,
  rect: Rect,
): ImageData | null
/**
 * @param imageData - The source image data to read from.
 * @param x - The starting horizontal coordinate.
 * @param y - The starting vertical coordinate.
 * @param w - The width of the region to extract.
 * @param h - The height of the region to extract.
 * @returns A buffer containing the RGBA pixel data of the region.
 */
export function extractImageData(
  imageData: ImageDataLike,
  x: number,
  y: number,
  w: number,
  h: number,
): ImageData | null
export function extractImageData(
  imageData: ImageDataLike,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): ImageData | null {
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : { x: _x, y: _y!, w: _w!, h: _h! }

  if (w <= 0) return null
  if (h <= 0) return null

  const result = new ImageData(w, h)

  const buffer = extractImageDataBuffer(imageData, x, y, w, h)
  result.data.set(buffer)

  return result

}
