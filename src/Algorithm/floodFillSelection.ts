import { type Color32, type ImageDataLike, MaskType, type Rect, type SelectionRect } from '../_types'
import { colorDistance } from '../color'
import { extractImageDataPixels } from '../ImageData/extractImageDataPixels'
import type { PixelData } from '../PixelData/PixelData'
import { trimRectBounds } from '../Rect/trimRectBounds'

export type FloodFillImageDataOptions = {
  contiguous?: boolean
  tolerance?: number
  bounds?: Rect
}

export type FloodFillResult = {
  startX: number
  startY: number
  selectionRect: SelectionRect
  pixels: Uint8ClampedArray
}

/**
 * Performs a color-based flood fill selection on {@link ImageData} or {@link PixelData}.
 * This utility identifies pixels starting from a specific coordinate that fall within a
 * color tolerance. It can operate in "contiguous" mode (classic bucket fill) or
 * "non-contiguous" mode (selects all matching pixels in the buffer).
 *
 * @param img - The source image data to process.
 * @param startX - The starting horizontal coordinate.
 * @param startY - The starting vertical coordinate.
 * @param options - Configuration for the fill operation.
 * @param options.contiguous - @default true. If true, only connected pixels are
 * selected. If false, all pixels within tolerance are selected regardless of position.
 * @param options.tolerance - @default 0. The maximum allowed difference in color
 * distance (0-255) for a pixel to be included.
 * @param options.bounds - Optional bounding box to restrict the search area.
 *
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
  img: ImageDataLike | PixelData,
  startX: number,
  startY: number,
  {
    contiguous = true,
    tolerance = 0,
    bounds,
  }: FloodFillImageDataOptions = {},
): FloodFillResult | null {

  let imageData: ImageDataLike
  let data32: Uint32Array
  if ('data32' in img) {
    data32 = img.data32
    imageData = img.imageData
  } else {
    data32 = new Uint32Array(
      img.data.buffer,
      img.data.byteOffset,
      img.data.byteLength >> 2,
    )
    imageData = img
  }
  const {
    width,
    height,
  } = img

  const limit = bounds || {
    x: 0,
    y: 0,
    w: width,
    h: height,
  }

  const xMin = Math.max(0, limit.x)
  const xMax = Math.min(width - 1, limit.x + limit.w - 1)
  const yMin = Math.max(0, limit.y)
  const yMax = Math.min(height - 1, limit.y + limit.h - 1)

  if (startX < xMin || startX > xMax || startY < yMin || startY > yMax) {
    return null
  }

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

  if (matchCount === 0) {
    return null
  }
  const selectionRect: SelectionRect = {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    mask: new Uint8Array((maxX - minX + 1) * (maxY - minY + 1)),
    maskType: MaskType.BINARY,
  }

  // REMOVED trimRectBounds from here

  const sw = selectionRect.w
  const sh = selectionRect.h
  const finalMask = selectionRect.mask!

  for (let i = 0; i < matchCount; i++) {
    const mx = matchX[i] - selectionRect.x
    const my = matchY[i] - selectionRect.y

    if (mx >= 0 && mx < sw && my >= 0 && my < sh) {
      finalMask[my * sw + mx] = 1
    }
  }

  // trimRectBounds can see them and work correctly.
  trimRectBounds(
    selectionRect,
    { x: 0, y: 0, w: width, h: height },
  )

  // Use the UPDATED values from the selectionRect after trimming
  const extracted = extractImageDataPixels(
    imageData,
    selectionRect.x,
    selectionRect.y,
    selectionRect.w,
    selectionRect.h,
  )

  return {
    startX,
    startY,
    selectionRect,
    pixels: extracted,
  }
}
