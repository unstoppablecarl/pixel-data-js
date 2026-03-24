import { describe, expect, it } from 'vitest'
import { type BinaryMask, type Color32 } from '@/index'
import { blendColorPixelDataBinaryMask } from '@/index'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const copyBlend = (s: Color32) => s

describe('blendColorPixelDataBinaryMask', () => {
  it('handles BinaryMask skip/pass and inversion', () => {
    const dst = makeTestPixelData(4, 1, BLUE)
    const mask = new Uint8Array([1, 0, 1, 0]) as BinaryMask

    blendColorPixelDataBinaryMask(dst, RED, mask)
    expect(dst.data32[0]).toBe(RED)
    expect(dst.data32[1]).toBe(BLUE)

    const dst2 = makeTestPixelData(4, 1, BLUE)
    blendColorPixelDataBinaryMask(dst2, RED, mask,{  invertMask: true })
    expect(dst2.data32[0]).toBe(BLUE)
    expect(dst2.data32[1]).toBe(RED)
  })

  it('aligns mask using dx/dy displacement logic and custom pitch', () => {
    const dst = makeTestPixelData(10, 10, BLUE)
    const mask = new Uint8Array(16).fill(0) as BinaryMask
    mask[10] = 1 // At mw: 4, this is x:2, y:2

    blendColorPixelDataBinaryMask(dst, RED, mask,{
      x: 5, y: 5, w: 1, h: 1, mw: 4, mx: 2, my: 2
    })
    expect(dst.data32[55]).toBe(RED) // 5 * 10 + 5
  })

  it('verifies multi-row mask alignment across every pixel', () => {
    const dst = makeTestPixelData(5, 5, 0)
    const mask = new Uint8Array(25) as BinaryMask
    for (let i = 0; i < 25; i++) mask[i] = i % 2 === 0 ? 1 : 0

    blendColorPixelDataBinaryMask(dst, RED,mask, {  blendFn: copyBlend })

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const mIdx = y * 5 + x
        expect(dst.data32[y * 5 + x]).toBe(mask[mIdx] === 1 ? RED : 0)
      }
    }
  })

  it('respects my and mx offsets even when clipping occurs', () => {
    const dst = makeTestPixelData(1, 1, BLUE)
    const mask = new Uint8Array([0, 0, 0, 1]) as BinaryMask

    blendColorPixelDataBinaryMask(dst, RED, mask,{
      x: -1, y: -1, w: 2, h: 2, mw: 2, mx: 0, my: 0, blendFn: copyBlend
    })

    // Destination clipped to 0,0. Displacement dx=1, dy=1. Mask reads index 3 (which is 1)
    expect(dst.data32[0]).toBe(RED)
  })
})
