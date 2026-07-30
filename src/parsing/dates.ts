/**
 * Excel serial date epoch is 1899-12-30 (accounts for the classic Lotus 1900 leap-year bug).
 */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function parseExcelValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return value
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return null
    return new Date(EXCEL_EPOCH_MS + value * MS_PER_DAY)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const numeric = Number(trimmed)
    if (!Number.isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return new Date(EXCEL_EPOCH_MS + numeric * MS_PER_DAY)
    }
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) return parsed
    return null
  }
  return null
}

export function isSameOrBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() <= startOfDay(b).getTime()
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY)
}
