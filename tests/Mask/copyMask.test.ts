import { copyMask, MaskType } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestAlphaMask } from '../_helpers'

describe('copyMask', () => {
  it('creates a new Uint8Array with the same content', () => {
    const arr = [1, 2, 3, 255]
    const mask = makeTestAlphaMask(2, 2, arr)
    const copy = copyMask(mask)

    const res = {
      ...copy,
      data: Array.from(copy.data),
    }

    // Check equality of contents
    expect(res).toEqual({
      type: MaskType.ALPHA,
      w: 2,
      h: 2,
      data: arr,
    })

    // Ensure it is a different instance in memory
    expect(copy.data).not.toBe(mask.data)
  })

  it('ensures mutations to the copy do not affect the original', () => {
    const arr = [10, 20, 30]
    const mask = makeTestAlphaMask(2, 2, arr)
    const copy = copyMask(mask)

    mask.data[0] = 99

    expect(mask.data[0]).toBe(99)
    expect(copy.data[0]).toBe(10)
  })

  it('handles empty masks correctly', () => {

    const empty = makeTestAlphaMask(0, 0)
    const copy = copyMask(empty)

    expect(copy.data.length).toBe(0)
    expect(copy).not.toBe(empty)
  })
})
