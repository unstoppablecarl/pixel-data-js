import { makeRectFalloffPaintAlphaMask } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makeRectFalloffPaintAlphaMask', () => {
  it('should generate a 5x5 square mask with linear falloff', () => {
    const mask = makeRectFalloffPaintAlphaMask(5, 5)

    expect(Array.from(mask.data)).toEqual([
      50, 50, 50, 50, 50,
      50, 153, 153, 153, 50,
      50, 153, 255, 153, 50,
      50, 153, 153, 153, 50,
      50, 50, 50, 50, 50,
    ])
  })

  it('should handle even dimensions (8x8) correctly', () => {
    const mask = makeRectFalloffPaintAlphaMask(8, 8)

    expect(Array.from(mask.data)).toEqual([
      31, 31, 31, 31, 31, 31, 31, 31,
      31, 95, 95, 95, 95, 95, 95, 31,
      31, 95, 159, 159, 159, 159, 95, 31,
      31, 95, 159, 223, 223, 159, 95, 31,
      31, 95, 159, 223, 223, 159, 95, 31,
      31, 95, 159, 159, 159, 159, 95, 31,
      31, 95, 95, 95, 95, 95, 95, 31,
      31, 31, 31, 31, 31, 31, 31, 31,
    ])
  })

  it('should handle rectangular dimensions (10x4)', () => {
    const mask = makeRectFalloffPaintAlphaMask(10, 4)

    expect(Array.from(mask.data)).toEqual([
      25, 63, 63, 63, 63, 63, 63, 63, 63, 25,
      25, 76, 127, 178, 191, 191, 178, 127, 76, 25,
      25, 76, 127, 178, 191, 191, 178, 127, 76, 25,
      25, 63, 63, 63, 63, 63, 63, 63, 63, 25,
    ])
  })

  it('should apply a custom falloff function (step function)', () => {
    const stepFalloff = (d: number) => (d > 0.5 ? 1 : 0)
    const mask = makeRectFalloffPaintAlphaMask(
      10,
      10,
      stepFalloff,
    )

    expect(Array.from(mask.data)).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 255, 255, 255, 255, 0, 0, 0,
      0, 0, 0, 255, 255, 255, 255, 0, 0, 0,
      0, 0, 0, 255, 255, 255, 255, 0, 0, 0,
      0, 0, 0, 255, 255, 255, 255, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
  })

  it('should apply a quadratic falloff function', () => {
    const quadratic = (d: number) => d * d
    const mask = makeRectFalloffPaintAlphaMask(
      7,
      7,
      quadratic,
    )

    expect(Array.from(mask.data)).toEqual([
      5, 5, 5, 5, 5, 5, 5,
      5, 46, 46, 46, 46, 46, 5,
      5, 46, 130, 130, 130, 46, 5,
      5, 46, 130, 255, 130, 46, 5,
      5, 46, 130, 130, 130, 46, 5,
      5, 46, 46, 46, 46, 46, 5,
      5, 5, 5, 5, 5, 5, 5,
    ])
  })

  it('should have correct metadata for centering even and odd numbers', () => {
    const mask = makeRectFalloffPaintAlphaMask(15, 16)

    expect(mask.w).toBe(15)
    expect(mask.h).toBe(16)
    // Checking offsets based on your macro_halfAndFloor implementation
    expect(mask.centerOffsetX).toBe(-7)
    expect(mask.centerOffsetY).toBe(-8)
  })
})
