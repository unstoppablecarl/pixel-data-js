import type { Color32 } from '@/_types'
import type { PixelData, PixelData32 } from '@/PixelData/_pixelData-types'
import { getColorListFromUint32Array, printPixelDataGridColor, unpackStr } from '../_helpers'

export function toOnlyContainColors(this: any, received: Uint32Array | PixelData, expected: Color32[], message?: string) {
  let receivedData: Uint32Array
  if ('data' in received && received.data instanceof Uint32Array) {
    receivedData = received.data as Uint32Array
  } else if (received instanceof Uint32Array) {
    receivedData = received
  } else {
    throw new Error('invalid input for toOnlyContainColors matcher')
  }

  const indexed = getColorListFromUint32Array(receivedData)
  const receivedColors = Array.from(indexed).map(unpackStr).sort()
  const expectedColors = expected.map(unpackStr).sort()

  const pass = this.equals(receivedColors, expectedColors)

  return {
    pass,
    message: () => {
      const hint = message ? `\nHint: ${message}` : ''
      const diff = this.utils.printDiffOrStringify(
        expectedColors,
        receivedColors,
        'Expected colors',
        'Received colors',
        this.isNot,
      )
      return `Uint32Array color mismatch:${hint}\n${diff}`
    },
    expected: expectedColors,
    actual: receivedColors,
  }
}

export function toMatchPixelGrid(
  this: any,
  received: PixelData32,
  expected: (number | Color32)[],
  message?: string,
) {
  const receivedFlat = Array.from(received.data)
  const pass = this.equals(receivedFlat, expected, {
    customTesters: this.customTesters,
  })

  return {
    pass,
    message: () => {
      const hint = message ? `\nHint: ${message}` : ''

      if (!pass) {
        const expectedPixelData: PixelData32 = {
          w: received.w,
          h: received.h,
          data: new Uint32Array(expected),
        }

        console.log('\n--- Received ---')
        printPixelDataGridColor(received)

        console.log('\n--- Expected ---')
        printPixelDataGridColor(expectedPixelData)

      }

      const sizeMatch = receivedFlat.length === expected.length
        ? ''
        : `\nSize mismatch: received ${receivedFlat.length} pixels, expected ${expected.length} pixels`

      return (
        `PixelData grid mismatch (${received.w}x${received.h})${hint}${sizeMatch}\n`
      )
    },
  }
}

