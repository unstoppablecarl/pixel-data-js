import type {
  Task,
  TaskResultCompleted,
  TaskResultRuntimeInfo,
  TaskResultTimestampProviderInfo,
  TaskResultWithStatistics,
} from 'tinybench'

export function formatCompactNumber(number: number) {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  })
  return formatter.format(number)
}

export function percentDiff(base: number, target: number) {
  if (base === 0) return 0
  return ((target - base) / base) * 100
}

export function percentDiffString(val: number) {
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

export type BlendModeMetadataMap<T extends string = string> = Map<string, {
  type: T;
  blendMode: string;
  testCase: string
}>;

export function groupBlendModeTasks<T, B extends string, U extends string>(
  tasks: Task[],
  meta: BlendModeMetadataMap,
  baseType: B,
  targetType: U,
  cb: (result: TaskResultWithStatistics) => T,
) {
  type Rec = {
    blendMode: string;
    testCase: string;
  } & {
    [K in B | U]: T;
  };

  const groups = new Map<string, Rec>()

  for (const task of tasks) {
    const result = task.result

    if (!taskResultComplete(result)) {
      continue
    }

    const {
      type,
      blendMode,
      testCase,
    } = meta.get(task.name)!

    const key = `${blendMode}::${testCase}`

    if (!groups.has(key)) {
      groups.set(key, {
        blendMode,
        testCase,
        [baseType]: {} as T,
        [targetType]: {} as T,
      } as Rec)
    }

    const group = groups.get(key)!;

    // Type assertion here helps TS understand 'type' matches B or U
    (group as any)[type] = cb(result)
  }

  return groups
}

export function taskResultComplete(result: Task['result']): result is TaskResultCompleted & TaskResultRuntimeInfo & TaskResultTimestampProviderInfo {
  return result?.state === 'completed'
}

export type BlendModeBenchCase = {
  blendMode: string
  testCase: string
  type: string
  run: () => void
};
