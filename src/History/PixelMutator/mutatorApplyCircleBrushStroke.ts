import {
  type AlphaMask,
  type BlendColor32,
  type Color32,
  type ColorBlendMaskOptions,
  type HistoryMutator,
  MaskType,
  type Rect,
} from '../../_types'
import { forEachLinePoint } from '../../Algorithm/forEachLinePoint'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { blendColorPixelDataAlphaMask } from '../../PixelData/blendColorPixelDataAlphaMask'
import { getCircleBrushOrPencilBounds } from '../../Rect/getCircleBrushOrPencilBounds'
import { getCircleBrushOrPencilStrokeBounds } from '../../Rect/getCircleBrushOrPencilStrokeBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  forEachLinePoint,
  blendColorPixelDataAlphaMask,
  getCircleBrushOrPencilBounds,
  getCircleBrushOrPencilStrokeBounds,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyCircleBrushStroke = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    forEachLinePoint = defaults.forEachLinePoint,
    blendColorPixelDataAlphaMask = defaults.blendColorPixelDataAlphaMask,
    getCircleBrushOrPencilBounds = defaults.getCircleBrushOrPencilBounds,
    getCircleBrushOrPencilStrokeBounds = defaults.getCircleBrushOrPencilStrokeBounds,
  } = deps

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

  const blendColorPixelOptions: ColorBlendMaskOptions = {
    alpha: 255,
    blendFn: sourceOverPerfect,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const mask = {
    type: MaskType.ALPHA,
    data: null as unknown as Uint8Array,
    w: 0,
    h: 0,
  }

  return {
    applyCircleBrushStroke(
      color: Color32,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      brushSize: number,
      alpha = 255,
      fallOff: (dist: number) => number,
      blendFn: BlendColor32 = sourceOverPerfect,
    ) {
      const {
        x: bx,
        y: by,
        w: bw,
        h: bh,
      } = getCircleBrushOrPencilStrokeBounds(x0, y0, x1, y1, brushSize, strokeBoundsOut)

      if (bw <= 0 || bh <= 0) return

      mask.data = new Uint8Array(bw * bh)
      mask.w = bw
      mask.h = bh

      const maskData = mask.data
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
        } = getCircleBrushOrPencilBounds(px, py, brushSize, targetWidth, targetHeight, circleBrushBounds)

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

              const dist = Math.sqrt(dSqr) * invR
              const intensity = (fallOff(1 - dist) * 255) | 0
              if (intensity > maskData[maskIdx]) {
                maskData[maskIdx] = intensity
              }
            }
          }
        }
      })

      blendColorPixelOptions.blendFn = blendFn
      blendColorPixelOptions.alpha = alpha
      blendColorPixelOptions.x = bx
      blendColorPixelOptions.y = by
      blendColorPixelOptions.w = bw
      blendColorPixelOptions.h = bh

      blendColorPixelDataAlphaMask(writer.target, color, mask as AlphaMask, blendColorPixelOptions)
    },
  }
}) satisfies HistoryMutator<any, Deps>
