import type { PixelData, PixelData32, Rect } from '../_types'
import { extractPixelDataBuffer } from './extractPixelDataBuffer'
import { makePixelData } from './PixelData'

/**
 * High-level extraction that returns a new PixelData instance.
 * Leverages extractPixelDataBuffer for optimized 32-bit memory moves.
 */
export function extractPixelData(source: PixelData32, rect: Rect): PixelData
export function extractPixelData(source: PixelData32, x: number, y: number, w: number, h: number): PixelData
export function extractPixelData(
  source: PixelData32,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): PixelData {
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : { x: _x, y: _y!, w: _w!, h: _h! }

  const result = makePixelData(new ImageData(w, h))

  const buffer = extractPixelDataBuffer(source, x, y, w, h)
  result.data32.set(buffer)

  return result
}
