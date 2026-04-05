import { makeImageDataLike } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makeImageDataLike', () => {
  it('should allocate a new buffer when data is not provided', () => {
    const width = 10
    const height = 10
    const result = makeImageDataLike(width, height)
    const expectedLength = 400
    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.data.length).toBe(expectedLength)
    expect(result.data[0]).toBe(0)
  })

  it('should wrap an existing buffer when data is provided', () => {
    const width = 1
    const height = 1
    const raw = Buffer.from([255, 128, 64, 255])
    const result = makeImageDataLike(width, height, raw)
    expect(result.data[0]).toBe(255)
    expect(result.data[1]).toBe(128)
  })

  it('should maintain a live link to the provided buffer', () => {
    const width = 1
    const height = 1
    const raw = Buffer.alloc(4)
    const result = makeImageDataLike(width, height, raw)
    // Mutate the original Buffer
    raw[0] = 100
    // The "Like" object should reflect the change immediately
    expect(result.data[0]).toBe(100)
  })

  it('should handle buffer offsets correctly when using subarrays', () => {
    const width = 1
    const height = 1
    const bigBuffer = Buffer.from([0, 0, 0, 0, 10, 20, 30, 40])
    const sub = bigBuffer.subarray(4)
    const result = makeImageDataLike(width, height, sub)
    expect(result.data[0]).toBe(10)
    expect(result.data[3]).toBe(40)
  })
})
