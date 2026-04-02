import type { IPixelData32 } from '../_types'

export class PixelBuffer32 implements IPixelData32 {
  readonly data32: Uint32Array

  constructor(
    readonly width: number,
    readonly height: number,
    data32?: Uint32Array,
  ) {
    this.data32 = data32 ?? new Uint32Array(width * height)
  }

  set(width: number, height: number, data32?: Uint32Array): void {
    ;(this as any).data32 = data32 ?? new Uint32Array(width * height)
    ;(this as any).width = width
    ;(this as any).height = height
  }

  copy(): PixelBuffer32 {
    const newData32 = new Uint32Array(this.data32)
    return new PixelBuffer32(
      this.width,
      this.height,
      newData32,
    )
  }
}
