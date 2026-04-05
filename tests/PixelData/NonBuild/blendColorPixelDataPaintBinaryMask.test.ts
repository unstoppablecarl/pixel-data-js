import type { Color32, PaintBinaryMask, PixelData32 } from '@/_types'
import { sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import * as BinaryModule from '@/PixelData/blendColorPixelDataBinaryMask'
import { blendColorPixelDataPaintBinaryMask } from '@/PixelData/blendColorPixelDataPaintBinaryMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('blendColorPixelDataPaintBinaryMask', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'blendColorPixelDataBinaryMask')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should calculate correct target position using centerOffset', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0xFF0000FF as Color32
    const mockMask: PaintBinaryMask = {
      centerOffsetX: 10,
      centerOffsetY: 20,
    } as PaintBinaryMask

    const x = 100
    const y = 50
    const alpha = 180;

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true)

    const result = blendColorPixelDataPaintBinaryMask(
      mockDst,
      mockColor,
      mockMask,
      x,
      y,
      alpha,
    )

    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledOnce()
    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      expect.objectContaining({
        x: 110,   // 100 + 10
        y: 70,    // 50 + 20
        alpha: 180,
        blendFn: sourceOverPerfect,
      }),
    )

    expect(result).toBe(true)
  })

  it('should use default values when alpha and blendFn are not provided', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0x00FF00FF as Color32
    const mockMask: PaintBinaryMask = {
      centerOffsetX: 5,
      centerOffsetY: 5,
    } as PaintBinaryMask;

    (blendColorPixelDataBinaryMask as any).mockReturnValue(false)

    blendColorPixelDataPaintBinaryMask(mockDst, mockColor, mockMask, 200, 150)

    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      expect.objectContaining({
        x: 205,                    // 200 + 5
        y: 155,                    // 150 + 5
        alpha: 255,                // default
        blendFn: sourceOverPerfect, // default
      }),
    )
  })

  it('should override blendFn when provided', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0x0000FFFF as Color32
    const mockMask: PaintBinaryMask = { centerOffsetX: 0, centerOffsetY: 0 } as PaintBinaryMask
    const customBlendFn = vi.fn();

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true)

    blendColorPixelDataPaintBinaryMask(
      mockDst,
      mockColor,
      mockMask,
      0,
      0,
      255,
      customBlendFn,
    )

    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      expect.objectContaining({
        blendFn: customBlendFn,
      }),
    )
  })

  it('should reuse the same SCRATCH_OPTS object', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask: PaintBinaryMask = { centerOffsetX: 0, centerOffsetY: 0 } as PaintBinaryMask;

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true)

    // Call twice to verify the same object is being mutated
    blendColorPixelDataPaintBinaryMask(mockDst, 0xFF0000FF as Color32, mockMask, 10, 20)
    blendColorPixelDataPaintBinaryMask(mockDst, 0x00FF00FF as Color32, mockMask, 30, 40, 128)

    const calls = (blendColorPixelDataBinaryMask as any).mock.calls

    expect(calls[0][3]).toBe(calls[1][3]) // same SCRATCH_OPTS reference
    expect(calls[1][3].x).toBe(30)
    expect(calls[1][3].y).toBe(40)
    expect(calls[1][3].alpha).toBe(128)
  })
})
