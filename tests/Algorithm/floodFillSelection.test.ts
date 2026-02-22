import { describe, expect, it } from 'vitest'
import { floodFillSelection, PixelData } from '../../src'
import { makeTestPixelData, pack } from '../_helpers'

describe('floodFillSelection: Scrutiny Suite', () => {
  it('correctly isolates areas with a "moat" in contiguous mode', () => {
    const white = pack(255, 255, 255, 255)
    const black = pack(0, 0, 0, 255)
    const imgData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    }

    const p = new PixelData(imgData)
    p.data32.fill(white)

    // Create a horizontal black moat at y = 5
    for (let x = 0; x < 10; x++) {
      p.data32[5 * 10 + x] = black
    }

    // Start fill at (0,0) - top half
    const result = floodFillSelection(
      imgData as ImageData,
      0,
      0,
      {
        contiguous: true,
        tolerance: 0,
      },
    )

    expect(result).not.toBeNull()
    // The selection should stop before the moat (y=5), so height should be 5
    expect(result!.selectionRect.h).toBe(5)

    // Verify a pixel on the other side of the moat is NOT in the mask
    // We check the last pixel of the image (9,9)
    // Since selectionRect only goes to y=4, (9,9) shouldn't even be in the mask bounds
    expect(result!.selectionRect.y + result!.selectionRect.h).toBeLessThan(9)
  })

  it('correctly isolates areas with a "moat" in contiguous mode using PixelData', () => {
    const white = pack(255, 255, 255, 255)
    const black = pack(0, 0, 0, 255)
    const imgData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    }

    const p = new PixelData(imgData)
    p.data32.fill(white)

    // Create a horizontal black moat at y = 5
    for (let x = 0; x < 10; x++) {
      p.data32[5 * 10 + x] = black
    }

    // Start fill at (0,0) - top half
    const result = floodFillSelection(
      p,
      0,
      0,
      {
        contiguous: true,
        tolerance: 0,
      },
    )

    expect(result).not.toBeNull()
    // The selection should stop before the moat (y=5), so height should be 5
    expect(result!.selectionRect.h).toBe(5)

    // Verify a pixel on the other side of the moat is NOT in the mask
    // We check the last pixel of the image (9,9)
    // Since selectionRect only goes to y=4, (9,9) shouldn't even be in the mask bounds
    expect(result!.selectionRect.y + result!.selectionRect.h).toBeLessThan(9)
  })

  it('prevents diagonal leaking (4-connectivity verification)', () => {
    const white = pack(255, 255, 255, 255)
    const black = pack(0, 0, 0, 255)
    const imgData = {
      width: 3,
      height: 3,
      data: new Uint8ClampedArray(3 * 3 * 4),
    }

    const p = new PixelData(imgData)
    p.data32.fill(white)

    /**
     * W B W
     * B W B
     * W B W
     * Center pixel (1,1) is white but surrounded by black on 4 sides.
     */
    p.data32[1] = black // (1,0)
    p.data32[3] = black // (0,1)
    p.data32[5] = black // (2,1)
    p.data32[7] = black // (1,2)

    const result = floodFillSelection(
      imgData as ImageData,
      1,
      1,
      {
        contiguous: true,
        tolerance: 0,
      },
    )

    // With 4-connectivity, only the center pixel should be selected
    expect(result!.selectionRect.w).toBe(1)
    expect(result!.selectionRect.h).toBe(1)
    expect(result!.selectionRect.mask![0]).toBe(1)
  })

  it('verifies non-contiguous mode picks up isolated islands', () => {
    const white = pack(255, 255, 255, 255)
    const black = pack(0, 0, 0, 255)
    const imgData = {
      width: 4,
      height: 1,
      data: new Uint8ClampedArray(4 * 1 * 4),
    }

    const p = new PixelData(imgData)
    // Pattern: White, Black, White, Black
    p.data32[0] = white
    p.data32[1] = black
    p.data32[2] = white
    p.data32[3] = black

    const result = floodFillSelection(
      imgData as ImageData,
      0,
      0,
      {
        contiguous: false,
        tolerance: 0,
      },
    )

    expect(result!.selectionRect.w).toBe(3) // Bounds span from index 0 to 2
    const mask = result!.selectionRect.mask!

    // Mask corresponds to x=0, 1, 2
    expect(mask[0]).toBe(1) // x=0 (White)
    expect(mask[1]).toBe(0) // x=1 (Black)
    expect(mask[2]).toBe(1) // x=2 (White)
  })
  it('validates coordinate remapping using a truly solid color block', () => {
    const w = 10
    const h = 10
    const solidColor = pack(255, 0, 0, 255) // Pure Red
    const imgData = makeTestPixelData(
      w,
      h,
      solidColor,
    ).imageData

    const bounds = {
      x: 2,
      y: 2,
      w: 4,
      h: 4,
    }

    const result = floodFillSelection(
      imgData,
      2,
      2,
      {
        bounds,
        tolerance: 0,
      },
    )

    expect(result).not.toBeNull()
    const {
      selectionRect,
      pixels,
    } = result!

    // This should now be 4 because every pixel is exactly the same pack(255,0,0,255)
    expect(selectionRect.w).toBe(4)
    expect(selectionRect.h).toBe(4)

    const resultView = {
      width: selectionRect.w,
      height: selectionRect.h,
      data: pixels,
    }

    // Check the corners of the extracted 4x4 block
    const d = resultView.data

    // (0,0) in result
    expect(d[0]).toBe(255) // Red
    expect(d[3]).toBe(255) // Alpha

    // (3,3) in result
    const lastPixelIdx = (3 * 4 + 3) * 4
    expect(d[lastPixelIdx]).toBe(255)
    expect(d[lastPixelIdx + 3]).toBe(255)
  })
  it('triggers early null return if startX/Y is outside bounds', () => {
    const imgData = makeTestPixelData(10, 10).imageData
    const bounds = {
      x: 5,
      y: 5,
      w: 2,
      h: 2,
    }

    // startX (0) is less than xMin (5)
    const result = floodFillSelection(
      imgData,
      0,
      0,
      { bounds },
    )

    expect(result).toBeNull()
  })

  it('covers min/max coordinate expansion logic', () => {
    const white = pack(255, 255, 255, 255)
    const imgData = makeTestPixelData(10, 10, white).imageData

    // Start at (5,5). The fill will expand to (0,0) and (9,9).
    // This forces minX to move from 5 to 0, and maxX from 5 to 9.
    const result = floodFillSelection(
      imgData,
      5,
      5,
      {
        contiguous: true,
        tolerance: 0,
      },
    )

    expect(result!.selectionRect.x).toBe(0)
    expect(result!.selectionRect.y).toBe(0)
    expect(result!.selectionRect.w).toBe(10)
    expect(result!.selectionRect.h).toBe(10)
  })

  it('covers neighbor color distance and visited checks', () => {
    const white = pack(255, 255, 255, 255)
    const black = pack(0, 0, 0, 255)
    const p = makeTestPixelData(3, 1, white)

    // Pattern: [White, Black, White]
    p.data32[1] = black

    const imgData = p.imageData

    const result = floodFillSelection(
      imgData,
      0,
      0,
      {
        contiguous: true,
        tolerance: 0,
      },
    )

    // The logic should check index 1, see colorDistance > tolerance,
    // and never set visited[1] or push it to stack.
    expect(result!.selectionRect.w).toBe(1)
  })

  it('covers the case where matchCount would be 0 (safety check)', () => {
    const imgData = makeTestPixelData(2, 2).imageData

    // To reach matchCount === 0 after passing the initial startX/Y check,
    // we use an empty bounds rect if the implementation allows,
    // or simulate a failure in the scan loop.
    const bounds = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    }

    const result = floodFillSelection(
      imgData,
      0,
      0,
      { bounds },
    )

    // Depending on trimRectBounds logic, this should exit early or return null
    expect(result).toBeNull()
  })
  describe('floodFillImageDataSelection: Non-Contiguous & Min/Max Coverage', () => {
    it('covers min/max expansion in non-contiguous mode', () => {
      const white = pack(255, 255, 255, 255)
      const black = pack(0, 0, 0, 255)
      const p = makeTestPixelData(10, 10, black)

      // Set a matching pixel at the top-left (0,0) and bottom-right (9,9)
      // Start the fill at (5,5)
      p.data32[0] = white
      p.data32[5 * 10 + 5] = white
      p.data32[9 * 10 + 9] = white

      const imgData = p.imageData

      const result = floodFillSelection(
        imgData,
        5,
        5,
        {
          contiguous: false,
          tolerance: 0,
        },
      )

      // This forces:
      // x < minX (0 < 5)
      // x > maxX (9 > 5)
      // y < minY (0 < 5)
      // y > maxY (9 > 5)
      expect(result!.selectionRect.x).toBe(0)
      expect(result!.selectionRect.y).toBe(0)
      expect(result!.selectionRect.w).toBe(10)
      expect(result!.selectionRect.h).toBe(10)
    })

    it('verifies matchCount logic with a single pixel match', () => {
      const white = pack(255, 255, 255, 255)
      const black = pack(0, 0, 0, 255)
      const p = makeTestPixelData(3, 3, black)

      // Only the starting pixel is white
      p.data32[1 * 3 + 1] = white

      const imgData = p.imageData

      const result = floodFillSelection(
        imgData,
        1,
        1,
        {
          contiguous: false,
          tolerance: 0,
        },
      )

      // matchCount will be 1.
      // The min/max checks will run but won't change the values.
      expect(result!.selectionRect.w).toBe(1)
      expect(result!.selectionRect.h).toBe(1)
    })

    it('ensures selectionRect mask is correctly initialized even with 1 match', () => {
      const white = pack(255, 255, 255, 255)
      const imgData = makeTestPixelData(1, 1, white).imageData

      const result = floodFillSelection(
        imgData,
        0,
        0,
        {
          contiguous: false,
          tolerance: 0,
        },
      )

      expect(result!.selectionRect.mask![0]).toBe(1)
      expect(result!.selectionRect.mask!.length).toBe(1)
    })
  })
  it('covers the matchCount === 0 branch using an empty bounds rectangle', () => {
    const white = pack(255, 255, 255, 255)
    const imgData = makeTestPixelData(
      10,
      10,
      white,
    ).imageData

    // Using a 0-width bounds forces the non-contiguous loops to skip entirely
    const bounds = {
      x: 0,
      y: 0,
      w: 0,
      h: 10,
    }

    const result = floodFillSelection(
      imgData,
      0,
      0,
      {
        contiguous: false,
        bounds,
      },
    )

    // This specifically hits the 'if (matchCount === 0) return null' branch
    expect(result).toBeNull()
  })

  it('verifies matchCount remains 0 when bounds are valid but dimensions are zero', () => {
    const white = pack(255, 255, 255, 255)
    const imgData = makeTestPixelData(
      10,
      10,
      white,
    ).imageData

    const bounds = {
      x: 2,
      y: 2,
      w: 10,
      h: 0,
    }

    const result = floodFillSelection(
      imgData,
      2,
      2,
      {
        contiguous: false,
        bounds,
      },
    )

    expect(result).toBeNull()
  })
  it('covers matchCount === 0 by forcing a NaN tolerance', () => {
    const white = pack(255, 255, 255, 255)
    const imgData = makeTestPixelData(
      10,
      10,
      white,
    ).imageData

    const result = floodFillSelection(
      imgData,
      5,
      5,
      {
        contiguous: false,
        // 0 <= NaN is false.
        // This allows the guard to pass but the match check to fail.
        tolerance: NaN,
      },
    )

    expect(result).toBeNull()
  })
})
