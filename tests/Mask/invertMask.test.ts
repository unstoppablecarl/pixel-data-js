import { invertAlphaMask, invertBinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask } from '../_helpers'

describe('Mask Inversion Helpers', () => {
  describe('invertBinaryMask', () => {
    it('flips 0 to 1 and 1 to 0 across the entire buffer', () => {

      const mask = makeTestBinaryMask(3, 2, [1, 0, 1, 1, 0, 1])

      invertBinaryMask(mask)

      expect(Array.from(mask.data)).toEqual([0, 1, 0, 0, 1, 0])
    })

    it('is an idempotent operation when called twice', () => {
      const original = [1, 0, 1, 0]
      const mask = makeTestBinaryMask(2, 2, original)

      invertBinaryMask(mask)
      invertBinaryMask(mask)

      expect(Array.from(mask.data)).toEqual(original)
    })
  })

  describe('invertAlphaMask', () => {
    it('performs 255 - value for alpha channels', () => {
      const mask = makeTestAlphaMask(2, 2, [0, 128, 255, 0])

      invertAlphaMask(mask)

      expect(Array.from(mask.data)).toEqual([255, 127, 0, 255])
    })

    it('handles a full range of values correctly', () => {
      const mask = makeTestAlphaMask(2, 2, [1, 10, 200, 0])

      invertAlphaMask(mask)

      const result = Array.from(mask.data)

      expect(result).toEqual([254, 245, 55, 255])
    })
  })
})
