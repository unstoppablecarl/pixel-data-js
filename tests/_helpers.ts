import { expect } from 'vitest'
import {
  type AlphaMask,
  type BinaryMask,
  type BinaryMaskRect,
  type Color32,
  type ImageDataLike,
  type ImageDataLikeConstructor,
  type IPixelData32,
  makeAlphaMask,
  makeBinaryMask,
  PaintBuffer,
  PixelData,
  PixelEngineConfig,
  PixelTilePool,
  type RGBA,
  unpackAlpha,
  unpackBlue,
  unpackGreen,
  unpackRed,
} from '../src'

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
  img: ImageDataLike | PixelData,
  x: number,
  y: number,
  expectedX: number,
  expectedY: number,
  overrideStep = 10,
) => {
  const i = (y * img.width + x) * 4

  let step: number
  let d: Uint8ClampedArray
  if ('imageData' in img) {
    d = img.imageData.data
    step = img.width
  } else {
    d = img.data
    step = img.width
  }

  step = overrideStep ?? step

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
  const img = new PixelData(new ImageData(w, h))
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

export function makeTestAlphaMask(w: number, h: number, value?: number | number[]): AlphaMask {
  const mask = makeAlphaMask(w, h)
  if (typeof value === 'number') {
    mask.data.fill(value)
  }
  if (Array.isArray(value)) {
    mask.data.set(value)
  }
  return mask
}

export function makeTestBinaryMask(w: number, h: number, value?: number | number[]): BinaryMask {
  const mask = makeBinaryMask(w, h)
  if (typeof value === 'number') {
    mask.data.fill(value)
  }
  if (Array.isArray(value)) {
    mask.data.set(value)
  }
  return mask
}

export function makeTestBinaryMaskRect(x: number, y: number, w: number, h: number, value?: number | number[]): BinaryMaskRect {
  const mask = makeBinaryMask(w, h)
  if (typeof value === 'number') {
    mask.data.fill(value)
  }
  if (Array.isArray(value)) {
    mask.data.set(value)
  }
  return {
    x,
    y,
    ...mask,
  }
}

/**
 * Compares two Uint32 pixel buffers and returns an array of mismatches
 * with their 2D coordinates and hex values.
 */
export function comparePixelBuffers(
  expected: Uint32Array,
  actual: Uint32Array,
  width: number,
) {
  const mismatches: {
    x: number
    y: number
    actual: string
    expected: string
  }[] = []
  expect(actual.length, `Buffer length mismatch: actual ${actual.length}, expected ${expected.length}`).toBe(expected.length)

  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      const x = i % width
      const y = Math.floor(i / width)

      mismatches.push({
        x,
        y,
        actual: toRGBAString(unpack(actual[i] as Color32)),
        expected: toRGBAString(unpack(expected[i] as Color32)),
      })
    }
  }

  return mismatches
}

const toRGBAString = ({ r, g, b, a }: RGBA) => `rgba(${r}, ${g}, ${b}, ${a})`

export const expectPixelToMatchColor = (
  target: PixelData,
  x: number,
  y: number,
  color: Color32,
) => {

  const value = getPixelColorFromUInt32Array(target.data32, x, y, target.width)

  expect(unpack(color)).toEqual(unpack(value))
}

export const getPixelColorFromUInt32Array = (
  target: Uint32Array,
  x: number,
  y: number,
  width: number,
): Color32 => {
  const i = (y * width + x)
  const value = target[i]
  if (value === undefined) {
    throw new Error(
      `Out of Bounds: Accessing index ${i} (x:${x}, y:${y}) in buffer of length ${target.length}.
       Expected Width: ${width}`,
    )
  }
  return value as Color32
}

export function forEachPixel(
  target: PixelData,
  callback: (x: number, y: number, color: Color32) => void,
): void {

  let index = 0
  const height = target.height
  const width1 = target.width

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width1; x++) {
      callback(x, y, target.data32[y * width1 + x] as Color32)
      index++
    }
  }
}

function rgbColor(color: Color32) {
  const a = unpackAlpha(color)
  const r = unpackRed(color)
  const g = unpackGreen(color)
  const b = unpackBlue(color)

  if (a === 0) {
    return ' X'
  } else {
    return `\x1b[38;2;${r};${g};${b}m █\x1b[0m`
  }
}

export function printBinaryMaskGrid(dst: BinaryMask, sep = ', '): void {
  const w = dst.w
  const h = dst.h
  const data = dst.data

  for (let y = 0; y < h; y++) {
    let rowString = ''

    for (let x = 0; x < w; x++) {
      const index = y * w + x
      const pixel = data[index]
      rowString += '' + pixel + sep
    }

    console.log(rowString)
  }
}

export function printAlphaMaskGrid(dst: AlphaMask, sep = ', '): void {
  const w = dst.w
  const h = dst.h
  const data = dst.data

  for (let y = 0; y < h; y++) {
    let rowString = ''

    for (let x = 0; x < w; x++) {
      const index = y * w + x
      const pixel = data[index]
      rowString += ('' + pixel).padStart(3, ' ') + sep
    }

    console.log(rowString)
  }
}

export function printPixelDataGrid(dst: IPixelData32, sep = ', '): void {
  const w = dst.width
  const h = dst.height
  const data = dst.data32

  for (let y = 0; y < h; y++) {
    let rowString = ''

    for (let x = 0; x < w; x++) {
      const index = y * w + x
      const pixel = data[index]
      rowString += ('' + pixel).padStart(8, ' ') + sep
    }

    console.log(rowString)
  }
}

export function printPixelDataGridColor(dst: IPixelData32): void {
  const w = dst.width
  const h = dst.height
  const data = dst.data32

  for (let y = 0; y < h; y++) {
    let rowString = ''

    for (let x = 0; x < w; x++) {
      const index = y * w + x
      const pixel = data[index]
      rowString += rgbColor(pixel as Color32)
    }

    console.log(rowString)
  }
}

export function printPixelDataTable(dst: IPixelData32): void {
  const w = dst.width
  const h = dst.height
  const data = dst.data32
  const grid = []

  for (let y = 0; y < h; y++) {
    const row = []

    for (let x = 0; x < w; x++) {
      const index = y * w + x
      const pixel = data[index]
      const hex = pixel.toString(16)
      const padded = hex.padStart(8, '0')

      row.push(padded)
    }

    grid.push(row)
  }

  console.table(grid)
}

export function copyPixelData<T extends ImageDataLike = ImageData>(target: PixelData<T>): PixelData<T> {
  const data = target.imageData.data
  const buffer = new Uint8ClampedArray(data)
  const Ctor = target.imageData.constructor
  const isCtorValid = typeof Ctor === 'function'

  let newImageData: T
  if (isCtorValid && Ctor !== Object) {
    const ImageConstructor = Ctor as ImageDataLikeConstructor<T>
    newImageData = new ImageConstructor(
      buffer,
      target.width,
      target.height,
    )
  } else {
    newImageData = {
      width: target.width,
      height: target.height,
      data: buffer,
    } as unknown as T
  }

  return new PixelData<T>(newImageData)
}

export function makeTestPaintBuffer(tileSize: number, w = 2, h = 2) {
  const target = makeTestPixelData(tileSize * w, tileSize * h)
  const config = new PixelEngineConfig(tileSize, target)
  const tilePool = new PixelTilePool(config)
  const paintBuffer = new PaintBuffer(config, tilePool)

  return {
    target,
    config,
    tilePool,
    paintBuffer,
  }
}
