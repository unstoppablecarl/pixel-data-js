import { type BinaryMaskRect, fillPixelData, mutatorClear } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorClear', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorClear, { fillPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const r: Partial<BinaryMaskRect> = {
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    }

    const result = mutator.clear(r)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(r.x, r.y, r.w, r.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, 0, r.x, r.y, r.w, r.h)
  })

  it('should call accumulator with defaults', () => {

    const result = mutator.clear()
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, target.w, target.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, 0, 0, 0, target.w, target.h)
  })

  it('should return false when out of bounds', () => {
    const r: Partial<BinaryMaskRect> = {
      x: 1000,
      y: 1000,
      w: 50,
      h: 50,
    }

    const result = mutator.clear(r)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(r.x, r.y, r.w, r.h)
    expect(spyDeps.fillPixelData).not.toHaveBeenCalled()
  })
})
