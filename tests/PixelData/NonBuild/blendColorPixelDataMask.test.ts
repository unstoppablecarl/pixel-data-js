import { type Color32, type ColorBlendMaskOptions } from '@/_types'
import { type Mask, MaskType } from '@/Mask/_mask-types'
import type { PixelData32 } from '@/PixelData/_pixelData-types'
import * as AlphaModule from '@/PixelData/blendColorPixelDataAlphaMask'
import * as BinaryModule from '@/PixelData/blendColorPixelDataBinaryMask'
import { blendColorPixelDataMask } from '@/PixelData/blendColorPixelDataMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('blendColorPixelDataMask', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'blendColorPixelDataBinaryMask')
    vi.spyOn(AlphaModule, 'blendColorPixelDataAlphaMask')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call blendColorPixelDataBinaryMask when mask type is BINARY', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0xFF0000FF as Color32
    const mockMask: Mask = { type: MaskType.BINARY } as Mask
    const mockOpts: ColorBlendMaskOptions = {} as ColorBlendMaskOptions

    const mockResult = true;
    (blendColorPixelDataBinaryMask as any).mockReturnValue(mockResult)

    const result = blendColorPixelDataMask(mockDst, mockColor, mockMask, mockOpts)

    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledOnce()
    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      mockOpts,
    )
    expect(blendColorPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(result).toBe(mockResult)
  })

  it('should call blendColorPixelDataAlphaMask when mask type is not BINARY', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0x00FF00FF as Color32
    const mockMask: Mask = { type: MaskType.ALPHA } as Mask
    const mockOpts: ColorBlendMaskOptions = {} as ColorBlendMaskOptions

    const mockResult = false;
    (blendColorPixelDataAlphaMask as any).mockReturnValue(mockResult)

    const result = blendColorPixelDataMask(mockDst, mockColor, mockMask, mockOpts)

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledOnce()
    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      mockOpts,
    )
    expect(blendColorPixelDataBinaryMask).not.toHaveBeenCalled()
    expect(result).toBe(mockResult)
  })

  it('should pass undefined options correctly', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor: Color32 = 0xFFFFFFFF as Color32
    const mockMask: Mask = { type: MaskType.BINARY } as Mask

    (blendColorPixelDataBinaryMask as any).mockReturnValue(true)

    blendColorPixelDataMask(mockDst, mockColor, mockMask)

    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockColor,
      mockMask,
      undefined,
    )
  })
})
