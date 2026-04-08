import { makeReusablePixelData } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makeReusablePixelData', () => {

  it('allocates new pixel data on the first call', () => {
    const getReusablePixelData = makeReusablePixelData()
    const pd = getReusablePixelData(10, 20)

    expect(pd.w).toBe(10)
    expect(pd.h).toBe(20)
    expect(pd.data).toBeInstanceOf(Uint32Array)
  })

  it('reuses the instance and clears data when dimensions match', () => {
    const getReusablePixelData = makeReusablePixelData()
    const pd1 = getReusablePixelData(10, 10)

    // Mutate the array buffer to verify the subsequent clear works
    pd1.data[0] = 999

    const pd2 = getReusablePixelData(10, 10)

    expect(pd2).toBe(pd1)
    expect(pd2.data[0]).toBe(0)
  })

  it('allocates new data via the setter when dimensions change', () => {
    const getReusablePixelData = makeReusablePixelData()
    const pd1 = getReusablePixelData(10, 10)

    const pd2 = getReusablePixelData(20, 20)
    // The container object reference remains exactly the same
    expect(pd2).toBe(pd1)
    expect(pd2.w).toBe(20)
    expect(pd2.h).toBe(20)
  })
})
