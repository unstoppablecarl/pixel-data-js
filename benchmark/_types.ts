import type { Stats } from 'mitata-ts'

export const BLEND_MODE_TYPES = ['fast', 'perfect'] as const

export type BlendModeType = typeof BLEND_MODE_TYPES[number]

export interface BenchRun {
  id: string
  slug: string
  groupName: string
  alias: string
  runName: string
  runIndex: number
  isMultiRun: boolean
  args: Record<string, any>
  avg: number
  min: number
  max: number
  p25: number
  p50: number
  p75: number
  p99: number
  p999: number
  heap?: Stats['heap']
}

export type BaseBenchCmdOpts = {
  seed: number
  group: string
  log: boolean
  subProcess?: boolean
}
