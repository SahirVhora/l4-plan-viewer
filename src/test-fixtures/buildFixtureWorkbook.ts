import * as XLSX from 'xlsx'

/**
 * Builds a tiny synthetic workbook matching the documented L4 column layout,
 * used to unit-test the parser end to end without needing the real file.
 */
export function buildFixtureWorkbook(): XLSX.WorkBook {
  const titleRows = [['CST238 SuccessFactors Programme Plan (synthetic fixture)'], []]
  const header = [
    'ID',
    'WBS',
    'Outline Level',
    'Task Name',
    'Task Mode',
    'Task Type',
    'Milestone',
    'Module',
    'Track',
    'Stage',
    'Primary Owner',
    'Resource Names',
    'Party',
    'Duration',
    'Duration Days',
    'Start',
    'Finish',
    'Predecessors',
    'Constraint Type',
    'Constraint Date',
    'Deadline',
    'Calendar',
    'Deliverable',
    'Acceptance Authority',
    'Contract Reference',
    'Critical Path',
    'Baseline Confidence',
    'Status',
    '% Complete',
    'Notes',
  ]

  const rows: (string | number | null)[][] = [
    [1, '1', 1, 'Programme', 'Auto Scheduled', 'Summary', 'Programme', 'Programme', 'Programme', '', '', '', '', '', '', null, null, '', '', '', '', '', '', '', '', 'No', '', '', 0, ''],
    [2, '1.1', 2, 'M1 - Foundation', 'Auto Scheduled', 'Summary', 'M1', 'Cross-functional', 'Programme', 'Prepare', '', '', '', '', '', null, null, '', '', '', '', '', '', '', '', 'No', '', '', 0, ''],
    [3, '1.1.1', 3, 'Week 1 kickoff', 'Auto Scheduled', 'Summary', 'M1', 'Cross-functional', 'Programme', 'Prepare', '', '', '', '', '', null, null, '', '', '', '', '', '', '', '', 'No', '', '', 0, ''],
    [4, '1.1.1.1', 4, 'Kickoff workshop', 'Auto Scheduled', 'Task', 'M1', 'Employee Central', 'Track A', 'Prepare', 'Jane Lead', 'Jane Lead;Bob PM', 'VE3', '2d', 2, 45292, 45293, '', 'As Soon As Possible', null, null, 'Standard', 'Signed workshop minutes', 'Programme Board', 'SOW-1', 'Yes', 'High', 'Complete', 1, 'Went well.\nNo issues.'],
    [5, '1.1.1.2', 4, 'Requirements draft', 'Auto Scheduled', 'Task', 'M1', 'Employee Central', 'Track A', 'Explore', 'Jane Lead', 'Jane Lead', 'Joint', '3d', 3, 45303, 45305, '4FS', 'As Soon As Possible', null, null, 'Standard', 'Draft requirements doc', 'Programme Board', 'SOW-1', 'No', 'Medium', 'In Progress', 0.5, ''],
    [6, '1.1.2', 3, 'M1 acceptance', 'Auto Scheduled', 'Milestone', 'M1', 'Programme', 'Programme', 'Deploy', 'Bob PM', 'Bob PM', 'Council', '0d', 0, 45310, 45310, '5FS+2d', 'Must Finish On', 45310, 45310, 'Standard', 'M1 signoff pack', 'Council Sponsor', 'SOW-1', 'Yes', 'High', 'Not Started', 0, ''],
  ]

  const sheetData = [...titleRows, header, ...rows]
  const wsMain = XLSX.utils.aoa_to_sheet(sheetData)

  const wsMilestone = XLSX.utils.aoa_to_sheet([
    ['Milestone', 'Contract Stage / Track', 'Planning Target', 'Contract Timing', 'Payment %', 'Acceptance Authority', 'Acceptance Evidence', 'Executable Tasks', 'Critical Tasks', 'Baseline Confidence', 'Schedule Status', 'Source', 'Comment'],
    ['M1', 'Prepare / Track A', 45310, 'Contractual', 0.1, 'Council Sponsor', 'M1 signoff pack', 2, 1, 'High', 'On Track', 'Contract Schedule 2', ''],
    ['M2', 'Explore / Track A', 45400, 'Contractual', 0.9, 'Council Sponsor', 'Final signoff pack', 0, 0, 'Medium', 'Not Started', 'Contract Schedule 2', ''],
  ])

  const wsResourceDict = XLSX.utils.aoa_to_sheet([
    ['Resource / Role', 'Organisation'],
    ['Jane Lead', 'VE3'],
    ['Bob PM', 'Council'],
  ])

  const wsAssumptions = XLSX.utils.aoa_to_sheet([
    ['ID', 'Type', 'Topic', 'Current Planning Position', 'Impact if Wrong', 'Decision / Evidence Required', 'Owner', 'Target Decision Date', 'Status', 'Affects Milestone', 'Schedule Treatment', 'Source', 'MD Attention'],
    ['AD-001', 'Assumption', 'Data cleansing scope', 'Council owns cleansing', 'Slip of 2 weeks', 'Confirm with data lead', 'Bob PM', 45305, 'Open', 'M1', 'No change', 'Workshop notes', 'High'],
  ])

  const wsMdBrief = XLSX.utils.aoa_to_sheet([
    ['Baseline Outcome', 'Value', 'Executive Implication', 'Control'],
    ['On track for M1', 'Low risk', 'No MD action needed', 'Monitor weekly'],
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, wsMain, 'MS Project Import')
  XLSX.utils.book_append_sheet(workbook, wsMilestone, 'Milestone Summary')
  XLSX.utils.book_append_sheet(workbook, wsResourceDict, 'Resource Dictionary')
  XLSX.utils.book_append_sheet(workbook, wsAssumptions, 'Assumptions Decisions')
  XLSX.utils.book_append_sheet(workbook, wsMdBrief, 'MD Brief')
  return workbook
}

export function workbookToFile(workbook: XLSX.WorkBook, name = 'fixture.xlsx'): File {
  const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new File([out], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
