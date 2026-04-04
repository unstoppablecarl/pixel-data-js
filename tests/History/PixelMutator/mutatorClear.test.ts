import { type BinaryMaskRect, fillPixelData, mutatorClear } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorClear', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorClear, { fillPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const r: Partial<BinaryMaskRect> = {
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    }

    mutator.clear(r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledWith(target, 0, r.x, r.y, r.w, r.h)
  })

  it('should call accumulator with defaults', () => {

    mutator.clear()

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(spyDeps.fillPixelData).toHaveBeenCalledWith(target, 0, 0, 0, target.width, target.height)
  })
})
