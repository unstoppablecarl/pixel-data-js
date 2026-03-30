import { mutatorApplyAlphaMask } from './PixelMutator/mutatorApplyAlphaMask'
import { mutatorApplyBinaryMask } from './PixelMutator/mutatorApplyBinaryMask'
import { mutatorApplyCircleBrush } from './PixelMutator/mutatorApplyCircleBrush'
import { mutatorApplyCircleBrushStroke } from './PixelMutator/mutatorApplyCircleBrushStroke'
import { mutatorApplyCirclePencil } from './PixelMutator/mutatorApplyCirclePencil'
import { mutatorApplyCirclePencilStroke } from './PixelMutator/mutatorApplyCirclePencilStroke'
import { mutatorApplyRectBrush } from './PixelMutator/mutatorApplyRectBrush'
import { mutatorApplyRectBrushStroke } from './PixelMutator/mutatorApplyRectBrushStroke'
import { mutatorApplyRectPencil } from './PixelMutator/mutatorApplyRectPencil'
import { mutatorApplyRectPencilStroke } from './PixelMutator/mutatorApplyRectPencilStroke'
import { mutatorBlendColor } from './PixelMutator/mutatorBlendColor'
import { mutatorBlendPixel } from './PixelMutator/mutatorBlendPixel'
import { mutatorBlendPixelData } from './PixelMutator/mutatorBlendPixelData'
import { mutatorClear } from './PixelMutator/mutatorClear'
import { mutatorFill } from './PixelMutator/mutatorFill'
import { mutatorFillBinaryMask } from './PixelMutator/mutatorFillBinaryMask'
import { mutatorInvert } from './PixelMutator/mutatorInvert'
import type { PixelWriter } from './PixelWriter'

export function makeFullPixelMutator(writer: PixelWriter<any>) {
  return {
    // @sort
    ...mutatorApplyAlphaMask(writer),
    ...mutatorApplyBinaryMask(writer),
    ...mutatorApplyCircleBrush(writer),
    ...mutatorApplyCircleBrushStroke(writer),
    ...mutatorApplyCirclePencil(writer),
    ...mutatorApplyCirclePencilStroke(writer),
    ...mutatorApplyRectBrush(writer),
    ...mutatorApplyRectBrushStroke(writer),
    ...mutatorApplyRectPencil(writer),
    ...mutatorApplyRectPencilStroke(writer),
    ...mutatorBlendColor(writer),
    ...mutatorBlendPixel(writer),
    ...mutatorBlendPixelData(writer),
    ...mutatorClear(writer),
    ...mutatorFill(writer),
    ...mutatorFillBinaryMask(writer),
    ...mutatorInvert(writer),
  }
}
