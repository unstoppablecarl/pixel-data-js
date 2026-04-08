import {
  type ApplyMaskToPixelDataOptions,
  type PixelData32,
} from '@/_types'
import { type AlphaMask, type BinaryMask, type Mask, MaskType } from '@/Mask/_mask-types'
import * as AlphaModule from '@/PixelData/blendPixelDataAlphaMask'
import * as BinaryModule from '@/PixelData/blendPixelDataBinaryMask'
import { blendPixelDataMask } from '@/PixelData/blendPixelDataMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('blendPixelDataMask', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'blendPixelDataBinaryMask')
    vi.spyOn(AlphaModule, 'blendPixelDataAlphaMask')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call blendPixelDataBinaryMask when mask.type is BINARY', () => {
    const blendPixelDataBinaryMask = BinaryModule.blendPixelDataBinaryMask
    const blendPixelDataAlphaMask = AlphaModule.blendPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockSrc: PixelData32 = {} as PixelData32

    const mockMask = { type: MaskType.BINARY } as Mask
    const mockOpts: ApplyMaskToPixelDataOptions = { x: 10, y: 20 } as ApplyMaskToPixelDataOptions

    const mockResult = true;

    (blendPixelDataBinaryMask as any).mockReturnValue(mockResult)

    const result = blendPixelDataMask(mockDst, mockSrc, mockMask, mockOpts)

    expect(blendPixelDataBinaryMask).toHaveBeenCalledOnce()
    expect(blendPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockSrc,
      mockMask as BinaryMask,   // type assertion matches the function
      mockOpts,
    )
    expect(blendPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(result).toBe(mockResult)
  })

  it('should call blendPixelDataAlphaMask when mask.type is not BINARY', () => {
    const blendPixelDataBinaryMask = BinaryModule.blendPixelDataBinaryMask
    const blendPixelDataAlphaMask = AlphaModule.blendPixelDataAlphaMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockSrc: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.ALPHA } as Mask // or any other non-binary type
    const mockOpts: ApplyMaskToPixelDataOptions = { x: 5, y: 15 } as ApplyMaskToPixelDataOptions

    const mockResult = false

    const result = blendPixelDataMask(mockDst, mockSrc, mockMask, mockOpts)

    expect(blendPixelDataAlphaMask).toHaveBeenCalledOnce()
    expect(blendPixelDataAlphaMask).toHaveBeenCalledWith(
      mockDst,
      mockSrc,
      mockMask as AlphaMask,
      mockOpts,
    )
    expect(blendPixelDataBinaryMask).not.toHaveBeenCalled()
    expect(result).toBe(mockResult)
  })

  it('should pass undefined options when opts is not provided', () => {
    const blendPixelDataBinaryMask = BinaryModule.blendPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockSrc: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.BINARY } as Mask

    (blendPixelDataBinaryMask as any).mockReturnValue(true)

    blendPixelDataMask(mockDst, mockSrc, mockMask)

    expect(blendPixelDataBinaryMask).toHaveBeenCalledWith(
      mockDst,
      mockSrc,
      expect.anything(),
      undefined,
    )
  })

  it('should handle different non-binary mask types correctly', () => {

    const mockDst: PixelData32 = {} as PixelData32
    const mockSrc: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.ALPHA } as Mask

    const blendPixelDataBinaryMask = BinaryModule.blendPixelDataBinaryMask
    const blendPixelDataAlphaMask = AlphaModule.blendPixelDataAlphaMask;

    (blendPixelDataAlphaMask as any).mockReturnValue(true)

    blendPixelDataMask(mockDst, mockSrc, mockMask)

    expect(blendPixelDataAlphaMask).toHaveBeenCalledOnce()
    expect(blendPixelDataBinaryMask).not.toHaveBeenCalled()
  })
})
