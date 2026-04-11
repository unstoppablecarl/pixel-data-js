import { type Color32, fillPixelData, mutatorFill, type Rect } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorFill', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorFill, { fillPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const x = 10
    const y = 10
    const w = 50
    const h = 50

    const result = mutator.fill(color, x, y, w, h)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(x, y, w, h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, color, x, y, w, h)
  })

  it('should call accumulator with partial rect obj', () => {
    const color = 0xFFFF00FF as Color32
    const r: Partial<Rect> = { x: 10, y: 10 }

    const result = mutator.fill(color, r)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(r.x, r.y, target.w, target.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, color, r.x, r.y, target.w, target.h)
  })

  it('should call accumulator with partial rect obj x', () => {
    const color = 0xFFFF00FF as Color32
    const r: Partial<Rect> = { x: 10 }

    const result = mutator.fill(color, r)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(r.x, 0, target.w, target.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, color, r.x, 0, target.w, target.h)
  })

  it('should call accumulator with partial rect obj y', () => {
    const color = 0xFFFF00FF as Color32
    const r: Partial<Rect> = { y: 10 }

    const result = mutator.fill(color, r)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, r.y, target.w, target.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, color, 0, r.y, target.w, target.h)
  })

  it('should call accumulator with rect obj', () => {
    const color = 0xFFFF00FF as Color32
    const r: Rect = { x: 10, y: 10, w: 50, h: 50 }

    const result = mutator.fill(color, r)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(r.x, r.y, r.w, r.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, color, r.x, r.y, r.w, r.h)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32

    const result = mutator.fill(color)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, target.w, target.h)
    expect(spyDeps.fillPixelData).toHaveBeenCalledExactlyOnceWith(target, color, 0, 0, target.w, target.h)
  })

  it('should return false when out of bounds', () => {
    const color = 0xFF0000FF as Color32
    const x = 1000
    const y = 1000
    const w = 50
    const h = 50

    const result = mutator.fill(color, x, y, w, h)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(x, y, w, h)
    expect(spyDeps.fillPixelData).not.toHaveBeenCalled()
  })
})

