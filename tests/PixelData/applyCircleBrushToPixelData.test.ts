import { describe, expect, it, vi } from 'vitest'
import { PixelData } from '../../src'
import { applyCircleBrushToPixelData } from '../../src/PixelData/applyCircleBrushToPixelData'

describe('applyCircleBrushToPixelData', () => {
  const createMockPixelData = (width: number, height: number) => {
    const buffer = new Uint8ClampedArray(width * height * 4)

    const imageData = {
      data: buffer,
      width: width,
      height: height,
    } as ImageData

    return new PixelData(imageData)
  }

  it('colors the correct pixels for a solid brush', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xff0000ff as any // Red

    applyCircleBrushToPixelData(target, color, 5, 5, 4, 255)

    const centerIdx = 5 * 10 + 5
    const cornerIdx = 0

    expect(target.data32[centerIdx]).toBe(0xff0000ff)
    expect(target.data32[cornerIdx]).toBe(0)
  })

  it('applies fallOff correctly when provided', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any
    const fallOff = vi.fn(() => 0.5)

    applyCircleBrushToPixelData(target, color, 5, 5, 2, 255, fallOff)

    expect(fallOff).toHaveBeenCalled()
    const centerIdx = 5 * 10 + 5
    // 0.5 * 255 = 127.5 -> 127
    expect(target.data32[centerIdx] >>> 24).toBe(127)
  })

  it('handles even brush sizes with center offset', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    // Size 2 brush at 5,5 should color 4 pixels if it hits the corners
    applyCircleBrushToPixelData(target, color, 5, 5, 2, 255)

    const count = target.data32.filter(p => p !== 0).length
    expect(count).toBeGreaterThan(0)
  })

  it('clips correctly when brush is partially off-screen (Top-Left)', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    // Center at 0,0 size 10 covers top left quadrant
    applyCircleBrushToPixelData(target, color, 0, 0, 10, 255)

    expect(target.data32[0]).toBe(0xffffffff)
  })

  it('clips correctly when brush is partially off-screen (Bottom-Right)', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    applyCircleBrushToPixelData(target, color, 9, 9, 10, 255)

    expect(target.data32[99]).toBe(0xffffffff)
  })

  it('does nothing if the brush is entirely outside the target', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    applyCircleBrushToPixelData(target, color, 50, 50, 5, 255)

    const hasData = target.data32.some(p => p !== 0)
    expect(hasData).toBe(false)
  })

  it('applies the alpha parameter to the final color', () => {
    const target = createMockPixelData(10, 10)
    const color = 0x0000ff00 as any // Green base
    const customAlpha = 128

    applyCircleBrushToPixelData(target, color, 5, 5, 2, customAlpha)

    const centerIdx = 5 * 10 + 5
    expect(target.data32[centerIdx] >>> 24).toBe(128)
  })
})
