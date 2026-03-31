import { makeReusableImageData } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makeReusableImageData (Meaningful Persistence Tests)', () => {
  it('guarantees referential identity for matching dimensions', () => {
    const getImg = makeReusableImageData()
    const firstRef = getImg(100, 100)
    const secondRef = getImg(100, 100)
    const thirdRef = getImg(100, 100)

    // Meaningful: Proves we aren't just creating identical objects,
    // but returning the exact same memory address.
    expect(firstRef).toBe(secondRef)
    expect(secondRef).toBe(thirdRef)
  })

  it('persists pixel data between calls (Dirty Buffer check)', () => {
    const getImg = makeReusableImageData()
    const img = getImg(1, 1)

    // Write a "signature" to the buffer
    img.data[0] = 42
    img.data[1] = 99

    const sameImg = getImg(1, 1)

    // Meaningful: Verifies that the factory DOES NOT clear the buffer automatically.
    // This is a feature of reusability; the caller decides when to clear.
    expect(sameImg.data[0]).toBe(42)
    expect(sameImg.data[1]).toBe(99)
  })

  it('invalidates the instance only when dimensions shift', () => {
    const getImg = makeReusableImageData()
    const original = getImg(10, 10)

    // Request same total size (400 bytes) but different shape
    const swapped = getImg(20, 5)

    // Meaningful: Proves that even if size is the same, we MUST
    // create a new instance because ImageData.width is immutable.
    expect(swapped).not.toBe(original)
    expect(swapped.width).toBe(20)
  })

  it('works independently across different factory instances', () => {
    const factoryA = makeReusableImageData()
    const factoryB = makeReusableImageData()

    const imgA = factoryA(10, 10)
    const imgB = factoryB(10, 10)

    // Meaningful: Ensures there is no global singleton leak.
    expect(imgA).not.toBe(imgB)
  })
})
