import {
  type AlphaMask,
  type BlendColor32,
  type CircleBrushAlphaMask,
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
      brush: CircleBrushAlphaMask,
      alpha = 255,
      blendFn: BlendColor32 = sourceOverPerfect,
    ) {
      const brushSize = brush.size

      const {
        x: bx,
        y: by,
        w: bw,
        h: bh,
      } = getCircleBrushOrPencilStrokeBounds(
        x0,
        y0,
        x1,
        y1,
        brushSize,
        strokeBoundsOut,
      )

      if (bw <= 0 || bh <= 0) return

      mask.data = new Uint8Array(bw * bh)
      mask.w = bw
      mask.h = bh

      const maskData = mask.data
      const brushData = brush.data
      const minOffset = brush.minOffset

      const target = writer.config.target
      const targetWidth = target.width
      const targetHeight = target.height

      forEachLinePoint(
        x0,
        y0,
        x1,
        y1,
        (px, py) => {
          const {
            x: cbx,
            y: cby,
            w: cbw,
            h: cbh,
          } = getCircleBrushOrPencilBounds(
            px,
            py,
            brushSize,
            targetWidth,
            targetHeight,
            circleBrushBounds,
          )

          writer.accumulator.storeRegionBeforeState(
            cbx,
            cby,
            cbw,
            cbh,
          )

          const startX = Math.max(bx, cbx)
          const startY = Math.max(by, cby)
          const endX = Math.min(bx + bw, cbx + cbw)
          const endY = Math.min(by + bh, cby + cbh)

          const unclippedStartX = Math.floor(px + minOffset)
          const unclippedStartY = Math.floor(py + minOffset)

          for (let my = startY; my < endY; my++) {
            const strokeMaskY = my - by
            const strokeMaskRowOffset = strokeMaskY * bw

            const brushY = my - unclippedStartY
            const brushRowOffset = brushY * brushSize

            for (let mx = startX; mx < endX; mx++) {
              const brushX = mx - unclippedStartX
              const brushVal = brushData[brushRowOffset + brushX]

              if (brushVal > 0) {
                const strokeMaskIdx = strokeMaskRowOffset + (mx - bx)

                if (brushVal > maskData[strokeMaskIdx]) {
                  maskData[strokeMaskIdx] = brushVal
                }
              }
            }
          }
        },
      )

      blendColorPixelOptions.blendFn = blendFn
      blendColorPixelOptions.alpha = alpha
      blendColorPixelOptions.x = bx
      blendColorPixelOptions.y = by
      blendColorPixelOptions.w = bw
      blendColorPixelOptions.h = bh

      blendColorPixelDataAlphaMask(
        target,
        color,
        mask as AlphaMask,
        blendColorPixelOptions,
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
