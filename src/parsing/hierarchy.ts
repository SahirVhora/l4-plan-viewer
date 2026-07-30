import type { Task } from '../model/types'

/**
 * Each row's parent is the nearest preceding row (in source order) with a strictly
 * lower outline level. Returns root ids and mutates parentId/children on the tasks.
 */
export function buildHierarchy(tasks: Task[]): { rootIds: number[] } {
  const stack: Task[] = []
  const rootIds: number[] = []

  for (const task of tasks) {
    while (stack.length && stack[stack.length - 1].outlineLevel >= task.outlineLevel) {
      stack.pop()
    }
    const parent = stack[stack.length - 1]
    if (parent) {
      task.parentId = parent.id
      parent.children.push(task.id)
    } else {
      task.parentId = null
      rootIds.push(task.id)
    }
    stack.push(task)
  }

  return { rootIds }
}

/**
 * Sanity-check the outline-derived tree against the WBS dotted path depth and
 * prefix relationship. Returns human-readable warnings; never throws.
 */
export function validateHierarchyAgainstWbs(tasks: Task[], tasksById: Map<number, Task>): string[] {
  const warnings: string[] = []
  for (const task of tasks) {
    if (!task.wbs) continue
    const segments = task.wbs.split('.').filter(Boolean)
    if (segments.length !== task.outlineLevel) {
      warnings.push(
        `Task ${task.id} ("${task.name}"): WBS "${task.wbs}" has ${segments.length} segments but Outline Level is ${task.outlineLevel}.`,
      )
    }
    if (task.parentId !== null) {
      const parent = tasksById.get(task.parentId)
      if (parent?.wbs && task.wbs !== parent.wbs && !task.wbs.startsWith(`${parent.wbs}.`)) {
        warnings.push(
          `Task ${task.id} ("${task.name}"): WBS "${task.wbs}" is not nested under parent ${parent.id} WBS "${parent.wbs}".`,
        )
      }
    }
  }
  return warnings
}

export function rollUpSummaryDates(tasks: Task[], tasksById: Map<number, Task>): void {
  const memoStart = new Map<number, Date | null>()
  const memoFinish = new Map<number, Date | null>()

  function computeStart(task: Task): Date | null {
    if (memoStart.has(task.id)) return memoStart.get(task.id)!
    let result: Date | null
    if (task.taskType !== 'Summary') {
      result = task.start
    } else if (task.children.length === 0) {
      result = task.start
    } else {
      const childStarts = task.children
        .map((id) => tasksById.get(id))
        .filter((t): t is Task => !!t)
        .map(computeStart)
        .filter((d): d is Date => d !== null)
      result = childStarts.length ? new Date(Math.min(...childStarts.map((d) => d.getTime()))) : null
    }
    memoStart.set(task.id, result)
    return result
  }

  function computeFinish(task: Task): Date | null {
    if (memoFinish.has(task.id)) return memoFinish.get(task.id)!
    let result: Date | null
    if (task.taskType !== 'Summary') {
      result = task.finish
    } else if (task.children.length === 0) {
      result = task.finish
    } else {
      const childFinishes = task.children
        .map((id) => tasksById.get(id))
        .filter((t): t is Task => !!t)
        .map(computeFinish)
        .filter((d): d is Date => d !== null)
      result = childFinishes.length ? new Date(Math.max(...childFinishes.map((d) => d.getTime()))) : null
    }
    memoFinish.set(task.id, result)
    return result
  }

  for (const task of tasks) {
    if (task.taskType === 'Summary') {
      const start = computeStart(task)
      const finish = computeFinish(task)
      if (!task.start && start) {
        task.start = start
        task.rolledUp = true
      }
      if (!task.finish && finish) {
        task.finish = finish
        task.rolledUp = true
      }
    }
    if (task.taskType === 'Milestone') {
      if (task.start && !task.finish) task.finish = task.start
      if (task.finish && !task.start) task.start = task.finish
    }
  }
}

export function computeSuccessors(tasks: Task[], tasksById: Map<number, Task>): void {
  for (const task of tasks) {
    for (const dep of task.predecessors) {
      const predecessor = tasksById.get(dep.fromId)
      if (predecessor && !predecessor.successors.includes(task.id)) {
        predecessor.successors.push(task.id)
      }
    }
  }
}
