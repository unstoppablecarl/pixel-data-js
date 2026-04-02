import type { IPixelData } from '../_types'

export class PixelTile implements IPixelData {
  readonly data32: Uint32Array
  readonly width: number
  readonly height: number
  readonly imageData: ImageData

  constructor(
    public id: number,
    public tx: number,
    public ty: number,
    tileSize: number,
    tileArea: number,
  ) {
    this.width = this.height = tileSize
    this.data32 = new Uint32Array(tileArea)
    const data8 = new Uint8ClampedArray(this.data32.buffer) as Uint8ClampedArray<ArrayBuffer>
    this.imageData = new ImageData(data8, tileSize, tileSize)
  }
}
