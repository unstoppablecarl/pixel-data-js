import type { BlendColor32 } from '../_types'
import type { ColorPaintBuffer } from '../Paint/ColorPaintBuffer'
import type { PixelData32 } from './_pixelData-types'
import { blendPixelData } from './blendPixelData'

const SCRATCH_OPTS = {
  x: 0,
  y: 0,
  alpha: 255,
  blendFn: undefined as BlendColor32 | undefined,
}

export function blendPixelDataPaintBuffer(
  target: PixelData32,
  paintBuffer: ColorPaintBuffer,
  alpha = 255,
  blendFn?: BlendColor32,
  blendPixelDataFn = blendPixelData,
): void {
  const lookup = paintBuffer.lookup
  for (let i = 0; i < lookup.length; i++) {
    const tile = lookup[i]

    if (tile) {
      const x = tile.x
      const y = tile.y

      SCRATCH_OPTS.x = x
      SCRATCH_OPTS.y = y
      SCRATCH_OPTS.alpha = alpha
      SCRATCH_OPTS.blendFn = blendFn

      blendPixelDataFn(target, tile, SCRATCH_OPTS)
    }
  }
}

