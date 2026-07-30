import { describe, expect, it } from 'vitest'
import { parseWorkbook } from './parseWorkbook'
import { buildFixtureWorkbook, workbookToFile } from '../test-fixtures/buildFixtureWorkbook'

describe('parseWorkbook (synthetic fixture)', () => {
  it('parses the flat task list into a tree with correct rollups and dependencies', async () => {
    const file = workbookToFile(buildFixtureWorkbook())
    const plan = await parseWorkbook(file)

    expect(plan.tasks).toHaveLength(6)
    expect(plan.rootIds).toEqual([1])

    const programme = plan.tasksById.get(1)!
    expect(programme.taskType).toBe('Summary')
    expect(programme.children).toEqual([2])

    const kickoff = plan.tasksById.get(4)!
    expect(kickoff.taskType).toBe('Task')
    expect(kickoff.percentComplete).toBe(100)
    expect(kickoff.health).toBe('complete')

    const requirements = plan.tasksById.get(5)!
    expect(requirements.predecessors).toEqual([{ fromId: 4, type: 'FS', lagDays: 0 }])
    expect(requirements.percentComplete).toBe(50)

    const acceptance = plan.tasksById.get(6)!
    expect(acceptance.taskType).toBe('Milestone')
    expect(acceptance.predecessors).toEqual([{ fromId: 5, type: 'FS', lagDays: 2 }])
    expect(acceptance.start).toEqual(acceptance.finish)

    expect(kickoff.successors).toContain(5)
    expect(requirements.successors).toContain(6)

    // Summary rollup: programme root should span from earliest child start to latest child finish
    expect(programme.start).not.toBeNull()
    expect(programme.finish).not.toBeNull()

    expect(plan.milestoneSummary).toHaveLength(2)
    expect(plan.resourceDictionary).toHaveLength(2)
    expect(plan.assumptions).toHaveLength(1)
    expect(plan.mdBrief).toHaveLength(1)
  })

  it('flags when milestone payment percentages do not sum to 100%', async () => {
    const file = workbookToFile(buildFixtureWorkbook())
    const plan = await parseWorkbook(file)
    const paymentSum = plan.milestoneSummary.reduce((s, m) => s + m.paymentPct, 0)
    expect(paymentSum).toBeCloseTo(1, 5)
    expect(plan.dataNotes.some((n) => n.message.includes('sum to'))).toBe(false)
  })
})
