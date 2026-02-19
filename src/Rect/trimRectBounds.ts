import type { Rect, SelectionRect } from '../_types'
import { extractMask } from '../Mask/extractMask'

/**
 * Intersects a target rectangle with a boundary, trimming dimensions and masks in-place.
 * This utility calculates the axis-aligned intersection between the `target` and `bounds`.
 * If the `target` includes a `mask` (as in a `SelectionRect`), the mask is physically
 * cropped and re-aligned using `extractMask` to match the new dimensions.
 * @param target - The rectangle or selection object to be trimmed. **Note:** This object is mutated in-place.
 * @param bounds - The boundary rectangle defining the maximum allowable area (e.g., canvas dimensions).
 * @example
 * const selection = { x: -10, y: -10, w: 50, h: 50, mask: new Uint8Array(2500) };
 * const canvas = { x: 0, y: 0, w: 100, h: 100 };
 * // Selection will be moved to (0,0) and resized to 40x40.
 * // The mask will be cropped by 10px on the top and left.
 * trimRectBounds(selection, canvas);
 */
export function trimRectBounds<T extends Rect | SelectionRect>(
  target: T,
  bounds: Rect,
): void {
  const originalX = target.x
  const originalY = target.y
  const originalW = target.w

  const intersectedX = Math.max(
    target.x,
    bounds.x,
  )
  const intersectedY = Math.max(
    target.y,
    bounds.y,
  )

  const intersectedMaxX = Math.min(
    target.x + target.w,
    bounds.x + bounds.w,
  )
  const intersectedMaxY = Math.min(
    target.y + target.h,
    bounds.y + bounds.h,
  )

  // Early return if there is no physical intersection
  if (intersectedMaxX <= intersectedX || intersectedMaxY <= intersectedY) {
    target.w = 0
    target.h = 0

    if ('mask' in target && target.mask) {
      target.mask = new Uint8Array(0)
    }

    return
  }

  const intersectedW = Math.max(
    0,
    intersectedMaxX - intersectedX,
  )
  const intersectedH = Math.max(
    0,
    intersectedMaxY - intersectedY,
  )

  // Calculate where the new top-left is relative to the old top-left
  const offsetX = intersectedX - originalX
  const offsetY = intersectedY - originalY

  target.x = intersectedX
  target.y = intersectedY
  target.w = intersectedW
  target.h = intersectedH

  if ('mask' in target && target.mask) {
    target.mask = extractMask(
      target.mask,
      originalW,
      offsetX,
      offsetY,
      intersectedW,
      intersectedH,
    )
  }
}
