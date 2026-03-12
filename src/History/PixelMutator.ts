import { mutatorApplyMask } from './PixelMutator/mutatorApplyMask'
import { mutatorBlendColor } from './PixelMutator/mutatorBlendColor'
import { mutatorBlendPixel } from './PixelMutator/mutatorBlendPixel'
import { mutatorBlendPixelData } from './PixelMutator/mutatorBlendPixelData'
import { mutatorFill } from './PixelMutator/mutatorFillPixelData'
import { mutatorInvert } from './PixelMutator/mutatorInvert'
import type { PixelWriter } from './PixelWriter'

export function makeFullPixelMutator(writer: PixelWriter<any>) {
  return {
    ...mutatorApplyMask(writer),
    ...mutatorBlendPixelData(writer),
    ...mutatorBlendColor(writer),
    ...mutatorBlendPixel(writer),
    ...mutatorFill(writer),
    ...mutatorInvert(writer),
  }
}
