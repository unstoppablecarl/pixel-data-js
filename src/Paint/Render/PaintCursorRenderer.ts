import { type Color32 } from '../../_types'
import type { ReusableCanvasFactory } from '../../Canvas/_canvas-types'
import { makeReusableOffscreenCanvas } from '../../Canvas/ReusableCanvas'
import { packColor } from '../../color'
import { _macro_paintRectCenterOffset } from '../../Internal/macros'
import { type BinaryMask, MaskType } from '../../Mask/_mask-types'
import { makeBinaryMaskFromAlphaMask } from '../../Mask/BinaryMask/makeBinaryMaskFromAlphaMask'
import { makeBinaryMaskOutline } from '../../Mask/BinaryMask/makeBinaryMaskOutline'
import { makeCircleBinaryMaskOutline } from '../../Mask/BinaryMask/makeCircleBinaryMaskOutline'
import { makeRectBinaryMaskOutline } from '../../Mask/BinaryMask/makeRectBinaryMaskOutline'
import { fillPixelDataBinaryMask } from '../../PixelData/fillPixelDataBinaryMask'
import { makeReusablePixelData } from '../../PixelData/ReusablePixelData'
import type { Rect } from '../../Rect/_rect-types'
import { type PaintBrush, PaintMaskOutline } from '../_paint-types'

export type PaintCursorRenderer = ReturnType<typeof makePaintCursorRenderer>

export function makePaintCursorRenderer<T extends HTMLCanvasElement | OffscreenCanvas = OffscreenCanvas>(
  reusableCanvasFactory?: () => ReusableCanvasFactory<T>,
) {
  const factory = (reusableCanvasFactory ?? makeReusableOffscreenCanvas) as unknown as () => ReusableCanvasFactory<T>
  const updateBuffer = factory()
  const { canvas, ctx } = updateBuffer(1, 1)

  const getPixelData = makeReusablePixelData()

  let _color = packColor(0, 255, 255, 255)
  let _scale = 1

  let currentBrush: PaintBrush = {
    type: null,
    outlineType: PaintMaskOutline.RECT,
    w: 1,
    h: 1,
    centerOffsetX: _macro_paintRectCenterOffset(10),
    centerOffsetY: _macro_paintRectCenterOffset(10),
    data: null,
  }

  let outline: BinaryMask

  function update(paintMask?: PaintBrush, scale?: number, color?: Color32, alphaThreshold = 127) {
    currentBrush = paintMask ?? currentBrush

    _scale = scale ?? _scale
    _color = color ?? _color

    updateBuffer(
      currentBrush.w * _scale + 2 * _scale,
      currentBrush.h * _scale + 2 * _scale,
    )

    if (currentBrush.type === MaskType.BINARY) {
      if (currentBrush.outlineType === PaintMaskOutline.CIRCLE) {
        outline = makeCircleBinaryMaskOutline(currentBrush.w, _scale)
      } else if (currentBrush.outlineType === PaintMaskOutline.RECT) {
        outline = makeRectBinaryMaskOutline(currentBrush.w, currentBrush.h, _scale)
      } else if (currentBrush.outlineType === PaintMaskOutline.MASKED) {
        outline = makeBinaryMaskOutline(currentBrush, _scale)
      }
    } else if (currentBrush.type === MaskType.ALPHA) {
      const mask = makeBinaryMaskFromAlphaMask(currentBrush, alphaThreshold)
      outline = makeBinaryMaskOutline(mask, _scale)
    } else {
      outline = makeRectBinaryMaskOutline(currentBrush.w, currentBrush.h, _scale)
    }

    const pixelData = getPixelData(outline.w, outline.h)
    fillPixelDataBinaryMask(pixelData, _color, outline)
    ctx.putImageData(pixelData.imageData, 0, 0)
  }

  const boundsScratch = { x: 0, y: 0, w: 0, h: 0 }

  function getBounds(centerX: number, centerY: number): Rect {
    boundsScratch.x = centerX + currentBrush.centerOffsetX
    boundsScratch.y = centerY + currentBrush.centerOffsetY
    boundsScratch.w = currentBrush.w
    boundsScratch.h = currentBrush.h

    return boundsScratch
  }

  const boundsScaledScratch = { x: 0, y: 0, w: 0, h: 0 }

  function getOutlineBoundsScaled(centerX: number, centerY: number): Rect {
    boundsScaledScratch.x = centerX * _scale + currentBrush.centerOffsetX * _scale - 1
    boundsScaledScratch.y = centerY * _scale + currentBrush.centerOffsetY * _scale - 1
    boundsScaledScratch.w = currentBrush.w * _scale
    boundsScaledScratch.h = currentBrush.h * _scale

    return boundsScaledScratch
  }

  function draw(
    drawCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    centerX: number,
    centerY: number,
  ) {
    const dx = centerX * _scale + currentBrush.centerOffsetX * _scale - 1
    const dy = centerY * _scale + currentBrush.centerOffsetY * _scale - 1

    drawCtx.drawImage(canvas, Math.floor(dx), Math.floor(dy))
  }

  function drawRaw(
    drawCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
  ) {
    drawCtx.drawImage(canvas, Math.floor(x * _scale), Math.floor(y * _scale))
  }

  function getSettings() {
    return {
      color: _color,
      scale: _scale,
      currentBrush,
    }
  }

  return {
    update,
    getBounds,
    getBoundsScaled: getOutlineBoundsScaled,
    draw,
    drawRaw,
    getSettings,
  }
}
