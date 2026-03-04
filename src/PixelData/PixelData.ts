import { imageDataToUInt32Array } from '../ImageData/imageDataToUInt32Array'

export class PixelData {
  public data32: Uint32Array
  public imageData!: ImageData

  get width(): number {
    return this.imageData.width
  }

  get height(): number {
    return this.imageData.height
  }

  constructor(imageData: ImageData) {
    this.data32 = imageDataToUInt32Array(imageData)
    this.imageData = imageData
  }

  set(imageData: ImageData): void {
    this.imageData = imageData
    this.data32 = imageDataToUInt32Array(imageData)
  }

  /**
   * Creates a deep copy of the PixelData using the environment's ImageData constructor.
   */
  copy(): PixelData {
    const buffer = new Uint8ClampedArray(this.imageData.data)

    // Fallback to the object's own constructor if the global ImageData is missing (Node tests)
    const ImageConstructor = (typeof ImageData !== 'undefined'
      ? ImageData
      : (this.imageData.constructor as typeof ImageData))

    const newImageData = new ImageConstructor(
      buffer,
      this.width,
      this.height,
    )

    return new PixelData(newImageData)
  }
}
