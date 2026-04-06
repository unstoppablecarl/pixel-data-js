import type { AlphaMask, BinaryMask, ImageDataLike, PixelData } from '@/_types'
import { makeAlphaMask } from '@/Mask/AlphaMask'
import { makeBinaryMask } from '@/Mask/BinaryMask'
import { makePixelData } from '@/PixelData/PixelData'

export function makeMulberry32(initialSeed = 0) {
  let seed = initialSeed

  const result = (): number => {
    // Mulberry32 algorithm
    // 0x6D2B79F5 is used as the Weyl sequence constant
    let t = (seed += 0x6D2B79F5) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function int(max: number): number
  function int(min: number, max: number): number
  function int(minOrMax: number, max?: number): number {
    let min: number = minOrMax
    if (max === undefined) {
      min = 0
      max = minOrMax
    }

    const minInt = Math.ceil(min)
    const maxInt = Math.floor(max)

    return Math.floor(result() * (maxInt - minInt + 1)) + minInt
  }

  result.int = int

  return result
}

function makeImageData(
  w: number,
  h: number,
): ImageData {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  } as ImageData
}

export function makeRndPixelData(w: number, h: number, seed = 1): PixelData {
  const rand = makeMulberry32(seed)
  const img = makeImageData(w, h)
  const pixelData = makePixelData(img)
  const data = pixelData.data

  for (let i = 0; i < data.length; i++) {
    data[i] = (rand() * 0x100000000) >>> 0
  }

  return pixelData as PixelData
}

export function makeRndAlphaMask(w: number, h: number, seed = 1): AlphaMask {
  const rand = makeMulberry32(seed)
  const mask = makeAlphaMask(w, h)

  for (let i = 0; i < mask.data.length; i++) {
    mask.data[i] = (rand() * 256) | 0
  }

  return mask
}

export function makeRndBinaryMask(w: number, h: number, seed = 1): BinaryMask {
  const rand = makeMulberry32(seed)
  const mask = makeBinaryMask(w, h)

  for (let i = 0; i < mask.data.length; i++) {
    mask.data[i] = (rand() < 0.5) ? 1 : 0
  }

  return mask
}

export const makeRndRealisticPixelData = (
  {
    width,
    height,
    rand,
    opaqueRatio = 0.85,
    transparentRatio = 0.10,
  }: {
    width: number,
    height: number,
    rand: () => number,
    opaqueRatio?: number,
    transparentRatio?: number,
  },
) => {

  const buffer = makeRndRealisticPixelBuffer({
    length: width * height,
    rand,
    opaqueRatio,
    transparentRatio,
  })

  const imageData = uInt32ArrayToImageData(buffer, width, height)

  return makePixelData(imageData)
}

export const makeRndColor = (rand: () => number) => (rand() * 0xFFFFFFFF) >>> 0

export const makeRndRealisticPixelBuffer = (
  {
    length,
    rand,
    opaqueRatio = 0.85,
    transparentRatio = 0.10,
  }: {
    length: number,
    rand: () => number,
    opaqueRatio?: number,
    transparentRatio?: number,
  },
) => {

  const buffer = new Uint32Array(length)
  const transparentThreshold = opaqueRatio + transparentRatio

  for (let i = 0; i < length; i++) {
    const branchRand = rand()
    const srcBase = (rand() * 0xFFFFFFFF) >>> 0

    if (branchRand < opaqueRatio) {
      // Force alpha to 255 (Opaque)
      buffer[i] = srcBase | 0xFF000000
    } else if (branchRand < transparentThreshold) {
      // Force alpha to 0 (Transparent)
      buffer[i] = srcBase & 0x00FFFFFF
    } else {
      // Translucent (Ensure it falls between 1 and 254)
      let alpha = srcBase >>> 24

      if (alpha === 0 || alpha === 255) {
        alpha = 128
      }

      buffer[i] = (srcBase & 0x00FFFFFF) | (alpha << 24)
    }
  }

  return buffer
}

function uInt32ArrayToImageData(
  data: Uint32Array,
  width: number,
  height: number,
): ImageDataLike {
  const buffer = data.buffer
  const clampedArray = new Uint8ClampedArray(buffer)

  const i = makeImageData(width, height)
  i.data.set(clampedArray)

  return i
}
