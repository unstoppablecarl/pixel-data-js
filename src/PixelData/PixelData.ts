import type { ImageDataLike, ImageDataLikeConstructor, IPixelData } from '../_types'
import { imageDataToUInt32Array } from '../ImageData/imageDataToUInt32Array'

export class PixelData<T extends ImageDataLike = ImageData> implements IPixelData {
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

  // should only be used for debug and testing
  copy(): PixelData<T> {
    const data = this.imageData.data
    const buffer = new Uint8ClampedArray(data)
    const Ctor = this.imageData.constructor
    const isCtorValid = typeof Ctor === 'function'

    let newImageData: T
    if (isCtorValid && Ctor !== Object) {
      const ImageConstructor = Ctor as ImageDataLikeConstructor<T>
      newImageData = new ImageConstructor(
        buffer,
        this.width,
        this.height,
      )
    } else {
      newImageData = {
        width: this.width,
        height: this.height,
        data: buffer,
      } as unknown as T
    }

    return new PixelData<T>(newImageData)
  }
}
