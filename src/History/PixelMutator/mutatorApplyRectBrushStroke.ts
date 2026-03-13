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
import { getRectBrushBounds } from '../../PixelData/applyRectBrushToPixelData'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { PixelWriter } from '../PixelWriter'

const strokeBoundsOut: Rect = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

const rectBrushBounds: Rect = {
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

export function mutatorApplyRectBrushStroke(writer: PixelWriter<any>) {

  return {
    applyRectBrushStroke(
      color: Color32,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      brushWidth: number,
      brushHeight: number,
      alpha = 255,
      fallOff?: (dist: number) => number,
      blendFn: BlendColor32 = sourceOverPerfect,
    ) {
      const {
        x: bx,
        y: by,
        w: bw,
        h: bh,
      } = getRectBrushStrokeBounds(
        x0,
        y0,
        x1,
        y1,
        brushWidth,
        brushHeight,
        strokeBoundsOut,
      )

      if (bw <= 0 || bh <= 0) return

      const useAlpha = fallOff !== undefined
      const mask = new Uint8Array(bw * bh) as AnyMask

      const halfW = brushWidth / 2
      const halfH = brushHeight / 2
      const invHalfW = 1 / halfW
      const centerOffset = (brushWidth % 2 === 0) ? 0.5 : 0

      const targetWidth = writer.target.width
      const targetHeight = writer.target.height

      forEachLinePoint(x0, y0, x1, y1, (px, py) => {
        const {
          x: rbx,
          y: rby,
          w: rbw,
          h: rbh,
        } = getRectBrushBounds(
          px,
          py,
          brushWidth,
          brushHeight,
          targetWidth,
          targetHeight,
          rectBrushBounds,
        )

        writer.accumulator.storeRegionBeforeState(
          rbx,
          rby,
          rbw,
          rbh,
        )

        const startX = Math.max(bx, rbx)
        const startY = Math.max(by, rby)
        const endX = Math.min(bx + bw, rbx + rbw)
        const endY = Math.min(by + bh, rby + rbh)

        const fPx = Math.floor(px)
        const fPy = Math.floor(py)

        for (let my = startY; my < endY; my++) {
          const dy = Math.abs((my - fPy) + centerOffset)
          const maskRowOffset = (my - by) * bw

          for (let mx = startX; mx < endX; mx++) {
            const dx = Math.abs((mx - fPx) + centerOffset)
            const maskIdx = maskRowOffset + (mx - bx)

            if (dx <= halfW && dy <= halfH) {
              if (useAlpha) {
                // Normalize distance based on the larger dimension for falloff
                const dist = Math.max(dx * invHalfW, dy * (1 / halfH))
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

      blendColorPixelData(
        writer.target,
        color,
        blendColorPixelOptions,
      )
    },
  }
}

export function getRectBrushStrokeBounds(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  brushWidth: number,
  brushHeight: number,
  result: Rect,
): Rect {
  const halfW = brushWidth / 2
  const halfH = brushHeight / 2

  const minX = Math.min(x0, x1) - halfW
  const minY = Math.min(y0, y1) - halfH
  const maxX = Math.max(x0, x1) + halfW
  const maxY = Math.max(y0, y1) + halfH

  result.x = Math.floor(minX)
  result.y = Math.floor(minY)
  result.w = Math.ceil(maxX - minX)
  result.h = Math.ceil(maxY - minY)

  return result
}
