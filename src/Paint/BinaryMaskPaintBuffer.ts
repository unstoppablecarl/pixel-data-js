import { type Color32 } from '../_types'
import { forEachLinePoint } from '../Algorithm/forEachLinePoint'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import type { PixelAccumulator } from '../History/PixelAccumulator'
import type { PixelEngineConfig } from '../History/PixelEngineConfig'
import { _macro_paintRectCenterOffset } from '../Internal/macros'
import { blendColorPixelDataBinaryMask } from '../PixelData/blendColorPixelDataBinaryMask'
import type { Rect } from '../Rect/_rect-types'
import { trimRectBounds } from '../Rect/trimRectBounds'
import type { BinaryMaskTile } from '../Tile/_tile-types'
import type { TilePool } from '../Tile/TilePool'
import type { PaintBinaryMask } from './_paint-types'
import { eachTileInBounds } from './eachTileInBounds'

export class BinaryMaskPaintBuffer {
  readonly lookup: (BinaryMaskTile | undefined)[]
  private readonly scratchBounds: Rect = { x: 0, y: 0, w: 0, h: 0 }

  private blendColorPixelDataBinaryMaskFn = blendColorPixelDataBinaryMask
  private forEachLinePointFn = forEachLinePoint
  private trimRectBoundsFn = trimRectBounds
  private eachTileInBoundsFn = eachTileInBounds

  constructor(
    readonly config: PixelEngineConfig,
    readonly tilePool: TilePool<BinaryMaskTile>,
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
    brushWidth: number,
    brushHeight: number,
    x: number,
    y: number,
  ): boolean
  paintRect(
    brushWidth: number,
    brushHeight: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintRect(
    brushWidth: number,
    brushHeight: number,
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

    const centerOffsetX = _macro_paintRectCenterOffset(brushWidth)
    const centerOffsetY = _macro_paintRectCenterOffset(brushHeight)

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

  private opts = {
    alpha: 255,
    blendFn: sourceOverPerfect,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  commit(
    accumulator: PixelAccumulator,
    color: Color32,
    alpha = 255,
    blendFn = sourceOverPerfect,
  ) {
    const blendColorPixelDataBinaryMaskFn = this.blendColorPixelDataBinaryMaskFn
    const tileShift = this.config.tileShift
    const lookup = this.lookup
    const opts = this.opts

    opts.alpha = alpha
    opts.blendFn = blendFn

    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        const didChange = accumulator.storeTileBeforeState(tile.id, tile.tx, tile.ty)

        const dx = tile.tx << tileShift
        const dy = tile.ty << tileShift

        opts.x = dx
        opts.y = dy
        opts.w = tile.w
        opts.h = tile.h

        didChange(
          blendColorPixelDataBinaryMaskFn(
            this.config.target,
            color,
            tile,
            opts,
          ),
        )
      }
    }

    this.clear()
  }

  clear(): void {
    this.tilePool.releaseTiles(this.lookup)
  }
}
