import { mutatorApplyCircleBrush } from './PixelMutator/mutatorApplyCircleBrush'
import { mutatorApplyCircleBrushStroke } from './PixelMutator/mutatorApplyCircleBrushStroke'
import { mutatorApplyMask } from './PixelMutator/mutatorApplyMask'
import { mutatorApplyRectBrush } from './PixelMutator/mutatorApplyRectBrush'
import { mutatorApplyRectBrushStroke } from './PixelMutator/mutatorApplyRectBrushStroke'
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
    ...mutatorApplyCircleBrush(writer),
    ...mutatorApplyCircleBrushStroke(writer),
    ...mutatorApplyRectBrush(writer),
    ...mutatorApplyRectBrushStroke(writer),
  }
}
