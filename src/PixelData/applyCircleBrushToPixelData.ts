import {
  type BlendColor32,
  type CircleBrushMask,
  type Color32,
  type ColorBlendMaskOptions,
  type IPixelData,
  MaskType,
  type Rect,
} from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { getCircleBrushOrPencilBounds } from '../Rect/getCircleBrushOrPencilBounds'
import { blendColorPixelDataAlphaMask } from './blendColorPixelDataAlphaMask'
import { blendColorPixelDataBinaryMask } from './blendColorPixelDataBinaryMask'

/**
 * Applies a circular brush to pixel data using a pre-calculated alpha mask.
 *
 * @param target The PixelData to modify.
 * @param color The brush color.
 * @param centerX The center x-coordinate of the brush.
 * @param centerY The center y-coordinate of the brush.
 * @param brush The pre-calculated CircleBrushAlphaMask.
 * @param alpha The overall opacity of the brush (0-255).
 * @param blendFn
 * @param scratchOptions
 * @param bounds precalculated result from {@link getCircleBrushOrPencilBounds}
 */
export function applyCircleBrushToPixelData(
  target: IPixelData,
  color: Color32,
  centerX: number,
  centerY: number,
  brush: CircleBrushMask,
  alpha = 255,
  blendFn: BlendColor32 = sourceOverPerfect,
  scratchOptions: ColorBlendMaskOptions = {},
  bounds?: Rect,
): void {
  const b = bounds ?? getCircleBrushOrPencilBounds(
    centerX,
    centerY,
    brush.size,
    target.width,
    target.height,
  )

  if (b.w <= 0 || b.h <= 0) return

  const unclippedStartX = Math.floor(centerX + brush.minOffset)
  const unclippedStartY = Math.floor(centerY + brush.minOffset)

  // Calculate the intersection between the unclipped mask rect and the allowed bounds
  const ix = Math.max(unclippedStartX, b.x)
  const iy = Math.max(unclippedStartY, b.y)
  const ir = Math.min(unclippedStartX + brush.w, b.x + b.w)
  const ib = Math.min(unclippedStartY + brush.h, b.y + b.h)

  const iw = ir - ix
  const ih = ib - iy

  // If the mask falls entirely outside the bounds, exit
  if (iw <= 0 || ih <= 0) return

  // Apply the intersected coordinates and internal mask offsets
  scratchOptions.x = ix
  scratchOptions.y = iy
  scratchOptions.w = iw
  scratchOptions.h = ih
  scratchOptions.mx = ix - unclippedStartX
  scratchOptions.my = iy - unclippedStartY
  scratchOptions.alpha = alpha
  scratchOptions.blendFn = blendFn

  if (brush.type === MaskType.ALPHA) {
    blendColorPixelDataAlphaMask(
      target,
      color,
      brush,
      scratchOptions,
    )
  }

  if (brush.type === MaskType.BINARY) {
    blendColorPixelDataBinaryMask(
      target,
      color,
      brush,
      scratchOptions,
    )
  }
}
