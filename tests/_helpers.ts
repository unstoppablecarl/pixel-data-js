import { expect } from 'vitest'
import type { AlphaMask, BinaryMask, Color32, ImageDataLike } from '../src'
import { PixelData } from '../src'

/**
 * Creates ImageData filled with unique colors based on coordinates.
 * R: x * step, G: y * step, B: (x+y), A: 255
 */
export const createTestImageData = (
  w: number,
  h: number,
  step: number = 10,
): ImageData => {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      data[i] = (x * step) % 256
      data[i + 1] = (y * step) % 256
      data[i + 2] = (x + y) % 256
      data[i + 3] = 255
    }
  }
  return new ImageData(data, w, h)
}

/**
 * Validates that a specific pixel in ImageData matches expected coordinates.
 */
export const expectPixelToMatch = (
  img: ImageDataLike,
  x: number,
  y: number,
  expectedX: number,
  expectedY: number,
  step: number = 10,
) => {
  const i = (y * img.width + x) * 4
  const d = img.data

  if (d[i] === undefined) {
    throw new Error(
      `Out of Bounds: Accessing index ${i} (x:${x}, y:${y}) in buffer of length ${d.length}.
       Expected Width: ${img.width}, Expected Height: ${img.height}`,
    )
  }

  expect({
    x,
    y,
    red: d[i],
  }).toEqual({
    x,
    y,
    red: (expectedX * step) % 256,
  })

  expect({
    x,
    y,
    green: d[i + 1],
  }).toEqual({
    x,
    y,
    green: (expectedY * step) % 256,
  })

  expect({
    x,
    y,
    blue: d[i + 2],
  }).toEqual({
    x,
    y,
    blue: (expectedX + expectedY) % 256,
  })

  expect({
    x,
    y,
    alpha: d[i + 3],
  }).toEqual({
    x,
    y,
    alpha: 255,
  })
}

export const createImg = (
  w: number,
  h: number,
): ImageData => {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  } as ImageData
}

export const pack = (
  r: number,
  g: number,
  b: number,
  a: number,
): Color32 => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32
export const unpack = (c: number) => ({
  r: c & 0xFF,
  g: (c >> 8) & 0xFF,
  b: (c >> 16) & 0xFF,
  a: (c >>> 24) & 0xFF,
})

export const makeTestPixelData = (
  w: number,
  h: number,
  fill: number = 0,
) => {
  const data = new Uint8ClampedArray(w * h * 4)
  const img = new PixelData({
    width: w,
    height: h,
    data,
  })
  if (fill !== 0) {
    img.data32.fill(fill)
  }
  return img
}

export function getPixel(
  src: PixelData,
  x: number,
  y: number,
): Color32 {
  const index = y * src.width + x

  return src.data32[index] as Color32
}

export function makeComplexTestPixelData(w: number, h: number): PixelData {
  const img = new ImageData(w, h)
  const pixelData = new PixelData(img)
  const data = pixelData.data32
  for (let i = 0; i < data.length; i++) {
    const x = i % w
    const y = (i / w) | 0

    // Create a color/alpha gradient so branches aren't predictable
    const r = (x / w) * 255
    const g = (y / h) * 255
    const b = ((x + y) / (w + h)) * 255
    const a = (i % 255) // Varying alpha

    data[i] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0
  }
  return pixelData
}

export function makeComplexAlphaMask(w: number, h: number): AlphaMask {
  const data = new Uint8Array(w * h);

  for (let i = 0; i < data.length; i++) {
    const x = i % w;
    const y = (i / w) | 0;

    // Create a spatial gradient (0-255)
    // This ensures we test the full range of interpolation math
    data[i] = ((x / w) * 127 + (y / h) * 127) | 0;
  }

  return data as AlphaMask;
}

export function makeComplexBinaryMask(w: number, h: number): BinaryMask {
  const data = new Uint8Array(w * h);

  for (let i = 0; i < data.length; i++) {
    // Create a checkerboard or "noisy" pattern
    // This prevents the CPU from predicting the "if (mask[i])" branch
    const x = i % w;
    const y = (i / w) | 0;

    data[i] = (x + y) % 2 === 0 ? 1 : 0;
  }

  return data as BinaryMask;
}
