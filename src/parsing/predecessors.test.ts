import { describe, expect, it } from 'vitest'
import { parsePredecessors } from './predecessors'

describe('parsePredecessors', () => {
  it('parses a single FS token with no lag', () => {
    expect(parsePredecessors('26FS')).toEqual([{ fromId: 26, type: 'FS', lagDays: 0 }])
  })

  it('parses a bare id as FS with no lag', () => {
    expect(parsePredecessors('26')).toEqual([{ fromId: 26, type: 'FS', lagDays: 0 }])
  })

  it('parses multiple comma-separated tokens with lag', () => {
    expect(parsePredecessors('26FS,81SS+5d')).toEqual([
      { fromId: 26, type: 'FS', lagDays: 0 },
      { fromId: 81, type: 'SS', lagDays: 5 },
    ])
  })

  it('parses negative lag', () => {
    expect(parsePredecessors('10FF-4d')).toEqual([{ fromId: 10, type: 'FF', lagDays: -4 }])
  })

  it('returns an empty array for blank input', () => {
    expect(parsePredecessors(null)).toEqual([])
    expect(parsePredecessors('')).toEqual([])
  })
})
