import { writePixelData } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('writePixelData', () => {

  it('should copy source data to target at specific coordinates', () => {
    const target = makeTestPixelData(4, 4, 0)
    const source = makeTestPixelData(2, 2, 0xFFFFFFFF)

    writePixelData(target, source, 1, 1)

    // Check a pixel inside the written area (1, 1) -> index 5
    expect(target.data[5]).toBe(0xFFFFFFFF)
    // Check a pixel outside the written area (0, 0) -> index 0
    expect(target.data[0]).toBe(0)
  })

  it('should clip when source is partially off the left/top edges', () => {
    const target = makeTestPixelData(3, 3, 0)
    const source = makeTestPixelData(2, 2, 0xAAAAAAAA)

    // Offset is -1, -1. Only the bottom-right pixel of source should hit (0, 0)
    writePixelData(target, source, -1, -1)

    expect(target.data[0]).toBe(0xAAAAAAAA)
    expect(target.data[1]).toBe(0)
    expect(target.data[3]).toBe(0)
  })

  it('should clip when source is partially off the right/bottom edges', () => {
    const target = makeTestPixelData(2, 2, 0)
    const source = makeTestPixelData(2, 2, 0xBBBBBBBB)

    // Only (0, 0) of source fits at (1, 1) of target
    writePixelData(target, source, 1, 1)

    expect(target.data[3]).toBe(0xBBBBBBBB)
    expect(target.data[0]).toBe(0)
  })

  it('should return early if source is completely out of bounds', () => {
    const target = makeTestPixelData(2, 2, 0)
    const source = makeTestPixelData(2, 2, 0xFFFFFFFF)

    writePixelData(target, source, 5, 5)

    expect(target.data.every(v => v === 0)).toBe(true)
  })

  it('should handle source larger than target (cropping)', () => {
    const target = makeTestPixelData(2, 2, 0)
    const source = makeTestPixelData(10, 10, 0xCCCCCCCC)

    writePixelData(target, source, 0, 0)

    expect(target.data.every(v => v === 0xCCCCCCCC)).toBe(true)
    expect(target.w).toBe(2)
  })

  it('should work with default coordinates (0, 0)', () => {
    const target = makeTestPixelData(2, 2, 0)
    const source = makeTestPixelData(1, 1, 0xDDDDDDDD)

    writePixelData(target, source)

    expect(target.data[0]).toBe(0xDDDDDDDD)
  })
})
