import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyCircleBrushToPixelData,
  applyMaskToPixelData,
  applyRectBrushToPixelData,
  type BinaryMask,
  blendColorPixelData,
  blendPixelData,
  type Color32,
  fillPixelData,
  invertPixelData,
  makeFullPixelMutator,
  PixelAccumulator,
  PixelData,
  PixelEngineConfig,
  PixelWriter,
  type Rect,
  sourceOverFast,
} from '../../src'

// Mock the underlying PixelData functions
vi.mock('../../src/PixelData/fillPixelData')
vi.mock('../../src/PixelData/clearPixelData')
vi.mock('../../src/PixelData/blendPixelData')
vi.mock('../../src/PixelData/blendColorPixelData')
vi.mock('../../src/PixelData/applyMaskToPixelData')
vi.mock('../../src/PixelData/invertPixelData')

vi.mock('../../src/PixelData/applyCircleBrushToPixelData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/PixelData/applyCircleBrushToPixelData')>()
  return {
    ...actual,
    applyCircleBrushToPixelData: vi.fn(),
  }
})

vi.mock('../../src/PixelData/applyRectBrushToPixelData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/PixelData/applyRectBrushToPixelData')>()
  return {
    ...actual,
    applyRectBrushToPixelData: vi.fn(),
  }
})

