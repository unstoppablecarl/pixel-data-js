import { blendColorPixelDataBinaryMask, type Color32, makeBinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const copyBlend = (s: Color32) => s

describe('blendColorPixelDataBinaryMask', () => {
  it('handles BinaryMask skip/pass and inversion', () => {
    const dst = makeTestPixelData(4, 1, BLUE)
    const mask = makeBinaryMask(4, 1)
    mask.data.set([1, 0, 1, 0])

    const result1 = blendColorPixelDataBinaryMask(dst, RED, mask)

    expect(result1).toBe(true)
    expect(dst.data32[0]).toBe(RED)
    expect(dst.data32[1]).toBe(BLUE)

    const dst2 = makeTestPixelData(4, 1, BLUE)
    const result2 = blendColorPixelDataBinaryMask(dst2, RED, mask, { invertMask: true })

    expect(result2).toBe(true)
    expect(dst2.data32[0]).toBe(BLUE)
    expect(dst2.data32[1]).toBe(RED)
  })

  it('aligns mask using dx/dy displacement logic and custom pitch', () => {
    const dst = makeTestPixelData(10, 10, BLUE)
    const mask = makeBinaryMask(4, 4)
    mask.data[10] = 1 // At mw: 4, this is x:2, y:2

   const result = blendColorPixelDataBinaryMask(dst, RED, mask, {
      x: 5, y: 5, w: 1, h: 1, mx: 2, my: 2,
    })

    expect(result).toBe(true)
    expect(dst.data32[55]).toBe(RED) // 5 * 10 + 5
  })

  it('verifies multi-row mask alignment across every pixel', () => {
    const dst = makeTestPixelData(5, 5, 0)
    const mask = makeBinaryMask(5, 5)
    for (let i = 0; i < 25; i++) {
      mask.data[i] = i % 2 === 0 ? 1 : 0
    }

    const result = blendColorPixelDataBinaryMask(dst, RED, mask, { blendFn: copyBlend })

    expect(result).toBe(true)
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const mIdx = y * 5 + x
        expect(dst.data32[y * 5 + x]).toBe(mask.data[mIdx] === 1 ? RED : 0)
      }
    }
  })

  it('respects my and mx offsets even when clipping occurs', () => {
    const dst = makeTestPixelData(1, 1, BLUE)
    const mask = makeBinaryMask(2, 2)
    mask.data.set([0, 0, 0, 1])
    const result =    blendColorPixelDataBinaryMask(dst, RED, mask, {
      x: -1, y: -1, w: 2, h: 2, mx: 0, my: 0, blendFn: copyBlend,
    })

    expect(result).toBe(true)
    expect(dst.data32[0]).toBe(RED)
  })

  it('returns false when no pixels are changed', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = makeBinaryMask(1, 1)
    mask.data[0] = 1

    const result = blendColorPixelDataBinaryMask(dst, RED, mask)
    expect(result).toBe(false)
  })
})
