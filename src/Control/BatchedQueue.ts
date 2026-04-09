export type BatchedQueueFn = (fn: () => void) => void

export type BatchedQueue = ReturnType<typeof makeBatchedQueue>

/**
 * Creates a high-performance, zero-allocation batching queue.
 * This utility collects items marked as "dirty" and flushes them in a single batch.
 * * **⚠️ CRITICAL: Synchronous Processing Required**
 * Because the internal sets are reused, the `Set` passed to the `processor` is instantly
 * cleared the moment the processor function returns. If you need to process the items
 * asynchronously, you **must** manually clone the set inside your processor.
 * @template T - The type of items being batched.
 * @param processor - The callback executed when the batch flushes. Receives a `Set` of all batched items.
 * @param queue - The scheduling function used to defer the flush. Defaults to `queueMicrotask`.
 * @returns An object containing methods to mark items as dirty.
 * @example
 * * @example
 * ```ts
 * import { nextTick } from 'vue'
 * let bq = makeBatchedQueue<string>(
 *   (items) => drawSomething(items),
 *   nextTick,
 * )
 * ```
 */
export function makeBatchedQueue<T>(
  processor: (items: Set<T>) => void,
  queue: BatchedQueueFn,
) {
  let activeSet = new Set<T>()
  let processingSet = new Set<T>()
  let scheduled = false

  const flush = () => {
    // swap sets
    const current = activeSet
    activeSet = processingSet
    processingSet = current

    scheduled = false

    try {
      processor(processingSet)
    } finally {
      processingSet.clear()
    }
  }

  function markDirty(item: T) {
    activeSet.add(item)

    if (!scheduled) {
      scheduled = true
      queue(flush)
    }
  }

  function markMultipleDirty(items: T[]) {
    let len = items.length
    if (len === 0) return

    for (let i = 0; i < len; i++) {
      activeSet.add(items[i])
    }

    if (!scheduled) {
      scheduled = true
      queue(flush)
    }
  }

  return {
    markDirty,
    markMultipleDirty,
  }
}
