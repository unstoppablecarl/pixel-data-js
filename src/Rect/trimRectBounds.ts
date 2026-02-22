import type { Rect, SelectionRect } from '../_types'
import { extractMask } from '../Mask/extractMask'

/**
 * Intersects a target rectangle with a boundary, trimming dimensions and masks in-place.
 * This utility calculates the axis-aligned intersection between the `target` and `bounds`.
 * If the `target` includes a `mask` (as in a {@link SelectionRect}), the mask is physically
 * cropped and re-aligned using `extractMask` to match the new dimensions.
 * @param target - The rectangle or selection object to be trimmed. **Note:** This object is mutated in-place.
 * @param bounds - The boundary rectangle defining the maximum allowable area (e.g., canvas dimensions).
 * @example
 * const selection = { x: -10, y: -10, w: 50, h: 50, mask: new Uint8Array(2500) };
 * const canvas = { x: 0, y: 0, w: 100, h: 100 };
 * // Selection will be moved to (0,0) and resized to 40x40.
 * // The mask is cropped by 10 px on the top and left.
 * trimRectBounds(selection, canvas);
 */
export function trimRectBounds<T extends Rect | SelectionRect>(
  target: T,
  bounds: Rect,
): void {
  const originalX = target.x
  const originalY = target.y
  const originalW = target.w

  const intersectedX = Math.max(target.x, bounds.x)
  const intersectedY = Math.max(target.y, bounds.y)

  const intersectedMaxX = Math.min(
    target.x + target.w,
    bounds.x + bounds.w,
  )
  const intersectedMaxY = Math.min(
    target.y + target.h,
    bounds.y + bounds.h,
  )

  // Intersection check
  if (intersectedMaxX <= intersectedX || intersectedMaxY <= intersectedY) {
    target.w = 0
    target.h = 0

    if ('mask' in target && target.mask) {
      // This line is now hit by the 'empty intersection' test below
      target.mask = new Uint8Array(0)
    }

    return
  }

  const intersectedW = intersectedMaxX - intersectedX
  const intersectedH = intersectedMaxY - intersectedY
  const offsetX = intersectedX - originalX
  const offsetY = intersectedY - originalY

  target.x = intersectedX
  target.y = intersectedY
  target.w = intersectedW
  target.h = intersectedH

  if ('mask' in target && target.mask) {
    const currentMask = extractMask(
      target.mask,
      originalW,
      offsetX,
      offsetY,
      intersectedW,
      intersectedH,
    )

    let minX = intersectedW
    let maxX = -1
    let minY = intersectedH
    let maxY = -1

    // Scan for content
    for (let y = 0; y < intersectedH; y++) {
      for (let x = 0; x < intersectedW; x++) {
        if (currentMask[y * intersectedW + x] !== 0) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    // If no content is found (all zeros)
    if (maxX === -1) {
      target.w = 0
      target.h = 0
      // This covers the specific line you mentioned
      target.mask = new Uint8Array(0)
      return
    }

    const finalW = maxX - minX + 1
    const finalH = maxY - minY + 1

    // Only shift and crop if the content is smaller than the intersection
    if (finalW !== intersectedW || finalH !== intersectedH) {
      target.mask = extractMask(
        currentMask,
        intersectedW,
        minX,
        minY,
        finalW,
        finalH,
      )
      target.x += minX
      target.y += minY
      target.w = finalW
      target.h = finalH
    } else {
      target.mask = currentMask
    }
  }
}
