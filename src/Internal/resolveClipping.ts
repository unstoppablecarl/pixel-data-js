export type ClippedRect = {
  x: number
  y: number
  w: number
  h: number
  inBounds: boolean
}

export type ClippedBlit = {
  x: number
  y: number
  sx: number
  sy: number
  w: number
  h: number
  inBounds: boolean
}

// use factory functions when creating reusable objects ensure property order for JIT perf
export const makeClippedRect = (): ClippedRect => ({
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  inBounds: false,
})

export const makeClippedBlit = (): ClippedBlit => ({
  x: 0,
  y: 0,
  sx: 0,
  sy: 0,
  w: 0,
  h: 0,
  inBounds: false,
})

/**
 * Calculates the intersection of a target rectangle and a bounding box (usually 0,0 -> width,height).
 * Handles negative offsets by shrinking dimensions.
 */
export function resolveRectClipping(
  x: number,
  y: number,
  w: number,
  h: number,
  boundaryW: number,
  boundaryH: number,
  out: ClippedRect,
): ClippedRect {
  // Destination Clipping (Top/Left)
  if (x < 0) {
    w += x
    x = 0
  }
  if (y < 0) {
    h += y
    y = 0
  }

  // Destination Clipping (Bottom/Right)
  const actualW = Math.min(w, boundaryW - x)
  const actualH = Math.min(h, boundaryH - y)

  if (actualW <= 0 || actualH <= 0) {
    out.inBounds = false
    return out
  }

  out.x = x
  out.y = y
  out.w = actualW
  out.h = actualH
  out.inBounds = true

  return out
}

/**
 * Calculates the clipping for transferring data from a Source to a Destination.
 * Handles cases where the source is out of bounds (shifting the destination target)
 * AND cases where the destination is out of bounds (shifting the source target).
 */
export function resolveBlitClipping(
  x: number,
  y: number,
  sx: number,
  sy: number,
  w: number,
  h: number,
  dstW: number,
  dstH: number,
  srcW: number,
  srcH: number,
  out: ClippedBlit,
): ClippedBlit {
  // 1. Source Clipping: If reading from negative source, shift target right and shrink
  if (sx < 0) {
    x -= sx
    w += sx
    sx = 0
  }
  if (sy < 0) {
    y -= sy
    h += sy
    sy = 0
  }
  w = Math.min(w, srcW - sx)
  h = Math.min(h, srcH - sy)

  // 2. Destination Clipping: If writing to negative dest, shift source right and shrink
  if (x < 0) {
    sx -= x
    w += x
    x = 0
  }
  if (y < 0) {
    sy -= y
    h += y
    y = 0
  }

  const actualW = Math.min(w, dstW - x)
  const actualH = Math.min(h, dstH - y)

  if (actualW <= 0 || actualH <= 0) {
    out.inBounds = false
    return out
  }

  out.x = x
  out.y = y
  out.sx = sx
  out.sy = sy
  out.w = actualW
  out.h = actualH
  out.inBounds = true

  return out
}
