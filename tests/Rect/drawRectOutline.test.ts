import { color32ToCssRGBA } from '@/color'
import { drawRectObjOutline, drawRectOutline } from '@/Rect/drawRectOutline'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { canvasCtxToTestPixelData, pack } from '../_helpers'

describe('drawRectOutline', () => {
  const redTint = pack(255, 0, 0, 120)
  const cyan = pack(0, 255, 255, 255)
  const C = cyan
  const r = redTint
  const redCssColor = color32ToCssRGBA(redTint)
  const cyanCssColor = color32ToCssRGBA(cyan)

  const cases = [
    {
      scale: 1,
      x: 2,
      y: 3,
      w: 4,
      h: 5,
      thickness: 1,
      targetW: 8,
      targetH: 10,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, C, C, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, r, r, r, r, C, 0,
        0, C, C, C, C, C, C, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      scale: 1,
      x: 4,
      y: 5,
      w: 6,
      h: 7,
      thickness: 2,
      targetW: 16,
      targetH: 16,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, 0, 0, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, C, C, 0, 0, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, 0, 0, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,

      ],
    },
    {
      scale: 2,
      x: 2,
      y: 3,
      w: 4,
      h: 5,
      thickness: 1,
      targetW: 14,
      targetH: 18,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, C, C, C, C, C, C, C, C, C, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, r, r, r, r, r, r, r, r, C, 0,
        0, 0, 0, C, C, C, C, C, C, C, C, C, C, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
    {
      scale: 2,
      x: 2,
      y: 3,
      w: 4,
      h: 5,
      thickness: 2,
      targetW: 16,
      targetH: 20,
      expectedResult: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, C, C, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, r, r, r, r, r, r, r, r, C, C, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, C, C, 0, 0,
        0, 0, C, C, C, C, C, C, C, C, C, C, C, C, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    },
  ]
  it.each(cases)('drawRectOutline scale=$scale x=$x y=$y w=$w h=$h', (v) => {

    const { scale, x, y, w, h, expectedResult, targetW, targetH, thickness } = v

    const canvas = createCanvas(targetW, targetH)
    const ctx = canvas.getContext('2d')! as unknown as CanvasRenderingContext2D

    drawRectOutline(ctx, x, y, w, h, cyanCssColor, scale, thickness)

    ctx.fillStyle = redCssColor
    ctx.fillRect(
      x * scale,
      y * scale,
      w * scale,
      h * scale,
    )

    const result = canvasCtxToTestPixelData(ctx)

    // printPixelDataGrid(result, new Map([
    //   [C, 'C'],
    //   [r, 'r'],
    // ]))

    expect(result).toMatchPixelGrid(expectedResult)

  })

  it.each(cases)('drawRectOutlineObj scale=$scale x=$x y=$y w=$w h=$h', (v) => {

    const { scale, x, y, w, h, expectedResult, targetW, targetH, thickness } = v

    const canvas = createCanvas(targetW, targetH)
    const ctx = canvas.getContext('2d')! as unknown as CanvasRenderingContext2D

    drawRectObjOutline(ctx, { x, y, w, h }, cyanCssColor, scale, thickness)

    ctx.fillStyle = redCssColor
    ctx.fillRect(
      x * scale,
      y * scale,
      w * scale,
      h * scale,
    )

    const result = canvasCtxToTestPixelData(ctx)

    // printPixelDataGrid(result, new Map([
    //   [C, 'C'],
    //   [r, 'r'],
    // ]))

    expect(result).toMatchPixelGrid(expectedResult)

  })
})
