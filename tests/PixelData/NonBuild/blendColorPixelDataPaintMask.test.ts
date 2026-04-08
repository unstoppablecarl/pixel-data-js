import { type Color32 } from '@/_types'
import { sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import { MaskType } from '@/Mask/_mask-types'
import type { PaintMask } from '@/Paint/_paint-types'
import type { PixelData32 } from '@/PixelData/_pixelData-types'
import * as AlphaModule from '@/PixelData/blendColorPixelDataAlphaMask'
import * as BinaryModule from '@/PixelData/blendColorPixelDataBinaryMask'
import { blendColorPixelDataPaintMask } from '@/PixelData/blendColorPixelDataPaintMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('blendColorPixelDataPaintMask', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'blendColorPixelDataBinaryMask')
    vi.spyOn(AlphaModule, 'blendColorPixelDataAlphaMask')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call blendColorPixelDataBinaryMask when mask.type is BINARY', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0xFF0000FF as Color32
    const mockMask: PaintMask = {
      type: MaskType.BINARY,
      centerOffsetX: 15,
      centerOffsetY: 25,
    } as PaintMask

    const x = 100
    const y = 200
    const alpha = 180;

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true)

    const result = blendColorPixelDataPaintMask(
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
        x: 115,   // 100 + 15
        y: 225,   // 200 + 25
        alpha: 180,
        blendFn: sourceOverPerfect,
      }),
    )

    // expect(blendColorPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call blendColorPixelDataAlphaMask when mask.type is not BINARY', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0x00FF00FF as Color32
    const mockMask: PaintMask = {
      type: MaskType.ALPHA,           // or any non-BINARY type
      centerOffsetX: 8,
      centerOffsetY: 12,
    } as PaintMask;

    (blendColorPixelDataAlphaMask as any).mockReturnValue(false)

    const result = blendColorPixelDataPaintMask(mockDst, mockColor, mockMask, 50, 60)

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledOnce()
    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      expect.objectContaining({
        x: 58,   // 50 + 8
        y: 72,   // 60 + 12
        alpha: 255,                 // default
        blendFn: sourceOverPerfect, // default
      }),
    )

    expect(blendColorPixelDataBinaryMask).not.toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('should use default alpha and blendFn when not provided', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask: PaintMask = {
      type: MaskType.BINARY,
      centerOffsetX: 0,
      centerOffsetY: 0,
    } as PaintMask;

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true)

    const result = blendColorPixelDataPaintMask(mockDst, 0xFFFFFFFF as Color32, mockMask, 300, 400)

    expect(result).toEqual(true)
    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        x: 300,
        y: 400,
        alpha: 255,
        blendFn: sourceOverPerfect,
      }),
    )
  })

  it('should correctly override alpha and blendFn when provided', () => {
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask: PaintMask = {
      type: MaskType.ALPHA,
      centerOffsetX: 0,
      centerOffsetY: 0,
    } as PaintMask

    const customBlendFn = vi.fn();

    (blendColorPixelDataAlphaMask as any).mockReturnValue(true)

    blendColorPixelDataPaintMask(
      mockDst,
      0x0000FFFF as Color32,
      mockMask,
      10,
      20,
      128,
      customBlendFn,
    )

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        alpha: 128,
        blendFn: customBlendFn,
      }),
    )
  })

  it('should reuse the same SCRATCH_OPTS object across calls', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockBinaryMask: PaintMask = { type: MaskType.BINARY, centerOffsetX: 0, centerOffsetY: 0 } as PaintMask
    const mockAlphaMask: PaintMask = { type: MaskType.ALPHA, centerOffsetX: 0, centerOffsetY: 0 } as PaintMask;

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true);
    (blendColorPixelDataAlphaMask as any).mockReturnValue(true)

    blendColorPixelDataPaintMask(mockDst, 0xFF0000FF as Color32, mockBinaryMask, 5, 5)
    blendColorPixelDataPaintMask(mockDst, 0x00FF00FF as Color32, mockAlphaMask, 50, 60, 200)

    const firstOpts = (blendColorPixelDataBinaryMask as any).mock.calls[0][3]
    const secondOpts = (blendColorPixelDataAlphaMask as any).mock.calls[0][3]

    expect(firstOpts).toBe(secondOpts)
    expect(secondOpts.x).toBe(50)
    expect(secondOpts.y).toBe(60)
    expect(secondOpts.alpha).toBe(200)
  })
})
