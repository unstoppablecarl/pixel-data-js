import { describe, expect, it } from 'vitest'
import { PixelBuffer32 } from '@/index'

describe('PixelBuffer32', () => {
  it('should initialize with correct dimensions and zeroed data', () => {
    const width = 2
    const height = 2
    const buffer = new PixelBuffer32(width, height)
    const expectedLength = 4
    expect(buffer.width).toBe(width)
    expect(buffer.height).toBe(height)
    expect(buffer.data32.length).toBe(expectedLength)
    expect(buffer.data32[0]).toBe(0)
  })

  it('should allow providing a pre-allocated Uint32Array', () => {
    const width = 1
    const height = 1
    const data = new Uint32Array([0xff00ff00])
    const buffer = new PixelBuffer32(width, height, data)
    expect(buffer.data32[0]).toBe(0xff00ff00)
  })

  it('should update properties correctly using set()', () => {
    const buffer = new PixelBuffer32(1, 1)
    const newWidth = 6
    const newHeight = 7
    const newData = new Uint32Array(newWidth * newHeight)
    newData[0] = 42
    buffer.set(newWidth, newHeight, newData)
    expect(buffer.width).toBe(newWidth)
    expect(buffer.height).toBe(newHeight)
    expect(buffer.data32[0]).toBe(42)
  })

  it('should update properties correctly using set() without new Uint32Array', () => {
    const buffer = new PixelBuffer32(1, 1)
    const newWidth = 5
    const newHeight = 6
    buffer.set(newWidth, newHeight)
    expect(buffer.width).toBe(newWidth)
    expect(buffer.height).toBe(newHeight)
    expect(buffer.data32.length).toBe(newWidth * newHeight)
  })

  it('should create a deep copy of the data using copy()', () => {
    const width = 2
    const height = 1
    const original = new PixelBuffer32(width, height)
    original.data32[0] = 0xffffffff
    const clone = original.copy()
    // Verify values match
    expect(clone.width).toBe(original.width)
    expect(clone.data32[0]).toBe(0xffffffff)
    // Verify memory is independent
    clone.data32[0] = 0x00000000
    expect(original.data32[0]).toBe(0xffffffff)
    expect(clone.data32[0]).toBe(0)
  })

  it('should handle "hot" mutations without losing reference', () => {
    const data = new Uint32Array([1, 2, 3, 4])
    const buffer = new PixelBuffer32(2, 2, data)
    // Direct mutation of the source array
    data[0] = 99
    // The class instance should reflect the change immediately
    expect(buffer.data32[0]).toBe(99)
  })
})
