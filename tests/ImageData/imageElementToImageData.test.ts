import { EmptyImageError, imageElementToImageData } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { offscreenCanvasMockContext, useOffscreenCanvasMock } from '../_helpers/OffscreenCanvasMock'

describe('EmptyImageError', () => {
  it('has the correct name', () => {
    expect(new EmptyImageError().name).toBe('EmptyImageError')
  })

  it('is an instance of Error', () => {
    expect(new EmptyImageError()).toBeInstanceOf(Error)
  })
})

function makeLoadedImg(naturalWidth = 100, naturalHeight = 50): HTMLImageElement {
  return { complete: true, naturalWidth, naturalHeight } as unknown as HTMLImageElement
}

function makePendingImg(naturalWidth: number, naturalHeight: number): HTMLImageElement {
  return Object.assign(new EventTarget(), {
    complete: false,
    naturalWidth,
    naturalHeight,
    src: 'test.png',
  }) as unknown as HTMLImageElement
}

describe('imageElementToImageData', () => {
  beforeEach(() => {
    useOffscreenCanvasMock()
  })

  it('draws the image and returns ImageData with correct dimensions', async () => {
    const img = makeLoadedImg(100, 50)
    const result = await imageElementToImageData(img)
    expect(offscreenCanvasMockContext.drawImage).toHaveBeenCalledWith(img, 0, 0)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('throws EmptyImageError when naturalWidth is 0', async () => {
    const img = makePendingImg(0, 50)
    const promise = imageElementToImageData(img)
    img.dispatchEvent(new Event('load'))
    await expect(promise).rejects.toBeInstanceOf(EmptyImageError)
  })

  it('throws EmptyImageError when naturalHeight is 0', async () => {
    const img = makePendingImg(100, 0)
    const promise = imageElementToImageData(img)
    img.dispatchEvent(new Event('load'))
    await expect(promise).rejects.toBeInstanceOf(EmptyImageError)
  })

  it('throws when the canvas context is unavailable', async () => {
    vi.stubGlobal('OffscreenCanvas', vi.fn().mockReturnValue({ getContext: () => null }))
    await expect(imageElementToImageData(makeLoadedImg())).rejects.toThrow('Failed to create OffscreenCanvas context')
  })
})
