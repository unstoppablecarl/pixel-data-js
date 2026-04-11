import { forEachLinePoint } from '../Algorithm/forEachLinePoint'
import type { PixelEngineConfig } from '../History/PixelEngineConfig'
import type { Rect } from '../Rect/_rect-types'
import { trimRectBounds } from '../Rect/trimRectBounds'
import type { BinaryMaskTile } from '../Tile/_tile-types'
import { makeBinaryMaskTile } from '../Tile/MaskTile'
import { TilePool } from '../Tile/TilePool'
import type { PaintBinaryMask, PaintRect } from './_paint-types'
import { eachTileInBounds } from './eachTileInBounds'

export class BinaryMaskPaintBuffer {
  readonly lookup: (BinaryMaskTile | undefined)[]
  private readonly scratchBounds: Rect = { x: 0, y: 0, w: 0, h: 0 }

  private forEachLinePointFn = forEachLinePoint
  private trimRectBoundsFn = trimRectBounds
  private eachTileInBoundsFn = eachTileInBounds

  constructor(
    readonly config: PixelEngineConfig,
    readonly tilePool: TilePool<BinaryMaskTile> = new TilePool(config, makeBinaryMaskTile),
  ) {
    this.lookup = []
  }

  paintBinaryMask(
    brush: PaintBinaryMask,
    x: number,
    y: number,
  ): boolean
  paintBinaryMask(
    brush: PaintBinaryMask,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintBinaryMask(
    brush: PaintBinaryMask,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {
    const scratch = this.scratchBounds
    const lookup = this.lookup
    const tilePool = this.tilePool
    const config = this.config
    const tileShift = config.tileShift
    const tileMask = config.tileMask
    const target = config.target

    const { w: bW, h: bH, data: bD, centerOffsetX, centerOffsetY } = brush
    let changed = false

    const trimRectBoundsFn = this.trimRectBoundsFn
    const eachTileInBoundsFn = this.eachTileInBoundsFn

    this.forEachLinePointFn(x0, y0, x1, y1, (px, py) => {
      const topLeftX = Math.floor(px + centerOffsetX)
      const topLeftY = Math.floor(py + centerOffsetY)

      trimRectBoundsFn(
        topLeftX,
        topLeftY,
        bW,
        bH,
        target.w,
        target.h,
        scratch,
      )

      if (scratch.w <= 0 || scratch.h <= 0) return

      eachTileInBoundsFn(config, lookup, tilePool, scratch, (tile, bX, bY, bW_t, bH_t) => {
        const data = tile.data
        let tileChanged = false

        for (let i = 0; i < bH_t; i++) {
          const canvasY = bY + i
          const bOff = (canvasY - topLeftY) * bW
          const tOff = (canvasY & tileMask) << tileShift
          const dS = tOff + (bX & tileMask)

          for (let j = 0; j < bW_t; j++) {
            const canvasX = bX + j

            if (bD[bOff + (canvasX - topLeftX)]) {
              const idx = dS + j

              // Only write if it's not already "on"
              if (data[idx] === 0) {
                data[idx] = 1
                tileChanged = true
              }
            }
          }
        }
        if (tileChanged) changed = true
      })
    })

    return changed
  }

  paintRect(
    brush: PaintRect,
    x: number,
    y: number,
  ): boolean
  paintRect(
    brush: PaintRect,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintRect(
    brush: PaintRect,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {
    const scratch = this.scratchBounds
    const lookup = this.lookup
    const tilePool = this.tilePool
    const config = this.config
    const tileShift = config.tileShift
    const tileMask = config.tileMask
    const target = config.target

    const brushWidth = brush.w
    const brushHeight = brush.h
    const centerOffsetX = brush.centerOffsetX
    const centerOffsetY = brush.centerOffsetY

    const trimRectBoundsFn = this.trimRectBoundsFn
    const eachTileInBoundsFn = this.eachTileInBoundsFn

    let changed = false
    this.forEachLinePointFn(
      x0,
      y0,
      x1,
      y1,
      (px, py) => {
        const topLeftX = Math.floor(px + centerOffsetX)
        const topLeftY = Math.floor(py + centerOffsetY)

        trimRectBoundsFn(
          topLeftX,
          topLeftY,
          brushWidth,
          brushHeight,
          target.w,
          target.h,
          scratch,
        )

        if (scratch.w <= 0 || scratch.h <= 0) return

        eachTileInBoundsFn(config, lookup, tilePool, scratch, (tile, bX, bY, bW_t, bH_t) => {
            const data = tile.data
            let tileChanged = false

            for (let i = 0; i < bH_t; i++) {
              const canvasY = bY + i
              const tOff = (canvasY & tileMask) << tileShift
              const dS = tOff + (bX & tileMask)

              for (let j = 0; j < bW_t; j++) {
                const idx = dS + j

                // Only write if it's not already "on"
                if (data[idx] === 0) {
                  data[idx] = 1
                  tileChanged = true
                }
              }
            }

            if (tileChanged) {
              changed = true
            }
          },
        )
      },
    )

    return changed
  }

  clear(): void {
    this.tilePool.releaseTiles(this.lookup)
  }
}
