import type { BlendColor32 } from '../_types'

export const BaseBlendMode = {
  overwrite: 0,
  sourceOver: 1,
  darken: 2,
  multiply: 3,
  colorBurn: 4,
  linearBurn: 5,
  darkerColor: 6,
  lighten: 7,
  screen: 8,
  colorDodge: 9,
  linearDodge: 10,
  lighterColor: 11,
  overlay: 12,
  softLight: 13,
  hardLight: 14,
  vividLight: 15,
  linearLight: 16,
  pinLight: 17,
  hardMix: 18,
  difference: 19,
  exclusion: 20,
  subtract: 21,
  divide: 22,
} as const

export const overwriteBase: BlendColor32 = (src, _dst) => src
overwriteBase.isOverwrite = true
