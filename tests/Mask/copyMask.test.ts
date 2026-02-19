import { describe, expect, it } from 'vitest'
import type { AlphaMask, BinaryMask } from '../../src'
import { copyMask } from '../../src/Mask/copyMask'

describe('copyMask', () => {
  it('creates a new Uint8Array with the same content', () => {
    const originalArr = new Uint8Array([1, 2, 3, 255])
    const original = originalArr as AlphaMask

    const copy = copyMask(original)

    // Check equality of contents
    expect(copy).toEqual(original)
    // Ensure it is a different instance in memory
    expect(copy).not.toBe(original)
  })

  it('ensures mutations to the copy do not affect the original', () => {
    const originalArr = new Uint8Array([10, 20, 30])
    const original = originalArr as AlphaMask

    const copy = copyMask(original)

    copy[0] = 99

    expect(original[0]).toBe(10)
    expect(copy[0]).toBe(99)
  })

  it('handles empty masks correctly', () => {
    const empty = new Uint8Array(0) as BinaryMask

    const copy = copyMask(empty)

    expect(copy.length).toBe(0)
    expect(copy).not.toBe(empty)
  })
})
