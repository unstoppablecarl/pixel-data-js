// @ts-nocheck
import { createCanvas, Image, ImageData } from '@napi-rs/canvas'
import { beforeEach } from 'vitest'
import { OffscreenCanvasMock } from './_helpers/OffscreenCanvasMock'

beforeEach(() => {
  global.Image = Image
  global.ImageData = ImageData
  global.OffscreenCanvas = OffscreenCanvasMock

  // Patch window.Image + window.ImageData (JSDOM keeps its own window object)
  if (typeof window !== 'undefined') {
    window.Image = Image
    window.ImageData = ImageData
    window.OffscreenCanvas = OffscreenCanvasMock
  }

  class ProxyCanvas {
    constructor() {
      return createCanvas(300, 150)
    }
  }

  // Override BOTH global and window constructors
  global.HTMLCanvasElement = ProxyCanvas
  if (typeof window !== 'undefined') {
    window.HTMLCanvasElement = ProxyCanvas
  }

  // Override document.createElement('canvas')
  const origCreateElement = document.createElement.bind(document)
  document.createElement = (tag) => {
    if (tag === 'canvas') {
      return createCanvas(300, 150)
    }
    return origCreateElement(tag)
  }
})
