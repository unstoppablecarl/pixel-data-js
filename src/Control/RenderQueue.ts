/**
 * Creates a debounced render queue using `requestAnimationFrame`.
 * This utility ensures that a callback is executed exactly once right before
 * the next visual frame, regardless of how many times the trigger is called
 * synchronously. It safely prevents layout thrashing and redundant computations.
 * @param cb - The function to execute on the next animation frame.
 * @returns A trigger function that schedules the callback. It includes a `.cancel()` method to abort the pending frame.
 * * @example
 * ```ts
 * let renderQueue = makeRenderQueue(() => {
 * console.log('DOM updated!')
 * })
 * * // Calling this multiple times synchronously...
 * renderQueue()
 * renderQueue()
 * renderQueue()
 * * // ...will only result in one 'DOM updated!' log on the next frame.
 * ```
 * * @example
 * ```ts
 * // Canceling a scheduled render (e.g., when a component unmounts)
 * let trigger = makeRenderQueue(updateLayout)
 * trigger()
 * trigger.cancel() // The callback will not execute
 * ```
 */
export function makeRenderQueue(cb: () => void) {
  let needsRender = false
  let frameId = 0

  const trigger = () => {
    if (needsRender) return
    needsRender = true

    frameId = requestAnimationFrame(() => {
      needsRender = false
      cb()
    })
  }

  trigger.cancel = () => {
    if (needsRender) {
      cancelAnimationFrame(frameId)
      needsRender = false
    }
  }

  return trigger
}
