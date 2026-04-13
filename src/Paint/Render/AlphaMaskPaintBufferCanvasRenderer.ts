import type { Color32 } from '../../_types'
import type { ReusableCanvasFactory } from '../../Canvas/_canvas-types'
import { makeReusableOffscreenCanvas } from '../../Canvas/ReusableCanvas'
import type { PixelData } from '../../PixelData/_pixelData-types'
import { makeReusablePixelData } from '../../PixelData/ReusablePixelData'
import type { AlphaMaskTile, TileTargetMeta } from '../../Tile/_tile-types'
import type { AlphaMaskPaintBuffer } from '../AlphaMaskPaintBuffer'

export type AlphaMaskPaintBufferCanvasRenderer = ReturnType<typeof makeAlphaMaskPaintBufferCanvasRenderer>

export function makeAlphaMaskPaintBufferCanvasRenderer<T extends HTMLCanvasElement | OffscreenCanvas>(
  paintBuffer: AlphaMaskPaintBuffer,
  reusableCanvasFactory?: () => ReusableCanvasFactory<T>,
) {
  const factory = (reusableCanvasFactory ?? makeReusableOffscreenCanvas) as unknown as () => ReusableCanvasFactory<T>
  const getBuffer = factory()
  const getBridge = makeReusablePixelData()

  let config: TileTargetMeta
  let tileSize: number
  let tileArea: number
  let lookup: (AlphaMaskTile | undefined)[]
  let view32: Uint32Array
  let bridge: PixelData
  let canvas: HTMLCanvasElement | OffscreenCanvas
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  setBuffer(paintBuffer)

  function setBuffer(value: AlphaMaskPaintBuffer) {
    paintBuffer = value
    config = paintBuffer.config
    tileSize = config.tileSize
    tileArea = config.tileArea
    lookup = paintBuffer.lookup
    bridge = getBridge(tileSize, tileSize)
    view32 = bridge.data
    const buff = getBuffer(tileSize, tileSize)
    canvas = buff.canvas
    ctx = buff.ctx
  }

  function draw(
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    color: Color32,
    alpha = 255,
    compOperation: GlobalCompositeOperation = 'source-over',
  ): void {
    if (alpha === 0) return

    const baseSrcAlpha = (color >>> 24)
    const colorRGB = color & 0x00ffffff

    if (baseSrcAlpha === 0) return

    targetCtx.globalAlpha = alpha / 255
    targetCtx.globalCompositeOperation = compOperation

    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        const data8 = tile.data
        view32.fill(0)

        for (let p = 0; p < tileArea; p++) {
          const maskA = data8[p]
          if (maskA === 0) continue

          // If mask is solid, the final pixel is just the unmodified color
          if (maskA === 255) {
            view32[p] = color
          } else {
            // Otherwise, blend the color's inherent alpha with the mask's alpha
            const t = baseSrcAlpha * maskA + 128
            const finalA = (t + (t >> 8)) >> 8

            view32[p] = ((colorRGB | (finalA << 24)) >>> 0) as Color32
          }
        }

        ctx.putImageData(bridge.imageData, 0, 0)
        targetCtx.drawImage(canvas, tile.x, tile.y)
      }
    }

    targetCtx.globalAlpha = 1
    targetCtx.globalCompositeOperation = 'source-over'
  }

  return {
    draw,
    setBuffer,
  }
}
