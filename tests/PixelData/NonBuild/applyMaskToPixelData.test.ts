import {
  type ApplyMaskToPixelDataOptions,

} from '@/_types'
import { type AlphaMask, type BinaryMask, type Mask, MaskType } from '@/Mask/_mask-types'
import type { PixelData32 } from '@/PixelData/_pixelData-types'
import * as AlphaModule from '@/PixelData/applyAlphaMaskToPixelData'
import * as BinaryModule from '@/PixelData/applyBinaryMaskToPixelData'
import { applyMaskToPixelData } from '@/PixelData/applyMaskToPixelData'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('applyMaskToPixelData', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'applyBinaryMaskToPixelData')
    vi.spyOn(AlphaModule, 'applyAlphaMaskToPixelData')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call applyBinaryMaskToPixelData when mask.type is BINARY', () => {
    const applyBinaryMaskToPixelData = BinaryModule.applyBinaryMaskToPixelData
    const applyAlphaMaskToPixelData = AlphaModule.applyAlphaMaskToPixelData

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.BINARY } as Mask
    const mockOpts: ApplyMaskToPixelDataOptions = { x: 10, y: 20 } as ApplyMaskToPixelDataOptions

    const mockResult = true;

    (applyBinaryMaskToPixelData as any).mockReturnValue(mockResult)

    const result = applyMaskToPixelData(mockDst, mockMask, mockOpts)

    expect(applyBinaryMaskToPixelData).toHaveBeenCalledOnce()
    expect(applyBinaryMaskToPixelData).toHaveBeenCalledWith(
      mockDst,
      mockMask as BinaryMask,   // type assertion matches the function
      mockOpts,
    )
    expect(applyAlphaMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(mockResult)
  })

  it('should call applyAlphaMaskToPixelData when mask.type is not BINARY', () => {
    const applyBinaryMaskToPixelData = BinaryModule.applyBinaryMaskToPixelData
    const applyAlphaMaskToPixelData = AlphaModule.applyAlphaMaskToPixelData

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.ALPHA } as Mask // or any other non-binary type
    const mockOpts: ApplyMaskToPixelDataOptions = { x: 5, y: 15 } as ApplyMaskToPixelDataOptions

    const mockResult = false

    const result = applyMaskToPixelData(mockDst, mockMask, mockOpts)

    expect(applyAlphaMaskToPixelData).toHaveBeenCalledOnce()
    expect(applyAlphaMaskToPixelData).toHaveBeenCalledWith(
      mockDst,
      mockMask as AlphaMask,
      mockOpts,
    )
    expect(applyBinaryMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(mockResult)
  })

  it('should pass undefined options when opts is not provided', () => {
    const applyBinaryMaskToPixelData = BinaryModule.applyBinaryMaskToPixelData

    const mockDst: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.BINARY } as Mask

    (applyBinaryMaskToPixelData as any).mockReturnValue(true)

    applyMaskToPixelData(mockDst, mockMask)

    expect(applyBinaryMaskToPixelData).toHaveBeenCalledWith(
      mockDst,
      expect.anything(),
      undefined,
    )
  })

  it('should handle different non-binary mask types correctly', () => {
    const mockDst: PixelData32 = {} as PixelData32
    const mockMask = { type: MaskType.ALPHA } as Mask

    const applyBinaryMaskToPixelData = BinaryModule.applyBinaryMaskToPixelData
    const applyAlphaMaskToPixelData = AlphaModule.applyAlphaMaskToPixelData;

    (applyAlphaMaskToPixelData as any).mockReturnValue(true)

    applyMaskToPixelData(mockDst, mockMask)

    expect(applyAlphaMaskToPixelData).toHaveBeenCalledOnce()
    expect(applyBinaryMaskToPixelData).not.toHaveBeenCalled()
  })
})
