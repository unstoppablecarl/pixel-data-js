import {
  type BinaryMask,
  type BlendColor32,
  type Color32,
  type ColorBlendOptions,
  type HistoryMutator, MaskType,
  type Rect,
} from '../../_types'
import { forEachLinePoint } from '../../Algorithm/forEachLinePoint'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import { getRectBrushOrPencilBounds } from '../../Rect/getRectBrushOrPencilBounds'
import { getRectBrushOrPencilStrokeBounds } from '../../Rect/getRectBrushOrPencilStrokeBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  forEachLinePoint,
  getRectBrushOrPencilBounds,
  getRectBrushOrPencilStrokeBounds,
  blendColorPixelDataBinaryMask,
}

type Deps = Partial<typeof defaults>
export const mutatorApplyRectPencilStroke = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    forEachLinePoint = defaults.forEachLinePoint,
    blendColorPixelDataBinaryMask = defaults.blendColorPixelDataBinaryMask,
    getRectBrushOrPencilBounds = defaults.getRectBrushOrPencilBounds,
    getRectBrushOrPencilStrokeBounds = defaults.getRectBrushOrPencilStrokeBounds,
  } = deps

  const strokeBoundsOut: Rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const rectPencilBounds: Rect = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const blendColorPixelOptions: ColorBlendOptions = {
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
    applyRectPencilStroke(
      color: Color32,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      brushWidth: number,
      brushHeight: number,
      alpha = 255,
      blendFn: BlendColor32 = sourceOverPerfect,
    ) {
      const {
        x: bx,
        y: by,
        w: bw,
        h: bh,
      } = getRectBrushOrPencilStrokeBounds(
        x0,
        y0,
        x1,
        y1,
        brushWidth,
        brushHeight,
        strokeBoundsOut,
      )

      if (bw <= 0 || bh <= 0) return

      mask.data = new Uint8Array(bw * bh)
      mask.w = bw
      mask.h = bh

      const maskData = mask.data

      const halfW = brushWidth / 2
      const halfH = brushHeight / 2
      const centerOffset = (brushWidth % 2 === 0) ? 0.5 : 0

      const targetWidth = writer.target.width
      const targetHeight = writer.target.height

      forEachLinePoint(x0, y0, x1, y1, (px, py) => {
        const {
          x: rbx,
          y: rby,
          w: rbw,
          h: rbh,
        } = getRectBrushOrPencilBounds(
          px,
          py,
          brushWidth,
          brushHeight,
          targetWidth,
          targetHeight,
          rectPencilBounds,
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
              maskData[maskIdx] = 1
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

      blendColorPixelDataBinaryMask(writer.target, color, mask as BinaryMask, blendColorPixelOptions)
    },
  }
}) satisfies HistoryMutator<any, Deps>
