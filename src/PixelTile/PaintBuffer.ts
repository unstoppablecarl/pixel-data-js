import type { AlphaMaskRect, BinaryMaskRect, Color32, Rect } from '../_types'
import type { PixelEngineConfig } from '../History/PixelEngineConfig'
import type { PixelTile } from './PixelTile'
import type { PixelTilePool } from './PixelTilePool'

export class PaintBuffer {
  readonly lookup: (PixelTile | undefined)[]

  constructor(
    readonly config: PixelEngineConfig,
    readonly tilePool: PixelTilePool,
  ) {
    this.lookup = []
  }

  private processMaskTiles(
    mask: Rect,
    callback: (tile: PixelTile, bX: number, bY: number, bW: number, bH: number, mX: number, mY: number) => void,
  ): void {
    const { tileShift, targetColumns } = this.config

    const x1 = mask.x >> tileShift
    const y1 = mask.y >> tileShift
    const x2 = (mask.x + mask.w - 1) >> tileShift
    const y2 = (mask.y + mask.h - 1) >> tileShift

    for (let ty = y1; ty <= y2; ty++) {
      const tileRowIndex = ty * targetColumns
      const tileTop = ty << tileShift

      for (let tx = x1; tx <= x2; tx++) {
        const id = tileRowIndex + tx
        let tile = this.lookup[id]

        if (!tile) {
          tile = this.tilePool.getTile(id, tx, ty)
          this.lookup[id] = tile
        }

        const tileLeft = tx << tileShift

        const startX = Math.max(mask.x, tileLeft)
        const endX = Math.min(mask.x + mask.w, tileLeft + this.config.tileSize)
        const startY = Math.max(mask.y, tileTop)
        const endY = Math.min(mask.y + mask.h, tileTop + this.config.tileSize)

        // Passing 7 primitive arguments to avoid object allocation
        callback(
          tile,
          startX,
          startY,
          endX - startX,
          endY - startY,
          startX - mask.x,
          startY - mask.y,
        )
      }
    }
  }

  writeColorBinaryMaskRect(color: Color32, mask: BinaryMaskRect): void {
    const { tileShift, tileMask } = this.config
    const maskData = mask.data
    const maskW = mask.w

    this.processMaskTiles(mask, (tile, bX, bY, bW, bH, mX, mY) => {
      const data32 = tile.data32
      const startTileX = bX & tileMask

      for (let i = 0; i < bH; i++) {
        const tileY = (bY + i) & tileMask
        const maskY = mY + i
        const tileRowOffset = tileY << tileShift
        const maskRowOffset = maskY * maskW

        const destStart = tileRowOffset + startTileX
        const maskStart = maskRowOffset + mX

        for (let j = 0; j < bW; j++) {
          if (maskData[maskStart + j]) {
            data32[destStart + j] = color
          }
        }
      }
    })
  }

  writeColorAlphaMaskRect(color: Color32, mask: AlphaMaskRect): void {
    const { tileShift, tileMask } = this.config
    const maskData = mask.data
    const maskW = mask.w
    const colorRGB = color & 0x00ffffff
    const colorA = color >>> 24

    this.processMaskTiles(mask, (tile, bX, bY, bW, bH, mX, mY) => {
      const data32 = tile.data32
      const startTileX = bX & tileMask

      for (let i = 0; i < bH; i++) {
        const tileY = (bY + i) & tileMask
        const maskY = mY + i
        const tileRowOffset = tileY << tileShift
        const maskRowOffset = maskY * maskW

        const destStart = tileRowOffset + startTileX
        const maskStart = maskRowOffset + mX

        for (let j = 0; j < bW; j++) {
          const maskA = maskData[maskStart + j]
          if (maskA > 0) {
            const finalA = (colorA * maskA + 128) >> 8
            data32[destStart + j] = (colorRGB | (finalA << 24)) >>> 0 as Color32
          }
        }
      }
    })
  }

  clear(): void {
    this.tilePool.releaseTiles(this.lookup)
  }
}
