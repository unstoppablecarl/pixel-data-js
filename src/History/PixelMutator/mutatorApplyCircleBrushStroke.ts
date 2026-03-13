import {
  type AnyMask,
  type BlendColor32,
  type Color32,
  type ColorBlendOptions,
  MaskType,
  type Rect,
} from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { forEachLinePoint } from '../../Internal/forEachLinePoint'
import { getCircleBrushBounds } from '../../PixelData/applyCircleBrushToPixelData'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { PixelWriter } from '../PixelWriter'

const strokeBoundsOut: Rect = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

const circleBrushBounds: Rect = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

const blendColorPixelOptions: ColorBlendOptions = {
  maskType: MaskType.ALPHA,
  alpha: 255,
  blendFn: sourceOverPerfect,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

export function mutatorApplyCircleBrushStroke(writer: PixelWriter<any>) {
  return {
    applyCircleBrushStroke(
      color: Color32,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      brushSize: number,
      alpha = 255,
      fallOff?: (dist: number) => number,
      blendFn: BlendColor32 = sourceOverPerfect,
    ) {
      const {
        x: bx,
        y: by,
        w: bw,
        h: bh,
      } = getCircleBrushStrokeBounds(x0, y0, x1, y1, brushSize, strokeBoundsOut)

      if (bw <= 0 || bh <= 0) return

      const useAlpha = fallOff !== undefined
      const mask = new Uint8Array(bw * bh) as AnyMask

      const r = brushSize / 2
      const rSqr = r * r
      const invR = 1 / r
      const centerOffset = (brushSize % 2 === 0) ? 0.5 : 0

      const targetWidth = writer.target.width
      const targetHeight = writer.target.height

      forEachLinePoint(x0, y0, x1, y1, (px, py) => {
        // 2. Calculate bounds for this specific stamp
        const {
          x: cbx,
          y: cby,
          w: cbw,
          h: cbh,
        } = getCircleBrushBounds(px, py, brushSize, targetWidth, targetHeight, circleBrushBounds)

        writer.accumulator.storeRegionBeforeState(cbx, cby, cbw, cbh)

        const startX = Math.max(bx, cbx)
        const startY = Math.max(by, cby)
        const endX = Math.min(bx + bw, cbx + cbw)
        const endY = Math.min(by + bh, cby + cbh)

        const fPx = Math.floor(px)
        const fPy = Math.floor(py)

        for (let my = startY; my < endY; my++) {
          const dy = (my - fPy) + centerOffset
          const dySqr = dy * dy
          const maskRowOffset = (my - by) * bw

          for (let mx = startX; mx < endX; mx++) {
            const dx = (mx - fPx) + centerOffset
            const dSqr = dx * dx + dySqr

            if (dSqr <= rSqr) {
              const maskIdx = maskRowOffset + (mx - bx)

              if (useAlpha) {
                const dist = Math.sqrt(dSqr) * invR
                const intensity = (fallOff!(dist) * 255) | 0
                if (intensity > mask[maskIdx]) {
                  mask[maskIdx] = intensity
                }
              } else {
                mask[maskIdx] = 1
              }
            }
          }
        }
      })

      blendColorPixelOptions.mask = mask
      blendColorPixelOptions.maskType = useAlpha ? MaskType.ALPHA : MaskType.BINARY
      blendColorPixelOptions.blendFn = blendFn
      blendColorPixelOptions.alpha = alpha
      blendColorPixelOptions.x = bx
      blendColorPixelOptions.y = by
      blendColorPixelOptions.w = bw
      blendColorPixelOptions.h = bh

      blendColorPixelData(writer.target, color, blendColorPixelOptions)
    },
  }
}

export function getCircleBrushStrokeBounds(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  brushSize: number,
  result: Rect,
): Rect {
  const r = Math.ceil(brushSize / 2)

  const minX = Math.min(x0, x1) - r
  const minY = Math.min(y0, y1) - r
  const maxX = Math.max(x0, x1) + r
  const maxY = Math.max(x0, y1) + r

  result.x = Math.floor(minX)
  result.y = Math.floor(minY)
  result.w = Math.ceil(maxX - minX)
  result.h = Math.ceil(maxY - minY)

  return result
}
