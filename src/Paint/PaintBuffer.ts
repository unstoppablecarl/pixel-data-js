import type { Color32, PaintAlphaMask, PaintBinaryMask, Rect } from '../_types'
import { forEachLinePoint } from '../Algorithm/forEachLinePoint'
import type { PixelEngineConfig } from '../History/PixelEngineConfig'
import { _macro_paintRectCenterOffset } from '../Internal/macros'
import type { PixelTile } from '../PixelTile/PixelTile'
import type { PixelTilePool } from '../PixelTile/PixelTilePool'
import { trimRectBounds } from '../Rect/trimRectBounds'

export class PaintBuffer {
  readonly lookup: (PixelTile | undefined)[]
  private readonly scratchBounds: Rect = { x: 0, y: 0, w: 0, h: 0 }

  constructor(
    readonly config: PixelEngineConfig,
    readonly tilePool: PixelTilePool,
  ) {
    this.lookup = []
  }

  private eachTileInBounds(
    bounds: Rect,
    callback: (tile: PixelTile, bX: number, bY: number, bW: number, bH: number) => void,
  ): void {
    const { tileShift, targetColumns, targetRows, tileSize } = this.config

    const x1 = Math.max(0, bounds.x >> tileShift)
    const y1 = Math.max(0, bounds.y >> tileShift)
    const x2 = Math.min(targetColumns - 1, (bounds.x + bounds.w - 1) >> tileShift)
    const y2 = Math.min(targetRows - 1, (bounds.y + bounds.h - 1) >> tileShift)

    if (x1 > x2 || y1 > y2) return

    const lookup = this.lookup
    const tilePool = this.tilePool

    for (let ty = y1; ty <= y2; ty++) {
      const rowOffset = ty * targetColumns
      const tileTop = ty << tileShift

      for (let tx = x1; tx <= x2; tx++) {
        const id = rowOffset + tx
        const tile = lookup[id] ?? (lookup[id] = tilePool.getTile(id, tx, ty))
        const tileLeft = tx << tileShift

        const startX = bounds.x > tileLeft ? bounds.x : tileLeft
        const startY = bounds.y > tileTop ? bounds.y : tileTop

        const maskEndX = bounds.x + bounds.w
        const tileEndX = tileLeft + tileSize
        const endX = maskEndX < tileEndX ? maskEndX : tileEndX

        const maskEndY = bounds.y + bounds.h
        const tileEndY = tileTop + tileSize
        const endY = maskEndY < tileEndY ? maskEndY : tileEndY

        callback(tile, startX, startY, endX - startX, endY - startY)
      }
    }
  }

  paintAlphaMask(
    color: Color32,
    brush: PaintAlphaMask,
    x: number,
    y: number,
  ): boolean
  paintAlphaMask(
    color: Color32,
    brush: PaintAlphaMask,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintAlphaMask(
    color: Color32,
    brush: PaintAlphaMask,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {
    const cA = color >>> 24
    if (cA === 0) return false

    const { tileShift, tileMask, target } = this.config
    const { w: bW, h: bH, data: bD, centerOffsetX, centerOffsetY } = brush
    const cRGB = color & 0x00ffffff
    const scratch = this.scratchBounds

    let changed = false

    forEachLinePoint(x0, y0, x1, y1, (px, py) => {

      const topLeftX = Math.floor(px + centerOffsetX)
      const topLeftY = Math.floor(py + centerOffsetY)
      trimRectBounds(
        topLeftX,
        topLeftY,
        bW,
        bH,
        target.w,
        target.h,
        scratch,
      )

      if (scratch.w <= 0 || scratch.h <= 0) return

      this.eachTileInBounds(scratch, (tile, bX, bY, bW_t, bH_t) => {
        const d32 = tile.data32
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

            const t = cA * brushA + 128
            const blendedA = (t + (t >> 8)) >> 8

            const idx = dS + j
            const cur = d32[idx]
            if (brushA > (cur >>> 24)) {
              const next = (cRGB | (blendedA << 24)) >>> 0
              if (cur !== next) {
                d32[idx] = next as Color32
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

  paintBinaryMask(
    color: Color32,
    brush: PaintBinaryMask,
    x: number,
    y: number,
  ): boolean
  paintBinaryMask(
    color: Color32,
    brush: PaintBinaryMask,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintBinaryMask(
    color: Color32,
    brush: PaintBinaryMask,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {
    const alphaIsZero = (color >>> 24) === 0
    if (alphaIsZero) return false

    const { tileShift, tileMask, target } = this.config
    const { w: bW, h: bH, data: bD, centerOffsetX, centerOffsetY } = brush
    const scratch = this.scratchBounds
    let changed = false

    forEachLinePoint(x0, y0, x1, y1, (px, py) => {
      const topLeftX = Math.floor(px + centerOffsetX)
      const topLeftY = Math.floor(py + centerOffsetY)

      trimRectBounds(
        topLeftX,
        topLeftY,
        bW,
        bH,
        target.w,
        target.h,
        scratch,
      )

      if (scratch.w <= 0 || scratch.h <= 0) return

      this.eachTileInBounds(scratch, (tile, bX, bY, bW_t, bH_t) => {
        const d32 = tile.data32
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
              if (d32[idx] !== color) {
                d32[idx] = color
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
    color: Color32,
    brushWidth: number,
    brushHeight: number,
    x: number,
    y: number,
  ): boolean
  paintRect(
    color: Color32,
    brushWidth: number,
    brushHeight: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean
  paintRect(
    color: Color32,
    brushWidth: number,
    brushHeight: number,
    x0: number,
    y0: number,
    x1: number = x0,
    y1: number = y0,
  ): boolean {
    const alphaIsZero = (color >>> 24) === 0
    if (alphaIsZero) return false

    const config = this.config
    const tileShift = config.tileShift
    const tileMask = config.tileMask
    const target = config.target
    const scratch = this.scratchBounds

    const centerOffsetX = -_macro_paintRectCenterOffset(brushWidth)
    const centerOffsetY = -_macro_paintRectCenterOffset(brushHeight)

    let changed = false

    forEachLinePoint(
      x0,
      y0,
      x1,
      y1,
      (px, py) => {
        const topLeftX = Math.floor(px + centerOffsetX)
        const topLeftY = Math.floor(py + centerOffsetY)

        trimRectBounds(
          topLeftX,
          topLeftY,
          brushWidth,
          brushHeight,
          target.w,
          target.h,
          scratch,
        )

        if (scratch.w <= 0 || scratch.h <= 0) return

        this.eachTileInBounds(
          scratch,
          (tile, bX, bY, bW_t, bH_t) => {
            const d32 = tile.data32
            let tileChanged = false

            for (let i = 0; i < bH_t; i++) {
              const canvasY = bY + i
              const tOff = (canvasY & tileMask) << tileShift
              const dS = tOff + (bX & tileMask)

              for (let j = 0; j < bW_t; j++) {
                const idx = dS + j

                if (d32[idx] !== color) {
                  d32[idx] = color
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
