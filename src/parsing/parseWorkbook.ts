import * as XLSX from 'xlsx'
import type {
  AssumptionDecisionRow,
  DataNote,
  MdBriefRow,
  MdPriorityRow,
  MilestoneSummaryRow,
  ProgrammePlan,
  ResourceDictionaryRow,
  Task,
  TaskType,
} from '../model/types'
import { parseExcelValue } from './dates'
import { parsePredecessors } from './predecessors'
import { buildHierarchy, computeSuccessors, rollUpSummaryDates, validateHierarchyAgainstWbs } from './hierarchy'
import { deriveHealth } from '../model/health'

export class WorkbookParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkbookParseError'
  }
}

const REQUIRED_HEADERS = ['ID', 'WBS', 'Task Name', 'Outline Level']

const HEADER_ALIASES: Record<string, string> = {
  id: 'ID',
  wbs: 'WBS',
  'outline level': 'Outline Level',
  'task name': 'Task Name',
  'task mode': 'Task Mode',
  'task type': 'Task Type',
  milestone: 'Milestone',
  module: 'Module',
  workstream: 'Module',
  'module / workstream': 'Module',
  'module/workstream': 'Module',
  track: 'Track',
  stage: 'Stage',
  'primary owner': 'Primary Owner',
  'resource names': 'Resource Names',
  party: 'Party',
  duration: 'Duration',
  'duration days': 'Duration Days',
  start: 'Start',
  finish: 'Finish',
  predecessors: 'Predecessors',
  'constraint type': 'Constraint Type',
  'constraint date': 'Constraint Date',
  deadline: 'Deadline',
  calendar: 'Calendar',
  deliverable: 'Deliverable',
  'acceptance evidence': 'Deliverable',
  'deliverable / acceptance evidence': 'Deliverable',
  'acceptance authority': 'Acceptance Authority',
  'contract / source reference': 'Contract Reference',
  'contract reference': 'Contract Reference',
  'source reference': 'Contract Reference',
  'critical path': 'Critical Path',
  'baseline confidence': 'Baseline Confidence',
  status: 'Status',
  '% complete': '% Complete',
  'percent complete': '% Complete',
  notes: 'Notes',
}

function normaliseHeaderCell(cell: unknown): string {
  return String(cell ?? '').trim()
}

function canonicaliseHeader(cell: string): string {
  const key = cell.toLowerCase().trim()
  return HEADER_ALIASES[key] ?? cell
}

type SheetRows = unknown[][]

function sheetToRows(workbook: XLSX.WorkBook, sheetName: string): SheetRows | null {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return null
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null }) as SheetRows
}

function findSheetName(workbook: XLSX.WorkBook, target: string): string | null {
  const normalisedTarget = target.toLowerCase().trim()
  return workbook.SheetNames.find((name) => name.toLowerCase().trim() === normalisedTarget) ?? null
}

function findHeaderRow(rows: SheetRows): { headerIndex: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue
    const headers = row.map((c) => canonicaliseHeader(normaliseHeaderCell(c)))
    const hasAll = REQUIRED_HEADERS.every((h) => headers.includes(h))
    if (hasAll) {
      return { headerIndex: i, headers }
    }
  }
  return null
}

