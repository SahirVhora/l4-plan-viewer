import type { Dependency, PredecessorRelation } from '../model/types'

const TOKEN_RE = /^(\d+)\s*(FS|SS|FF|SF)?\s*([+-]\s*\d+\s*d?)?$/i

/**
 * Tokens look like `26FS`, `81SS+5d`, or bare `26` (defaults to FS, 0 lag).
 */
export function parsePredecessors(raw: string | null | undefined): Dependency[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map(parseToken)
    .filter((d): d is Dependency => d !== null)
}

function parseToken(token: string): Dependency | null {
  const match = TOKEN_RE.exec(token)
  if (!match) return null
  const fromId = Number(match[1])
  const type = (match[2]?.toUpperCase() ?? 'FS') as PredecessorRelation
  const lagRaw = match[3]?.replace(/\s|d/gi, '') ?? '0'
  const lagDays = Number(lagRaw) || 0
  return { fromId, type, lagDays }
}
