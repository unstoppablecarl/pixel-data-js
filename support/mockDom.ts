// @ts-nocheck
import { createCanvas, Image, ImageData } from '@napi-rs/canvas'

export function mockGlobalImageData() {
  global.Image = Image
  global.ImageData = ImageData

  if (typeof window !== 'undefined') {
    window.Image = Image
    window.ImageData = ImageData
  }
}

export function mockGlobalCanvas() {

  // Override BOTH global and window constructors
  global.HTMLCanvasElement = ProxyCanvas
  if (typeof window !== 'undefined') {
    window.HTMLCanvasElement = ProxyCanvas
  }

  if (!document) return
  if (document.createElement.customBound === true) return

  // Override document.createElement('canvas')
  const origCreateElement = document.createElement.bind(document)
  const createElement = (tag) => {
    if (tag === 'canvas') {
      return createCanvas(300, 150)
    }
    return origCreateElement(tag)
  }
  createElement.customBound = true
  document.createElement = createElement
}

class ProxyCanvas {
  constructor() {
    return createCanvas(300, 150)
  }
}
