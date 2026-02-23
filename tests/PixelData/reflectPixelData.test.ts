import { describe, expect, it } from 'vitest'
import { PixelData } from '../../src'
import { reflectPixelDataHorizontal, reflectPixelDataVertical } from '../../src/PixelData/reflectPixelData'

describe('Reflection Functions', () => {
  describe('reflectPixelDataHorizontal', () => {
    it('should flip pixels left-to-right within each row', () => {
      const buffer = new Uint8ClampedArray(4 * 4)
      const imageData = {
        data: buffer,
        width: 2,
        height: 2,
      }

      const pixelData = new PixelData(imageData)
      const data = pixelData.data32

      // Initial: [1, 2]
      //          [3, 4]
      data[0] = 1
      data[1] = 2
      data[2] = 3
      data[3] = 4

      reflectPixelDataHorizontal(pixelData)

      // Expected: [2, 1]
      //           [4, 3]
      expect(data[0]).toBe(2)
      expect(data[1]).toBe(1)
      expect(data[2]).toBe(4)
      expect(data[3]).toBe(3)
    })
  })

  describe('reflectPixelDataVertical', () => {
    it('should flip pixels top-to-bottom across rows', () => {
      const buffer = new Uint8ClampedArray(4 * 4)
      const imageData = {
        data: buffer,
        width: 2,
        height: 2,
      }

      const pixelData = new PixelData(imageData)
      const data = pixelData.data32

      // Initial: [1, 2]
      //          [3, 4]
      data[0] = 1
      data[1] = 2
      data[2] = 3
      data[3] = 4

      reflectPixelDataVertical(pixelData)

      // Expected: [3, 4]
      //           [1, 2]
      expect(data[0]).toBe(3)
      expect(data[1]).toBe(4)
      expect(data[2]).toBe(1)
      expect(data[3]).toBe(2)
    })
  })

  it('should return to original state after two identical reflections', () => {
    const buffer = new Uint8ClampedArray(4 * 4)
    const imageData = {
      data: buffer,
      width: 2,
      height: 2,
    }

    const pixelData = new PixelData(imageData)
    pixelData.data32[0] = 100

    reflectPixelDataHorizontal(pixelData)
    reflectPixelDataHorizontal(pixelData)

    expect(pixelData.data32[0]).toBe(100)
  })
})
