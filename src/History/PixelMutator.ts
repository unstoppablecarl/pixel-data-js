import { mutatorApplyAlphaMask } from './PixelMutator/mutatorApplyAlphaMask'
import { mutatorApplyBinaryMask } from './PixelMutator/mutatorApplyBinaryMask'
import { mutatorApplyMask } from './PixelMutator/mutatorApplyMask'
import { mutatorBlendAlphaMask } from './PixelMutator/mutatorBlendAlphaMask'
import { mutatorBlendBinaryMask } from './PixelMutator/mutatorBlendBinaryMask'
import { mutatorBlendColor } from './PixelMutator/mutatorBlendColor'
import { mutatorBlendColorPaintAlphaMask } from './PixelMutator/mutatorBlendColorPaintAlphaMask'
import { mutatorBlendColorPaintBinaryMask } from './PixelMutator/mutatorBlendColorPaintBinaryMask'
import { mutatorBlendColorPaintMask } from './PixelMutator/mutatorBlendColorPaintMask'
import { mutatorBlendMask } from './PixelMutator/mutatorBlendMask'
import { mutatorBlendPaintRect } from './PixelMutator/mutatorBlendPaintRect'
import { mutatorBlendPixel } from './PixelMutator/mutatorBlendPixel'
import { mutatorBlendPixelData } from './PixelMutator/mutatorBlendPixelData'
import { mutatorClear } from './PixelMutator/mutatorClear'
import { mutatorFill, mutatorFillRect } from './PixelMutator/mutatorFill'
import { mutatorFillBinaryMask } from './PixelMutator/mutatorFillBinaryMask'
import { mutatorInvert } from './PixelMutator/mutatorInvert'
import type { PixelWriter } from './PixelWriter'

export function makeFullPixelMutator(writer: PixelWriter<any>) {
  return {
    // @sort
    ...mutatorApplyAlphaMask(writer),
    ...mutatorApplyBinaryMask(writer),
    ...mutatorApplyMask(writer),
    ...mutatorBlendAlphaMask(writer),
    ...mutatorBlendBinaryMask(writer),
    ...mutatorBlendColor(writer),
    ...mutatorBlendColorPaintAlphaMask(writer),
    ...mutatorBlendColorPaintBinaryMask(writer),
    ...mutatorBlendColorPaintMask(writer),
    ...mutatorBlendMask(writer),
    ...mutatorBlendPaintRect(writer),
    ...mutatorBlendPixel(writer),
    ...mutatorBlendPixelData(writer),
    ...mutatorClear(writer),
    ...mutatorFill(writer),
    ...mutatorFillBinaryMask(writer),
    ...mutatorFillRect(writer),
    ...mutatorInvert(writer),
  }
}
