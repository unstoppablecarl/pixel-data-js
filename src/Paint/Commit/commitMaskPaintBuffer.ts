import { type Color32 } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { PixelAccumulator } from '../../History/PixelAccumulator'
import { blendColorPixelDataAlphaMask } from '../../PixelData/blendColorPixelDataAlphaMask'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import type { AlphaMaskPaintBuffer } from '../AlphaMaskPaintBuffer'
import type { BinaryMaskPaintBuffer } from '../BinaryMaskPaintBuffer'

const SCRATCH_OPTS = {
  alpha: 255,
  blendFn: sourceOverPerfect,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
}

export function commitMaskPaintBuffer(
  accumulator: PixelAccumulator,
  paintBuffer: BinaryMaskPaintBuffer,
  color: Color32,
  alpha: number | undefined,
  blendFn: typeof sourceOverPerfect | undefined,
  blendColorPixelDataMaskFn: typeof blendColorPixelDataBinaryMask,
): void

export function commitMaskPaintBuffer(
  accumulator: PixelAccumulator,
  paintBuffer: AlphaMaskPaintBuffer,
  color: Color32,
  alpha: number | undefined,
  blendFn: typeof sourceOverPerfect | undefined,
  blendColorPixelDataMaskFn: typeof blendColorPixelDataAlphaMask,
): void

export function commitMaskPaintBuffer(
  accumulator: PixelAccumulator,
  paintBuffer: any,
  color: Color32,
  alpha = 255,
  blendFn = sourceOverPerfect,
  blendColorPixelDataMaskFn: any,
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
        blendColorPixelDataMaskFn(
          config.target,
          color,
          tile,
          SCRATCH_OPTS,
        ),
      )
    }
  }

  paintBuffer.clear()
}

