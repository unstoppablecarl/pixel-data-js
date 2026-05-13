import { FailedToLoadImageError, imageElementLoaded } from '@/index'
import { describe, expect, it, vi } from 'vitest'

function makePendingImg(src = 'https://example.com/pending.png'): HTMLImageElement {
  return Object.assign(new EventTarget(), { complete: false, naturalWidth: 0, src }) as unknown as HTMLImageElement
}

describe('FailedToLoadImageError', () => {
  it('has the correct name', () => {
    expect(new FailedToLoadImageError('img.png').name).toBe('FailedToLoadImageError')
  })

  it('includes the src in the message', () => {
    expect(new FailedToLoadImageError('img.png').message).toContain('img.png')
  })

  it('is an instance of Error', () => {
    expect(new FailedToLoadImageError('img.png')).toBeInstanceOf(Error)
  })
})

describe('imageElementLoaded', () => {
  it('resolves immediately when the image is already cached', async () => {
    const img = {
      complete: true,
      naturalWidth: 100,
      src: 'loaded.png',
      addEventListener: vi.fn(),
    } as unknown as HTMLImageElement

    await expect(imageElementLoaded(img)).resolves.toBe(img)
  })

  it('rejects immediately when complete but has no dimensions', async () => {
    const img = {
      complete: true,
      naturalWidth: 0,
      src: 'broken.png',
      addEventListener: vi.fn(),
    } as unknown as HTMLImageElement

    await expect(imageElementLoaded(img)).rejects.toBeInstanceOf(FailedToLoadImageError)
  })

  it('resolves when the load event fires', async () => {
    const img = makePendingImg()
    const promise = imageElementLoaded(img)
    img.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBe(img)
  })

  it('rejects with FailedToLoadImageError when the error event fires', async () => {
    const img = makePendingImg()
    const promise = imageElementLoaded(img)
    img.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toBeInstanceOf(FailedToLoadImageError)
  })

  it('includes the src in the error message', async () => {
    const img = makePendingImg('https://example.com/fail.png')
    const promise = imageElementLoaded(img)
    img.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow('https://example.com/fail.png')
  })
})
