export type CanvasContext<T> = T extends HTMLCanvasElement
  ? CanvasRenderingContext2D
  : OffscreenCanvasRenderingContext2D

export interface ReusableCanvas<T extends HTMLCanvasElement | OffscreenCanvas> {
  readonly canvas: T
  readonly ctx: CanvasContext<T>
}

export type ReusableCanvasFactory<T extends HTMLCanvasElement | OffscreenCanvas> = {
  (w: number, h: number): ReusableCanvas<T>,
  reset(): void
}

export type DrawPixelLayer<T extends HTMLCanvasElement | OffscreenCanvas> =
  (ctx: CanvasContext<T>) => void

export type DrawScreenLayer = (ctx: CanvasRenderingContext2D, scale: number) => void

export interface PixelCanvas {
  readonly canvas: HTMLCanvasElement,
  readonly ctx: CanvasRenderingContext2D,
  readonly resize: (w: number, h: number) => void
}

export type CanvasObjectFactory<T extends HTMLCanvasElement | OffscreenCanvas> = (w: number, h: number) => T
