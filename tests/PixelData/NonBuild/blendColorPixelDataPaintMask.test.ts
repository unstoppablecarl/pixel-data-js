import { type Color32 } from '@/_types'
import { multiplyPerfect, sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import { MaskType } from '@/Mask/_mask-types'
import { type PaintMask, PaintMaskOutline, type PaintRect } from '@/Paint/_paint-types'
import type { PixelData32 } from '@/PixelData/_pixelData-types'
import * as BlendModule from '@/PixelData/blendColorPixelData'
import * as AlphaModule from '@/PixelData/blendColorPixelDataAlphaMask'
import * as BinaryModule from '@/PixelData/blendColorPixelDataBinaryMask'

import { blendColorPixelDataPaintMask } from '@/PixelData/blendColorPixelDataPaintMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPixelData, pack } from '../../_helpers'

describe('blendColorPixelDataPaintMask', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'blendColorPixelDataBinaryMask')
    vi.spyOn(AlphaModule, 'blendColorPixelDataAlphaMask')
    vi.spyOn(BlendModule, 'blendColorPixelData')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call blendColorPixelDataBinaryMask when mask.type is BINARY', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask

    const mockDst: PixelData32 = {} as PixelData32
    const mockColor = 0xFF0000FF as Color32
    const mockMask: PaintMask = {
      data: new Uint8Array(9).fill(1),
      type: MaskType.BINARY,
      centerOffsetX: 15,
      centerOffsetY: 25,
      w: 10,
      h: 10,
      outlineType: PaintMaskOutline.RECT,
    }

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

    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledExactlyOnceWith(
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

    expect(AlphaModule.blendColorPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call blendColorPixelDataAlphaMask when mask.type is not BINARY', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const target = makeTestPixelData(10, 10, pack(0, 0, 255, 255))
    const color = pack(255, 0, 0, 255)

    const mask: PaintMask = {
      data: new Uint8Array(100).fill(255),
      type: MaskType.ALPHA,
      centerOffsetX: -1,
      centerOffsetY: -1,
      w: 10,
      h: 10,
      outlineType: PaintMaskOutline.RECT,
    }

    const x = 2
    const y = 3

    const result = blendColorPixelDataPaintMask(target, color, mask, x, y)

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledExactlyOnceWith(
      target,
      color,
      mask,
      expect.objectContaining({
        x: x + mask.centerOffsetX,
        y: y + mask.centerOffsetY,
        alpha: 255,                 // default
        blendFn: sourceOverPerfect, // default
        w: undefined,
        h: undefined,
      }),
    )

    expect(blendColorPixelDataBinaryMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should use default alpha and blendFn when not provided', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const color = pack(255, 0, 0, 255)

    const target = makeTestPixelData(20, 20, pack(0, 0, 255, 255))
    const mask: PaintMask = {
      data: new Uint8Array(9).fill(1),
      type: MaskType.BINARY,
      centerOffsetX: -3,
      centerOffsetY: -4,
      w: 10,
      h: 10,
      outlineType: PaintMaskOutline.RECT,
    }

    const x = 10
    const y = 11

    const result = blendColorPixelDataPaintMask(target, color, mask, x, y)

    expect(result).toEqual(true)
    expect(blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      target,
      color,
      mask,
      expect.objectContaining({
        x: x + mask.centerOffsetX,
        y: y + mask.centerOffsetY,
        alpha: 255,
        blendFn: sourceOverPerfect,
      }),
    )
  })

  it('should handle PaintRect', () => {
    const blendColorPixelData = BlendModule.blendColorPixelData
    const color = pack(255, 0, 0, 255)

    const target = makeTestPixelData(20, 20, pack(0, 0, 255, 255))
    const mask: PaintRect = {
      centerOffsetX: -2,
      centerOffsetY: -3,
      w: 10,
      h: 11,
      data: null,
      type: null,
      outlineType: PaintMaskOutline.RECT,
    }

    const x = 3
    const y = 5
    const result = blendColorPixelDataPaintMask(target, color, mask, x, y)

    expect(result).toEqual(true)
    expect(blendColorPixelData).toHaveBeenCalledExactlyOnceWith(
      target,
      color,
      expect.objectContaining({
        x: x + mask.centerOffsetX,
        y: y + mask.centerOffsetY,
        alpha: 255,
        blendFn: sourceOverPerfect,
        w: mask.w,
        h: mask.h,
      }),
    )
  })

  it('should correctly override alpha and blendFn when provided', () => {
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const target = makeTestPixelData(10, 10, pack(0, 0, 255, 255))
    const color = pack(255, 0, 0, 255)

    const mask: PaintMask = {
      data: new Uint8Array(100).fill(255),
      type: MaskType.ALPHA,
      centerOffsetX: -1,
      centerOffsetY: -1,
      w: 10,
      h: 10,
      outlineType: PaintMaskOutline.RECT,
    }

    const customBlendFn = multiplyPerfect

    const x = 10
    const y = 13
    const alpha = 128
    blendColorPixelDataPaintMask(
      target,
      color,
      mask,
      x,
      y,
      alpha,
      customBlendFn,
    )

    expect(blendColorPixelDataAlphaMask).toHaveBeenCalledExactlyOnceWith(
      target,
      color,
      mask,
      expect.objectContaining({
        alpha,
        blendFn: customBlendFn,
      }),
    )
  })

  it('should reuse the same SCRATCH_OPTS object across calls', () => {
    const blendColorPixelDataBinaryMask = BinaryModule.blendColorPixelDataBinaryMask
    const blendColorPixelDataAlphaMask = AlphaModule.blendColorPixelDataAlphaMask

    const target: PixelData32 = {} as PixelData32
    const binaryMask: PaintMask = {
      type: MaskType.BINARY,
      outlineType: PaintMaskOutline.RECT,
      data: new Uint8Array(100).fill(1),
      centerOffsetX: 0,
      centerOffsetY: 0,
      w: 10,
      h: 10,
    }
    const alphaMask: PaintMask = {
      type: MaskType.ALPHA,
      outlineType: PaintMaskOutline.RECT,
      data: new Uint8Array(100).fill(255),
      centerOffsetX: 0,
      centerOffsetY: 0,
      w: 10,
      h: 10,
    }

    blendColorPixelDataPaintMask(target, 0xFF0000FF as Color32, binaryMask, 5, 5)
    blendColorPixelDataPaintMask(target, 0x00FF00FF as Color32, alphaMask, 50, 60, 200)

    const firstOpts = (blendColorPixelDataBinaryMask as any).mock.calls[0][3]
    const secondOpts = (blendColorPixelDataAlphaMask as any).mock.calls[0][3]

    expect(firstOpts).toBe(secondOpts)
    expect(secondOpts.x).toBe(50)
    expect(secondOpts.y).toBe(60)
    expect(secondOpts.alpha).toBe(200)
  })
})
