import { type BinaryMaskRect, type Color32, MaskType, type PixelData, type Rect } from '../_types'
import { colorDistance } from '../color'
import { extractImageDataBuffer } from '../ImageData/extractImageDataBuffer'
import { trimMaskRectBounds } from '../Rect/trimMaskRectBounds'

export type FloodFillResult = BinaryMaskRect & {
  startX: number
  startY: number
  pixels: Uint8ClampedArray
}

/**
 * Performs a color-based flood fill selection {@link PixelData}.
 * This utility identifies pixels starting from a specific coordinate that fall within a
 * color tolerance. It can operate in "contiguous" mode (classic bucket fill) or
 * "non-contiguous" mode (selects all matching pixels in the buffer).
 *
 * @param target - The source image data to process.
 * @param startX - The starting horizontal coordinate.
 * @param startY - The starting vertical coordinate.
 * @param contiguous - If true, only connected pixels are
 * selected. If false, all pixels within tolerance are selected regardless of position.
 * @param tolerance - The maximum allowed difference in color
 * distance (0-255) for a pixel to be included.
 * @param bounds - Optional bounding box to restrict the search area.
 * @param out output object
 * @returns A {@link FloodFillResult} containing the mask and bounds of the selection,
 * or `null` if the starting coordinates are out of bounds.
 *
 * @example
 * ```typescript
 * const result = floodFillImageDataSelection(
 * ctx.getImageData(0, 0, 100, 100),
 * 50,
 * 50,
 * {
 * tolerance: 20,
 * contiguous: true
 * }
 * );
 * ```
 */
export function floodFillSelection(
  target: PixelData,
  startX: number,
  startY: number,
  contiguous = true,
  tolerance = 0,
  bounds?: Rect,
  out?: FloodFillResult,
): FloodFillResult | null {

  const data32 = target.data
  const width = target.w
  const height = target.h

  const lx = bounds?.x ?? 0
  const ly = bounds?.y ?? 0
  const lw = bounds?.w ?? width
  const lh = bounds?.h ?? height

  const xMin = Math.max(0, lx)
  const xMax = Math.min(width - 1, lx + lw - 1)
  const yMin = Math.max(0, ly)
  const yMax = Math.min(height - 1, ly + lh - 1)

  if (startX < xMin || startX > xMax || startY < yMin || startY > yMax) {
    return null
  }
  out = out ?? {} as FloodFillResult

  const baseColor = data32[startY * width + startX] as Color32

  let matchCount = 0
  const matchX = new Uint16Array(width * height)
  const matchY = new Uint16Array(width * height)

  let minX = startX
  let maxX = startX
  let minY = startY
  let maxY = startY

  if (contiguous) {
    const visited = new Uint8Array(width * height)
    const stack = new Uint32Array(width * height)
    let stackPtr = 0

    stack[stackPtr++] = (startY << 16) | startX
    visited[startY * width + startX] = 1

    while (stackPtr > 0) {
      const val = stack[--stackPtr]
      const x = val & 0xFFFF
      const y = val >>> 16

      matchX[matchCount] = x
      matchY[matchCount] = y
      matchCount++

      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y

      // Right
      if (x + 1 <= xMax) {
        const idx = y * width + (x + 1)
        if (!visited[idx] && colorDistance(data32[idx] as Color32, baseColor) <= tolerance) {
          visited[idx] = 1
          stack[stackPtr++] = (y << 16) | (x + 1)
        }
      }
      // Left
      if (x - 1 >= xMin) {
        const idx = y * width + (x - 1)
        if (!visited[idx] && colorDistance(data32[idx] as Color32, baseColor) <= tolerance) {
          visited[idx] = 1
          stack[stackPtr++] = (y << 16) | (x - 1)
        }
      }
      // Down
      if (y + 1 <= yMax) {
        const idx = (y + 1) * width + x
        if (!visited[idx] && colorDistance(data32[idx] as Color32, baseColor) <= tolerance) {
          visited[idx] = 1
          stack[stackPtr++] = ((y + 1) << 16) | x
        }
      }
      // Up
      if (y - 1 >= yMin) {
        const idx = (y - 1) * width + x
        if (!visited[idx] && colorDistance(data32[idx] as Color32, baseColor) <= tolerance) {
          visited[idx] = 1
          stack[stackPtr++] = ((y - 1) << 16) | x
        }
      }
    }
  } else {
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const color = data32[y * width + x] as Color32
        if (colorDistance(color, baseColor) <= tolerance) {
          matchX[matchCount] = x
          matchY[matchCount] = y
          matchCount++

          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
  }

  if (matchCount === 0) return null

  const w = maxX - minX + 1
  const h = maxY - minY + 1

  out.startX = startX
  out.startY = startY
  out.x = minX
  out.y = minY
  out.w = w
  out.h = h
  out.data = new Uint8Array(w * h)
  out.type = MaskType.BINARY

  const finalMask = out.data

  for (let i = 0; i < matchCount; i++) {
    const mx = matchX[i] - minX
    const my = matchY[i] - minY

    if (mx >= 0 && mx < w && my >= 0 && my < h) {
      finalMask[my * w + mx] = 1
    }
  }

  trimMaskRectBounds(
    out,
    { x: 0, y: 0, w: width, h: height },
  )

  out.pixels = extractImageDataBuffer(
    target.imageData,
    out.x,
    out.y,
    out.w,
    out.h,
  )

  return out
}
