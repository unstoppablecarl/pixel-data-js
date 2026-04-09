import { makeBatchedQueue } from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('makeBatchedQueue', () => {
  it('processes a single item via markDirty', () => {
    let capturedItems = new Set()

    let processor = vi.fn().mockImplementation((items: Set<string>) => {
      capturedItems = new Set(items)
    })

    let queue = (fn: () => void) => fn()

    let bq = makeBatchedQueue(processor, queue)

    bq.markDirty('item1')

    expect(processor).toHaveBeenCalledTimes(1)
    expect(capturedItems).toEqual(new Set(['item1']))
  })

  it('batches multiple items correctly before flush', () => {
    let capturedItems = new Set()

    let processor = vi.fn().mockImplementation((items: Set<string>) => {
      capturedItems = new Set(items)
    })

    let flushFn: (() => void) | null = null
    let queueFn = (fn: () => void) => {
      flushFn = fn
    }
    let bq = makeBatchedQueue(processor, queueFn)

    bq.markDirty('a')
    bq.markDirty('b')
    bq.markMultipleDirty(['c', 'd'])

    expect(processor).toHaveBeenCalledTimes(0)

    flushFn!()

    expect(processor).toHaveBeenCalledTimes(1)
    expect(capturedItems).toEqual(new Set(['a', 'b', 'c', 'd']))
  })

  it('deduplicates identical items in the queue', () => {
    let capturedItems = new Set()

    let processor = vi.fn().mockImplementation((items: Set<string>) => {
      capturedItems = new Set(items)
    })

    let queued: (() => void) = () => {
    }

    let queue = vi.fn().mockImplementation((fn: () => void) => queued = fn)
    let bq = makeBatchedQueue(processor, queue)

    bq.markMultipleDirty(['a', 'a', 'b'])
    bq.markDirty('b')
    bq.markDirty('c')

    expect(queue).toHaveBeenCalledTimes(1)
    expect(processor).not.toHaveBeenCalled()
    queued()
    expect(processor).toHaveBeenCalledTimes(1)

    expect(capturedItems).toEqual(new Set(['a', 'b', 'c']))
  })

  it('ignores empty arrays in markMultipleDirty', () => {
    let processor = vi.fn()
    let queueFn = vi.fn()
    let bq = makeBatchedQueue(processor, queueFn)

    bq.markMultipleDirty([])

    expect(queueFn).not.toHaveBeenCalled()
    expect(processor).not.toHaveBeenCalled()
  })

  it('handles recursive scheduling safely', () => {
    let capturedItems: Set<string>[] = []

    let flushQueue: (() => void)[] = []
    let queue = (fn: () => void) => flushQueue.push(fn)
    let processorImpl = (items: Set<string>) => {
      capturedItems.push(new Set(items))

      if (items.has('trigger')) {
        bq.markDirty('reaction')
      }
    }
    let bq = makeBatchedQueue(processorImpl, queue)

    bq.markDirty('trigger')

    let flushOne = flushQueue.shift()
    flushOne!()

    expect(capturedItems).toEqual([new Set(['trigger'])])
    expect(flushQueue.length).toBe(1)

    let flushTwo = flushQueue.shift()
    flushTwo!()
    expect(capturedItems).toEqual([new Set(['trigger']), new Set(['reaction'])])
  })

  it('clears processingSet even if processor throws', () => {
    let shouldThrowError = true
    let capturedItems: Set<string>[] = []
    let processor = vi.fn().mockImplementation((items: Set<string>) => {
      capturedItems.push(new Set(items))
      if (shouldThrowError) {
        throw new Error('Test error')
      }
    })
    let flushFn: (() => void) | null = null
    let queue = (fn: () => void) => {
      flushFn = fn
    }
    let bq = makeBatchedQueue(processor, queue)

    bq.markDirty('a')
    expect(processor).not.toHaveBeenCalled()

    let triggerFlush = () => flushFn!()
    expect(triggerFlush).toThrow('Test error')
    expect(capturedItems).toEqual([new Set(['a'])])

    shouldThrowError = false
    bq.markDirty('b')
    expect(capturedItems).toEqual([new Set(['a'])])

    flushFn!()
    expect(capturedItems).toEqual([new Set(['a']), new Set(['b'])])
  })
})
