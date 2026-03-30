import {
  type BinaryMask,
  forEachLinePoint,
  getRectBrushOrPencilBounds,
  MaskType,
  mutatorApplyRectPencilStroke,
  sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pack } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyRectPencilStroke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('orchestrates the full stroke lifecycle with correct arguments', () => {
    const color = pack(255, 0, 0, 255)

    const getRectBrushOrPencilStrokeBoundsMock = vi.fn((x0, y0, x1, y1, bw, bh, res) => {
      res.x = 10
      res.y = 10
      res.w = 5
      res.h = 5
      return res
    })

    const forEachLinePointMock = vi.fn((x0, y0, x1, y1, cb) => {
      cb(12, 12)
    })

    const getRectBrushOrPencilBoundsMock = vi.fn((cx, cy, bw, bh, tw, th, res) => {
      res!.x = 11
      res!.y = 11
      res!.w = 3
      res!.h = 3
      return res!
    })

    const blendColorPixelDataBinaryMaskSpy = vi.fn()

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorApplyRectPencilStroke, {
      getRectBrushOrPencilStrokeBounds: getRectBrushOrPencilStrokeBoundsMock,
      forEachLinePoint: forEachLinePointMock,
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsMock,
      blendColorPixelDataBinaryMask: blendColorPixelDataBinaryMaskSpy,
    })

    mutator.applyRectPencilStroke(color, 0, 0, 10, 10, 3, 3)

    // Assert correct orchestration
    expect(getRectBrushOrPencilStrokeBoundsMock).toHaveBeenCalledWith(0, 0, 10, 10, 3, 3, expect.anything())
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(11, 11, 3, 3)

    // Check the final blit call
    expect(blendColorPixelDataBinaryMaskSpy).toHaveBeenCalledWith(
      target,
      color,
      expect.toSatisfy((v: BinaryMask) => {
        expect(v).toEqual({
          type: MaskType.BINARY,
          w: 5,
          h: 5,
          data: new Uint8Array([
            0, 0, 0, 0, 0,
            0, 1, 1, 1, 0,
            0, 1, 1, 1, 0,
            0, 1, 1, 1, 0,
            0, 0, 0, 0, 0,
          ]),
        })
        return true
      }),
      expect.objectContaining({
        alpha: 255,
        blendFn: sourceOverPerfect,
        x: 10,
        y: 10,
        w: 5,
        h: 5,
      }),
    )
  })

  it('correctly calculates the internal mask index', () => {
    const getRectBrushOrPencilStrokeBoundsMock = vi.fn((x0, y0, x1, y1, bw, bh, res) => {
      res.x = 10
      res.y = 10
      res.w = 5
      res.h = 5
      return res
    })

    const forEachLinePointMock = vi.fn((x0, y0, x1, y1, cb) => {
      cb(11.5, 11.5) // px/py used for floor and distance math
    })

    const getRectBrushOrPencilBoundsMock = vi.fn((cx, cy, bw, bh, tw, th, res) => {
      res!.x = 11
      res!.y = 11
      res!.w = 2
      res!.h = 2
      return res!
    })

    const blendColorPixelDataBinaryMaskSpy = vi.fn()

    const { mutator } = mockAccumulatorMutator(mutatorApplyRectPencilStroke, {
      getRectBrushOrPencilStrokeBounds: getRectBrushOrPencilStrokeBoundsMock,
      forEachLinePoint: forEachLinePointMock,
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsMock,
      blendColorPixelDataBinaryMask: blendColorPixelDataBinaryMaskSpy,
    })

    mutator.applyRectPencilStroke(0 as any, 0, 0, 0, 0, 2, 2)

    const mask = blendColorPixelDataBinaryMaskSpy.mock.calls[0][2] as BinaryMask

    expect(mask).toEqual({
      w: 5,
      h: 5,
      type: MaskType.BINARY,
      data: expect.toSatisfy((v: Uint8Array) => {

        expect(Array.from(v)).toEqual([
          0, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 0,
        ])
        return true
      }),
    })

    // Math check:
    // bx=10, by=10, bw=5
    // Stamp point is (11, 11).
    // lx = 11 - 10 = 1. ly = 11 - 10 = 1.
    // index = 1 * 5 + 1 = 6.
    expect(mask.data[6]).toBe(1)

  })

  it('returns early and skips all work if stroke bounds are empty', () => {
    const getRectBrushOrPencilStrokeBoundsMock = vi.fn((x0, y0, x1, y1, bw, bh, res) => {
      res.w = 0
      res.h = 0
      return res
    })

    const forEachLinePointSpy = vi.fn(forEachLinePoint)
    const blendColorPixelDataBinaryMaskSpy = vi.fn()

    const { mutator, accumulator } = mockAccumulatorMutator(mutatorApplyRectPencilStroke, {
      getRectBrushOrPencilStrokeBounds: getRectBrushOrPencilStrokeBoundsMock,
      forEachLinePoint: forEachLinePointSpy,
      blendColorPixelDataBinaryMask: blendColorPixelDataBinaryMaskSpy,
      getRectBrushOrPencilBounds,
    })

    mutator.applyRectPencilStroke(0 as any, 0, 0, 0, 0, 0, 0)

    expect(forEachLinePointSpy).not.toHaveBeenCalled()
    expect(accumulator.storeRegionBeforeState).not.toHaveBeenCalled()
    expect(blendColorPixelDataBinaryMaskSpy).not.toHaveBeenCalled()
  })
})
