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
  } = mockMutator(mutatorBlendColorPaintRect, { blendColorPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32

    const x = 0
    const y = 1
    const brushWidth = 10
    const brushHeight = 5
    const alpha = 120
    const blendFn = overwritePerfect

    mutator.blendColorPaintRect(color, x, y, brushWidth, brushHeight, alpha, blendFn)

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

    mutator.blendColorPaintRect(color, x, y, brushWidth, brushHeight)

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
})
