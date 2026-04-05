import { makePixelData, rotatePixelData } from '@/index'
import { createImageData } from '@napi-rs/canvas/node-canvas'
import { describe, expect, it } from 'vitest'

describe('rotatePixelData', () => {
  it('should rotate a square 2x2 image in-place', () => {
    const imageData = createImageData(2, 2) as ImageData

    const pixelData = makePixelData(imageData)
    const data = pixelData.data32

    // Initial: [1, 2]
    //          [3, 4]
    data[0] = 1
    data[1] = 2
    data[2] = 3
    data[3] = 4

    rotatePixelData(pixelData)

    // Expected: [3, 1]
    //           [4, 2]
    expect(data[0]).toBe(3)
    expect(data[1]).toBe(1)
    expect(data[2]).toBe(4)
    expect(data[3]).toBe(2)
    expect(pixelData.w).toBe(2)
    expect(pixelData.h).toBe(2)
  })

  it('should rotate a rectangular 3x2 image and update dimensions', () => {
    const imageData = createImageData(3, 2) as ImageData

    const pixelData = makePixelData(imageData)
    const data = pixelData.data32

    // Initial (3w x 2h):
    // [1, 2, 3]
    // [4, 5, 6]
    data[0] = 1
    data[1] = 2
    data[2] = 3
    data[3] = 4
    data[4] = 5
    data[5] = 6

    rotatePixelData(pixelData)

    // Expected (2w x 3h):
    // [4, 1]
    // [5, 2]
    // [6, 3]
    expect(pixelData.w).toBe(2)
    expect(pixelData.h).toBe(3)
    expect(pixelData.data32[0]).toBe(4)
    expect(pixelData.data32[1]).toBe(1)
    expect(pixelData.data32[2]).toBe(5)
    expect(pixelData.data32[3]).toBe(2)
    expect(pixelData.data32[4]).toBe(6)
    expect(pixelData.data32[5]).toBe(3)
  })

  it('should preserve all pixels after a full 360-degree rotation', () => {
    const imageData = createImageData(2, 2) as ImageData

    const pixelData = makePixelData(imageData)
    pixelData.data32[0] = 10
    pixelData.data32[1] = 20
    pixelData.data32[2] = 30
    pixelData.data32[3] = 40

    rotatePixelData(pixelData)
    rotatePixelData(pixelData)
    rotatePixelData(pixelData)
    rotatePixelData(pixelData)

    expect(pixelData.data32[0]).toBe(10)
    expect(pixelData.data32[3]).toBe(40)
  })
})
