import {
  type BinaryMask,
  type Color32,
  forEachLinePoint,
  getCircleBrushOrPencilBounds,
  getCircleBrushOrPencilStrokeBounds, MaskType,
  mutatorApplyCirclePencilStroke, sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { printBinaryMaskGrid } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyCirclePencilStroke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('orchestrates the lifecycle and passes correct args to internal helpers', () => {
    const forEachLinePointSpy = vi.fn(forEachLinePoint)
    const blendColorPixelDataBinaryMaskSpy = vi.fn()
    const getCircleBrushOrPencilBoundsSpy = vi.fn(getCircleBrushOrPencilBounds)
    const getCircleBrushOrPencilStrokeBoundsSpy = vi.fn(getCircleBrushOrPencilStrokeBounds)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorApplyCirclePencilStroke, {
      forEachLinePoint: forEachLinePointSpy,
      blendColorPixelDataBinaryMask: blendColorPixelDataBinaryMaskSpy,
      getCircleBrushOrPencilBounds: getCircleBrushOrPencilBoundsSpy,
      getCircleBrushOrPencilStrokeBounds: getCircleBrushOrPencilStrokeBoundsSpy,
    })

    const color = 0xFFFFFFFF as Color32
    const brushSize = 3
    const alpha = 255

    mutator.applyCirclePencilStroke(
      color,
      10,
      10,
      12,
      10,
      brushSize,
      alpha,
    )

    expect(getCircleBrushOrPencilStrokeBoundsSpy).toHaveBeenCalledWith(
      10,
      10,
      12,
      10,
      brushSize,
      expect.any(Object),
    )

    expect(forEachLinePointSpy).toHaveBeenCalledWith(
      10,
      10,
      12,
      10,
      expect.any(Function),
    )

    expect(getCircleBrushOrPencilBoundsSpy).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      brushSize,
      target.width,
      target.height,
      expect.any(Object),
    )

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    )

    expect(blendColorPixelDataBinaryMaskSpy).toHaveBeenCalledWith(
      target,
      color,
      expect.toSatisfy((v: BinaryMask) => {
        expect(v).toEqual({
          type: MaskType.BINARY,
          w: 6,
          h: 4,
          data: new Uint8Array([
            0, 0, 0, 0, 0, 0,
            0, 1, 1, 1, 1, 1,
            0, 1, 1, 1, 1, 1,
            0, 1, 1, 1, 1, 1,
          ]),
        })
        return true
      }),
      expect.objectContaining({
        x: 8,
        y: 8,
        w: 6,
        h: 4,
        alpha: 255,
        blendFn: sourceOverPerfect,
      }),
    )
  })

  it('returns early if brush size is zero', () => {
    const blendColorPixelDataBinaryMaskSpy = vi.fn()
    const {
      mutator,
      accumulator,
    } = mockAccumulatorMutator(mutatorApplyCirclePencilStroke, {
      blendColorPixelDataBinaryMask: blendColorPixelDataBinaryMaskSpy,
      forEachLinePoint,
      getCircleBrushOrPencilBounds,
      getCircleBrushOrPencilStrokeBounds,
    })

    mutator.applyCirclePencilStroke(
      0 as Color32,
      5,
      5,
      5,
      5,
      0,
    )

    expect(accumulator.storeRegionBeforeState).not.toHaveBeenCalled()
    expect(blendColorPixelDataBinaryMaskSpy).not.toHaveBeenCalled()
  })

  it('reuses the same closure object for circlePencilBounds to prevent allocations', () => {
    const getCircleBrushOrPencilBoundsSpy = vi.fn(getCircleBrushOrPencilBounds)
    const {
      mutator,
    } = mockAccumulatorMutator(mutatorApplyCirclePencilStroke, {
      getCircleBrushOrPencilBounds: getCircleBrushOrPencilBoundsSpy,
      forEachLinePoint,
      blendColorPixelDataBinaryMask: vi.fn(),
      getCircleBrushOrPencilStrokeBounds,
    })

    mutator.applyCirclePencilStroke(
      0 as Color32,
      10,
      10,
      12,
      10,
      2,
    )

    const firstCallOut = getCircleBrushOrPencilBoundsSpy.mock.calls[0][5]
    const secondCallOut = getCircleBrushOrPencilBoundsSpy.mock.calls[1][5]

    expect(firstCallOut).toBe(secondCallOut)
  })
})
