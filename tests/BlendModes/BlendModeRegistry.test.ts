import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  BASE_FAST_BLEND_MODE_FUNCTIONS,
  BaseBlendMode,
  type BlendColor32,
  makeBlendModeRegistry,
  overwriteBase,
} from '../../src'

describe('BlendModeRegistry', () => {
  describe('full list with custom', () => {
    const BlendMode = {
      ...BaseBlendMode,
      custom: 99,
    }

    const customBlendFn: BlendColor32 = (src, dst) => src

    const Items = {
      ...BASE_FAST_BLEND_MODE_FUNCTIONS,
      [BlendMode.custom]: customBlendFn,
    }

    const registry = makeBlendModeRegistry(BlendMode, Items)

    type ExpectedIndex = typeof BlendMode[keyof typeof BlendMode];
    expectTypeOf(registry.indexType).toEqualTypeOf<ExpectedIndex>()
    expectTypeOf(registry.nameType).toEqualTypeOf<keyof typeof BlendMode>()

    it('should add custom modes', () => {

      expect(registry.nameToBlend.custom).toBe(customBlendFn)
      expect(registry.blendToIndex.get(customBlendFn)).toBe(99)

      expectTypeOf(registry.nameToBlend.overwrite).toEqualTypeOf<BlendColor32>()
      expectTypeOf(registry.nameToBlend.overlay).toEqualTypeOf<BlendColor32>()

      expectTypeOf(registry.nameToBlend.custom).toEqualTypeOf<BlendColor32>()
    })
  })

  describe('empty with with custom', () => {
    const BlendMode = {
      overwrite: 0,
      custom: 99,
    } as const

    const blendFn: BlendColor32 = (src, dst) => src

    const Items = {
      [BlendMode.overwrite]: overwriteBase,
      [BlendMode.custom]: blendFn,
    }

    const registry = makeBlendModeRegistry(BlendMode, Items)

    type ExpectedIndex = typeof BlendMode[keyof typeof BlendMode];
    expectTypeOf(registry.indexType).toEqualTypeOf<ExpectedIndex>()
    expectTypeOf(registry.nameType).toEqualTypeOf<keyof typeof BlendMode>()

    it('should add custom modes', () => {

      expect(registry.nameToBlend.custom).toBe(blendFn)
      expect(registry.blendToIndex.get(blendFn)).toBe(99)

      expectTypeOf(registry.nameToBlend.overwrite).toEqualTypeOf<BlendColor32>()
      expectTypeOf(registry.nameToBlend).toEqualTypeOf<{
        readonly overwrite: BlendColor32,
        readonly custom: BlendColor32
      }>()

      expectTypeOf(registry.nameToBlend.custom).toEqualTypeOf<BlendColor32>()
    })
  })
  describe('BlendModeRegistry Error Cases', () => {
    const mockFn: BlendColor32 = (src, _dst) => src
    const otherFn: BlendColor32 = (_src, dst) => dst

    it('should throw when an index is not a finite number', () => {
      const BlendModes = {
        overwrite: 0,
        invalid: NaN
      } as any

      const Entries = {
        0: mockFn,
        [NaN as any]: otherFn
      }

      expect(() => makeBlendModeRegistry(BlendModes, Entries))
        .toThrowError('Index "NaN" is not a number. Attempting to add name: "invalid", index: "NaN"')
    })

    it('should throw when multiple names map to the same index', () => {
      const BlendModes = {
        overwrite: 0,
        collision: 0
      } as any

      const Entries = {
        0: mockFn
      }

      expect(() => makeBlendModeRegistry(BlendModes, Entries))
        .toThrowError('Blend Mode index: 0 is already used. Attempting to add name: "collision", index: "0"')
    })

    it('should handle missing entries for a defined mode', () => {
      // Testing what happens if blendModes defines an index that is missing in initialEntries
      const BlendModes = {
        overwrite: 0,
        missing: 5
      } as any

      const Entries = {
        0: mockFn
        // index 5 is missing
      } as any

      // This will currently pass 'undefined' to add(), which you might want
      // to add a specific check for if you want to be extra safe.
      const registry = makeBlendModeRegistry(BlendModes, Entries)
      expect(registry.indexToBlend.get(5)).toBeUndefined()
    })
  })
})
