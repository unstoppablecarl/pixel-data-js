import { describe, expect, it } from 'vitest'
import type { AlphaMask, BinaryMask } from '../../src'
import { invertAlphaMask, invertBinaryMask } from '../../src/Mask/invertMask'

describe('Mask Inversion Helpers', () => {
  describe('invertBinaryMask', () => {
    it('flips 0 to 1 and 1 to 0 across the entire buffer', () => {
      const mask = new Uint8Array([1, 0, 1, 1, 0]) as BinaryMask

      invertBinaryMask(mask)

      expect(Array.from(mask)).toEqual([0, 1, 0, 0, 1])
    })

    it('is an idempotent operation when called twice', () => {
      const original = [1, 0, 1]
      const mask = new Uint8Array(original) as BinaryMask

      invertBinaryMask(mask)
      invertBinaryMask(mask)

      expect(Array.from(mask)).toEqual(original)
    })
  })

  describe('invertAlphaMask', () => {
    it('performs 255 - value for alpha channels', () => {
      const mask = new Uint8Array([0, 128, 255]) as AlphaMask

      invertAlphaMask(mask)

      expect(Array.from(mask)).toEqual([255, 127, 0])
    })

    it('handles a full range of values correctly', () => {
      const mask = new Uint8Array([1, 10, 200]) as AlphaMask

      invertAlphaMask(mask)

      const result = Array.from(mask)

      expect(result[0]).toBe(254)
      expect(result[1]).toBe(245)
      expect(result[2]).toBe(55)
    })
  })
})
