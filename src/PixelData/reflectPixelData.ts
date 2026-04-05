import type { PixelData32 } from '../_types'

export function reflectPixelDataHorizontal(pixelData: PixelData32): void {
  const width = pixelData.w
  const height = pixelData.h
  const data = pixelData.data32
  const halfWidth = Math.floor(width / 2)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width

    for (let x = 0; x < halfWidth; x++) {
      const leftIdx = rowOffset + x
      const rightIdx = rowOffset + (width - 1 - x)
      const temp = data[leftIdx]

      data[leftIdx] = data[rightIdx]
      data[rightIdx] = temp
    }
  }
}

export function reflectPixelDataVertical(pixelData: PixelData32): void {
  const width = pixelData.w
  const height = pixelData.h
  const data = pixelData.data32
  const halfHeight = Math.floor(height / 2)

  for (let y = 0; y < halfHeight; y++) {
    const topRowOffset = y * width
    const bottomRowOffset = (height - 1 - y) * width

    for (let x = 0; x < width; x++) {
      const topIdx = topRowOffset + x
      const bottomIdx = bottomRowOffset + x
      const temp = data[topIdx]

      data[topIdx] = data[bottomIdx]
      data[bottomIdx] = temp
    }
  }
}
