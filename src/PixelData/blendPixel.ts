import type { BlendColor32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import type { Color32 } from '../Color/_color-types'
import type { PixelData32 } from './_pixelData-types'

export function blendPixel(
  target: PixelData32,
  x: number,
  y: number,
  color: Color32,
  alpha: number = 255,
  blendFn: BlendColor32 = sourceOverPerfect,
): boolean {
  if (alpha === 0) return false

  let width = target.w
  let height = target.h

  if (x < 0 || x >= width || y < 0 || y >= height) return false

  let srcAlpha = color >>> 24
  let isOverwrite = blendFn.isOverwrite

  // Early exit for transparent source unless we are in an overwrite mode
  if (srcAlpha === 0 && !isOverwrite) return false

  let dst32 = target.data
  let index = y * width + x
  let finalColor = color

  if (alpha !== 255) {
    let finalAlpha = (srcAlpha * alpha + 128) >> 8

    if (finalAlpha === 0 && !isOverwrite) return false

    finalColor = (((color & 0x00ffffff) | (finalAlpha << 24)) >>> 0) as Color32
  }

  let current = dst32[index] as Color32
  let next = blendFn(finalColor, current)

  if (current !== next) {
    dst32[index] = next

    return true
  }

  return false
}
