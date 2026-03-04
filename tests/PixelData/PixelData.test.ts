import { createImageData } from '@napi-rs/canvas/node-canvas'
import { describe, expect, it } from 'vitest'
import { PixelData } from '../../src'
import { ImageData as NapiImageData } from '@napi-rs/canvas'

describe('PixelData', () => {
  it('should initialize width, height, and data32 view', () => {
    const width = 2
    const height = 2
    // 4 pixels * 4 bytes = 16 bytes
    const buffer = new Uint8ClampedArray(16)
    const imageData = createImageData(buffer, width, height) as ImageData

    const pixelData = new PixelData(imageData)

    expect(pixelData.width).toBe(width)
    expect(pixelData.height).toBe(height)
    expect(pixelData.data32.length).toBe(4)
  })

  it('should correctly map Uint8 colors to a single Uint32 value', () => {
    const buffer = new Uint8ClampedArray(4)
    // RGBA: 255, 0, 0, 255 (Red)
    buffer[0] = 255
    buffer[1] = 0
    buffer[2] = 0
    buffer[3] = 255
    const imageData = createImageData(buffer, 1, 1) as ImageData

    const pixelData = new PixelData(imageData)

    // On little-endian systems, 0xFF0000FF is Red
    // 0x (Alpha)(Blue)(Green)(Red) -> 0xFF 00 00 FF
    expect(pixelData.data32[0]).toBe(0xFF0000FF)
  })

  it('should create a deep copy with the copy() method', () => {
    const buffer = new Uint8ClampedArray(4)
    buffer.fill(255)
    const imageData = createImageData(buffer, 1, 1) as ImageData

    const original = new PixelData(imageData)
    const clone = original.copy()

    // Modify the original
    original.data32[0] = 0x00000000

    expect(clone.data32[0]).toBe(0xFFFFFFFF)
    expect(clone.width).toBe(original.width)
    expect(clone.height).toBe(original.height)
    expect(clone).not.toBe(original)
  })

  it('should use the instance constructor when global ImageData is undefined', () => {
    // Ensure global is clean for this specific test
    const originalGlobal = global.ImageData
    // @ts-ignore
    delete global.ImageData
    // @ts-ignore
    delete window.ImageData

    const buffer = new Uint8ClampedArray(4)
    const napiImg = new NapiImageData(buffer, 1, 1)
    const pixelData = new PixelData(napiImg as unknown as ImageData)

    const copied = pixelData.copy()

    expect(copied.width).toBe(1)
    // Verify it used the NAPI constructor by checking the instance type
    expect(copied.imageData).toBeInstanceOf(NapiImageData)

    // Restore for other tests
    global.ImageData = originalGlobal
  })
})
