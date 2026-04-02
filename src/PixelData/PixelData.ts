import type { ImageDataLike, IPixelData } from '../_types'
import { imageDataToUInt32Array } from '../ImageData/imageDataToUInt32Array'

export class PixelData<T extends ImageDataLike = ImageData> implements IPixelData<T> {
  readonly data32: Uint32Array
  readonly imageData: T
  readonly width: number
  readonly height: number

  constructor(imageData: T) {
    this.data32 = imageDataToUInt32Array(imageData)
    this.imageData = imageData
    this.width = imageData.width
    this.height = imageData.height
  }

  set(imageData: T): void {
    ;(this as any).imageData = imageData
    ;(this as any).data32 = imageDataToUInt32Array(imageData)
    ;(this as any).width = imageData.width
    ;(this as any).height = imageData.height
  }
}
