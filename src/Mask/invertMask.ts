import type { AlphaMask, BinaryMask } from '../index'

/**
 * Inverts a BinaryMask in-place.
 */
export function invertBinaryMask(dst: BinaryMask): void {
  const len = dst.length

  for (let i = 0; i < len; i++) {
    dst[i] = dst[i] === 0
      ? 1
      : 0
  }
}

/**
 * Inverts an AlphaMask in-place.
 */
export function invertAlphaMask(dst: AlphaMask): void {
  const len = dst.length

  for (let i = 0; i < len; i++) {
    dst[i] = 255 - dst[i]
  }
}
