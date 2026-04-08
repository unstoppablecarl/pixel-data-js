import { ERRORS, makeReusableCanvas, makeReusableOffscreenCanvas } from '@/index'
import { createCanvas } from '@napi-rs/canvas'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('makeReusableCanvas', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes and resizes correctly using a mocked canvas', () => {
    const get = makeReusableCanvas()

    const spy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        const mockCanvas = createCanvas(1, 1)
        return mockCanvas as any
      }

      return document.createElement(tagName)
    })

    const { canvas } = get(150, 200)

    expect(spy).toHaveBeenCalledWith('canvas')
    expect(canvas.width).toBe(150)
    expect(canvas.height).toBe(200)
  })

  it('manually clears when dimensions match', () => {
    const get = makeReusableCanvas()
    const {
      ctx,
    } = get(100, 100)

    const clearSpy = vi.spyOn(ctx, 'clearRect')

    // Trigger the 'else' branch (same size)
    get(100, 100)

    expect(clearSpy).toHaveBeenCalledWith(0, 0, 100, 100)
  })

  it('hits the error branch when context is null', () => {
    const get = makeReusableCanvas()

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        const mockCanvas = createCanvas(1, 1)
        // Force getContext to fail
        mockCanvas.getContext = () => null as any
        return mockCanvas as any
      }

      return document.createElement(tagName)
    })

    expect(() => get(10, 10)).toThrow(ERRORS.CANVAS_CTX_FAILED)
  })

  it('correctly resets closure state', () => {
    const get = makeReusableCanvas()

    const firstCanvas = get(10, 10).canvas

    get.reset()

    const spy = vi.spyOn(document, 'createElement')

    const secondCanvas = get(10, 10).canvas

    expect(spy).toHaveBeenCalledWith('canvas')

    expect(firstCanvas).not.toBe(secondCanvas)
  })
})

describe('makeReusableOffscreenCanvas', () => {
  let mockCtx: any
  let constructorSpy: any

  beforeEach(() => {
    mockCtx = {
      imageSmoothingEnabled: true,
      setTransform: vi.fn(),
      clearRect: vi.fn(),
    }

    constructorSpy = vi.fn()

    // Polyfill OffscreenCanvas for the test environment
    class MockOffscreenCanvas {
      public width: number
      public height: number

      constructor(w: number, h: number) {
        this.width = w
        this.height = h
        constructorSpy(w, h)
      }

      getContext(type: string) {
        if (type === '2d') return mockCtx
        return null
      }
    }

    globalThis.OffscreenCanvas = MockOffscreenCanvas as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up the global polyfill to prevent leaking into other test suites
    delete (globalThis as any).OffscreenCanvas
  })

  it('allocates a new OffscreenCanvas on the first call with exact dimensions', () => {
    const get = makeReusableOffscreenCanvas()

    const result = get(256, 128)

    expect(constructorSpy).toHaveBeenCalledWith(256, 128)
    expect(result.canvas.width).toBe(256)
    expect(result.canvas.height).toBe(128)
    expect(result.ctx.imageSmoothingEnabled).toBe(false)
  })

  it('throws an error if the context cannot be initialized', () => {
    // Override the mock to return null to simulate failure
    class BadCanvas {
      constructor(_w: number, _h: number) {
      }

      getContext() {
        return null
      }
    }

    globalThis.OffscreenCanvas = BadCanvas as any

    const get = makeReusableOffscreenCanvas()

    expect(() => get(100, 100)).toThrowError(ERRORS.CANVAS_CTX_FAILED)
  })

  it('resizes the existing canvas and reapplies smoothing lock if dimensions change', () => {
    const get = makeReusableOffscreenCanvas()
    const firstCall = get(100, 100)

    // Mutate the smoothing to verify it gets re-locked on resize
    firstCall.ctx.imageSmoothingEnabled = true

    const secondCall = get(200, 200)

    // Verify it reused the wrapper object
    expect(firstCall).toBe(secondCall)

    // Verify it did not allocate a brand new instance
    expect(constructorSpy).toHaveBeenCalledTimes(1)

    // Verify dimensions updated
    expect(secondCall.canvas.width).toBe(200)
    expect(secondCall.canvas.height).toBe(200)

    // Verify smoothing was reapplied
    expect(secondCall.ctx.imageSmoothingEnabled).toBe(false)
  })

  it('resets transform and clears canvas if requested dimensions match exactly', () => {
    const get = makeReusableOffscreenCanvas()
    get(100, 100)

    // Clear the spy history from the initial allocation
    vi.clearAllMocks()

    get(100, 100)

    // Verify it reused the instance
    expect(constructorSpy).not.toHaveBeenCalled()

    // Verify the fast-clear path was taken
    expect(mockCtx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100)
  })

  it('correctly resets closure state and severs references', () => {
    const get = makeReusableOffscreenCanvas()

    const firstCanvas = get(10, 10).canvas

    get.reset()

    const secondCanvas = get(10, 10).canvas

    // Verify a new canvas was generated after the reset
    expect(constructorSpy).toHaveBeenCalledTimes(2)
    expect(firstCanvas).not.toBe(secondCanvas)
  })
})
