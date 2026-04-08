import type { Color32 } from '@/_types'
import { ERRORS, makeBinaryMaskPaintBufferCanvasRenderer } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { offscreenCanvasMockContext, useOffscreenCanvasMock } from '../../_helpers/OffscreenCanvasMock'

describe('BinaryMaskPaintBufferCanvasRenderer', () => {
  const tileSize = 4
  let mockConfig: any
  let mockLookup: any[]
  let mockPaintBuffer: any
  let mockTargetCtx: any

  beforeEach(() => {
    useOffscreenCanvasMock()
    offscreenCanvasMockContext.putImageData.mockClear()
    offscreenCanvasMockContext.drawImage.mockClear()

    mockConfig = {
      tileSize: tileSize,
      tileShift: 2,
      tileArea: 16,
    }

    mockLookup = []
    mockPaintBuffer = {
      config: mockConfig,
      lookup: mockLookup,
    }

    mockTargetCtx = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      drawImage: vi.fn(),
    }
  })

  describe('Factory Initialization', () => {
    it('should throw CANVAS_CTX_FAILED if getContext returns null', () => {
      const BadCanvasClass = class {
        getContext() {
          return null
        }
      }

      expect(() => {
        makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, BadCanvasClass as any)
      }).toThrowError(ERRORS.CANVAS_CTX_FAILED)
    })

    it('should disable imageSmoothingEnabled on the internal canvas', () => {
      // Because OffscreenCanvas is stubbed globally, we don't even need to pass the 2nd arg
      makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      expect((offscreenCanvasMockContext as any).imageSmoothingEnabled).toBe(false)
    })
  })

  describe('Guard Clauses', () => {
    it('should return early if alpha is 0', () => {
      const render = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)
      const color = 0xFFFFFFFF as Color32

      render(mockTargetCtx, color, 0)

      expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
    })

    it('should return early if color alpha is 0', () => {
      const render = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)
      const transparentColor = 0x00FFFFFF as Color32

      render(mockTargetCtx, transparentColor)

      expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
    })
  })

  describe('Rendering Logic', () => {
    it('should only fill pixels where mask value is exactly 1', () => {
      const render = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)
      const data8 = new Uint8Array(16)
      data8[0] = 1
      data8[1] = 0
      data8[5] = 1

      mockLookup[0] = {
        data: data8,
        tx: 0,
        ty: 0,
      }

      const color = 0xABCDEF12 as Color32
      render(mockTargetCtx, color)

      const imageData = offscreenCanvasMockContext.putImageData.mock.calls[0][0]
      const view32 = new Uint32Array(imageData.data.buffer)

      expect(view32[0]).toBe(color)
      expect(view32[1]).toBe(0)
      expect(view32[5]).toBe(color)
    })

    it('should set and restore targetCtx global states', () => {
      const render = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)
      mockLookup[0] = {
        data: new Uint8Array(16).fill(1),
        tx: 0,
        ty: 0,
      }

      const alpha = 127.5
      const compOp = 'xor'

      render(mockTargetCtx, 0xFFFFFFFF as Color32, alpha, compOp)

      // Verify the math for globalAlpha setter
      expect(mockTargetCtx.globalAlpha).toBe(1)
      expect(mockTargetCtx.globalCompositeOperation).toBe('source-over')
    })

    it('should clear the bridge memory between tiles', () => {
      const render = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      const dataA = new Uint8Array(16)
      dataA[0] = 1

      const dataB = new Uint8Array(16)
      dataB[0] = 0 // Should be empty even though dataA had a pixel here

      mockLookup[0] = {
        data: dataA,
        tx: 0,
        ty: 0,
      }
      mockLookup[1] = {
        data: dataB,
        tx: 1,
        ty: 1,
      }

      render(mockTargetCtx, 0xFFFFFFFF as Color32)

      const secondCall = offscreenCanvasMockContext.putImageData.mock.calls[1][0]
      const view32 = new Uint32Array(secondCall.data.buffer)

      expect(view32[0]).toBe(0)
    })

    it('should calculate draw offsets using tileShift', () => {
      const render = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer)

      mockLookup[0] = {
        data: new Uint8Array(16),
        tx: 5,
        ty: 10,
      }

      render(mockTargetCtx, 0xFFFFFFFF as Color32)

      // 5 << 2 = 20, 10 << 2 = 40
      expect(mockTargetCtx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        20,
        40,
      )
    })
  })
})
