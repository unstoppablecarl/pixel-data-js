import prettyMilliseconds from 'pretty-ms'
import { Bench } from 'tinybench'
import { describe, test } from 'vitest'

import {
  type AlphaMask,
  type BinaryMask,
  type BlendColor32,
  BlendMode,
  blendPixelData,
  BLEND_MODES,
  BLEND_TO_INDEX,
  MaskType,
  PixelData, vividLightColor32,
} from '../src'
import { makeComplexAlphaMask, makeComplexBinaryMask, makeComplexTestPixelData } from '../tests/_helpers'
import { BenchReporter } from './BenchReporter'

describe('Blend Modes', () => {
  const size = 1024
  const src = makeComplexTestPixelData(size, size)
  const dst = makeComplexTestPixelData(size, size)
  const alphaMask = makeComplexAlphaMask(size, size)
  const binaryMask = makeComplexBinaryMask(size, size)

  const bench = new Bench({
    time: 3000,
    warmupTime: 1000,
  })
  const reporter = new BenchReporter(size, size)
  reporter.setupListeners(bench)

  // const cases = buildAllCases(src, dst, binaryMask, alphaMask)
  const cases = buildBlendModeCases(src, dst, binaryMask, alphaMask, vividLightColor32)

  const warmupTime = 1000
  const benchTime = 3000

  const timeout = cases.length * (benchTime + warmupTime)

  console.info('Starting: estimated time: ' + prettyMilliseconds(timeout))

  test('Blend Mode Bench', async () => {
    cases.forEach(({ name, run }) => bench.add(name, run))
    await bench.run()

    reporter.printFinal(bench.tasks)
  }, timeout + 5000)
})

type Case = {
  name: string;
  run: () => void;
};

function buildAllCases(
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
): Case[] {

  return BLEND_MODES.flatMap((blendFn) => {
    return buildBlendModeCases(
      src,
      dst,
      binaryMask,
      alphaMask,
      blendFn,
    )
  })
}

function buildBlendModeCases(
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
  blendFn: BlendColor32,
): Case[] {

  const cases = []
  const blendIndex = BLEND_TO_INDEX.get(blendFn)
  const name = BlendMode[blendIndex]

  // --- Base Combinations ---

  cases.push({
    name: `${name}`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
      })
    },
  })

  cases.push({
    name: `${name} + Global Alpha`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        alpha: 128,
      })
    },
  })

  // --- Masking Logic ---

  cases.push({
    name: `${name} + Binary Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: binaryMask,
        maskType: MaskType.BINARY,
      })
    },
  })

  cases.push({
    name: `${name} + Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
      })
    },
  })

  // --- Inversion and Alpha Combinations ---

  cases.push({
    name: `${name} + Alpha Mask (Inverted)`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })
    },
  })

  cases.push({
    name: `${name} + Alpha + Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        alpha: 128,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
      })
    },
  })

  // --- Coordinate & Offset Stress Tests ---

  cases.push({
    name: `${name} + Sub-region 512x512`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        x: 100,
        y: 100,
        w: 512,
        h: 512,
        sx: 50,
        sy: 50,
      })
    },
  })

  cases.push({
    name: `${name} + Sub-region 512x512 + Offset Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
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
    },
  })

  // Tests logic where the mask is not a 1:1 fit for the source/dest
  cases.push({
    name: `${name} + Offset Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        mx: 20,
        my: 20,
        mw: 1024,
      })
    },
  })

  // Worst-case scenario: heavy math + alpha scaling + mask + inversion
  cases.push({
    name: `${name} + Full Stack (Alpha/Mask/Invert)`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        alpha: 128,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })
    },
  })

  return cases
}

