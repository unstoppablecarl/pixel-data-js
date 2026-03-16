import { bench, group } from 'mitata'
import {
  type AlphaMask,
  BaseBlendMode,
  type BinaryMask,
  type BlendColor32,
  type BlendModeRegistry,
  blendPixelData as baseBlendPixelData,
  makeFastBlendModeRegistry,
  MaskType,
  PixelData,
} from '../../src'
import type { BlendModeBenchCase } from '../../tests-browser/reporters/_helpers'

const size = 1024
const src = makeComplexTestPixelData(size, size)
const dst = makeComplexTestPixelData(size, size)
const alphaMask = makeComplexAlphaMask(size, size)
const binaryMask = makeComplexBinaryMask(size, size)

export function pixelDataBenchmarkBuilder(blendPixelData: typeof baseBlendPixelData = baseBlendPixelData) {

  const cases = makeFastSummary(BaseBlendMode.sourceOver, blendPixelData)

  // const cases = makeAllCases('fast', makeFastBlendModeRegistry())
  group('blendPixelData', () => {
    cases.forEach(({ blendMode, testCase, type, run }) => {
      const taskName = `${type}: ${blendMode} - ${testCase}`
      bench(taskName, () => {
        run()
      })
    })
  })
}

function makeFastSummary(blendIndex: number, blendPixelDataFn: typeof baseBlendPixelData = baseBlendPixelData) {
  return makeCase('fast', makeFastBlendModeRegistry(), blendIndex, blendPixelDataFn)
}

function makeCase(
  type: string,
  registry: BlendModeRegistry,
  blendIndex: number,
  blendPixelDataFn: typeof baseBlendPixelData = baseBlendPixelData,
) {
  const blendName = registry.indexToName[blendIndex]!
  const blendFn = registry.indexToBlend[blendIndex]!

  return buildBlendModeCases(type, blendName, blendFn, src, dst, binaryMask, alphaMask, blendPixelDataFn)
}

function makeAllCases(
  type: string,
  registry: BlendModeRegistry,
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
  blendPixelDataFn: typeof baseBlendPixelData,
): BlendModeBenchCase[] {

  return registry.indexToBlend.flatMap((blendFn) => {

    const blendName = registry.blendToName.get(blendFn)!

    return buildBlendModeCases(
      type,
      blendName,
      blendFn,
      src,
      dst,
      binaryMask,
      alphaMask,
      blendPixelDataFn,
    )
  })
}

function buildBlendModeCases(
  type: string,
  blendMode: string,
  blendFn: BlendColor32,
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
  blendPixelDataFn: typeof baseBlendPixelData,
): BlendModeBenchCase[] {

  const cases: BlendModeBenchCase[] = []

  const base = {
    blendMode,
    type,
  }

  cases.push({
    ...base,
    testCase: `minimal`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Global Alpha`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        alpha: 128,
      })
      globalThis.lastResult = dst
    },
  })

  // --- Masking Logic ---

  cases.push({
    ...base,
    testCase: `Binary Mask`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        mask: binaryMask,
        maskType: MaskType.BINARY,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Alpha Mask`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
      })
      globalThis.lastResult = dst
    },
  })

  // --- Inversion and Alpha Combinations ---

  cases.push({
    ...base,
    testCase: `Alpha Mask (Inverted)`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Alpha + Alpha Mask`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        alpha: 128,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
      })
      globalThis.lastResult = dst
    },
  })

  // --- Coordinate & Offset Stress Tests ---

  cases.push({
    ...base,
    testCase: `Sub-region 512x512`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        x: 100,
        y: 100,
        w: 512,
        h: 512,
        sx: 50,
        sy: 50,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Sub-region 512x512 + Offset Alpha Mask`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        x: 100,
        y: 100,
        w: 512,
        h: 512,
        sx: 50,
        sy: 50,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        mx: 20,
        my: 20,
        mw: 1024,
      })
      globalThis.lastResult = dst
    },
  })

  // Tests logic where the mask is not a 1:1 fit for the source/dest
  cases.push({
    ...base,
    testCase: `Offset Alpha Mask`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        mx: 20,
        my: 20,
        mw: 1024,
      })
      globalThis.lastResult = dst
    },
  })

  // Worst-case scenario: heavy math + alpha scaling + mask + inversion
  cases.push({
    ...base,
    testCase: `Full Stack (Alpha/Mask/Invert)`,
    run: () => {
      blendPixelDataFn(dst, src, {
        blendFn,
        alpha: 128,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })
      globalThis.lastResult = dst
    },
  })

  return cases
}

// Prevent V8 from optimizing away the loop by "using" the return value
declare global {
  var lastResult: PixelData
}

function createImg(
  w: number,
  h: number,
): ImageData {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  } as ImageData
}

export function makeComplexTestPixelData(w: number, h: number, seed = 1): PixelData {
  const rand = makeMulberry32(seed)

  const img = createImg(w, h)
  const pixelData = new PixelData(img)
  const data = pixelData.data32

  for (let i = 0; i < data.length; i++) {
    // Generate a random 32-bit unsigned integer
    // Using >>> 0 ensures it is treated as a 32-bit unsigned int
    data[i] = (rand() * 0xFFFFFFFF) >>> 0
  }

  return pixelData
}

export function makeMulberry32(initialSeed = 0) {
  let seed = initialSeed
  let increment = 0

  return (): number => {
    increment++

    // Mulberry32 algorithm
    // 0x6D2B79F5 is used as the Weyl sequence constant
    let t = (seed += 0x6D2B79F5) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    seed = t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeComplexAlphaMask(w: number, h: number): AlphaMask {
  const data = new Uint8Array(w * h)

  for (let i = 0; i < data.length; i++) {
    const x = i % w
    const y = (i / w) | 0

    // Create a spatial gradient (0-255)
    // This ensures we test the full range of interpolation math
    data[i] = ((x / w) * 127 + (y / h) * 127) | 0
  }

  return data as AlphaMask
}

function makeComplexBinaryMask(w: number, h: number): BinaryMask {
  const data = new Uint8Array(w * h)

  for (let i = 0; i < data.length; i++) {
    // Create a checkerboard or "noisy" pattern
    // This prevents the CPU from predicting the "if (mask[i])" branch
    const x = i % w
    const y = (i / w) | 0

    data[i] = (x + y) % 2 === 0 ? 1 : 0
  }

  return data as BinaryMask
}
