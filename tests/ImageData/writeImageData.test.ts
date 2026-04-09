import { describe, expect, it } from 'vitest'
import { writeImageData } from '@/index'

describe('writeImageData', () => {
  const createImg = (w: number, h: number, color?: number) => {
    const img = new ImageData(new Uint8ClampedArray(w * h * 4), w, h)
    if (color !== undefined) img.data.fill(color)
    return img
  }

  describe('Fast Path (32-bit Aligned)', () => {
    it('performs bulk copy for full overlap', () => {
      const target = createImg(2, 2, 0)
      const source = createImg(2, 2, 255)

      writeImageData(target, source, 0, 0)

      expect(target.data.every(v => v === 255)).toBe(true)
    })

    it('handles partial overlap with clipping (Right/Bottom)', () => {
      const target = createImg(2, 2, 0)
      const source = createImg(2, 2, 255)

      // Source (0,0) hits target (1,1)
      writeImageData(target, source, 1, 1)

      const lastPixelIdx = (1 * 2 + 1) * 4
      expect(target.data[lastPixelIdx]).toBe(255)
      expect(target.data[0]).toBe(0)
    })
  })

  describe('Boundary Conditions', () => {
    it('clips content correctly when x/y are negative', () => {
      const target = createImg(2, 2, 0)
      const source = createImg(2, 2, 255)

      // Only the bottom-right pixel of source should hit top-left of target
      writeImageData(target, source, -1, -1)

      expect(target.data[0]).toBe(255) // Target (0,0)
      expect(target.data[4]).toBe(0)   // Target (1,0)
    })

    it('handles cases where source is larger than target', () => {
      const target = createImg(1, 1, 0)
      const source = createImg(5, 5, 255)

      writeImageData(target, source, 0, 0)

      expect(target.data[0]).toBe(255)
      expect(target.data.length).toBe(4)
    })

    it('does nothing for non-overlapping coordinates', () => {
      const target = createImg(2, 2, 0)
      const source = createImg(2, 2, 255)

      writeImageData(target, source, 5, 5)
      writeImageData(target, source, -5, -5)

      expect(target.data.every(v => v === 0)).toBe(true)
    })

    it('handles zero-dimension image data', () => {
      // Note: Native ImageData constructor throws on 0,
      // but ImageDataLike might have 0.
      const target = createImg(1, 1, 0)
      const emptySource = { width: 0, height: 0, data: new Uint8ClampedArray(0) } as any

      expect(() => writeImageData(target, emptySource, 0, 0)).not.toThrow()
    })
  })

  describe('Slow Path Validation', () => {
    const createUnalignedImageDataLike = (w: number, h: number, fill = 0) => {
      const buffer = new ArrayBuffer((w * h * 4) + 1);
      // Offset by 1 to force isAligned (byteOffset % 4 === 0) to be false
      const data = new Uint8ClampedArray(buffer, 1, w * h * 4);
      data.fill(fill);

      // Return a POJO that matches the ImageDataLike interface
      return {
        width: w,
        height: h,
        data
      };
    };

    it('correctly copies data when target is unaligned', () => {
      const target = createUnalignedImageDataLike(2, 2, 0) as unknown as ImageData;
      const source = new ImageData(new Uint8ClampedArray(2 * 2 * 4).fill(128), 2, 2);

      writeImageData(target, source, 0, 0);

      expect(target.data[0]).toBe(128);
      // This will now pass because we bypassed the ImageData constructor cloning
      expect(target.data.byteOffset % 4).not.toBe(0);
    });

    it('correctly copies data when source is unaligned', () => {
      const target = new ImageData(new Uint8ClampedArray(2 * 2 * 4), 2, 2);
      const source = createUnalignedImageDataLike(2, 2, 64) as unknown as ImageData;

      writeImageData(target, source, 0, 0);

      expect(target.data[0]).toBe(64);
      expect(source.data.byteOffset % 4).not.toBe(0);
    });
  });
})
