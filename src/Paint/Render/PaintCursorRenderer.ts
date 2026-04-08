import { type Color32 } from '../../_types'
import type { CanvasContext, CanvasObjectFactory } from '../../Canvas/_canvas-types'
import { packColor } from '../../color'
import { CANVAS_CTX_FAILED } from '../../Internal/_errors'
import { _macro_paintRectCenterOffset } from '../../Internal/macros'
import { type BinaryMask, MaskType } from '../../Mask/_mask-types'
import { makeBinaryMaskFromAlphaMask } from '../../Mask/BinaryMask/makeBinaryMaskFromAlphaMask'
import { makeBinaryMaskOutline } from '../../Mask/BinaryMask/makeBinaryMaskOutline'
import { makeCircleBinaryMaskOutline } from '../../Mask/BinaryMask/makeCircleBinaryMaskOutline'
import { makeRectBinaryMaskOutline } from '../../Mask/BinaryMask/makeRectBinaryMaskOutline'
import { fillPixelDataBinaryMask } from '../../PixelData/fillPixelDataBinaryMask'
import { makeReusablePixelData } from '../../PixelData/ReusablePixelData'
import type { Rect } from '../../Rect/_rect-types'
import { type PaintMask, PaintMaskOutline } from '../_paint-types'

export type PaintCursorRenderer = ReturnType<typeof makePaintCursorRenderer>

export function makePaintCursorRenderer<T extends HTMLCanvasElement | OffscreenCanvas>(
  factory: CanvasObjectFactory<T> = (w, h) => new OffscreenCanvas(w, h) as T,
) {
  const canvas = factory(1, 1)
  const ctx = canvas.getContext('2d')! as CanvasContext<T>
  if (!ctx) throw new Error(CANVAS_CTX_FAILED)
  ctx.imageSmoothingEnabled = false

  const getPixelData = makeReusablePixelData()

  let _color = packColor(0, 255, 255, 255)
  let _scale = 1

  let currentMask: PaintMask = {
    type: MaskType.BINARY,
    outlineType: PaintMaskOutline.RECT,
    w: 1,
    h: 1,
    centerOffsetX: _macro_paintRectCenterOffset(10),
    centerOffsetY: _macro_paintRectCenterOffset(10),
  } as PaintMask

  let outline: BinaryMask

  function update(paintMask?: PaintMask, scale?: number, color?: Color32, alphaThreshold = 127) {
    currentMask = paintMask ?? currentMask

    _scale = scale ?? _scale
    _color = color ?? _color

    canvas.width = currentMask.w * _scale + 2 * _scale
    canvas.height = currentMask.h * _scale + 2 * _scale

    if (currentMask.type === MaskType.BINARY) {
      if (currentMask.outlineType === PaintMaskOutline.CIRCLE) {
        outline = makeCircleBinaryMaskOutline(currentMask.w, _scale)
      } else if (currentMask.outlineType === PaintMaskOutline.RECT) {
        outline = makeRectBinaryMaskOutline(currentMask.w, currentMask.h, _scale)
      } else if (currentMask.outlineType === PaintMaskOutline.MASKED) {
        outline = makeBinaryMaskOutline(currentMask, _scale)
      }
    } else if (currentMask.type === MaskType.ALPHA) {
      const mask = makeBinaryMaskFromAlphaMask(currentMask, alphaThreshold)
      outline = makeBinaryMaskOutline(mask, _scale)
    }

    const pixelData = getPixelData(outline.w, outline.h)
    fillPixelDataBinaryMask(pixelData, _color, outline)
    ctx.putImageData(pixelData.imageData, 0, 0)
  }

  const boundsScratch = { x: 0, y: 0, w: 0, h: 0 }

  function getBounds(centerX: number, centerY: number): Rect {
    boundsScratch.x = centerX + currentMask.centerOffsetX
    boundsScratch.y = centerY + currentMask.centerOffsetY
    boundsScratch.w = currentMask.w
    boundsScratch.h = currentMask.h

    return boundsScratch
  }

  const boundsScaledScratch = { x: 0, y: 0, w: 0, h: 0 }

  function getOutlineBoundsScaled(centerX: number, centerY: number): Rect {
    boundsScaledScratch.x = centerX * _scale + currentMask.centerOffsetX * _scale - 1
    boundsScaledScratch.y = centerY * _scale + currentMask.centerOffsetY * _scale - 1
    boundsScaledScratch.w = currentMask.w * _scale
    boundsScaledScratch.h = currentMask.h * _scale

    return boundsScaledScratch
  }

  function draw(
    drawCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    centerX: number,
    centerY: number,
  ) {
    const dx = centerX * _scale + currentMask.centerOffsetX * _scale - 1
    const dy = centerY * _scale + currentMask.centerOffsetY * _scale - 1

    drawCtx.drawImage(canvas, Math.floor(dx), Math.floor(dy))
  }

  function getSettings() {
    return {
      color: _color,
      scale: _scale,
      currentMask,
    }
  }

  return {
    update,
    getBounds,
    getBoundsScaled: getOutlineBoundsScaled,
    draw,
    getSettings,
  }
}
