import { type Color32, fillPixelData, mutatorFill, mutatorFillRect, type Rect } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorFillRect', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorFillRect, { fillPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const r: Rect = { x: 10, y: 10, w: 50, h: 50 }

    mutator.fillRect(color, r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledWith(target, color, r.x, r.y, r.w, r.h)
  })
})

describe('mutatorFill', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorFill, { fillPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const x = 10
    const y = 10
    const w = 50
    const h = 50

    mutator.fill(color, x, y, w, h)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(x, y, w, h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledWith(target, color, x, y, w, h)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32

    mutator.fill(color)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.w, target.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledWith(target, color, 0, 0, target.w, target.h)
  })
})

