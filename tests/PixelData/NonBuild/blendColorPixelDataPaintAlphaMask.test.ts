import { sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import type { Color32 } from '@/Color/_color-types'
import type { PaintAlphaMask } from '@/Paint/_paint-types'
import type { PixelData32 } from '@/PixelData/_pixelData-types'
import * as AlphaModule from '@/PixelData/blendColorPixelDataAlphaMask'
import { blendColorPixelDataPaintAlphaMask } from '@/PixelData/blendColorPixelDataPaintAlphaMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('blendColorPixelDataPaintAlphaMask', () => {
  beforeEach(() => {
    vi.spyOn(AlphaModule, 'blendColorPixelDataAlphaMask')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should calculate correct target position using centerOffset', () => {
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask
    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0xFF0000FF as Color32
    const mockMask: PaintAlphaMask = {
      centerOffsetX: 10,
      centerOffsetY: 20,
    } as PaintAlphaMask

    const x = 100
    const y = 50
    const alpha = 180;

    (blendColorPixelDataAlphaMask as any).mockReturnValue(true)

    const result = blendColorPixelDataPaintAlphaMask(
      mockDst,
      mockColor,
      mockMask,
      x,
      y,
      alpha,
    )

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledOnce()
    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
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
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0x00FF00FF as Color32
    const mockMask: PaintAlphaMask = {
      centerOffsetX: 5,
      centerOffsetY: 5,
    } as PaintAlphaMask;

    (blendColorPixelDataAlphaMask as any).mockReturnValue(false)

    blendColorPixelDataPaintAlphaMask(mockDst, mockColor, mockMask, 200, 150)

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
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
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0x0000FFFF as Color32
    const mockMask: PaintAlphaMask = { centerOffsetX: 0, centerOffsetY: 0 } as PaintAlphaMask
    const customBlendFn = vi.fn();

    (blendColorPixelDataAlphaMask as any).mockReturnValue(true)

    blendColorPixelDataPaintAlphaMask(
      mockDst,
      mockColor,
      mockMask,
      0,
      0,
      255,
      customBlendFn,
    )

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      expect.objectContaining({
        blendFn: customBlendFn,
      }),
    )
  })

  it('should reuse the same SCRATCH_OPTS object', () => {
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask: PaintAlphaMask = { centerOffsetX: 0, centerOffsetY: 0 } as PaintAlphaMask;

    (blendColorPixelDataAlphaMask as any).mockReturnValue(true)

    // Call twice to verify the same object is being mutated
    blendColorPixelDataPaintAlphaMask(mockDst, 0xFF0000FF as Color32, mockMask, 10, 20)
    blendColorPixelDataPaintAlphaMask(mockDst, 0x00FF00FF as Color32, mockMask, 30, 40, 128)

    const calls = (blendColorPixelDataAlphaMask as any).mock.calls

    expect(calls[0][3]).toBe(calls[1][3]) // same SCRATCH_OPTS reference
    expect(calls[1][3].x).toBe(30)
    expect(calls[1][3].y).toBe(40)
    expect(calls[1][3].alpha).toBe(128)
  })
})