describe('PixelMutator', () => {
  let writer: PixelWriter<any>
  let accumulator: PixelAccumulator
  let target: PixelData
  let mutator: ReturnType<typeof makeFullPixelMutator>

  beforeEach(() => {
    vi.clearAllMocks()

    const config = new PixelEngineConfig(16)
    target = new PixelData(new ImageData(100, 100))
    accumulator = new PixelAccumulator(target, config)

    // Mock the accumulator methods
    vi.spyOn(accumulator, 'storeRegionBeforeState')
    vi.spyOn(accumulator, 'storeTileBeforeState')

    // Create a mock writer object that provides what the mutators need
    writer = {
      target,
      accumulator,
    } as any

    mutator = makeFullPixelMutator(writer)
  })

  it('makeFullPixelMutator should create a mutator with all methods', () => {
    expect(mutator).toHaveProperty('applyCircleBrush')
    expect(mutator).toHaveProperty('applyCircleBrushStroke')
    expect(mutator).toHaveProperty('applyMask')
    expect(mutator).toHaveProperty('applyRectBrush')
    expect(mutator).toHaveProperty('applyRectBrushStroke')
    expect(mutator).toHaveProperty('blendColor')
    expect(mutator).toHaveProperty('blendPixel')
    expect(mutator).toHaveProperty('blendPixelData')
    expect(mutator).toHaveProperty('clear')
    expect(mutator).toHaveProperty('fill')
    expect(mutator).toHaveProperty('invert')
  })

  describe('mutatorFill', () => {
    it('should call accumulator and fillPixelData with correct rect', () => {
      const color = 0xFF0000FF as Color32
      const rect: Partial<Rect> = { x: 10, y: 10, w: 50, h: 50 }

      mutator.fill(color, rect)

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(10, 10, 50, 50)
      expect(fillPixelData).toHaveBeenCalledWith(target, color, 10, 10, 50, 50)
    })

    it('should use default dimensions if rect is not provided', () => {
      const color = 0xFF0000FF as Color32

      mutator.fill(color)

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
      expect(fillPixelData).toHaveBeenCalledWith(target, color, 0, 0, target.width, target.height)
    })
  })

  describe('mutatorClear', () => {
    it('should call accumulator and clearPixelData with correct rect', () => {
      const rect: Partial<Rect> = { x: 10, y: 10, w: 50, h: 50 }
      mutator.clear(rect)
      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(10, 10, 50, 50)
      expect(fillPixelData).toHaveBeenCalledWith(target, 0, 10, 10, 50, 50)
    })

    it('should use default dimensions if rect is not provided', () => {
      mutator.clear()
      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
      expect(fillPixelData).toHaveBeenCalledWith(target, 0, 0, 0, target.width, target.height)
    })
  })

  describe('mutatorBlendPixelData', () => {
    it('should call accumulator and blendPixelData', () => {
      const source = new PixelData(new ImageData(10, 10))
      const options = { x: 20, y: 20 }

      mutator.blendPixelData(source, options)

      // The region is determined by the source size and target offset
      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(20, 20, source.width, source.height)
      expect(blendPixelData).toHaveBeenCalledWith(target, source, options)
    })
  })

  describe('mutatorBlendColor', () => {
    it('should call accumulator and blendColorPixelData', () => {
      const color = 0xFF0000FF as Color32
      const options = { x: 10, y: 10, w: 20, h: 20 }

      mutator.blendColor(color, options)

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(10, 10, 20, 20)
      expect(blendColorPixelData).toHaveBeenCalledWith(target, color, options)
    })
  })

  describe('mutatorApplyMask', () => {
    it('should call accumulator and applyMaskToPixelData', () => {
      const mask = new Uint8Array([1, 1, 1, 1]) as BinaryMask
      const options = { x: 5, y: 5, w: 2, h: 2 }

      mutator.applyMask(mask, options)

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(5, 5, 2, 2)
      expect(applyMaskToPixelData).toHaveBeenCalledWith(target, mask, options)
    })
  })

  describe('mutatorInvert', () => {
    it('should call accumulator and invertPixelData', () => {
      const options = { x: 15, y: 15, w: 30, h: 30 }

      mutator.invert(options)

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(15, 15, 30, 30)
      expect(invertPixelData).toHaveBeenCalledWith(target, options)
    })
  })

  describe('mutatorApplyCircleBrush', () => {
    it('should calculate bounds once and pass them to both accumulator and draw function', () => {
      const color = 0xFF0000FF as Color32
      const fallOff = (d: number) => 1 - d

      mutator.applyCircleBrush(color, 50, 50, 10, 255, fallOff, sourceOverFast)

      const expectedBounds = { x: 45, y: 45, w: 10, h: 10 }

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
        expectedBounds.x,
        expectedBounds.y,
        expectedBounds.w,
        expectedBounds.h,
      )

      expect(applyCircleBrushToPixelData).toHaveBeenCalledWith(
        target,
        color,
        50,
        50,
        10,
        255,
        fallOff,
        sourceOverFast,
        expect.objectContaining(expectedBounds), // Matches the out parameter logic
      )
    })
  })

  describe('mutatorApplyRectBrush', () => {
    it('should apply rectangular bounds exactly', () => {
      const color = 0xFFFFFFFF as Color32

      // 10x10 brush at 20,20:
      // startX = floor(20 - 5) = 15. endX = 15 + 10 = 25. w = 10.
      mutator.applyRectBrush(color, 20, 20, 10, 10, 255)

      const expectedBounds = { x: 15, y: 15, w: 10, h: 10 }

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(15, 15, 10, 10)

      expect(applyRectBrushToPixelData).toHaveBeenCalledWith(
        target,
        color,
        20,
        20,
        10,
        10,
        255,
        undefined,
        undefined,
        expect.objectContaining(expectedBounds),
      )
    })

    it('should respect target clipping in the mutator', () => {
      const color = 0xFFFFFFFF as Color32

      // Brush at 0,0 with size 10x10.
      // rawStart = -5, rawEnd = 5. Clamped to 0, 5. w=5.
      mutator.applyRectBrush(color, 0, 0, 10, 10)

      expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, 5, 5)
    })
  })

  describe('mutatorBlendPixel', () => {
    it('should call accumulator and modify the pixel data', () => {
      const x = 10, y = 20
      const color = 0xFF0000FF as Color32 // Opaque Red

      mutator.blendPixel(x, y, color)

      expect(accumulator.storeTileBeforeState).toHaveBeenCalledWith(x, y)
      const index = y * target.width + x
      // Uses overwriteFast by default, which just returns the second arg (src)
      expect(target.data32[index]).toBe(color)
    })

    it('should not do anything if coordinates are out of bounds', () => {
      mutator.blendPixel(-1, 10, 0xFFFFFFFF as Color32)
      mutator.blendPixel(10, -1, 0xFFFFFFFF as Color32)
      mutator.blendPixel(target.width, 10, 0xFFFFFFFF as Color32)
      mutator.blendPixel(10, target.height, 0xFFFFFFFF as Color32)

      expect(accumulator.storeTileBeforeState).not.toHaveBeenCalled()
      // Ensure no pixels were changed
      expect(target.data32.some(p => p !== 0)).toBe(false)
    })

    it('should apply partial alpha correctly', () => {
      const x = 5, y = 5
      // Opaque red with 50% alpha
      const color = 0xFF0000FF as Color32
      const alpha = 128 // ~50%

      mutator.blendPixel(x, y, color, alpha, sourceOverFast)

      const index = y * target.width + x
      const finalColor = target.data32[index]

      // With source-over on a black background (0x00000000),
      // the resulting alpha should be ~128
      const finalAlpha = finalColor >>> 24
      expect(finalAlpha).toBeCloseTo(128, -1) // Allow for rounding
    })

    it('should use the specified blend function', () => {
      const x = 1, y = 1
      const bgColor = 0xFF00FF00 as Color32 // Opaque Green
      const srcColor = 0x80FF0000 as Color32 // 50% Opaque Red

      const index = y * target.width + x
      target.data32[index] = bgColor

      const blendFn = vi.fn().mockReturnValue(0xDEADBEEF as Color32)

      mutator.blendPixel(x, y, srcColor, 255, blendFn)

      // Expect (src, dst) = (srcColor, bgColor)
      expect(blendFn).toHaveBeenCalledWith(srcColor, bgColor)
      expect(target.data32[index]).toBe(0xDEADBEEF)
    })
  })
})
