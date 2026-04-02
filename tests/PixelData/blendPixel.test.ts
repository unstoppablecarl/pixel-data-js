import { type BlendColor32, blendPixel, type Color32, sourceOverFast } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('blendPixel', () => {
  it('should return false immediately if global alpha is 0', () => {
    let target = makeTestPixelData(1, 1)
    let color = 0xFFFFFFFF as Color32

    let result = blendPixel(target, 0, 0, color, 0, sourceOverFast)

    expect(result).toBe(false)
    expect(target.data32[0]).toBe(0)
  })

  it('should return false if coordinates are out of bounds', () => {
    let target = makeTestPixelData(10, 10)
    let color = 0xFFFFFFFF as Color32

    expect(blendPixel(target, -1, 5, color)).toBe(false)
    expect(blendPixel(target, 5, -1, color)).toBe(false)
    expect(blendPixel(target, 10, 5, color)).toBe(false)
    expect(blendPixel(target, 5, 10, color)).toBe(false)
    expect(target.data32.some((p) => p !== 0)).toBe(false)
  })

  it('should return false if source color is completely transparent and not in overwrite mode', () => {
    let target = makeTestPixelData(1, 1)
    let transparentColor = 0x00FFFFFF as Color32 // Alpha is 00
    let mockBlend = vi.fn()

    let result = blendPixel(target, 0, 0, transparentColor, 255, mockBlend)

    expect(result).toBe(false)
    expect(mockBlend).not.toHaveBeenCalled()
  })

  it('should NOT return false for transparent source if blend mode is isOverwrite', () => {
    let target = makeTestPixelData(1, 1)
    target.data32[0] = 0xFFFFFFFF as Color32 // Opaque white background

    let transparentColor = 0x00FF0000 as Color32 // Transparent red

    let mockBlend = vi.fn().mockReturnValue(transparentColor) as unknown as BlendColor32
    mockBlend.isOverwrite = true

    let result = blendPixel(target, 0, 0, transparentColor, 255, mockBlend)

    expect(result).toBe(true)
    expect(mockBlend).toHaveBeenCalled()
    expect(target.data32[0]).toBe(transparentColor)
  })

  it('should apply partial alpha correctly and modify the target', () => {
    let target = makeTestPixelData(10, 10)
    let x = 5
    let y = 5
    let color = 0xFF0000FF as Color32
    let alpha = 128

    let result = blendPixel(target, x, y, color, alpha, sourceOverFast)

    let index = y * target.width + x
    let finalColor = target.data32[index]
    let finalAlpha = finalColor >>> 24

    expect(result).toBe(true)
    expect(finalAlpha).toBeCloseTo(128, -1)
  })

  it('should return false if partial alpha reduces final alpha to 0 and not in overwrite mode', () => {
    let target = makeTestPixelData(1, 1)
    let color = 0x01FFFFFF as Color32 // Barely visible alpha (1)
    let lowAlpha = 1 // Tiny global multiplier
    let mockBlend = vi.fn()

    // finalAlpha = (1 * 1 + 128) >> 8 === 0
    let result = blendPixel(target, 0, 0, color, lowAlpha, mockBlend)

    expect(result).toBe(false)
    expect(mockBlend).not.toHaveBeenCalled()
  })

  it('should NOT return false if partial alpha reduces to 0 but blend mode is isOverwrite', () => {
    let target = makeTestPixelData(1, 1)
    target.data32[0] = 0xFFFFFFFF as Color32

    let color = 0x01FFFFFF as Color32
    let lowAlpha = 1

    let mockBlend = vi.fn().mockReturnValue(0x00FFFFFF as Color32) as unknown as BlendColor32
    mockBlend.isOverwrite = true

    let result = blendPixel(target, 0, 0, color, lowAlpha, mockBlend)

    expect(result).toBe(true)
    expect(mockBlend).toHaveBeenCalled()
    expect(target.data32[0]).toBe(0x00FFFFFF)
  })

  it('should use the specified blend function', () => {
    let target = makeTestPixelData(10, 10)
    let x = 1
    let y = 1
    let bgColor = 0xFF00FF00 as Color32
    let srcColor = 0x80FF0000 as Color32

    let index = y * target.width + x
    target.data32[index] = bgColor

    let blendFn = vi.fn().mockReturnValue(0xDEADBEEF as Color32) as unknown as BlendColor32

    let result = blendPixel(target, x, y, srcColor, 255, blendFn)

    expect(result).toBe(true)
    expect(blendFn).toHaveBeenCalledWith(srcColor, bgColor)
    expect(target.data32[index]).toBe(0xDEADBEEF)
  })

  it('should return false and not update the buffer if the blend function results in the exact same color', () => {
    let target = makeTestPixelData(1, 1)
    let bgColor = 0xFF000000 as Color32
    target.data32[0] = bgColor

    let srcColor = 0xFF000000 as Color32

    // Using sourceOverFast, drawing transparent over solid black results in solid black
    let result = blendPixel(target, 0, 0, srcColor, 255, sourceOverFast)

    expect(result).toBe(false)
    expect(target.data32[0]).toBe(bgColor) // Buffer untouched
  })
})
