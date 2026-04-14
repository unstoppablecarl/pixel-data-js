import { colorDistance } from '@/index'
import { describe, expect, it } from 'vitest'
import { pack } from '../_helpers'

describe('Color Calculations', () => {
  it('should calculate squared Euclidean distance between colors', () => {
    const colorA = pack(100, 100, 100, 255)
    const colorB = pack(110, 100, 100, 255)

    // (110-100)^2 + 0 + 0 + 0 = 100
    expect(colorDistance(colorA, colorB)).toBe(100)
  })
})
