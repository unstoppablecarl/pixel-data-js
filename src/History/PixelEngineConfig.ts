import type { IPixelData } from '../_types'

export class PixelEngineConfig {
  readonly tileSize: number
  readonly tileShift: number
  readonly tileMask: number
  readonly tileArea: number
  readonly target!: IPixelData
  readonly targetColumns: number = 0

  constructor(tileSize: number, target: IPixelData) {
    // Ensure it's a power of 2 to guarantee bitwise math works
    if ((tileSize & (tileSize - 1)) !== 0) {
      throw new Error('tileSize must be a power of 2')
    }

    this.tileSize = tileSize
    this.tileShift = 31 - Math.clz32(tileSize)
    this.tileMask = tileSize - 1
    this.tileArea = tileSize * tileSize
    this.setTarget(target)
  }

  setTarget(target: IPixelData) {
    ;(this as any).target = target
    ;(this as any).targetColumns = (target.width + this.tileMask) >> this.tileShift
  }
}
