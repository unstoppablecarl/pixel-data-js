import { blendColorPixelDataBinaryMask, makeBinaryMaskOutline } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestBinaryMask, makeTestPixelData, pack } from '../../_helpers'

describe('makeBinaryMaskOutline', () => {
  const redTint = pack(255, 0, 0, 120)
  const cyan = pack(0, 255, 255, 120)
  const C = cyan
  const r = redTint

  const cases = [
    {
      scale: 1,
      w: 8,
      h: 5,
      input: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, r, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, 0, 0, 0, 0,
        0, C, r, C, 0, 0, 0, 0,
        0, C, C, C, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      scale: 1,
      w: 8,
      h: 5,
      input: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, r, r, r, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, C, C, 0, 0,
        0, C, r, r, r, C, 0, 0,
        0, C, C, C, C, C, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      scale: 1,
      w: 8,
      h: 7,
      input: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, r, 0, 0, 0,
        0, 0, r, r, r, r, 0, 0,
        0, 0, 0, 0, r, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, C, C, C, r, C, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, C, C, r, C, C, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },

    {
      scale: 1,
      w: 8,
      h: 8,
      input: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, r, r, r, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, r, r, 0, 0, 0,
        0, 0, 0, r, r, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, C, C, 0, 0,
        0, C, r, r, r, C, 0, 0,
        0, C, C, C, C, C, 0, 0,
        0, 0, C, r, r, C, 0, 0,
        0, 0, C, r, r, C, 0, 0,
        0, 0, C, C, C, C, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
  ]

  it.each(cases)('test case scale=$scale x=$x y=$y size=$size', (v) => {
    const { scale, w, h, input, expectedResult } = v

    const inputMask = makeTestBinaryMask(w, h, input)
    const outlineMask = makeBinaryMaskOutline(inputMask, scale)

    const result = makeTestPixelData(w, h)

    blendColorPixelDataBinaryMask(result, redTint, inputMask)
    blendColorPixelDataBinaryMask(result, cyan, outlineMask, { x: -1, y: -1 })

    // printPixelDataGrid(result, new Map([
    //   [cyan, 'C'],
    //   [redTint, 'r'],
    // ]))

    expect(result).toMatchPixelGrid(expectedResult)

  })
})
