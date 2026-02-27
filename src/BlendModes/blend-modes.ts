// The enum index IS the permanent ID.
// do not change the order, Adding to it is ok.
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

