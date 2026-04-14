import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { PixelAccumulator } from '../../History/PixelAccumulator'
import { blendPixelData } from '../../PixelData/blendPixelData'
import type { ColorPaintBuffer } from '../ColorPaintBuffer'

const SCRATCH_OPTS = {
  alpha: 255,
  blendFn: sourceOverPerfect,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

export function commitColorPaintBuffer(
  accumulator: PixelAccumulator,
  paintBuffer: ColorPaintBuffer,
  alpha = 255,
  blendFn = sourceOverPerfect,
  blendPixelDataFn = blendPixelData,
) {
  const config = accumulator.config
  const lookup = paintBuffer.lookup

  SCRATCH_OPTS.alpha = alpha
  SCRATCH_OPTS.blendFn = blendFn

  for (let i = 0; i < lookup.length; i++) {
    const tile = lookup[i]

    if (tile) {
      const didChange = accumulator.storeTileBeforeState(tile.id, tile.tx, tile.ty)

      SCRATCH_OPTS.x = tile.x
      SCRATCH_OPTS.y = tile.y
      SCRATCH_OPTS.w = tile.w
      SCRATCH_OPTS.h = tile.h

      didChange(
        blendPixelDataFn(
          config.target,
          tile,
          SCRATCH_OPTS,
        ),
      )
    }
  }

  paintBuffer.clear()
}

