import { makeRectBinaryMaskOutline } from '@/Mask/BinaryMask/makeRectBinaryMaskOutline'
import { blendColorPixelDataBinaryMask } from '@/PixelData/blendColorPixelDataBinaryMask'
import { fillPixelData } from '@/PixelData/fillPixelData'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData, pack, printPixelDataGrid } from '../../_helpers'

describe('makeRectBinaryMaskOutline', () => {
  const redTint = pack(255, 0, 0, 120)
  const cyan = pack(0, 255, 255, 120)
  const C = cyan
  const r = redTint

  const cases = [
    {
      scale: 1,
      w: 4,
      h: 3,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, C, C, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, C, C, C, C, C, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      scale: 2,
      w: 4,
      h: 5,
      targetW: 10,
      targetH: 12,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, C, C, C, C, C, C, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, r, r, r, r, r, r, r, r, C, 0,
        0, C, C, C, C, C, C, C, C, C, C, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
  ]
  it.each(cases)('case scale=$scale x=$x y=$y w=$w h=$h', (v) => {

    const { scale, w, h, expectedResult } = v

    const mask = makeRectBinaryMaskOutline(w, h, scale)

    const result = makeTestPixelData(w * scale + 4, h * scale + 4)

    blendColorPixelDataBinaryMask(result, cyan, mask, { x: 1, y: 1 })

    fillPixelData(result, redTint, { x: 2, y: 2, w: w * scale, h: h * scale })

    printPixelDataGrid(result, new Map([
      [C, 'C'],
      [r, 'r'],
    ]))

    expect(result).toMatchPixelGrid(expectedResult)

  })
})
