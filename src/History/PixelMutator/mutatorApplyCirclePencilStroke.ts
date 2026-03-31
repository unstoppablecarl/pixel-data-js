import {
  type BinaryMask,
  type BlendColor32,
  type CircleBinaryMask,
  type Color32,
  type ColorBlendMaskOptions,
  type HistoryMutator,
  MaskType,
  type Rect,
} from '../../_types'
import { forEachLinePoint } from '../../Algorithm/forEachLinePoint'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import { getCircleBrushOrPencilBounds } from '../../Rect/getCircleBrushOrPencilBounds'
import { getCircleBrushOrPencilStrokeBounds } from '../../Rect/getCircleBrushOrPencilStrokeBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  forEachLinePoint,
  blendColorPixelDataBinaryMask,
  getCircleBrushOrPencilBounds,
  getCircleBrushOrPencilStrokeBounds,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyCirclePencilStroke = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    forEachLinePoint = defaults.forEachLinePoint,
    blendColorPixelDataBinaryMask = defaults.blendColorPixelDataBinaryMask,
    getCircleBrushOrPencilStrokeBounds = defaults.getCircleBrushOrPencilStrokeBounds,
    getCircleBrushOrPencilBounds = defaults.getCircleBrushOrPencilBounds,
  } = deps

  const strokeBoundsOut: Rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const circlePencilBounds: Rect = {
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
    type: MaskType.BINARY,
    data: null as unknown as Uint8Array,
    w: 0,
    h: 0,
  }

  return {
    applyCirclePencilStroke(
      color: Color32,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      brush: CircleBinaryMask,
      alpha = 255,
      blendFn: BlendColor32 = sourceOverPerfect,
    ) {
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
        brush.size,
        strokeBoundsOut,
      )

      if (bw <= 0 || bh <= 0) return

      mask.data = new Uint8Array(bw * bh)
      mask.w = bw
      mask.h = bh

      const maskData = mask.data
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
            brush.size,
            targetWidth,
            targetHeight,
            circlePencilBounds,
          )

          writer.accumulator.storeRegionBeforeState(
            cbx,
            cby,
            cbw,
            cbh,
          )

          const unclippedStartX = Math.floor(px + brush.minOffset)
          const unclippedStartY = Math.floor(py + brush.minOffset)

          const startX = Math.max(bx, unclippedStartX)
          const startY = Math.max(by, unclippedStartY)
          const endX = Math.min(bx + bw, unclippedStartX + brush.w)
          const endY = Math.min(by + bh, unclippedStartY + brush.h)

          for (let my = startY; my < endY; my++) {
            const brushY = my - unclippedStartY
            const maskRowOffset = (my - by) * bw
            const brushRowOffset = brushY * brush.w

            for (let mx = startX; mx < endX; mx++) {
              const brushX = mx - unclippedStartX
              const brushAlpha = brush.data[brushRowOffset + brushX]

              if (brushAlpha > 0) {
                const maskIdx = maskRowOffset + (mx - bx)
                maskData[maskIdx] = brushAlpha
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

      blendColorPixelDataBinaryMask(
        target,
        color,
        mask as BinaryMask,
        blendColorPixelOptions,
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
