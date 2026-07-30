import { describe, expect, it } from 'vitest'
import { buildHierarchy, rollUpSummaryDates } from './hierarchy'
import type { Task } from '../model/types'

function makeTask(partial: Partial<Task>): Task {
  return {
    id: 0,
    wbs: '',
    outlineLevel: 1,
    name: '',
    taskMode: null,
    taskType: 'Task',
    milestone: null,
    module: null,
    track: null,
    stage: null,
    primaryOwner: null,
    resourceNames: [],
    party: null,
    duration: null,
    durationDays: null,
    start: null,
    finish: null,
    rolledUp: false,
    predecessorsRaw: null,
    predecessors: [],
    constraintType: null,
    constraintDate: null,
    deadline: null,
    calendar: null,
    deliverable: null,
    acceptanceAuthority: null,
    contractReference: null,
    criticalPath: false,
    baselineConfidence: null,
    status: null,
    percentComplete: 0,
    notes: null,
    parentId: null,
    children: [],
    health: 'on-track',
    successors: [],
    ...partial,
  }
}

describe('buildHierarchy', () => {
  it('assigns parents based on outline level, not WBS', () => {
    const tasks = [
      makeTask({ id: 1, outlineLevel: 1 }),
      makeTask({ id: 2, outlineLevel: 2 }),
      makeTask({ id: 3, outlineLevel: 3 }),
      makeTask({ id: 4, outlineLevel: 3 }),
      makeTask({ id: 5, outlineLevel: 2 }),
    ]
    const { rootIds } = buildHierarchy(tasks)
    expect(rootIds).toEqual([1])
    expect(tasks[1].parentId).toBe(1)
    expect(tasks[2].parentId).toBe(2)
    expect(tasks[3].parentId).toBe(2)
    expect(tasks[4].parentId).toBe(1)
    expect(tasks[0].children).toEqual([2, 5])
    expect(tasks[1].children).toEqual([3, 4])
  })
})

describe('rollUpSummaryDates', () => {
  it('computes summary start/finish as min/max of descendants', () => {
    const child1 = makeTask({ id: 2, outlineLevel: 2, start: new Date(2025, 0, 5), finish: new Date(2025, 0, 10) })
    const child2 = makeTask({ id: 3, outlineLevel: 2, start: new Date(2025, 0, 1), finish: new Date(2025, 0, 20) })
    const summary = makeTask({ id: 1, outlineLevel: 1, taskType: 'Summary' })
    const tasks = [summary, child1, child2]
    buildHierarchy(tasks)
    const byId = new Map(tasks.map((t) => [t.id, t]))
    rollUpSummaryDates(tasks, byId)
    expect(summary.start).toEqual(new Date(2025, 0, 1))
    expect(summary.finish).toEqual(new Date(2025, 0, 20))
    expect(summary.rolledUp).toBe(true)
  })

  it('sets milestone finish equal to start when only start is present', () => {
    const milestone = makeTask({ id: 1, taskType: 'Milestone', start: new Date(2025, 2, 1), finish: null })
    rollUpSummaryDates([milestone], new Map([[1, milestone]]))
    expect(milestone.finish).toEqual(new Date(2025, 2, 1))
  })
})
