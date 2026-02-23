import type { ImageDataLike } from '../_types'

export class PixelData {
  public data32: Uint32Array
  public width: number
  public height: number

  constructor(public readonly imageData: ImageDataLike) {
    this.width = imageData.width
    this.height = imageData.height

    // Create the view once.
    this.data32 = new Uint32Array(
      imageData.data.buffer,
      imageData.data.byteOffset,
      // Shift right by 2 is a fast bitwise division by 4.
      imageData.data.byteLength >> 2,
    )
  }

  copy(): PixelData {
    const buffer = new Uint8ClampedArray(this.data32.buffer.slice(0))
    const imageData = {
      data: buffer,
      width: this.width,
      height: this.height,
    }

    return new PixelData(imageData)
  }
}
