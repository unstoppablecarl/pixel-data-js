import { mutatorBlendColor } from './PixelMutator/mutatorBlendColor'
import { mutatorBlendPixel } from './PixelMutator/mutatorBlendPixel'
import { mutatorBlendPixelData } from './PixelMutator/mutatorBlendPixelData'
import { mutatorBlendPixelDataAlphaMask } from './PixelMutator/mutatorBlendPixelDataAlphaMask'
import { mutatorBlendPixelDataBinaryMask } from './PixelMutator/mutatorBlendPixelDataBinaryMask'
import { mutatorClear } from './PixelMutator/mutatorClear'
import { mutatorFill, mutatorFillRect } from './PixelMutator/mutatorFill'
import { mutatorFillBinaryMask } from './PixelMutator/mutatorFillBinaryMask'
import { mutatorInvert } from './PixelMutator/mutatorInvert'
import type { PixelWriter } from './PixelWriter'

export function makeFullPixelMutator(writer: PixelWriter<any>) {
  return {
    // @sort
    ...mutatorBlendColor(writer),
    ...mutatorBlendPixel(writer),
    ...mutatorBlendPixelData(writer),
    ...mutatorBlendPixelDataAlphaMask(writer),
    ...mutatorBlendPixelDataBinaryMask(writer),
    ...mutatorClear(writer),
    ...mutatorFill(writer),
    ...mutatorFillBinaryMask(writer),
    ...mutatorFillRect(writer),
    ...mutatorInvert(writer),
  }
}
