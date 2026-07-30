import { describe, expect, it } from 'vitest'
import { deriveHealth } from './health'
import type { Task } from './types'

function makeTask(partial: Partial<Task>): Task {
  return {
    id: 1,
    wbs: '1',
    outlineLevel: 1,
    name: 'Test',
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

const today = new Date(2025, 5, 15)

describe('deriveHealth', () => {
  it('marks complete when status is Complete', () => {
    expect(deriveHealth(makeTask({ status: 'Complete' }), today)).toBe('complete')
  })

  it('marks complete when percentComplete is 100', () => {
    expect(deriveHealth(makeTask({ percentComplete: 100 }), today)).toBe('complete')
  })

  it('marks blocked when finish is in the past and not complete', () => {
    expect(deriveHealth(makeTask({ finish: new Date(2025, 5, 1), percentComplete: 40 }), today)).toBe('blocked')
  })

  it('marks at-risk when on critical path, not started, and starting within 14 days', () => {
    expect(
      deriveHealth(
        makeTask({ criticalPath: true, percentComplete: 0, start: new Date(2025, 5, 20) }),
        today,
      ),
    ).toBe('at-risk')
  })

  it('marks on-track when critical path start is more than 14 days out', () => {
    expect(
      deriveHealth(
        makeTask({ criticalPath: true, percentComplete: 0, start: new Date(2025, 7, 1) }),
        today,
      ),
    ).toBe('on-track')
  })

  it('defaults to on-track otherwise', () => {
    expect(deriveHealth(makeTask({ percentComplete: 30, finish: new Date(2025, 6, 1) }), today)).toBe('on-track')
  })
})
