import type { ImageDataLikeConstructor, ImageDataLike } from '../_types'
import { imageDataToUInt32Array } from '../ImageData/imageDataToUInt32Array'

export class PixelData<T extends ImageDataLike = ImageData> {
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

  set(imageData: ImageData): void {
    ;(this as any).imageData = imageData
    ;(this as any).data32 = imageDataToUInt32Array(imageData)
    ;(this as any).width = imageData.width
    ;(this as any).height = imageData.height
  }

  copy(): PixelData<T> {
    const buffer = new Uint8ClampedArray(this.imageData.data as Uint8ClampedArray)
    const ImageConstructor = this.imageData.constructor as ImageDataLikeConstructor<T>

    const newImageData = new ImageConstructor(
      buffer,
      this.width,
      this.height,
    )

    return new PixelData<T>(newImageData)
  }
}
