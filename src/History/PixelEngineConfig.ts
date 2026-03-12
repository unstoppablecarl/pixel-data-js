export class PixelEngineConfig {
  public readonly tileSize: number
  public readonly tileShift: number
  public readonly tileMask: number
  public readonly tileArea: number

  constructor(tileSize: number = 256) {
    // Ensure it's a power of 2 to guarantee bitwise math works
    if ((tileSize & (tileSize - 1)) !== 0) {
      throw new Error('tileSize must be a power of 2')
    }

    this.tileSize = tileSize
    this.tileShift = Math.log2(tileSize)
    this.tileMask = tileSize - 1
    this.tileArea = tileSize * tileSize
  }
}
