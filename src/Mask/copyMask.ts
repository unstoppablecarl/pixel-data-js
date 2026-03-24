/**
 * Creates a new copy of a mask.
 * Uses the underlying buffer's slice method for high-performance memory copying.
 */
export function copyMask<T extends Uint8Array>(src: T): T {
  // Uint8Array.slice() is highly optimized at the engine level
  return src.slice() as T
}
