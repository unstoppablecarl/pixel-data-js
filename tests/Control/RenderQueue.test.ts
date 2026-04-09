import { makeRenderQueue } from '@/index'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('makeRenderQueue', () => {
  let pendingCallback: FrameRequestCallback | null = null
  let mockFrameId = 123

  beforeEach(() => {
    // Mock requestAnimationFrame to capture the callback without executing it
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      pendingCallback = cb
      return mockFrameId
    })

    // Mock cancelAnimationFrame to clear the callback if the ID matches
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      if (id === mockFrameId) {
        pendingCallback = null
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    pendingCallback = null
  })

  // Helper to simulate the browser firing the next animation frame
  let flushFrame = () => {
    if (pendingCallback) {
      let cb = pendingCallback
      pendingCallback = null
      cb(performance.now())
    }
  }

  it('schedules and executes the callback on the next frame', () => {
    let cb = vi.fn()
    let queue = makeRenderQueue(cb)

    queue()
    expect(cb).toHaveBeenCalledTimes(0)

    flushFrame()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('debounces multiple synchronous calls into a single execution', () => {
    let cb = vi.fn()
    let queue = makeRenderQueue(cb)

    queue()
    queue()
    queue()

    expect(cb).toHaveBeenCalledTimes(0)

    flushFrame()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('allows subsequent scheduling after a frame has flushed', () => {
    let cb = vi.fn()
    let queue = makeRenderQueue(cb)

    queue()
    flushFrame()
    expect(cb).toHaveBeenCalledTimes(1)

    queue()
    flushFrame()
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('cancels a pending render successfully', () => {
    let cb = vi.fn()
    let queue = makeRenderQueue(cb)

    queue()
    expect(pendingCallback).not.toBeNull()

    queue.cancel()
    expect(pendingCallback).toBeNull()

    flushFrame()
    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('safely handles calling cancel when nothing is scheduled', () => {
    let cb = vi.fn()
    let queue = makeRenderQueue(cb)

    // Should not throw or cause errors
    queue.cancel()

    // Scheduling should still work normally afterwards
    queue()
    flushFrame()
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
