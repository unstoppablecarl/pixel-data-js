import type { BlendColor32, Color32 } from '../../_types'
import { overwriteFast } from '../../BlendModes/blend-modes-fast'
import { PixelWriter } from '../PixelWriter'

export function mutatorBlendPixel(writer: PixelWriter<any>) {
  return {
    blendPixel(
      x: number,
      y: number,
      color: Color32,
      alpha: number = 255,
      blendFn: BlendColor32 = overwriteFast,
    ) {
      let target = writer.target
      let width = target.width
      let height = target.height

      if (x < 0 || x >= width || y < 0 || y >= height) return

      writer.accumulator.storeTileBeforeState(x, y)

      let index = y * width + x
      let bg = target.data32[index] as Color32

      let finalColor = color

      if (alpha < 255) {
        let baseSrcAlpha = color >>> 24
        let finalAlpha = (baseSrcAlpha * alpha + 128) >> 8

        finalColor = (((color & 0x00ffffff) | (finalAlpha << 24)) >>> 0) as Color32
      }

      target.data32[index] = blendFn(finalColor, bg)
    },
  }
}
