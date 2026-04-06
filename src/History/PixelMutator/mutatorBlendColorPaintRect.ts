import type { BlendColor32, Color32 } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { _macro_paintRectCenterOffset } from '../../Internal/macros'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  blendColorPixelData,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColorPaintRect = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    blendColorPixelData = defaults.blendColorPixelData,
  } = deps

  const OPTS = { x: 0, y: 0, w: 0, h: 0, blendFn: sourceOverPerfect, alpha: 255 }

  return {
    blendColorPaintRect(
      color: Color32,
      centerX: number,
      centerY: number,
      brushWidth: number,
      brushHeight: number,
      alpha = 255,
      blendFn: BlendColor32 = sourceOverPerfect,
    ): boolean {
      const target = writer.config.target

      const topLeftX = centerX + _macro_paintRectCenterOffset(brushWidth)
      const topLeftY = centerY + _macro_paintRectCenterOffset(brushHeight)

      OPTS.x = topLeftX
      OPTS.y = topLeftY
      OPTS.w = brushWidth
      OPTS.h = brushHeight
      OPTS.blendFn = blendFn
      OPTS.alpha = alpha

      const didChange = writer.accumulator.storeRegionBeforeState(topLeftX, topLeftY, brushWidth, brushHeight)
      return didChange(
        blendColorPixelData(
          target,
          color,
          OPTS,
        ),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
