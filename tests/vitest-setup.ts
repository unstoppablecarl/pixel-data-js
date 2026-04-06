import { beforeEach, expect, vi } from 'vitest'
import { mockGlobalCanvas, mockGlobalImageData } from '../support/mockDom'
import { toOnlyContainColors } from './_helpers/onlyContainsColorsMatcher'
import { toMatchPixelDataSnapshot, toMatchPngBufferSnapshot } from './_helpers/snapshotMatchers'

beforeEach(() => {
  mockGlobalImageData()
  mockGlobalCanvas()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

expect.extend({
  toMatchPngBufferSnapshot,
  toMatchPixelDataSnapshot,
  toOnlyContainColors,
})
