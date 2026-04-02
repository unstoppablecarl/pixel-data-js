import type { BlendColor32, Color32, IPixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendPixel(
  target: IPixelData32,
  x: number,
  y: number,
  color: Color32,
  alpha: number = 255,
  blendFn: BlendColor32 = sourceOverPerfect,
): boolean {
  if (alpha === 0) return false

  let width = target.width
  let height = target.height

  if (x < 0 || x >= width || y < 0 || y >= height) return false

  let srcAlpha = color >>> 24
  let isOverwrite = blendFn.isOverwrite

  // Early exit for transparent source unless we are in an overwrite mode
  if (srcAlpha === 0 && !isOverwrite) return false

  let dst32 = target.data32
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
