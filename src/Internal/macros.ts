// @__INLINE_MACRO__
export const _macro_halfAndFloor = (value: number) => value >> 1

// @__INLINE_MACRO__
export const _macro_paintRectCenterOffset = (size: number) => (size - 1) >> 1

// for reference only
// const _inline_multiplyAlpha = (a: number, b: number) => {
//   const t = a * b + 128
//   return (t + (t >> 8)) >> 8
// }
