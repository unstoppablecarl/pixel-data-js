import type { PixelData } from '../_types'

export class PixelEngineConfig {
  readonly tileSize: number
  // pixelX = tileX << tileShift
  // pixelY = tileY << tileShift
  readonly tileShift: number
  readonly tileMask: number
  readonly tileArea: number
  readonly target!: PixelData
  readonly targetColumns: number = 0
  readonly targetRows: number = 0

  constructor(tileSize: number, target: PixelData) {
    // Ensure it's a power of 2 to guarantee bitwise math works
    if ((tileSize & (tileSize - 1)) !== 0) {
      throw new Error('tileSize must be a power of 2')
    }

    this.tileSize = tileSize
    this.tileShift = 31 - Math.clz32(tileSize)
    this.tileMask = tileSize - 1
    this.tileArea = tileSize * tileSize
    this.target = target
    this.targetColumns = (target.w + this.tileMask) >> this.tileShift
    this.targetRows = (target.h + this.tileMask) >> this.tileShift
  }
}