function buildRowObject(headers: string[], row: unknown[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  headers.forEach((header, idx) => {
    if (!header) return
    obj[header] = row[idx] ?? null
  })
  return obj
}

function toNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function normaliseTaskType(v: unknown): TaskType {
  const s = toNullableString(v)?.toLowerCase()
  if (s === 'summary') return 'Summary'
  if (s === 'milestone') return 'Milestone'
  return 'Task'
}

function normalisePercent(v: unknown): number {
  const n = toNullableNumber(v)
  if (n === null) return 0
  if (n <= 1) return Math.round(n * 100)
  return Math.round(n)
}

function normaliseBoolYesNo(v: unknown): boolean {
  const s = toNullableString(v)?.toLowerCase()
  return s === 'yes' || s === 'y' || s === 'true'
}

function parseTaskRow(obj: Record<string, unknown>): Task {
  const id = Number(obj['ID'])
  const resourceNames = toNullableString(obj['Resource Names'])
  return {
    id,
    wbs: toNullableString(obj['WBS']) ?? '',
    outlineLevel: toNullableNumber(obj['Outline Level']) ?? 1,
    name: toNullableString(obj['Task Name']) ?? `Task ${id}`,
    taskMode: toNullableString(obj['Task Mode']),
    taskType: normaliseTaskType(obj['Task Type']),
    milestone: toNullableString(obj['Milestone']),
    module: toNullableString(obj['Module']),
    track: toNullableString(obj['Track']),
    stage: toNullableString(obj['Stage']),
    primaryOwner: toNullableString(obj['Primary Owner']),
    resourceNames: resourceNames ? resourceNames.split(';').map((s) => s.trim()).filter(Boolean) : [],
    party: toNullableString(obj['Party']),
    duration: toNullableString(obj['Duration']),
    durationDays: toNullableNumber(obj['Duration Days']),
    start: parseExcelValue(obj['Start']),
    finish: parseExcelValue(obj['Finish']),
    rolledUp: false,
    predecessorsRaw: toNullableString(obj['Predecessors']),
    predecessors: parsePredecessors(toNullableString(obj['Predecessors'])),
    constraintType: toNullableString(obj['Constraint Type']),
    constraintDate: parseExcelValue(obj['Constraint Date']),
    deadline: parseExcelValue(obj['Deadline']),
    calendar: toNullableString(obj['Calendar']),
    deliverable: toNullableString(obj['Deliverable']),
    acceptanceAuthority: toNullableString(obj['Acceptance Authority']),
    contractReference: toNullableString(obj['Contract Reference']),
    criticalPath: normaliseBoolYesNo(obj['Critical Path']),
    baselineConfidence: toNullableString(obj['Baseline Confidence']),
    status: toNullableString(obj['Status']),
    percentComplete: normalisePercent(obj['% Complete']),
    notes: toNullableString(obj['Notes']),
    parentId: null,
    children: [],
    health: 'on-track',
    successors: [],
  }
}

function parseMsProjectSheet(workbook: XLSX.WorkBook): Task[] {
  const sheetName = findSheetName(workbook, 'MS Project Import')
  if (!sheetName) {
    throw new WorkbookParseError(
      'Could not find a sheet named "MS Project Import". This workbook does not look like a recognised L4 programme plan export.',
    )
  }
  const rows = sheetToRows(workbook, sheetName)
  if (!rows || rows.length === 0) {
    throw new WorkbookParseError(`Sheet "${sheetName}" is empty.`)
  }
  const headerInfo = findHeaderRow(rows)
  if (!headerInfo) {
    throw new WorkbookParseError(
      `Could not find the header row in "${sheetName}". Expected a row containing ID, WBS, Task Name and Outline Level within the first 10 rows.`,
    )
  }
  const { headerIndex, headers } = headerInfo
  const tasks: Task[] = []
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const obj = buildRowObject(headers, row)
    const idValue = obj['ID']
    if (idValue === null || idValue === undefined || idValue === '') continue
    const idNum = Number(idValue)
    if (!Number.isInteger(idNum)) continue
    tasks.push(parseTaskRow(obj))
  }
  if (tasks.length === 0) {
    throw new WorkbookParseError(`Sheet "${sheetName}" has a header row but no data rows with an integer ID.`)
  }
  return tasks
}

function parseMilestoneSummarySheet(workbook: XLSX.WorkBook, notes: DataNote[]): MilestoneSummaryRow[] {
  const sheetName = findSheetName(workbook, 'Milestone Summary')
  if (!sheetName) {
    notes.push({ level: 'info', message: 'No "Milestone Summary" sheet found; milestone timeline and payment visual will be limited.' })
    return []
  }
  const rows = sheetToRows(workbook, sheetName)
  if (!rows || rows.length < 2) return []
  const headerInfo = findGenericHeaderRow(rows, ['Milestone'])
  if (!headerInfo) return []
  const { headerIndex, headers } = headerInfo
  const out: MilestoneSummaryRow[] = []
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const obj = buildRowObject(headers, row)
    const milestone = toNullableString(obj['Milestone'])
    if (!milestone) continue
    out.push({
      milestone,
      contractStageTrack: toNullableString(obj['Contract Stage / Track'] ?? obj['Contract Stage/Track']),
      planningTarget: parseExcelValue(obj['Planning Target']),
      contractTiming: toNullableString(obj['Contract Timing']),
      paymentPct: normalisePaymentPct(obj['Payment %'] ?? obj['Payment Pct']),
      acceptanceAuthority: toNullableString(obj['Acceptance Authority']),
      acceptanceEvidence: toNullableString(obj['Acceptance Evidence']),
      executableTasks: toNullableNumber(obj['Executable Tasks']),
      criticalTasks: toNullableNumber(obj['Critical Tasks']),
      baselineConfidence: toNullableString(obj['Baseline Confidence']),
      scheduleStatus: toNullableString(obj['Schedule Status']),
      source: toNullableString(obj['Source']),
      comment: toNullableString(obj['Comment']),
    })
  }
  return out
}

