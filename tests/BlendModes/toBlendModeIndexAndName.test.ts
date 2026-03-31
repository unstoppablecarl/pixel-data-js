// toBlendModeIndexAndName.test.ts
import { BaseBlendMode, toBlendModeIndexAndName } from '@/index'
import { describe, expect, it } from 'vitest'

const { sourceOver, darken, multiply } = BaseBlendMode

describe('toBlendModeIndexAndName', () => {
  describe('when given a valid name (string)', () => {
    it('resolves known name → returns correct index and normalized name', () => {
      expect(toBlendModeIndexAndName('sourceOver')).toEqual({
        blendIndex: sourceOver, // 1
        blendName: 'sourceOver',
      })

      expect(toBlendModeIndexAndName('multiply')).toEqual({
        blendIndex: multiply, // 3
        blendName: 'multiply',
      })
    })

    it('accepts whitespace around name and trims it', () => {
      expect(toBlendModeIndexAndName('  darken  ')).toEqual({
        blendIndex: darken, // 2
        blendName: 'darken',
      })
    })

    it('is case-sensitive (throws on wrong case)', () => {
      expect(() => toBlendModeIndexAndName('SourceOver')).toThrow(
        /Invalid blend mode/,
      )
    })

    it('throws on completely unknown name', () => {
      expect(() => toBlendModeIndexAndName('pizza')).toThrow(/pizza/)
    })
  })

  describe('when given a valid index (number)', () => {
    it('resolves number → returns index + correct name', () => {
      expect(toBlendModeIndexAndName(0)).toEqual({
        blendIndex: 0,
        blendName: 'overwrite',
      })

      expect(toBlendModeIndexAndName(3)).toEqual({
        blendIndex: 3,
        blendName: 'multiply',
      })
    })

    it('resolves numeric string', () => {
      expect(toBlendModeIndexAndName('2')).toEqual({
        blendIndex: 2,
        blendName: 'darken',
      })

      expect(toBlendModeIndexAndName('  1  ')).toEqual({
        blendIndex: 1,
        blendName: 'sourceOver',
      })
    })

    it('throws on unknown / out-of-range index', () => {
      expect(() => toBlendModeIndexAndName(999999)).toThrow(/999999/)
      expect(() => toBlendModeIndexAndName('999999')).toThrow(/999999/)
      expect(() => toBlendModeIndexAndName(-1)).toThrow(/-1/)
    })
  })

  describe('invalid / edge inputs', () => {
    it('throws on non-integer numbers', () => {
      expect(() => toBlendModeIndexAndName(1.5)).toThrow(/Invalid index: 1.5/)
      expect(() => toBlendModeIndexAndName(NaN)).toThrow()
      expect(() => toBlendModeIndexAndName(Infinity)).toThrow()
    })

    it('throws on invalid types', () => {
      // @ts-expect-error
      expect(() => toBlendModeIndexAndName(true)).toThrow()
      // @ts-expect-error
      expect(() => toBlendModeIndexAndName(null)).toThrow()
      // @ts-expect-error
      expect(() => toBlendModeIndexAndName(undefined)).toThrow()
      // @ts-expect-error
      expect(() => toBlendModeIndexAndName({})).toThrow()
    })

    it('handles empty string', () => {
      expect(() => toBlendModeIndexAndName('')).toThrow(/Invalid blend mode/)
      expect(() => toBlendModeIndexAndName('   ')).toThrow(/Invalid blend mode/)
    })
  })

  // Optional: round-trip consistency
  describe('round-trip consistency', () => {
    it.each([
      ['overwrite', 0],
      ['sourceOver', 1],
      ['darken', 2],
      ['multiply', 3],
    ])('name → index → name gives original name', (name, idx) => {
      const fromName = toBlendModeIndexAndName(name)
      expect(fromName).toEqual({ blendIndex: idx, blendName: name })

      const fromIndex = toBlendModeIndexAndName(idx)
      expect(fromIndex).toEqual({ blendIndex: idx, blendName: name })

      const fromNumericStr = toBlendModeIndexAndName(String(idx))
      expect(fromNumericStr).toEqual({ blendIndex: idx, blendName: name })
    })
  })
})
