import { createCanvas } from '@napi-rs/canvas'
import { vi } from 'vitest'

class OffscreenCanvasProxy {
  constructor(
    width: number,
    height: number,
  ) {
    return createProxy(createCanvas(width, height))
  }
}

function createProxy<T extends object>(target: T): T {
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      if (typeof value === 'function') {
        return function(...args: any[]) {
          return value.apply(target, args)
        }
      }

      return value
    },
    set(target, prop, value, receiver) {
      return Reflect.set(target, prop, value, receiver)
    },
  }

  return new Proxy(target, handler)
}

export function useOffscreenCanvasProxy() {
  vi.stubGlobal(
    'OffscreenCanvas',
    OffscreenCanvasProxy,
  )
}
