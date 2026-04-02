import { BaseBlendMode } from '../BlendModes/blend-modes'

export const CANVAS_COMPOSITE_MAP = {
  [BaseBlendMode.overwrite]: 'copy',
  [BaseBlendMode.sourceOver]: 'source-over',
  [BaseBlendMode.darken]: 'darken',
  [BaseBlendMode.multiply]: 'multiply',
  [BaseBlendMode.colorBurn]: 'color-burn',
  [BaseBlendMode.lighten]: 'lighten',
  [BaseBlendMode.screen]: 'screen',
  [BaseBlendMode.colorDodge]: 'color-dodge',
  [BaseBlendMode.linearDodge]: 'lighter',
  [BaseBlendMode.overlay]: 'overlay',
  [BaseBlendMode.softLight]: 'soft-light',
  [BaseBlendMode.hardLight]: 'hard-light',
  [BaseBlendMode.difference]: 'difference',
  [BaseBlendMode.exclusion]: 'exclusion',
} as const

export type CanvasBlendModeIndex = keyof typeof CANVAS_COMPOSITE_MAP
export type CanvasCompositeOperation = typeof CANVAS_COMPOSITE_MAP[CanvasBlendModeIndex]

/**
 * example
 * function getCanvasCompositeOperation(mode: CanvasBlendModeIndex): CanvasCompositeOperation {
 *   return CANVAS_COMPOSITE_MAP[mode]
 * }
 */
