export type TaskType = 'Summary' | 'Task' | 'Milestone'

export type Party = 'VE3' | 'Council' | 'Joint' | string

export type PredecessorRelation = 'FS' | 'SS' | 'FF' | 'SF'

export interface Dependency {
  fromId: number
  type: PredecessorRelation
  lagDays: number
}

export type HealthStatus = 'complete' | 'at-risk' | 'blocked' | 'on-track'

export interface Task {
  id: number
  wbs: string
  outlineLevel: number
  name: string
  taskMode: string | null
  taskType: TaskType
  milestone: string | null
  module: string | null
  track: string | null
  stage: string | null
  primaryOwner: string | null
  resourceNames: string[]
  party: Party | null
  duration: string | null
  durationDays: number | null
  start: Date | null
  finish: Date | null
  /** true when start/finish were rolled up from descendants rather than read directly */
  rolledUp: boolean
  predecessorsRaw: string | null
  predecessors: Dependency[]
  constraintType: string | null
  constraintDate: Date | null
  deadline: Date | null
  calendar: string | null
  deliverable: string | null
  acceptanceAuthority: string | null
  contractReference: string | null
  criticalPath: boolean
  baselineConfidence: string | null
  status: string | null
  percentComplete: number
  notes: string | null
  parentId: number | null
  children: number[]
  health: HealthStatus
  successors: number[]
}

export interface MilestoneSummaryRow {
  milestone: string
  contractStageTrack: string | null
  planningTarget: Date | null
  contractTiming: string | null
  paymentPct: number
  acceptanceAuthority: string | null
  acceptanceEvidence: string | null
  executableTasks: number | null
  criticalTasks: number | null
  baselineConfidence: string | null
  scheduleStatus: string | null
  source: string | null
  comment: string | null
}

export interface MdBriefRow {
  baselineOutcome: string
  value: string | null
  executiveImplication: string | null
  control: string | null
}

export interface MdPriorityRow {
  decision: string
  detail: string | null
  [key: string]: string | null | undefined
}

export interface ResourceDictionaryRow {
  resource: string
  organisation: Party
}

export interface AssumptionDecisionRow {
  id: string
  type: string | null
  topic: string | null
  currentPlanningPosition: string | null
  impactIfWrong: string | null
  decisionEvidenceRequired: string | null
  owner: string | null
  targetDecisionDate: Date | null
  status: string | null
  affectsMilestone: string | null
  scheduleTreatment: string | null
  source: string | null
  mdAttention: 'High' | 'Medium' | string | null
}

export interface DataNote {
  level: 'info' | 'warning'
  message: string
}

export interface ProgrammePlan {
  fileName: string
  tasks: Task[]
  tasksById: Map<number, Task>
  rootIds: number[]
  milestoneSummary: MilestoneSummaryRow[]
  mdBrief: MdBriefRow[]
  mdPriorities: MdPriorityRow[]
  resourceDictionary: ResourceDictionaryRow[]
  assumptions: AssumptionDecisionRow[]
  dataNotes: DataNote[]
  programmeStart: Date | null
  programmeFinish: Date | null
}
