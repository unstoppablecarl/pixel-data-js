import {
  blendColorPixelData,
  type Color32,
  mutatorBlendColorPaintRect,
  overwritePerfect,
  sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorBlendColorPaintRect', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendColorPaintRect, { blendColorPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32

    const x = 0
    const y = 1
    const brushWidth = 10
    const brushHeight = 5
    const alpha = 120
    const blendFn = overwritePerfect

    const result = mutator.blendColorPaintRect(color, x, y, brushWidth, brushHeight, alpha, blendFn)

    expect(result).toEqual(true)

    // should be macro inlined macro_paintRectCenterOffset()
    const topLeftX = x + -((brushWidth - 1) >> 1)
    const topLeftY = y + -((brushHeight - 1) >> 1)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      topLeftX,
      topLeftY,
      brushWidth,
      brushHeight,
    )

    expect(spyDeps.blendColorPixelData).toHaveBeenCalledExactlyOnceWith(target, color, expect.objectContaining({
      x: topLeftX,
      y: topLeftY,
      w: brushWidth,
      h: brushHeight,
      alpha,
      blendFn,
    }))
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32

    const x = 0
    const y = 1
    const brushWidth = 10
    const brushHeight = 5

    const result = mutator.blendColorPaintRect(color, x, y, brushWidth, brushHeight)
    expect(result).toEqual(true)

    // should be macro inlined macro_paintRectCenterOffset()
    const topLeftX = x + -((brushWidth - 1) >> 1)
    const topLeftY = y + -((brushHeight - 1) >> 1)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      topLeftX,
      topLeftY,
      brushWidth,
      brushHeight,
    )

    expect(spyDeps.blendColorPixelData).toHaveBeenCalledWith(target, color, expect.objectContaining({
      x: topLeftX,
      y: topLeftY,
      w: brushWidth,
      h: brushHeight,
      alpha: 255,
      blendFn: sourceOverPerfect,
    }))
  })

  it('should return false when out of bounds', () => {
    const color = 0xFF0000FF as Color32

    const x = 1000
    const y = 1000
    const brushWidth = 10
    const brushHeight = 5

    const result = mutator.blendColorPaintRect(color, x, y, brushWidth, brushHeight)
    expect(result).toEqual(false)

    // should be macro inlined macro_paintRectCenterOffset()
    const topLeftX = x + -((brushWidth - 1) >> 1)
    const topLeftY = y + -((brushHeight - 1) >> 1)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      topLeftX,
      topLeftY,
      brushWidth,
      brushHeight,
    )

    expect(spyDeps.blendColorPixelData).not.toHaveBeenCalled()
  })
})
