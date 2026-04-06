import 'vitest'
import type { Color32 } from '@/_types'
import { toOnlyContainColors } from './_helpers/onlyContainsColorsMatcher'

interface CustomMatchers<R = unknown> {
  toMatchPngBufferSnapshot(snapshotName?: string, message?: string): Promise<R>
  toMatchPixelDataSnapshot(snapshotName?: string, message?: string): Promise<R>
  toOnlyContainColors(expected: Color32[], message?: string): Promise<R>

}

declare module 'vitest' {

  interface Assertion<T = any> extends CustomMatchers<T> {
  }
}
