import type { ImageDataLike } from '../ImageData/_ImageData-types'
import { _macro_imageDataToUint32Array } from '../ImageData/imageDataToUint32Array'
import type { PixelData } from './_pixelData-types'

export function makePixelData<T extends ImageDataLike = ImageData>(imageData: T): PixelData<T> {
  return {
    data: _macro_imageDataToUint32Array(imageData),
    imageData,
    w: imageData.width,
    h: imageData.height,
  }
}

export function setPixelData(target: PixelData, imageData: ImageData) {
  ;(target as any).data = _macro_imageDataToUint32Array(imageData)
  ;(target as any).imageData = imageData
  ;(target as any).w = imageData.width
  ;(target as any).h = imageData.height
}
