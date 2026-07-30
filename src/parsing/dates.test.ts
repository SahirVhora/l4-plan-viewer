import { describe, expect, it } from 'vitest'
import { parseExcelValue } from './dates'

describe('parseExcelValue', () => {
  it('parses excel serial numbers to the correct calendar date', () => {
    const d = parseExcelValue(45301)
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2024)
    expect(d!.getUTCMonth()).toBe(0)
    expect(d!.getUTCDate()).toBe(10)
  })

  it('passes through JS Date instances', () => {
    const original = new Date(2025, 5, 1)
    expect(parseExcelValue(original)).toBe(original)
  })

  it('returns null for blank values', () => {
    expect(parseExcelValue(null)).toBeNull()
    expect(parseExcelValue(undefined)).toBeNull()
    expect(parseExcelValue('')).toBeNull()
  })

  it('parses numeric-looking strings as excel serials', () => {
    const d = parseExcelValue('45301')
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2024)
  })

  it('parses ISO date strings', () => {
    const d = parseExcelValue('2025-03-14')
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2025)
  })
})
