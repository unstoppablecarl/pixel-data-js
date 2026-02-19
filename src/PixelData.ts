import type { ImageDataLike } from './_types'

export class PixelData {
  public readonly data32: Uint32Array
  public readonly width: number
  public readonly height: number

  constructor(public readonly imageData: ImageDataLike) {
    this.width = imageData.width
    this.height = imageData.height

    // Create the view once.
    // Shift right by 2 is a fast bitwise division by 4.
    this.data32 = new Uint32Array(
      imageData.data.buffer,
      imageData.data.byteOffset,
      imageData.data.byteLength >> 2,
    )
  }
}
