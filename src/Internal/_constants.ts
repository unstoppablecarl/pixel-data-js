import type { CanvasObjectFactory } from '../Canvas/_canvas-types'

export const DEFAULT_CANVAS_FACTORY: CanvasObjectFactory<any> = (w, h) => new OffscreenCanvas(w, h)
