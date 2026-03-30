import { BaseBlendMode } from './blend-modes'

export function toBlendModeIndexAndName(input: string | number) {
  if (typeof input === 'number') {
    const name = getKeyByValue(BaseBlendMode, input)
    if (name === undefined) throw new Error(`Invalid index: ${input}`)
    return { blendIndex: input, blendName: name }
  }

  const trimmed = input.trim()
  const num = Number(trimmed)
  const isNumeric = trimmed !== '' && !Number.isNaN(num)

  if (isNumeric && Number.isInteger(num)) {
    const name = getKeyByValue(BaseBlendMode, num)
    if (name === undefined) throw new Error(`Invalid index: ${num}`)
    return { blendIndex: num, blendName: name }
  }

  if (trimmed in BaseBlendMode) {
    return {
      blendIndex: BaseBlendMode[trimmed as keyof typeof BaseBlendMode],
      blendName: trimmed as keyof typeof BaseBlendMode,
    }
  }

  throw new Error(`Invalid blend mode: ${JSON.stringify(input)}`)
}

const getKeyByValue = (obj: any, value: any) => {
  for (const key in obj) {
    if (obj[key] === value) return key
  }
}
