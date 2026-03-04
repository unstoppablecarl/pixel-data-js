// The enum index IS the permanent ID.
// do not change the order, Adding to it is ok.
import type { BlendColor32 } from '../_types'

export enum BlendMode {
  overwrite,
  sourceOver,

  darken,
  multiply,
  colorBurn,
  linearBurn,
  darkerColor,

  lighten,
  screen,
  colorDodge,
  linearDodge,
  lighterColor,

  overlay,
  softLight,
  hardLight,
  vividLight,
  linearLight,
  pinLight,
  hardMix,

  difference,
  exclusion,
  subtract,
  divide,
}

export type BlendModeIndex = typeof BlendMode[keyof typeof BlendMode];

export const overwriteBase: BlendColor32 = (src, _dst) => src
overwriteBase.isOverwrite = true
