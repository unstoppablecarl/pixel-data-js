import { describe, expect, expectTypeOf, it } from 'vitest'
import { BASE_FAST_BLEND_MODE_FUNCTIONS, BaseBlendMode, type BlendColor32, makeBlendModeRegistry } from '../../src'

describe('BlendModeRegistry', () => {
  const BlendMode = {
    ...BaseBlendMode,
    custom: 99,
  }

  const blendFn: BlendColor32 = (src, dst) => src

  const Items = {
    ...BASE_FAST_BLEND_MODE_FUNCTIONS,
    custom: blendFn,
  }

  const registry = makeBlendModeRegistry(BlendMode, Items)

  registry.add('custom', 99, blendFn)

  type ExpectedIndex = typeof BlendMode[keyof typeof BlendMode];
  expectTypeOf(registry.indexType).toEqualTypeOf<ExpectedIndex>()
  expectTypeOf(registry.nameType).toEqualTypeOf<keyof typeof BlendMode>()

  it('should add custom modes', () => {

    expect(registry.modes[99]).toBe(blendFn)
    expect(registry.byName.custom).toBe(blendFn)
    expect(registry.toIndex.get(blendFn)).toBe(99)

  })

  it('should throw an error when adding to an occupied index', () => {
    const conflictFn: BlendColor32 = (a) => a

    expect(() => {
      registry.add('conflict' as any, 0, conflictFn)
    }).toThrowError('Blend Mode index: 0 is already used')
  })

  it('should throw an error when adding to an occupied name', () => {
    const conflictFn: BlendColor32 = (a) => a

    expect(() => {
      registry.add('overwrite' as any, 1000, conflictFn)
    }).toThrowError('Blend Mode name: "overwrite" is already used')
  })
})
