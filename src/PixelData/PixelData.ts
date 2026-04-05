import type { ImageDataLike, PixelData } from '../_types'
import { _macro_imageDataToUInt32Array } from '../ImageData/imageDataToUInt32Array'

export function makePixelData<T extends ImageDataLike = ImageData>(imageData: T): PixelData<T> {
  return {
    data32: _macro_imageDataToUInt32Array(imageData),
    imageData,
    width: imageData.width,
    height: imageData.height,
  }
}

export function setPixelData(target: PixelData, imageData: ImageData) {
  ;(target as any).data32 = _macro_imageDataToUInt32Array(imageData)
  ;(target as any).imageData = imageData
  ;(target as any).width = imageData.width
  ;(target as any).height = imageData.height
}
