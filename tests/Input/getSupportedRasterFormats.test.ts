import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OffscreenCanvasMock, useOffscreenCanvasMock } from '../_helpers/OffscreenCanvasMock'

describe('getSupportedPixelFormats', () => {

  let getSupportedPixelFormats: () => Promise<string[]>

  beforeEach(async () => {
    vi.resetModules()
    vi.unstubAllGlobals()
    useOffscreenCanvasMock()
    const module = await import('../../src/Input/getSupportedRasterFormats')
    getSupportedPixelFormats = module.getSupportedPixelFormats

    vi.clearAllMocks()
  })

  it('should return a list of supported mime types', async () => {
    const formats = await getSupportedPixelFormats()

    expect(formats).toContain('image/png')
    expect(formats).toContain('image/jpeg')
  })

  it('should cache the result and only create one canvas', async () => {
    const spy = vi.fn().mockImplementation(
      (w, h) => new OffscreenCanvasMock(w, h),
    )

    // Re-bind the global to our spy
    vi.stubGlobal(
      'OffscreenCanvas',
      spy,
    )

    // Call multiple times simultaneously
    const p1 = getSupportedPixelFormats()
    const p2 = getSupportedPixelFormats()

    await Promise.all([p1, p2])

    // Should only be called once because of the promise cache
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should filter out unsupported types even if convertToBlob does not throw', async () => {
    // Mock convertToBlob to behave like older browsers that
    // always return image/png regardless of requested type
    vi.spyOn(global.OffscreenCanvas.prototype, 'convertToBlob')
      .mockImplementation(async (options) => {
        const type = options?.type === 'image/webp' ? 'image/webp' : 'image/png'
        const blob = new Blob([], { type })

        return blob
      })

    const formats = await getSupportedPixelFormats()

    // It should only contain webp and png, excluding jpeg/avif/etc.
    expect(formats).toContain('image/webp')
    expect(formats).not.toContain('image/jpeg')
  })

  it('should reset the promise cache if an error occurs', async () => {
    const canvasSpy = vi.fn()

    vi.stubGlobal(
      'OffscreenCanvas',
      canvasSpy,
    )

    // Force the constructor to throw
    canvasSpy.mockImplementationOnce(() => {
      throw new Error('Hardware failure')
    })

    // 2. This will now be caught because the 'new' call is inside the 'try'
    await expect(getSupportedPixelFormats()).rejects.toThrow('Hardware failure')

    // 3. Second call: Provide a working implementation
    canvasSpy.mockImplementationOnce(
      (w, h) => new OffscreenCanvasMock(w, h),
    )

    const formats = await getSupportedPixelFormats()

    expect(formats).toBeDefined()
    expect(canvasSpy).toHaveBeenCalledTimes(2)
  })
  it('handles individual format failures gracefully', async () => {
    const canvasSpy = vi.fn().mockImplementation(
      (w, h) => new OffscreenCanvasMock(w, h)
    )

    vi.stubGlobal(
      'OffscreenCanvas',
      canvasSpy,
    )

    const convertSpy = vi.spyOn(
      OffscreenCanvasMock.prototype,
      'convertToBlob',
    )

    convertSpy.mockImplementation(async (options) => {
      if (options?.type === 'image/avif') {
        throw new Error('AVIF encoding failed')
      }

      const type = options?.type || 'image/png'
      return new Blob(
        [],
        { type },
      )
    })

    const formats = await getSupportedPixelFormats()

    expect(formats).toContain('image/png')
    expect(formats).toContain('image/jpeg')

    expect(formats).not.toContain('image/avif')

    expect(convertSpy).toHaveBeenCalledWith({
      type: 'image/avif',
    })
  })
})
