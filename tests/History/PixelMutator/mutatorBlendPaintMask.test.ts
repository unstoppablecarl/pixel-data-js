import {
  type Color32,
  MaskType,
  mutatorBlendPaintMask,
  type PaintAlphaMask,
  type PaintBinaryMask,
  sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('mutatorBlendPaintMask', () => {
  let mockTarget: any
  let mockAccumulator: any
  let mockWriter: any
  let mockDidChange: any
  let mockBinaryBlend: any
  let mockAlphaBlend: any
  const color = 0xFF0000FF as Color32

  beforeEach(() => {
    mockTarget = {}
    mockDidChange = vi.fn()

    mockAccumulator = {
      storeRegionBeforeState: vi.fn().mockReturnValue(mockDidChange),
    }

    mockWriter = {
      config: {
        target: mockTarget,
      },
      accumulator: mockAccumulator,
    }

    mockBinaryBlend = vi.fn()
    mockAlphaBlend = vi.fn()
  })

  it('should process a binary mask, update OPTS, and return the didChange result', () => {
    const deps = {
      blendColorPixelDataBinaryMask: mockBinaryBlend,
      blendColorPixelDataAlphaMask: mockAlphaBlend,
    }

    const mutator = mutatorBlendPaintMask(mockWriter, deps)

    const mask = {
      type: MaskType.BINARY,
      w: 10,
      h: 10,
      centerOffsetX: -5,
      centerOffsetY: -5,
    } as PaintBinaryMask

    const x = 15
    const y = 20

    mockBinaryBlend.mockReturnValue(true)
    mockDidChange.mockImplementation((val: boolean) => val)

    const result = mutator.blendColorPaintMask(
      color,
      mask,
      x,
      y,
    )

    // tx = 15 + (-5) = 10
    // ty = 20 + (-5) = 15
    expect(mockAccumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      10,
      15,
      10,
      10,
    )

    const expectedOpts = {
      x: 10,
      y: 15,
      alpha: 255,
      blendFn: sourceOverPerfect,
    }

    expect(mockBinaryBlend).toHaveBeenCalledWith(
      mockTarget,
      color,
      mask,
      expectedOpts,
    )

    expect(mockAlphaBlend).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should process an alpha mask with custom alpha and blend function', () => {
    const deps = {
      blendColorPixelDataBinaryMask: mockBinaryBlend,
      blendColorPixelDataAlphaMask: mockAlphaBlend,
    }

    const mutator = mutatorBlendPaintMask(mockWriter, deps)
    const customBlendFn = vi.fn()

    const mask = {
      type: MaskType.ALPHA,
      w: 8,
      h: 8,
      centerOffsetX: -4,
      centerOffsetY: -4,
    } as PaintAlphaMask

    mockAlphaBlend.mockReturnValue(false)
    mockDidChange.mockImplementation((val: boolean) => val)

    const result = mutator.blendColorPaintMask(
      color,
      mask,
      10,
      10,
      128,
      customBlendFn,
    )

    expect(mockAccumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      6,
      6,
      8,
      8,
    )

    const expectedOpts = {
      x: 6,
      y: 6,
      alpha: 128,
      blendFn: customBlendFn,
    }

    expect(mockAlphaBlend).toHaveBeenCalledWith(
      mockTarget,
      color,
      mask,
      expectedOpts,
    )

    expect(mockBinaryBlend).not.toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('should reuse the exact same OPTS object reference across multiple calls', () => {
    const deps = {
      blendColorPixelDataBinaryMask: mockBinaryBlend,
      blendColorPixelDataAlphaMask: mockAlphaBlend,
    }

    const mutator = mutatorBlendPaintMask(mockWriter, deps)

    const mask = {
      type: MaskType.BINARY,
      w: 2,
      h: 2,
      centerOffsetX: 0,
      centerOffsetY: 0,
    } as PaintBinaryMask

    mutator.blendColorPaintMask(
      0 as Color32,
      mask,
      0,
      0,
    )

    mutator.blendColorPaintMask(
      0 as Color32,
      mask,
      10,
      10,
    )

    const call1Opts = mockBinaryBlend.mock.calls[0][3]
    const call2Opts = mockBinaryBlend.mock.calls[1][3]

    // Referential equality check to ensure we aren't creating new objects
    expect(call1Opts).toBe(call2Opts)
  })
})
