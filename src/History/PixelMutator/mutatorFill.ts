import type { Color32 } from '../../Color/_color-types'
import { fillPixelData } from '../../PixelData/fillPixelData'
import type { Rect } from '../../Rect/_rect-types'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { fillPixelData }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorFill = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelData = defaults.fillPixelData,
  } = deps

  const config = writer.config

  function fill(
    color: Color32,
    rect?: Partial<Rect>,
  ): boolean

  function fill(
    color: Color32,
    x: number,
    y: number,
    w: number,
    h: number,
  ): boolean
  function fill(
    color: Color32,
    _x?: Partial<Rect> | number,
    _y?: number,
    _w?: number,
    _h?: number,
  ): boolean {
    const target = config.target

    const dstW = target.w
    const dstH = target.h

    let x: number
    let y: number
    let w: number
    let h: number

    if (typeof _x === 'number') {
      x = _x
      y = _y!
      w = _w!
      h = _h!
    } else if (typeof _x === 'object') {
      x = _x.x ?? 0
      y = _x.y ?? 0
      w = _x.w ?? dstW
      h = _x.h ?? dstH
    } else {
      x = 0
      y = 0
      w = dstW
      h = dstH
    }

    const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
    if (!didChange) return false
    return didChange(
      fillPixelData(target, color, x, y, w, h),
    )
  }

  return { fill }
}) satisfies HistoryMutator<any, Deps>
