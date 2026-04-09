import {
  blendColorPixelData,
  blendColorPixelDataBinaryMask,
  blendPixelData,
  makeCirclePaintAlphaMask,
  makeCirclePaintBinaryMask,
  makePaintBinaryMask,
  makePaintCursorRenderer,
  makePixelData,
  makeReusableCanvas, MaskType,
  type PaintCursorRenderer, PaintMaskOutline,
  resamplePixelDataInPlace,
} from '@/index'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask, makeTestPaintRect, makeTestPixelData, pack } from '../../_helpers'
import { OffscreenCanvasMock, useOffscreenCanvasMock } from '../../_helpers/OffscreenCanvasMock'

describe('PaintCursorRenderer', () => {
  const redTint = pack(255, 0, 0, 120)
  const cyan = pack(0, 255, 255, 255)
  const C = cyan
  const r = redTint

  describe('rect', () => {

    const cases = [
      {
        scale: 1,
        x: 3,
        y: 4,
        w: 4,
        h: 4,
        targetW: 12,
        targetH: 12,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },
      {
        scale: 1,
        x: 3,
        y: 4,
        w: 4,
        h: 3,
        targetW: 12,
        targetH: 10,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },
      {
        scale: 2,
        x: 3,
        y: 4,
        w: 4,
        h: 3,
        targetW: 18,
        targetH: 14,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, C, C, C, C, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, C, C, C, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },

      {
        scale: 3,
        x: 3,
        y: 4,
        w: 4,
        h: 3,
        targetW: 20,
        targetH: 20,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, C, C, C, C, C, C, C, C, C, C, C, C, C, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, r, r, r, r, r, r, r, r, C, 0,
          0, 0, 0, 0, 0, C, C, C, C, C, C, C, C, C, C, C, C, C, C, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },
    ]
    it.each(cases)('test rect mask scale=$scale x=$x y=$y w=$w h=$h', (v) => {

      const { scale, x, y, w, h, targetW, targetH, expectedResult } = v
      const renderer = makePaintCursorRenderer(makeReusableCanvas)

      // copied from _macro_paintRectCenterOffset()
      const paintRectCenterOffset = (size: number) => -((size - 1) >> 1)

      const centerOffsetX = paintRectCenterOffset(w)
      const centerOffsetY = paintRectCenterOffset(h)

      const ox = x + centerOffsetX
      const oy = y + centerOffsetY

      renderer.update({
          type: MaskType.BINARY,
          outlineType: PaintMaskOutline.RECT,
          data: new Uint8Array(),
          w,
          h,
          centerOffsetX,
          centerOffsetY,
        },
        scale,
        cyan,
      )

      const { toPixelData } = makeTargetCanvas(targetW, targetH)

      const result = toPixelData(renderer, x, y)

      blendColorPixelData(result, redTint, {
        x: ox * scale,
        y: oy * scale,
        w: w * scale,
        h: h * scale,
      })

      expect(
        renderer.getBounds(0, 0),
      ).toEqual({
        x: centerOffsetX,
        y: centerOffsetY,
        w: w,
        h: h,
      })

      expect(
        renderer.getBounds(2, 3),
      ).toEqual({
        x: centerOffsetX + 2,
        y: centerOffsetY + 3,
        w: w,
        h: h,
      })

      expect(
        renderer.getBoundsScaled(10, 20),
      ).toEqual({
        x: (centerOffsetX + 10) * scale - 1,
        y: (centerOffsetY + 20) * scale - 1,
        w: w * scale,
        h: h * scale,
      })

      // printPixelDataGrid(result, new Map([
      //   [cyan, 'C'],
      //   [redTint, 'r'],
      // ]))

      expect(result).toMatchPixelGrid(expectedResult)
    })

    it.each(cases)('test rect scale=$scale x=$x y=$y w=$w h=$h', (v) => {

      const { scale, x, y, w, h, targetW, targetH, expectedResult } = v
      const renderer = makePaintCursorRenderer(makeReusableCanvas)

      // copied from _macro_paintRectCenterOffset()
      const paintRectCenterOffset = (size: number) => -((size - 1) >> 1)

      const centerOffsetX = paintRectCenterOffset(w)
      const centerOffsetY = paintRectCenterOffset(h)

      const ox = x + centerOffsetX
      const oy = y + centerOffsetY

      renderer.update(makeTestPaintRect(w, h),
        scale,
        cyan,
      )

      const { toPixelData } = makeTargetCanvas(targetW, targetH)

      const result = toPixelData(renderer, x, y)

      blendColorPixelData(result, redTint, {
        x: ox * scale,
        y: oy * scale,
        w: w * scale,
        h: h * scale,
      })

      expect(
        renderer.getBounds(0, 0),
      ).toEqual({
        x: centerOffsetX,
        y: centerOffsetY,
        w: w,
        h: h,
      })

      expect(
        renderer.getBounds(2, 3),
      ).toEqual({
        x: centerOffsetX + 2,
        y: centerOffsetY + 3,
        w: w,
        h: h,
      })

      expect(
        renderer.getBoundsScaled(10, 20),
      ).toEqual({
        x: (centerOffsetX + 10) * scale - 1,
        y: (centerOffsetY + 20) * scale - 1,
        w: w * scale,
        h: h * scale,
      })

      // printPixelDataGrid(result, new Map([
      //   [cyan, 'C'],
      //   [redTint, 'r'],
      // ]))

      expect(result).toMatchPixelGrid(expectedResult)
    })
  })

  describe('circle', () => {
    const cases = [{
      scale: 1,
      x: 4,
      y: 4,
      size: 1,
      targetW: 8,
      targetH: 8,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, 0, 0, C, r, C, 0, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
      {
        scale: 1,
        x: 4,
        y: 4,
        size: 2,
        targetW: 8,
        targetH: 8,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, C, C, C, C, 0, 0,
          0, 0, C, r, r, C, 0, 0,
          0, 0, C, r, r, C, 0, 0,
          0, 0, C, C, C, C, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },

      {
        scale: 1,
        x: 4,
        y: 4,
        size: 3,
        targetW: 8,
        targetH: 8,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, C, C, C, C, C, 0,
          0, 0, C, r, r, r, C, 0,
          0, 0, C, r, r, r, C, 0,
          0, 0, C, r, r, r, C, 0,
          0, 0, C, C, C, C, C, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },
      {
        scale: 1,
        x: 4,
        y: 4,
        size: 4,
        targetW: 8,
        targetH: 8,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, C, C, C, C, 0, 0,
          0, C, C, r, r, C, C, 0,
          0, C, r, r, r, r, C, 0,
          0, C, r, r, r, r, C, 0,
          0, C, C, r, r, C, C, 0,
          0, 0, C, C, C, C, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },
      {
        scale: 2,
        x: 4,
        y: 4,
        size: 4,
        targetW: 16,
        targetH: 16,
        expectedResult: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, C, C, C, r, r, r, r, C, C, C, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
          0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
          0, 0, 0, C, C, C, r, r, r, r, C, C, C, 0, 0, 0,
          0, 0, 0, 0, 0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, C, C, C, C, C, C, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      },

    ]
    it.each(cases)('test circle scale=$scale x=$x y=$y size=$size', (v) => {

      const { scale, x, y, size, targetW, targetH, expectedResult } = v
      const renderer = makePaintCursorRenderer(makeReusableCanvas)

      const mask = makeCirclePaintBinaryMask(size)

      const centerOffsetX = mask.centerOffsetX
      const centerOffsetY = mask.centerOffsetY
      const w = mask.w
      const h = mask.h

      const ox = x + centerOffsetX
      const oy = y + centerOffsetY

      renderer.update(mask, scale, cyan)

      const { toPixelData } = makeTargetCanvas(targetW, targetH)

      const result = toPixelData(renderer, x, y)

      const maskPixelData = makeTestPixelData(mask.w, mask.h)
      blendColorPixelDataBinaryMask(maskPixelData, redTint, mask)
      resamplePixelDataInPlace(maskPixelData, scale)

      blendPixelData(result, maskPixelData, {
        x: ox * scale,
        y: oy * scale,
      })

      expect(
        renderer.getBounds(0, 0),
      ).toEqual({
        y: expect.toSatisfy((v) => v + 0 === centerOffsetY),
        x: expect.toSatisfy((v) => v + 0 === centerOffsetX),
        w: w,
        h: h,
      })

      expect(
        renderer.getBounds(2, 3),
      ).toEqual({
        x: centerOffsetX + 2,
        y: centerOffsetY + 3,
        w: w,
        h: h,
      })

      expect(
        renderer.getBoundsScaled(10, 20),
      ).toEqual({
        x: (centerOffsetX + 10) * scale - 1,
        y: (centerOffsetY + 20) * scale - 1,
        w: w * scale,
        h: h * scale,
      })

      // printPixelDataGrid(result, new Map([
      //   [cyan, 'C'],
      //   [redTint, 'r'],
      // ]))
      expect(result).toMatchPixelGrid(expectedResult)
    })
  })

  it('alpha mask', () => {
    const scale = 1
    const x = 6
    const y = 6
    const size = 12
    const targetW = 12
    const targetH = 12

    const renderer = makePaintCursorRenderer(makeReusableCanvas)

    const mask = makeCirclePaintAlphaMask(size)

    const centerOffsetX = mask.centerOffsetX
    const centerOffsetY = mask.centerOffsetY
    const w = mask.w
    const h = mask.h

    const ox = x + centerOffsetX
    const oy = y + centerOffsetY

    renderer.update(mask, scale, cyan)

    const { toPixelData } = makeTargetCanvas(targetW, targetH)

    const result = toPixelData(renderer, x, y)

    const maskPixelData = makeTestPixelData(mask.w, mask.h)

    blendPixelData(result, maskPixelData, {
      x: ox * scale,
      y: oy * scale,
    })

    expect(
      renderer.getBounds(0, 0),
    ).toEqual({
      y: expect.toSatisfy((v) => v + 0 === centerOffsetY),
      x: expect.toSatisfy((v) => v + 0 === centerOffsetX),
      w: w,
      h: h,
    })

    expect(
      renderer.getBounds(2, 3),
    ).toEqual({
      x: centerOffsetX + 2,
      y: centerOffsetY + 3,
      w: w,
      h: h,
    })

    expect(
      renderer.getBoundsScaled(10, 20),
    ).toEqual({
      x: (centerOffsetX + 10) * scale - 1,
      y: (centerOffsetY + 20) * scale - 1,
      w: w * scale,
      h: h * scale,
    })

    // printPixelDataGrid(result, new Map([
    //   [cyan, 'C'],
    //   [redTint, 'r'],
    // ]))

    expect(result).toMatchPixelGrid([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, C, C, C, C, C, C, 0, 0, 0,
      0, 0, C, C, 0, 0, 0, 0, C, C, 0, 0,
      0, 0, C, 0, 0, 0, 0, 0, 0, C, 0, 0,
      0, 0, C, 0, 0, 0, 0, 0, 0, C, 0, 0,
      0, 0, C, 0, 0, 0, 0, 0, 0, C, 0, 0,
      0, 0, C, 0, 0, 0, 0, 0, 0, C, 0, 0,
      0, 0, C, C, 0, 0, 0, 0, C, C, 0, 0,
      0, 0, 0, C, C, C, C, C, C, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
  })

  it('binary mask', () => {
    const scale = 1
    const x = 6
    const y = 6
    const targetW = 12
    const targetH = 12

    const renderer = makePaintCursorRenderer(makeReusableCanvas)

    const bMask = makeTestBinaryMask(8, 7, [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, r, 0, 0, 0,
      0, 0, r, r, r, r, 0, 0,
      0, 0, 0, 0, r, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
    ])

    const mask = makePaintBinaryMask(bMask)

    const centerOffsetX = mask.centerOffsetX
    const centerOffsetY = mask.centerOffsetY
    const w = mask.w
    const h = mask.h

    const ox = x + centerOffsetX
    const oy = y + centerOffsetY

    renderer.update(mask, scale, cyan)

    const { toPixelData } = makeTargetCanvas(targetW, targetH)

    const result = toPixelData(renderer, x, y)

    const maskPixelData = makeTestPixelData(mask.w, mask.h)

    blendPixelData(result, maskPixelData, {
      x: ox * scale,
      y: oy * scale,
    })

    expect(
      renderer.getBounds(0, 0),
    ).toEqual({
      y: expect.toSatisfy((v) => v + 0 === centerOffsetY),
      x: expect.toSatisfy((v) => v + 0 === centerOffsetX),
      w: w,
      h: h,
    })

    expect(
      renderer.getBounds(2, 3),
    ).toEqual({
      x: centerOffsetX + 2,
      y: centerOffsetY + 3,
      w: w,
      h: h,
    })

    expect(
      renderer.getBoundsScaled(10, 20),
    ).toEqual({
      x: (centerOffsetX + 10) * scale - 1,
      y: (centerOffsetY + 20) * scale - 1,
      w: w * scale,
      h: h * scale,
    })

    // printPixelDataGrid(result, new Map([
    //   [cyan, 'C'],
    //   [redTint, 'r'],
    // ]))

    expect(result).toMatchPixelGrid([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, C, C, C, 0, 0, 0, 0,
      0, 0, 0, C, C, C, 0, C, C, 0, 0, 0,
      0, 0, 0, C, 0, 0, 0, 0, C, 0, 0, 0,
      0, 0, 0, C, C, C, 0, C, C, 0, 0, 0,
      0, 0, 0, 0, 0, C, C, C, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
  })

  it('should handle partial settings update', () => {

    const renderer = makePaintCursorRenderer(makeReusableCanvas)

    const defaults = {
      color: cyan,
      scale: 1,
      currentBrush: {
        type: null,
        data: null,
        centerOffsetX: -4,
        centerOffsetY: -4,
        outlineType: 2,
        w: 1,
        h: 1,
      },
    }

    expect(renderer.getSettings()).toEqual(defaults)

    renderer.update(undefined, undefined, redTint)

    const settings1 = {
      ...defaults,
      color: redTint,
    }

    expect(renderer.getSettings()).toEqual(settings1)

    renderer.update(undefined, 3)

    const settings2 = {
      ...settings1,
      scale: 3,
    }

    expect(renderer.getSettings()).toEqual(settings2)
  })

  it('changing scale or cursor updates scaledCenterOffsets', () => {
    const renderer = makePaintCursorRenderer(makeReusableCanvas)

    renderer.update(undefined, 4)

    expect(renderer.getBoundsScaled(0, 0).x).toEqual(-17)
    expect(renderer.getBoundsScaled(0, 0).y).toEqual(-17)

    renderer.update(undefined, 6)

    expect(renderer.getBoundsScaled(0, 0).x).toEqual(-25)
    expect(renderer.getBoundsScaled(0, 0).y).toEqual(-25)

  })

  it('should use fallback', () => {

    useOffscreenCanvasMock()
    const renderer = makePaintCursorRenderer()

    renderer.update(undefined, 4)

    const ctx = {
      drawImage: vi.fn(),
    } as any

    renderer.draw(ctx, 5, 6)

    expect(ctx.drawImage).toHaveBeenCalledWith(
      expect.toSatisfy((v) => v instanceof OffscreenCanvasMock),
      3,
      7,
    )
  })
})

function makeTargetCanvas(w = 100, h = 100) {
  const targetCanvas = createCanvas(w, h)

  const targetCtx = targetCanvas.getContext('2d') as unknown as CanvasRenderingContext2D
  targetCtx.imageSmoothingEnabled = false
  return {
    targetCanvas,
    targetCtx,
    toPixelData: (renderer: PaintCursorRenderer, x: number, y: number) => {
      renderer.draw(targetCtx, x, y)

      const result = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height)
      return makePixelData(result)
    },
  }
}
