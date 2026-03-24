import 'vitest'

interface CustomMatchers<R = unknown> {
  toMatchPngBufferSnapshot(snapshotName?: string, message?: string): Promise<R>
  toMatchPixelDataSnapshot(snapshotName?: string, message?: string): Promise<R>
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {
  }
}