function normalisePaymentPct(v: unknown): number {
  const n = toNullableNumber(v)
  if (n === null) return 0
  return n <= 1 ? n : n / 100
}

function findGenericHeaderRow(rows: SheetRows, required: string[]): { headerIndex: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i]
    if (!row) continue
    const headers = row.map((c) => normaliseHeaderCell(c))
    if (required.every((h) => headers.includes(h))) {
      return { headerIndex: i, headers }
    }
  }
  return null
}

function parseMdBriefSheet(workbook: XLSX.WorkBook, notes: DataNote[]): { brief: MdBriefRow[]; priorities: MdPriorityRow[] } {
  const sheetName = findSheetName(workbook, 'MD Brief')
  if (!sheetName) {
    notes.push({ level: 'info', message: 'No "MD Brief" sheet found; Executive Brief panel will be empty.' })
    return { brief: [], priorities: [] }
  }
  const rows = sheetToRows(workbook, sheetName)
  if (!rows) return { brief: [], priorities: [] }

  const briefHeader = findGenericHeaderRow(rows, ['Baseline Outcome'])
  const brief: MdBriefRow[] = []
  if (briefHeader) {
    for (let i = briefHeader.headerIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      const obj = buildRowObject(briefHeader.headers, row)
      const outcome = toNullableString(obj['Baseline Outcome'])
      if (!outcome) continue
      brief.push({
        baselineOutcome: outcome,
        value: toNullableString(obj['Value']),
        executiveImplication: toNullableString(obj['Executive Implication']),
        control: toNullableString(obj['Control']),
      })
    }
  }

  const priorityHeader = findGenericHeaderRow(rows, ['MD Priority'])
    ?? findGenericHeaderRow(rows, ['Decision'])
  const priorities: MdPriorityRow[] = []
  if (priorityHeader) {
    for (let i = priorityHeader.headerIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      const obj = buildRowObject(priorityHeader.headers, row)
      const decision = toNullableString(obj['MD Priority'] ?? obj['Decision'])
      if (!decision) continue
      const rest: Record<string, string | null> = {}
      for (const h of priorityHeader.headers) {
        if (h && h !== 'MD Priority' && h !== 'Decision') rest[h] = toNullableString(obj[h])
      }
      priorities.push({ decision, detail: null, ...rest })
    }
  }

  return { brief, priorities }
}

function parseResourceDictionarySheet(workbook: XLSX.WorkBook, notes: DataNote[]): ResourceDictionaryRow[] {
  const sheetName = findSheetName(workbook, 'Resource Dictionary')
  if (!sheetName) {
    notes.push({ level: 'info', message: 'No "Resource Dictionary" sheet found; resource organisation colour-coding will default to neutral.' })
    return []
  }
  const rows = sheetToRows(workbook, sheetName)
  if (!rows) return []
  const headerInfo = findGenericHeaderRow(rows, ['Resource / Role']) ?? findGenericHeaderRow(rows, ['Resource'])
  if (!headerInfo) return []
  const { headerIndex, headers } = headerInfo
  const out: ResourceDictionaryRow[] = []
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const obj = buildRowObject(headers, row)
    const resource = toNullableString(obj['Resource / Role'] ?? obj['Resource'])
    if (!resource) continue
    out.push({
      resource,
      organisation: toNullableString(obj['Organisation'] ?? obj['Organization']) ?? 'Joint',
    })
  }
  return out
}

