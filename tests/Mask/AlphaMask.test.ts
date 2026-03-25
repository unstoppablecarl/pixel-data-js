import { describe, expect, it } from 'vitest'
import { makeAlphaMask, MaskType } from '@/index'

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

  it('updates data, width, and height when set() is called', () => {
    const mask = makeAlphaMask(2, 2)
    const newWidth = 4
    const newHeight = 1
    const newData = new Uint8Array(4)

    newData[0] = 255
    newData[1] = 128
    newData[2] = 64
    newData[3] = 0

    mask.set(newData, newWidth, newHeight)

    expect(mask.w).toBe(newWidth)
    expect(mask.h).toBe(newHeight)
    expect(mask.data).toBe(newData)
    expect(mask.data[0]).toBe(255)
  })
})
