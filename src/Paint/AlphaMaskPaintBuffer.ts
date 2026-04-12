import { forEachLinePoint } from '../Algorithm/forEachLinePoint'
import type { Rect } from '../Rect/_rect-types'
import { trimRectBounds } from '../Rect/trimRectBounds'
import type { AlphaMaskTile, TileTargetMeta } from '../Tile/_tile-types'
import { makeAlphaMaskTile } from '../Tile/MaskTile'
import { TilePool } from '../Tile/TilePool'
import type { PaintAlphaMask, PaintBinaryMask, PaintRect } from './_paint-types'
import { eachTileInBounds } from './eachTileInBounds'

export class AlphaMaskPaintBuffer {
  readonly lookup: (AlphaMaskTile | undefined)[]
  private readonly scratchBounds: Rect = { x: 0, y: 0, w: 0, h: 0 }

  private forEachLinePointFn = forEachLinePoint
  private trimRectBoundsFn = trimRectBounds
  private eachTileInBoundsFn = eachTileInBounds

  constructor(
    readonly config: TileTargetMeta,
    readonly tilePool: TilePool<AlphaMaskTile> = new TilePool(config.tileSize, makeAlphaMaskTile),
  ) {
    this.lookup = []
  }

  paintAlphaMask(
    brush: PaintAlphaMask,
    x: number,
    y: number,
  ): boolean
  paintAlphaMask(
    brush: PaintAlphaMask,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintAlphaMask(
    brush: PaintAlphaMask,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {

    const scratch = this.scratchBounds
    const lookup = this.lookup
    const tilePool = this.tilePool
    const config = this.config
    const targetW = config.targetWidth
    const targetH = config.targetHeight
    const tileSize = config.tileSize

    const { w: bW, h: bH, data: bD, centerOffsetX, centerOffsetY } = brush

    let changed = false

    const eachTileInBoundsFn = this.eachTileInBoundsFn
    const trimRectBoundsFn = this.trimRectBoundsFn

    this.forEachLinePointFn(x0, y0, x1, y1, (px, py) => {

      const topLeftX = Math.floor(px + centerOffsetX)
      const topLeftY = Math.floor(py + centerOffsetY)
      trimRectBoundsFn(
        topLeftX,
        topLeftY,
        bW,
        bH,
        targetW,
        targetH,
        scratch,
      )

      if (scratch.w <= 0 || scratch.h <= 0) return

      eachTileInBoundsFn(config, lookup, tilePool, scratch, (tile, bX, bY, bW_t, bH_t) => {
        const data = tile.data
        let tileChanged = false

        for (let i = 0; i < bH_t; i++) {
          const canvasY = bY + i
          const bOff = (canvasY - topLeftY) * bW
          const tOff = (canvasY - tile.y) * tileSize
          const dS = tOff + (bX - tile.x)

          for (let j = 0; j < bW_t; j++) {
            const canvasX = bX + j
            const brushA = bD[bOff + (canvasX - topLeftX)]
            if (brushA === 0) continue
            const idx = dS + j

            // Only overwrite if the brush stroke is stronger than the existing mask pixel
            if (brushA > data[idx]) {
              data[idx] = brushA
              tileChanged = true
            }
          }
        }
        if (tileChanged) changed = true
      })
    })
    return changed
  }

  paintBinaryMask(
    brush: PaintBinaryMask,
    alpha: number,
    x: number,
    y: number,
  ): boolean
  paintBinaryMask(
    brush: PaintBinaryMask,
    alpha: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintBinaryMask(
    brush: PaintBinaryMask,
    alpha: number,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {
    if (alpha === 0) return false

    const scratch = this.scratchBounds
    const lookup = this.lookup
    const tilePool = this.tilePool
    const config = this.config
    const targetW = config.targetWidth
    const targetH = config.targetHeight
    const tileSize = config.tileSize

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
        targetW,
        targetH,
        scratch,
      )

      if (scratch.w <= 0 || scratch.h <= 0) return

      eachTileInBoundsFn(config, lookup, tilePool, scratch, (tile, bX, bY, bW_t, bH_t) => {
        const data = tile.data
        let tileChanged = false

        for (let i = 0; i < bH_t; i++) {
          const canvasY = bY + i
          const bOff = (canvasY - topLeftY) * bW
          const tOff = (canvasY - tile.y) * tileSize
          const dS = tOff + (bX - tile.x)

          for (let j = 0; j < bW_t; j++) {
            const canvasX = bX + j
            if (bD[bOff + (canvasX - topLeftX)]) {
              const idx = dS + j
              if (data[idx] < alpha) {
                data[idx] = alpha
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
    alpha: number,
    brush: PaintRect,
    x: number,
    y: number,
  ): boolean
  paintRect(
    alpha: number,
    brush: PaintRect,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintRect(
    alpha: number,
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
    const targetW = config.targetWidth
    const targetH = config.targetHeight
    const tileSize = config.tileSize

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
          targetW,
          targetH,
          scratch,
        )

        if (scratch.w <= 0 || scratch.h <= 0) return

        eachTileInBoundsFn(config, lookup, tilePool, scratch, (tile, bX, bY, bW_t, bH_t) => {
            const data = tile.data
            let tileChanged = false

            for (let i = 0; i < bH_t; i++) {
              const canvasY = bY + i
              const tOff = (canvasY - tile.y) * tileSize
              const dS = tOff + (bX - tile.x)

              for (let j = 0; j < bW_t; j++) {
                const idx = dS + j

                // If the new alpha is stronger than the current alpha, overwrite it
                if (alpha > data[idx]) {
                  data[idx] = alpha
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
