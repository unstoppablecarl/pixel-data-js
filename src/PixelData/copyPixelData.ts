import type { ImageDataLike, PixelData } from '../_types'
import { makePixelData } from './PixelData'

export function copyPixelData<T extends ImageDataLike = ImageData>(target: PixelData<T>): PixelData {
  const data = target.imageData.data
  const buffer = new Uint8ClampedArray(data)

  return makePixelData(new ImageData(
    buffer,
    target.w,
    target.h,
  ))
}
