import { getCircleBinaryMaskOutline } from '@/Mask/getCircleBinaryMaskOutline'
import { makeCirclePaintBinaryMask } from '@/Paint/makeCirclePaintMask'
import { blendColorPixelDataBinaryMask } from '@/PixelData/blendColorPixelDataBinaryMask'
import { blendPixelData } from '@/PixelData/blendPixelData'
import { resamplePixelDataInPlace } from '@/PixelData/resamplePixelData'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData, pack, printPixelDataGrid } from '../_helpers'

describe('drawCircleBinaryMaskOutline and drawCirclePaintBinaryMaskOutline', () => {
  const redTint = pack(255, 0, 0, 120)
  const cyan = pack(0, 255, 255, 120)
  const C = cyan
  const r = redTint

  const cases = [
    {
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

  describe.each(cases)('test case scale=$scale x=$x y=$y size=$size', (v) => {
    const { scale, x, y, size, targetW, targetH, expectedResult } = v

    it('drawCircleBinaryMaskOutline', () => {
      const mask = makeCirclePaintBinaryMask(size)
      const outlineMask = getCircleBinaryMaskOutline(mask, scale)

      const centerOffsetX = mask.centerOffsetX
      const centerOffsetY = mask.centerOffsetY

      const ox = x + centerOffsetX
      const oy = y + centerOffsetY

      const result = makeTestPixelData(targetW, targetH)

      blendColorPixelDataBinaryMask(result, cyan, outlineMask, {
        x: ox * scale - 1,
        y: oy * scale - 1,
      })

      const maskPixelData = makeTestPixelData(mask.w, mask.h)
      blendColorPixelDataBinaryMask(maskPixelData, redTint, mask)
      resamplePixelDataInPlace(maskPixelData, scale)

      blendPixelData(result, maskPixelData, {
        x: ox * scale,
        y: oy * scale,
      })

      printPixelDataGrid(result, new Map([
        [cyan, 'C'],
        [redTint, 'r'],
      ]))
      expect(result).toMatchPixelGrid(expectedResult)
    })
  })
})
