import type { Color32 } from '@/_types'
import { AlphaMaskPaintBuffer, ERRORS, makeAlphaMaskPaintBufferCanvasRenderer } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { offscreenCanvasMockContext, useOffscreenCanvasMock } from '../_helpers/OffscreenCanvasMock'

describe('AlphaMaskPaintBufferCanvasRenderer', () => {
  const tileSize = 8

  let mockConfig: any
  let mockLookup: any[]
  let mockPaintBuffer: AlphaMaskPaintBuffer
  let mockTargetCtx: any

  beforeEach(() => {
    offscreenCanvasMockContext.putImageData.mockClear()
    offscreenCanvasMockContext.drawImage.mockClear()
    offscreenCanvasMockContext.clearRect.mockClear()

    mockConfig = {
      tileSize: tileSize,
      tileShift: 4,
      tileArea: tileSize * tileSize,
    }

    mockLookup = []

    mockPaintBuffer = {
      config: mockConfig,
      lookup: mockLookup,
    } as unknown as AlphaMaskPaintBuffer

    mockTargetCtx = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      drawImage: vi.fn(),
    }

    useOffscreenCanvasMock()
  })

  describe('Factory Initialization', () => {
    it('should throw CANVAS_CTX_FAILED if getContext returns null', () => {
      const BadCanvasClass = class {
        getContext() {
          return null
        }
      }

      expect(() => {
        makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer, BadCanvasClass as any)
      }).toThrowError(ERRORS.CANVAS_CTX_FAILED)
    })

    it('should disable imageSmoothingEnabled on the internal canvas', () => {
      // Because OffscreenCanvas is stubbed globally, we don't even need to pass the 2nd arg
      makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      expect((offscreenCanvasMockContext as any).imageSmoothingEnabled).toBe(false)
    })
  })

  describe('drawPaintBuffer Rendering Logic', () => {
    it('should temporarily mutate and safely restore targetCtx global states', () => {
      const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      const color = 0xffffffff as Color32
      const alpha = 128
      const compOp = 'destination-out'

      const globalAlphaSetter = vi.fn()
      const globalCompSetter = vi.fn()

      const trackableTargetCtx = {
        set globalAlpha(val: number) {
          globalAlphaSetter(val)
        },
        set globalCompositeOperation(val: string) {
          globalCompSetter(val)
        },
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      render(trackableTargetCtx, color, alpha, compOp)

      // Initial assignments
      expect(globalAlphaSetter).toHaveBeenNthCalledWith(1, 128 / 255)
      expect(globalCompSetter).toHaveBeenNthCalledWith(1, compOp)

      // Restoration
      expect(globalAlphaSetter).toHaveBeenLastCalledWith(1)
      expect(globalCompSetter).toHaveBeenLastCalledWith('source-over')
    })

    it('should accurately translate 8-bit masks to 32-bit colors using bitwise math', () => {
      const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      const data8 = new Uint8Array(256)
      data8[0] = 0   // Transparent
      data8[1] = 255 // Solid
      data8[2] = 128 // 50% Partial Alpha

      const tile = {
        data: data8,
        tx: 0,
        ty: 0,
      }
      mockLookup[0] = tile

      const color = 0xff0000ff as Color32

      render(mockTargetCtx, color, 255, 'source-over')

      expect(offscreenCanvasMockContext.putImageData).toHaveBeenCalled()

      // Extract the ImageData payload sent to your mock context
      const imageDataArg = offscreenCanvasMockContext.putImageData.mock.calls[0][0] as ImageData
      const view32 = new Uint32Array(imageDataArg.data.buffer)

      // Assert 0: Transparent skipped
      expect(view32[0]).toBe(0)

      // Assert 1: Solid mapped perfectly to source color
      expect(view32[1]).toBe(0xff0000ff)

      // Assert 2: Partial blended correctly via double-shift
      expect(view32[2]).toBe(0x800000ff)
    })

    it('should clear memory bridge between tiles to prevent ghost pixels', () => {
      const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      const tileA = {
        data: new Uint8Array(256),
        tx: 0,
        ty: 0,
      }
      tileA.data[0] = 255

      const tileB = {
        data: new Uint8Array(256),
        tx: 1,
        ty: 0,
      }

      mockLookup[0] = tileA
      mockLookup[1] = tileB

      const color = 0xffffffff as Color32

      render(mockTargetCtx, color, 255, 'source-over')

      expect(offscreenCanvasMockContext.putImageData).toHaveBeenCalledTimes(2)

      // Inspect the bridge memory state during the Tile B draw call
      const tileBImageDataArg = offscreenCanvasMockContext.putImageData.mock.calls[1][0] as ImageData
      const tileBView32 = new Uint32Array(tileBImageDataArg.data.buffer)

      // The pixel at index 0 should have been erased by `view32.fill(0)`
      expect(tileBView32[0]).toBe(0)
    })

    it('should correctly calculate drawing offsets based on tile space geometry', () => {
      const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      const tile = {
        data: new Uint8Array(256),
        tx: 2,
        ty: 3,
      }
      mockLookup[0] = tile

      const color = 0xffffffff as Color32

      render(mockTargetCtx, color, 255, 'source-over')

      const expectedDx = 32
      const expectedDy = 48

      expect(mockTargetCtx.drawImage).toHaveBeenCalledWith(
        expect.objectContaining({ width: 8, height: 8 }),
        expectedDx,
        expectedDy,
      )
    })
  })

  it('should return early if alpha is zero', () => {
    const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

    const tile = {
      data: new Uint8Array(256),
      tx: 2,
      ty: 3,
    }
    mockLookup[0] = tile

    const color = 0xffffffff as Color32

    render(mockTargetCtx, color, 0, 'source-over')
    expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
  })

  it('should return early if color alpha is zero', () => {
    const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

    const tile = {
      data: new Uint8Array(256),
      tx: 2,
      ty: 3,
    }
    mockLookup[0] = tile

    const color = 0x00ffffff as Color32

    render(mockTargetCtx, color, 255, 'source-over')
    expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
  })

  it('should apply a mask to a color and render the full data array to target', () => {
    // 1. Setup a tiny 2x2 tile geometry
    const tileSize = 2
    const mockConfig = {
      tileSize: tileSize,
      tileShift: 0,
      tileArea: 4,
    }

    // 2. Create mask data:
    // [Solid, Transparent, 50% Alpha (128), 1/255 Alpha (1)]
    const data8 = new Uint8Array(4)
    data8[0] = 255
    data8[1] = 0
    data8[2] = 128
    data8[3] = 1

    const mockLookup = [
      {
        data: data8,
        tx: 0,
        ty: 0,
      },
    ]

    const mockPaintBuffer = {
      config: mockConfig,
      lookup: mockLookup,
    } as any

    const render = makeAlphaMaskPaintBufferCanvasRenderer(mockPaintBuffer)

    // 3. Prepare target: Full Blue color (0xFF0000FF)
    // baseSrcAlpha = 255, colorRGB = 0x0000FF
    const color = 0xFF0000FF as Color32

    // We want to capture the final pixels that go to the internal canvas
    render(mockTargetCtx, color, 255, 'source-over')

    const putImageDataCall = offscreenCanvasMockContext.putImageData.mock.calls[0]
    const imageDataArg = putImageDataCall[0] as ImageData
    const output32 = new Uint32Array(imageDataArg.data.buffer)

    // 4. Calculate expected values
    // Index 0: mask 255 -> 0xFF0000FF
    // Index 1: mask 0 -> 0x00000000 (skipped/filled 0)
    // Index 2: mask 128 -> (255 * 128 + 128) >> 8 = 128 -> 0x800000FF
    // Index 3: mask 1 -> (255 * 1 + 128) >> 8 = 1 -> 0x010000FF

    const expected = new Uint32Array(4)
    expected[0] = 0xFF0000FF
    expected[1] = 0x00000000
    expected[2] = 0x800000FF
    expected[3] = 0x010000FF

    expect(output32).toEqual(expected)

    // Verify it was drawn at the correct coordinates (tx:0, ty:0)
    expect(mockTargetCtx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
    )

  })
})
