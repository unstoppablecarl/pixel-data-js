import 'vitest'
import type { Color32 } from '@/_types'
import type { PixelData } from '@/PixelData/_pixelData-types'

interface CustomMatchers<R = unknown> {
  toMatchPngBufferSnapshot(snapshotName?: string, message?: string): Promise<R>
  toMatchPixelDataSnapshot(snapshotName?: string, message?: string): Promise<R>
  toOnlyContainColors(expected: Color32[], message?: string): Promise<R>
  toMatchPixelGrid(expected:  (number | Color32)[], message?: string): Promise<R>
}

declare module 'vitest' {

  interface Assertion<T = any> extends CustomMatchers<T> {
  }
}
