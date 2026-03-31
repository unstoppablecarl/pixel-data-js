import { blendColorPixelDataAlphaMask, type Color32, makeAlphaMask, sourceOverFast, unpackAlpha } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)
const copyBlend = (s: Color32) => s

describe('blendColorPixelDataAlphaMask', () => {
  it('scales AlphaMask and handles bit-perfect pass-through', () => {
    const dst = makeTestPixelData(3, 1, BLUE)
    const mask = makeAlphaMask(3, 1)
    mask.data.set([0, 128, 255])

    blendColorPixelDataAlphaMask(dst, WHITE, mask, { blendFn: copyBlend })

    expect(dst.data32[0]).toBe(BLUE)
    expect((dst.data32[1] >>> 24) & 0xff).toBe(128)
    expect(dst.data32[2]).toBe(WHITE)
  })

  it('accurately inverts AlphaMask values', () => {
    const dst = makeTestPixelData(1, 1, BLUE)
    const mask = makeAlphaMask(1, 1)
    mask.data[0] = 255

    blendColorPixelDataAlphaMask(dst, RED, mask, { invertMask: true, blendFn: copyBlend })
    expect(dst.data32[0]).toBe(BLUE)
  })

  it('covers the weight === 0 branch inside the mask block', () => {
    const dst = makeTestPixelData(1, 1, BLUE)
    const mask = makeAlphaMask(1, 1)
    mask.data[0] = 1

    const mockBlend = vi.fn(sourceOverFast)

    // globalAlpha 100 * mask 1 rounded down goes to 0 weight
    blendColorPixelDataAlphaMask(dst, RED, mask, { alpha: 100, blendFn: mockBlend })

    expect(mockBlend).not.toHaveBeenCalled()
    expect(dst.data32[0]).toBe(BLUE)
  })

  it('hits the (effM === 255) branch for raw color data with globalAlpha', () => {
    const dst = makeTestPixelData(1, 1, TRANSPARENT)
    const mask = makeAlphaMask(1, 1)
    mask.data[0] = 255

    const partialAlpha = 120

    blendColorPixelDataAlphaMask(dst, RED, mask, { alpha: partialAlpha })

    const resultAlpha = unpackAlpha(dst.data32[0] as Color32)
    expect(resultAlpha).toBe(120) // Passes through globalAlpha cleanly
  })

  it('covers the inverse identity branch where globalAlpha is 255', () => {
    const dst = makeTestPixelData(1, 1, TRANSPARENT)
    const mask = makeAlphaMask(1, 1)
    mask.data[0] = 120

    blendColorPixelDataAlphaMask(dst, RED, mask, { alpha: 255 })

    const resultAlpha = unpackAlpha(dst.data32[0] as Color32)
    expect(resultAlpha).toBe(120) // Passes through mask cleanly
  })
})
