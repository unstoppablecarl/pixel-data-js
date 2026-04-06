import type { Color32, PixelData } from '@/_types'
import { getColorListFromUint32Array, unpackStr } from '../_helpers'

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
