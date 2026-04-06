import { blendColorPixelData, type Color32 } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const copyBlend = (s: Color32) => s

describe('blendColorPixelData (No Mask)', () => {
  it('accurately maps every pixel in a complex clipped grid fill', () => {
    const DW = 10
    const DH = 10
    const dst = makeTestPixelData(DW, DH, BLUE)
    const targetX = 2
    const targetY = 3
    const drawW = 5
    const drawH = 4

    const result = blendColorPixelData(dst, RED, {
      x: targetX,
      y: targetY,
      w: drawW,
      h: drawH,
      blendFn: copyBlend,
    })

    expect(result).toBe(true)

    for (let dy = 0; dy < DH; dy++) {
      for (let dx = 0; dx < DW; dx++) {
        const isInside = dx >= targetX && dx < targetX + drawW && dy >= targetY && dy < targetY + drawH
        if (isInside) {
          expect(dst.data[dy * DW + dx]).toBe(RED)
        } else {
          expect(dst.data[dy * DW + dx]).toBe(BLUE)
        }
      }
    }
  })
})
