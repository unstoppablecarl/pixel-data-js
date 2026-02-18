import { describe, expect, it } from 'vitest'
import { type AlphaMask, applyAlphaMask, applyBinaryMask, type BinaryMask, MaskType } from '../../src'

describe('Mask Functions', () => {
  const createImg = (w: number, h: number) => new ImageData(new Uint8ClampedArray(w * h * 4).fill(255), w, h)

  const createAlphaMask = (w: number, h: number, fill: number): AlphaMask => ({
    type: MaskType.ALPHA,
    width: w,
    height: h,
    data: new Uint8Array(w * h).fill(fill),
  })

  const createBinaryMask = (w: number, h: number, fill: number): BinaryMask => ({
    type: MaskType.BINARY,
    width: w,
    height: h,
    data: new Uint8Array(w * h).fill(fill),
  })

  describe('Shared Clipping Logic (Alpha & Binary)', () => {
    it('covers dx < 0 and dy < 0 clipping', () => {
      const dst = createImg(5, 5)
      const mask = createAlphaMask(5, 5, 0)
      // dx: -2 means mask starts at index 2 (sx=2). dst[0,0] affected by mask[2,2]
      applyAlphaMask(dst, mask, { dx: -2, dy: -2 })
      expect(dst.data[3]).toBe(0) // dst[0,0] alpha is 0
    })

    it('covers sx < 0 and sy < 0 clipping', () => {
      const dst = createImg(5, 5)
      const mask = createAlphaMask(5, 5, 0)
      // sx: -2 means dst starts at index 2 (dx=2). dst[2,2] affected by mask[0,0]
      applyAlphaMask(dst, mask, { sx: -2, sy: -2 })
      expect(dst.data[(2 * 5 + 2) * 4 + 3]).toBe(0)
    })

    it('early exits if actualW <= 0', () => {
      const dst = createImg(5, 5)
      const mask = createAlphaMask(5, 5, 0)
      applyAlphaMask(dst, mask, { dx: 10 }) // Disjoint
      expect(dst.data[3]).toBe(255) // Unchanged
    })

    it('early exits if actualH <= 0', () => {
      const dst = createImg(5, 5)
      const mask = createAlphaMask(5, 5, 0)
      applyAlphaMask(dst, mask, { dy: 10 }) // Disjoint
      expect(dst.data[3]).toBe(255) // Unchanged
    })
  })

  describe('applyAlphaMask Specific Branches', () => {
    it('continues/skips when mask value is 255', () => {
      const dst = createImg(1, 1)
      dst.data[3] = 123 // Set specific alpha
      const mask = createAlphaMask(1, 1, 255)
      applyAlphaMask(dst, mask)
      expect(dst.data[3]).toBe(123) // Optimization hit, value unchanged
    })

    it('sets alpha to 0 when mask value is 0', () => {
      const dst = createImg(1, 1)
      const mask = createAlphaMask(1, 1, 0)
      applyAlphaMask(dst, mask)
      expect(dst.data[3]).toBe(0)
    })

    it('scales alpha using fast math for values between 0 and 255', () => {
      const dst = createImg(1, 1)
      dst.data[3] = 200
      const mask = createAlphaMask(1, 1, 128) // ~50%
      applyAlphaMask(dst, mask)
      // (200 * 128 + 255) >> 8 = 101
      expect(dst.data[3]).toBe(101)
    })
  })

  describe('applyBinaryMask Specific Branches', () => {
    it('kills alpha when mask value is 0', () => {
      const dst = createImg(1, 1)
      const mask = createBinaryMask(1, 1, 0)
      applyBinaryMask(dst, mask)
      expect(dst.data[3]).toBe(0)
    })

    it('leaves alpha alone when mask value is non-zero', () => {
      const dst = createImg(1, 1)
      dst.data[3] = 150
      const mask = createBinaryMask(1, 1, 255)
      applyBinaryMask(dst, mask)
      expect(dst.data[3]).toBe(150)
    })

    it('works with non-zero values that are not 255', () => {
      const dst = createImg(1, 1)
      dst.data[3] = 150
      const mask = createBinaryMask(1, 1, 1) // Not 0, so should be ignored
      applyBinaryMask(dst, mask)
      expect(dst.data[3]).toBe(150)
    })
  })
  describe('applyAlphaMask Exhaustive Coverage', () => {
    const createImg = (w: number, h: number, a = 255) => {
      const d = new Uint8ClampedArray(w * h * 4).fill(255)
      for (let i = 3; i < d.length; i += 4) d[i] = a
      return { width: w, height: h, data: d } as ImageData
    }

    it('covers negative dx/dy clipping', () => {
      const dst = createImg(2, 2)
      const mask = { type: MaskType.ALPHA, width: 2, height: 2, data: new Uint8Array([0, 0, 0, 0]) } as const
      applyAlphaMask(dst, mask, { dx: -1, dy: -1 })
      expect(dst.data[3]).toBe(0) // dst[0,0] hit by mask[1,1]
    })

    it('covers negative sx/sy clipping', () => {
      const dst = createImg(2, 2)
      const mask = { type: MaskType.ALPHA, width: 2, height: 2, data: new Uint8Array([0, 255, 255, 255]) } as const
      applyAlphaMask(dst, mask, { sx: -1, sy: -1 })
      expect(dst.data[15]).toBe(0) // dst[1,1] hit by mask[0,0]
    })

    it('early exits if actualW <= 0 (Disjoint)', () => {
      const dst = createImg(1, 1)
      const mask = { type: MaskType.ALPHA, width: 1, height: 1, data: new Uint8Array([0]) } as const
      applyAlphaMask(dst, mask, { dx: 10 })
      expect(dst.data[3]).toBe(255) // Untouched
    })

    it('hits the mVal === 255 continue branch', () => {
      const dst = createImg(1, 1, 150)
      const mask = { type: MaskType.ALPHA, width: 1, height: 1, data: new Uint8Array([255]) } as const
      applyAlphaMask(dst, mask)
      expect(dst.data[3]).toBe(150)
    })

    it('hits the mVal === 0 branch', () => {
      const dst = createImg(1, 1)
      const mask = { type: MaskType.ALPHA, width: 1, height: 1, data: new Uint8Array([0]) } as const
      applyAlphaMask(dst, mask)
      expect(dst.data[3]).toBe(0)
    })

    it('scales alpha correctly (The 101 Test)', () => {
      const dst = createImg(1, 1, 200)
      const mask = { type: MaskType.ALPHA, width: 1, height: 1, data: new Uint8Array([128]) } as const
      applyAlphaMask(dst, mask)
      expect(dst.data[3]).toBe(101)
    })
  })

  describe('applyBinaryMask', () => {
    const createImg = (w: number, h: number, a = 255) => {
      const d = new Uint8ClampedArray(w * h * 4).fill(255);
      for (let i = 3; i < d.length; i += 4) d[i] = a;
      return { width: w, height: h, data: d } as ImageData;
    };

    it('hits the early return (x1 <= x0) for disjoint binary mask', () => {
      const dst = createImg(5, 5);
      const mask = { type: MaskType.BINARY, width: 2, height: 2, data: new Uint8Array(4).fill(0) };

      // dx: 10 is outside dst.width (5), making x1 <= x0
      applyBinaryMask(dst, mask as BinaryMask, { dx: 10 });

      expect(dst.data[3]).toBe(255); // Pixel untouched
    });

    it('zeros out alpha only when mask value is 0', () => {
      const dst = createImg(2, 1, 200);
      // Pixel 0: Mask 0 (Kill), Pixel 1: Mask 255 (Keep)
      const mask = { type: MaskType.BINARY, width: 2, height: 1, data: new Uint8Array([0, 255]) };

      applyBinaryMask(dst, mask as BinaryMask);

      expect(dst.data[3]).toBe(0);   // First pixel alpha killed
      expect(dst.data[7]).toBe(200); // Second pixel alpha untouched
    });

    it('treats non-zero values (like 128) as opaque in binary mode', () => {
      const dst = createImg(1, 1, 200);
      const mask = { type: MaskType.BINARY, width: 1, height: 1, data: new Uint8Array([128]) };

      applyBinaryMask(dst, mask as BinaryMask);

      expect(dst.data[3]).toBe(200); // Binary doesn't scale, 128 is not 0, so it keeps alpha
    });

    it('handles negative clipping for sx and dx correctly', () => {
      const dst = createImg(2, 2);
      const mask = { type: MaskType.BINARY, width: 2, height: 2, data: new Uint8Array([0, 255, 255, 255]) };

      // dx: -1 makes sx become 1. mask[1,1] (255) hits dst[0,0]
      applyBinaryMask(dst, mask as BinaryMask, { dx: -1, dy: -1 });
      expect(dst.data[3]).toBe(255); // Stays 255 because mask[1,1] is 255

      // sx: -1 makes dx become 1. mask[0,0] (0) hits dst[1,1]
      applyBinaryMask(dst, mask as BinaryMask, { sx: -1, sy: -1 });
      expect(dst.data[15]).toBe(0); // dst[1,1] killed
    });
  });
})
