import { color32ToCssRGBA } from '@/color'
import { drawCircleBinaryMaskOutline, drawCirclePaintBinaryMaskOutline } from '@/Paint/drawCircleBinaryMaskOutline'
import { makeCirclePaintBinaryMask } from '@/Paint/makeCirclePaintMask'
import { blendColorPixelDataBinaryMask } from '@/PixelData/blendColorPixelDataBinaryMask'
import { blendPixelData } from '@/PixelData/blendPixelData'
import { resamplePixelDataInPlace } from '@/PixelData/resamplePixelData'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { canvasCtxToTestPixelData, makeTestPixelData, pack, printPixelDataGrid } from '../_helpers'

describe('drawCircleBinaryMaskOutline and drawCirclePaintBinaryMaskOutline', () => {
  const redTint = pack(255, 0, 0, 120)
  const cyan = pack(0, 255, 255, 255)
  const C = cyan
  const r = redTint
  const cyanCssColor = color32ToCssRGBA(cyan)

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
      0, 0, 0, 0, C, 0, 0, 0,
      0, 0, 0, C, r, C, 0, 0,
      0, 0, 0, 0, C, 0, 0, 0,
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
        0, 0, 0, C, C, 0, 0, 0,
        0, 0, C, r, r, C, 0, 0,
        0, 0, C, r, r, C, 0, 0,
        0, 0, 0, C, C, 0, 0, 0,
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
        0, 0, 0, C, C, C, 0, 0,
        0, 0, C, r, r, r, C, 0,
        0, 0, C, r, r, r, C, 0,
        0, 0, C, r, r, r, C, 0,
        0, 0, 0, C, C, C, 0, 0,
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
        0, 0, 0, C, C, 0, 0, 0,
        0, 0, C, r, r, C, 0, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, 0, C, r, r, C, 0, 0,
        0, 0, 0, C, C, 0, 0, 0,
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
        0, 0, 0, 0, 0, 0, C, C, C, C, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
        0, 0, 0, 0, C, C, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0, 0, 0,
        0, 0, 0, 0, C, C, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, 0, 0, 0, C, r, r, r, r, C, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, C, C, C, C, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
  ]

  describe.each(cases)('test case scale=$scale x=$x y=$y size=$size', (v) => {
    const { scale, x, y, size, targetW, targetH, expectedResult } = v

    it('drawCircleBinaryMaskOutline', () => {
      const mask = makeCirclePaintBinaryMask(size)

      const centerOffsetX = mask.centerOffsetX
      const centerOffsetY = mask.centerOffsetY

      const ox = x + centerOffsetX
      const oy = y + centerOffsetY

      const canvas = createCanvas(targetW, targetH)
      const ctx = canvas.getContext('2d')! as unknown as CanvasRenderingContext2D

      drawCircleBinaryMaskOutline(ctx, mask, cyanCssColor, ox, oy, scale)

      const result = canvasCtxToTestPixelData(ctx)

      const maskPixelData = makeTestPixelData(mask.w, mask.h)
      blendColorPixelDataBinaryMask(maskPixelData, redTint, mask)
      resamplePixelDataInPlace(maskPixelData, scale)

      blendPixelData(result, maskPixelData, {
        x: ox * scale,
        y: oy * scale,
      })

      // printPixelDataGrid(result, new Map([
      //   [cyan, 'C'],
      //   [redTint, 'r'],
      // ]))
      expect(result).toMatchPixelGrid(expectedResult)
    })

    it('drawCirclePaintBinaryMaskOutline', () => {
      const mask = makeCirclePaintBinaryMask(size)

      const centerOffsetX = mask.centerOffsetX
      const centerOffsetY = mask.centerOffsetY

      const ox = x + centerOffsetX
      const oy = y + centerOffsetY

      const canvas = createCanvas(targetW, targetH)
      const ctx = canvas.getContext('2d')! as unknown as CanvasRenderingContext2D

      drawCirclePaintBinaryMaskOutline(ctx, mask, cyanCssColor, x, y, scale)

      const result = canvasCtxToTestPixelData(ctx)

      const maskPixelData = makeTestPixelData(mask.w, mask.h)
      blendColorPixelDataBinaryMask(maskPixelData, redTint, mask)
      resamplePixelDataInPlace(maskPixelData, scale)

      blendPixelData(result, maskPixelData, {
        x: ox * scale,
        y: oy * scale,
      })

      // printPixelDataGrid(result, new Map([
      //   [cyan, 'C'],
      //   [redTint, 'r'],
      // ]))
      expect(result).toMatchPixelGrid(expectedResult)
    })
  })
})
