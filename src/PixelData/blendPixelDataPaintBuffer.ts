import type { BlendColor32, IPixelData32 } from '../_types'
import { blendPixelData } from './blendPixelData'
import type { PaintBuffer } from '../Paint/PaintBuffer'

const SCRATCH_OPTS = {
  x: 0,
  y: 0,
  alpha: 255,
  blendFn: undefined as BlendColor32 | undefined,
}

export function blendPixelDataPaintBuffer(
  target: IPixelData32,
  paintBuffer: PaintBuffer,
  alpha = 255,
  blendFn?: BlendColor32,
  blendPixelDataFn = blendPixelData,
): void {
  const tileShift = paintBuffer.config.tileShift
  const lookup = paintBuffer.lookup
  for (let i = 0; i < lookup.length; i++) {
    const tile = lookup[i]

    if (tile) {
      const x = tile.tx << tileShift
      const y = tile.ty << tileShift

      SCRATCH_OPTS.x = x
      SCRATCH_OPTS.y = y
      SCRATCH_OPTS.alpha = alpha
      SCRATCH_OPTS.blendFn = blendFn

      blendPixelDataFn(target, tile, SCRATCH_OPTS)
    }
  }
}