function parseAssumptionsSheet(workbook: XLSX.WorkBook, notes: DataNote[]): AssumptionDecisionRow[] {
  const sheetName = findSheetName(workbook, 'Assumptions Decisions')
  if (!sheetName) {
    notes.push({ level: 'info', message: 'No "Assumptions Decisions" sheet found; RAID panel will be empty.' })
    return []
  }
  const rows = sheetToRows(workbook, sheetName)
  if (!rows) return []
  const headerInfo = findGenericHeaderRow(rows, ['ID', 'Topic'])
  if (!headerInfo) return []
  const { headerIndex, headers } = headerInfo
  const out: AssumptionDecisionRow[] = []
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const obj = buildRowObject(headers, row)
    const id = toNullableString(obj['ID'])
    if (!id) continue
    out.push({
      id,
      type: toNullableString(obj['Type']),
      topic: toNullableString(obj['Topic']),
      currentPlanningPosition: toNullableString(obj['Current Planning Position']),
      impactIfWrong: toNullableString(obj['Impact if Wrong']),
      decisionEvidenceRequired: toNullableString(obj['Decision / Evidence Required']),
      owner: toNullableString(obj['Owner']),
      targetDecisionDate: parseExcelValue(obj['Target Decision Date']),
      status: toNullableString(obj['Status']),
      affectsMilestone: toNullableString(obj['Affects Milestone']),
      scheduleTreatment: toNullableString(obj['Schedule Treatment']),
      source: toNullableString(obj['Source']),
      mdAttention: toNullableString(obj['MD Attention']),
    })
  }
  return out
}

export async function parseWorkbook(file: File): Promise<ProgrammePlan> {
  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  } catch {
    throw new WorkbookParseError('This file could not be read as an Excel workbook (.xlsx).')
  }

  const dataNotes: DataNote[] = []
  const tasks = parseMsProjectSheet(workbook)

  const { rootIds } = buildHierarchy(tasks)
  const tasksById = new Map(tasks.map((t) => [t.id, t]))

  const wbsWarnings = validateHierarchyAgainstWbs(tasks, tasksById)
  if (wbsWarnings.length) {
    // eslint-disable-next-line no-console
    console.warn('[parseWorkbook] hierarchy/WBS mismatches:', wbsWarnings)
    dataNotes.push({
      level: 'warning',
      message: `${wbsWarnings.length} task(s) have a WBS path that does not match the outline-derived hierarchy. See console for details.`,
    })
  }

  rollUpSummaryDates(tasks, tasksById)
  computeSuccessors(tasks, tasksById)

  const today = new Date()
  for (const task of tasks) {
    task.health = deriveHealth(task, today)
  }

  const milestoneSummary = parseMilestoneSummarySheet(workbook, dataNotes)
  const { brief: mdBrief, priorities: mdPriorities } = parseMdBriefSheet(workbook, dataNotes)
  const resourceDictionary = parseResourceDictionarySheet(workbook, dataNotes)
  const assumptions = parseAssumptionsSheet(workbook, dataNotes)

  const allStarts = tasks.map((t) => t.start).filter((d): d is Date => d !== null)
  const allFinishes = tasks.map((t) => t.finish).filter((d): d is Date => d !== null)
  const programmeStart = allStarts.length ? new Date(Math.min(...allStarts.map((d) => d.getTime()))) : null
  const programmeFinish = allFinishes.length ? new Date(Math.max(...allFinishes.map((d) => d.getTime()))) : null

  const paymentSum = milestoneSummary.reduce((sum, m) => sum + m.paymentPct, 0)
  if (milestoneSummary.length && Math.abs(paymentSum - 1) > 0.02) {
    dataNotes.push({
      level: 'warning',
      message: `Milestone payment percentages sum to ${(paymentSum * 100).toFixed(1)}%, not 100%. Check the Milestone Summary sheet.`,
    })
  }

  return {
    fileName: file.name,
    tasks,
    tasksById,
    rootIds,
    milestoneSummary,
    mdBrief,
    mdPriorities,
    resourceDictionary,
    assumptions,
    dataNotes,
    programmeStart,
    programmeFinish,
  }
}
