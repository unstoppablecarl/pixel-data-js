import type { AlphaMask, BinaryMask } from '../index'

/**
 * Inverts a BinaryMask in-place.
 */
export function invertBinaryMask(dst: BinaryMask): void {
  const data = dst.data
  const len = data.length

  for (let i = 0; i < len; i++) {
    data[i] = data[i] === 0
      ? 1
      : 0
  }
}

/**
 * Inverts an AlphaMask in-place.
 */
export function invertAlphaMask(dst: AlphaMask): void {
  const data = dst.data
  const len = data.length

  for (let i = 0; i < len; i++) {
    data[i] = 255 - data[i]
  }
}
