import { describe, expect, it, vi } from 'vitest'
import { fileInputChangeToImageData } from '../../src'
import * as fileModule from '../../src'

describe('fileInputChangeToImageData', () => {
  it('should return null if no file is selected', async () => {
    const event = {
      target: {
        files: [],
      },
    } as unknown as Event

    const result = await fileInputChangeToImageData(event)

    expect(result).toBeNull()
  })

  it('should call fileToImageData when a file is present', async () => {
    const mockImageData = {
      width: 100,
      height: 100,
      data: new Uint8ClampedArray(40000),
    } as ImageData

    const spy = vi.spyOn(fileModule, 'fileToImageData')

    spy.mockResolvedValue(mockImageData)

    const file = new File([''], 'test.png', {
      type: 'image/png',
    })

    const event = {
      target: {
        files: [file],
      },
    } as unknown as Event

    const result = await fileInputChangeToImageData(event)

    expect(spy).toHaveBeenCalledWith(file)

    expect(result).toBe(mockImageData)

    spy.mockRestore()
  })

  it('should return null if target.files is undefined', async () => {
    const event = {
      target: {},
    } as unknown as Event

    const result = await fileInputChangeToImageData(event)

    expect(result).toBeNull()
  })
})
