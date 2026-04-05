import { PixelData } from './PixelData'

export function copyPixelData(target: PixelData): PixelData {
  const data = target.imageData.data
  const buffer = new Uint8ClampedArray(data)

  return new PixelData(new ImageData(
    buffer,
    target.width,
    target.height,
  ))
}
