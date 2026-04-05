import type { PixelData } from '../_types'
import { setPixelData } from './PixelData'

/**
 * Rotates pixel data 90 degrees clockwise.
 * If the image is square, it performs the rotation in-place.
 * If rectangular, it replaces the internal ImageData with a new rotated version.
 */
export function rotatePixelData(pixelData: PixelData): void {
  const width = pixelData.width
  const height = pixelData.height
  const data = pixelData.data32

  if (width === height) {
    rotateSquareInPlace(pixelData)
    return
  }

  const newWidth = height
  const newHeight = width
  const newData32 = new Uint32Array(data.length)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldIdx = y * width + x
      const newX = height - 1 - y
      const newY = x
      const newIdx = newY * newWidth + newX

      newData32[newIdx] = data[oldIdx]
    }
  }

  // To update a rectangular PixelData, we must create a new ImageData
  // since width/height are read-only properties of the native object.
  const newImageData = new ImageData(
    new Uint8ClampedArray(newData32.buffer),
    newWidth,
    newHeight,
  )

  setPixelData(pixelData, newImageData)
}

function rotateSquareInPlace(pixelData: PixelData): void {
  const n = pixelData.width
  const data = pixelData.data32

  for (let i = 0; i < n / 2; i++) {
    for (let j = i; j < n - i - 1; j++) {
      const top = i * n + j
      const right = j * n + (n - 1 - i)
      const bottom = (n - 1 - i) * n + (n - 1 - j)
      const left = (n - 1 - j) * n + i

      const temp = data[top]
      data[top] = data[left]
      data[left] = data[bottom]
      data[bottom] = data[right]
      data[right] = temp
    }
  }
}
