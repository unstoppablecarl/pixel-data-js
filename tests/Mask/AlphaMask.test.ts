import { makeAlphaMask, MaskType } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makeAlphaMask', () => {
  it('creates an AlphaMask with correct initial dimensions and data length', () => {
    const width = 10
    const height = 5
    const mask = makeAlphaMask(width, height)

    expect(mask.type).toBe(MaskType.ALPHA)
    expect(mask.w).toBe(width)
    expect(mask.h).toBe(height)
    expect(mask.data).toBeInstanceOf(Uint8Array)
    expect(mask.data.length).toBe(50)
  })

  it('creates an AlphaMask with provided data', () => {
    const data = new Uint8Array(4)

    data[0] = 255
    data[1] = 128
    data[2] = 64
    data[3] = 0

    const mask = makeAlphaMask(2, 2, data)
    expect(mask.data).toBe(data)
    expect(mask.data[0]).toBe(255)
  })
})
