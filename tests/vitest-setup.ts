import { beforeEach, vi } from 'vitest'
import './vitest-setup-canvas'

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
