import { type Color32, type PaintAlphaMask, type PaintBinaryMask, type Rect } from '../_types'
import { forEachLinePoint } from '../Algorithm/forEachLinePoint'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import type { PixelAccumulator } from '../History/PixelAccumulator'
import type { PixelEngineConfig } from '../History/PixelEngineConfig'
import { _macro_paintRectCenterOffset } from '../Internal/macros'
import { blendColorPixelDataAlphaMask } from '../PixelData/blendColorPixelDataAlphaMask'
import { trimRectBounds } from '../Rect/trimRectBounds'
import type { AlphaMaskTile } from '../Tile/_tile-types'
import type { TilePool } from '../Tile/TilePool'
import { eachTileInBounds } from './eachTileInBounds'

export class AlphaMaskPaintBuffer {
  readonly lookup: (AlphaMaskTile | undefined)[]
  private readonly scratchBounds: Rect = { x: 0, y: 0, w: 0, h: 0 }

  private blendColorPixelDataAlphaMaskFn = blendColorPixelDataAlphaMask
  private forEachLinePointFn = forEachLinePoint
  private trimRectBoundsFn = trimRectBounds
  private eachTileInBoundsFn = eachTileInBounds

  constructor(
    readonly config: PixelEngineConfig,
    readonly tilePool: TilePool<AlphaMaskTile>,
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
    const tileShift = config.tileShift
    const tileMask = config.tileMask
    const target = config.target

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
    brushWidth: number,
    brushHeight: number,
    x: number,
    y: number,
  ): boolean
  paintRect(
    alpha: number,
    brushWidth: number,
    brushHeight: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintRect(
    alpha: number,
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

    const centerOffsetX = -_macro_paintRectCenterOffset(brushWidth)
    const centerOffsetY = -_macro_paintRectCenterOffset(brushHeight)

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
    const blendColorPixelDataAlphaMaskFn = this.blendColorPixelDataAlphaMaskFn
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
          blendColorPixelDataAlphaMaskFn(
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
