import type { BarSeries } from '../components'
import type { Column } from '../components/DataTable/DataTable.types'
import type { SankeyLink, SankeyNode } from '../components/charts/SankeyChart'

export type FrontDeskIndustryId =
  | 'healthcare'
  | 'financial'
  | 'realEstate'
  | 'storage'
  | 'restaurant'
  | 'homeService'

export interface IndustryToggleOption {
  id: FrontDeskIndustryId
  label: string
}

export const FRONT_DESK_INDUSTRY_OPTIONS: IndustryToggleOption[] = [
  { id: 'healthcare', label: 'Healthcare / Dental' },
  { id: 'financial', label: 'Financial services' },
  { id: 'realEstate', label: 'Real estate' },
  { id: 'storage', label: 'Storage' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'homeService', label: 'Home service' },
]

/** Healthcare / dental uses "patient"; all other industries use "customer". */
export function usesPatientTerminology(industry: FrontDeskIndustryId): boolean {
  return industry === 'healthcare'
}

export function applyAudienceCopy(text: string, industry: FrontDeskIndustryId): string {
  if (usesPatientTerminology(industry)) return text
  return text
    .replace(/\bPatients\b/g, 'Customers')
    .replace(/\bpatients\b/g, 'customers')
    .replace(/\bPatient\b/g, 'Customer')
    .replace(/\bpatient\b/g, 'customer')
}

interface SubOutcomeDef {
  key: string
  label: string
  weight: number
  color: string
}

interface OutcomeDef {
  key: string
  label: string
  weight: number
  color: string
  subOutcomes: SubOutcomeDef[]
}

interface IndustryOutcomeConfig {
  resolvedOutcomes: OutcomeDef[]
  informationSubOutcomes: SubOutcomeDef[]
}

const SUB_COLORS = ['#1976d2', '#388e3c', '#4caf50', '#7e57c2', '#26a69a', '#5c6bc0', '#8d6e63']

const UNIVERSAL_NOT_RESOLVED: OutcomeDef[] = [
  {
    key: 'humanTransfer',
    label: 'Human transfer',
    weight: 10,
    color: '#ffa726',
    subOutcomes: [
      { key: 'callAttended', label: 'Call attended', weight: 6, color: '#8d6e63' },
      { key: 'callNotAttended', label: 'Call not attended', weight: 4, color: '#ef5350' },
    ],
  },
  {
    key: 'actionPending',
    label: 'Action pending',
    weight: 16,
    color: '#7e57c2',
    subOutcomes: [{ key: 'followUp', label: 'Follow up', weight: 16, color: '#ce93d8' }],
  },
  {
    key: 'incompleteInteraction',
    label: 'Incomplete interaction',
    weight: 4,
    color: '#ef5350',
    subOutcomes: [
      { key: 'callDisconnected', label: 'Call disconnected', weight: 2, color: '#e57373' },
      { key: 'abandoned', label: 'Abandoned', weight: 2, color: '#ef5350' },
    ],
  },
  {
    key: 'other',
    label: 'Other',
    weight: 3,
    color: '#78909c',
    subOutcomes: [
      { key: 'wrongNumbers', label: 'Wrong numbers', weight: 1, color: '#90a4ae' },
      { key: 'salesCalls', label: 'Sales calls', weight: 1, color: '#78909c' },
      { key: 'humanResources', label: 'Human resources', weight: 1, color: '#607d8b' },
    ],
  },
]

const HEALTHCARE_INFORMATION_SUBS: SubOutcomeDef[] = [
  { key: 'paymentBilling', label: 'Payment and billing', weight: 8, color: '#1976d2' },
  { key: 'insuranceCoverage', label: 'Insurance coverage', weight: 9, color: '#388e3c' },
  { key: 'treatmentRelated', label: 'Treatment related', weight: 10, color: '#4caf50' },
  { key: 'referrals', label: 'Referrals', weight: 6, color: '#7e57c2' },
  { key: 'generalEnquiry', label: 'General enquiry', weight: 7, color: '#26a69a' },
]

const INDUSTRY_INFORMATION_SUBS: Record<Exclude<FrontDeskIndustryId, 'healthcare'>, SubOutcomeDef[]> = {
  financial: [
    { key: 'consultationRelated', label: 'Consultation related', weight: 14, color: SUB_COLORS[0] },
    { key: 'accountBalanceInquiry', label: 'Account / balance inquiry', weight: 16, color: SUB_COLORS[1] },
    { key: 'productRateInfo', label: 'Product / rate info', weight: 18, color: SUB_COLORS[2] },
    { key: 'applicationStatus', label: 'Application status', weight: 12, color: SUB_COLORS[3] },
    { key: 'generalEnquiry', label: 'General enquiry', weight: 7, color: SUB_COLORS[4] },
  ],
  realEstate: [
    { key: 'listingPropertyInfo', label: 'Listing / property info', weight: 20, color: SUB_COLORS[0] },
    { key: 'pricingOfferInquiry', label: 'Pricing and offer inquiry', weight: 18, color: SUB_COLORS[1] },
    { key: 'applicationLeasingProcess', label: 'Application / leasing process', weight: 16, color: SUB_COLORS[2] },
    { key: 'generalEnquiry', label: 'General enquiry', weight: 13, color: SUB_COLORS[3] },
  ],
  storage: [
    { key: 'unitAvailabilityPricing', label: 'Unit availability and pricing', weight: 22, color: SUB_COLORS[0] },
    { key: 'paymentBilling', label: 'Payment and billing', weight: 18, color: SUB_COLORS[1] },
    { key: 'accessGateCode', label: 'Access / gate code', weight: 15, color: SUB_COLORS[2] },
    { key: 'generalEnquiry', label: 'General enquiry', weight: 12, color: SUB_COLORS[3] },
  ],
  restaurant: [
    { key: 'salesEnquiry', label: 'Sales enquiry', weight: 12, color: SUB_COLORS[0] },
    { key: 'serviceQuoteEstimate', label: 'Service quote / estimate', weight: 14, color: SUB_COLORS[1] },
    { key: 'warrantyInquiry', label: 'Warranty inquiry', weight: 10, color: SUB_COLORS[2] },
    { key: 'vehicleStatusUpdate', label: 'Vehicle status update', weight: 11, color: SUB_COLORS[3] },
    { key: 'partsAvailability', label: 'Parts availability', weight: 13, color: SUB_COLORS[4] },
    { key: 'generalEnquiry', label: 'General enquiry', weight: 7, color: SUB_COLORS[5] },
  ],
  homeService: [
    { key: 'salesEnquiry', label: 'Sales enquiry', weight: 14, color: SUB_COLORS[0] },
    { key: 'quoteEstimateRequest', label: 'Quote / estimate request', weight: 16, color: SUB_COLORS[1] },
    { key: 'serviceAreaAvailability', label: 'Service area / availability', weight: 15, color: SUB_COLORS[2] },
    { key: 'paymentBilling', label: 'Payment and billing', weight: 14, color: SUB_COLORS[3] },
    { key: 'generalEnquiry', label: 'General enquiry', weight: 8, color: SUB_COLORS[4] },
  ],
}

export function getSankeyOutcomeDefs(industry: FrontDeskIndustryId): OutcomeDef[] {
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  return [...resolvedOutcomes, ...UNIVERSAL_NOT_RESOLVED]
}

function getIndustryOutcomeConfig(industry: FrontDeskIndustryId): IndustryOutcomeConfig {
  if (industry === 'healthcare') {
    return {
      resolvedOutcomes: [
        { key: 'scheduled', label: 'Scheduled', weight: 14, color: '#81c784', subOutcomes: [] },
        { key: 'rescheduled', label: 'Rescheduled', weight: 9, color: '#66bb6a', subOutcomes: [] },
        { key: 'cancelled', label: 'Cancelled', weight: 4, color: '#ffb74d', subOutcomes: [] },
        {
          key: 'informationProvided',
          label: 'Information provided',
          weight: 40,
          color: '#26a69a',
          subOutcomes: HEALTHCARE_INFORMATION_SUBS,
        },
      ],
      informationSubOutcomes: HEALTHCARE_INFORMATION_SUBS,
    }
  }

  const informationSubOutcomes = INDUSTRY_INFORMATION_SUBS[industry]
  const infoWeight = informationSubOutcomes.reduce((sum, item) => sum + item.weight, 0)

  return {
    resolvedOutcomes: [
      {
        key: 'informationProvided',
        label: 'Information provided',
        weight: infoWeight,
        color: '#26a69a',
        subOutcomes: informationSubOutcomes,
      },
    ],
    informationSubOutcomes,
  }
}

function pctLabel(label: string, weight: number) {
  return `${label} (${weight}%)`
}

export function buildIndustryFunnel(industry: FrontDeskIndustryId) {
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  const nodes: SankeyNode[] = []
  const links: SankeyLink[] = []
  const nodeColors: Record<number, string> = {}

  const addNode = (name: string, color: string) => {
    const id = nodes.length
    nodes.push({ name })
    nodeColors[id] = color
    return id
  }

  const channelDefs = [
    { label: 'Call', pct: 60, color: '#1976d2', resolved: 40, notResolved: 20 },
    { label: 'Text', pct: 30, color: '#7e57c2', resolved: 20, notResolved: 10 },
    { label: 'Webchat', pct: 10, color: '#ce93d8', resolved: 7, notResolved: 3 },
  ]

  const channelIds = channelDefs.map((channel) => addNode(pctLabel(channel.label, channel.pct), channel.color))
  const resolvedStatusId = addNode(pctLabel('Resolved', 67), '#4cae3d')
  const notResolvedStatusId = addNode(pctLabel('Not resolved', 33), '#ef5350')

  channelDefs.forEach((channel, index) => {
    links.push({ source: channelIds[index], target: resolvedStatusId, value: channel.resolved })
    links.push({ source: channelIds[index], target: notResolvedStatusId, value: channel.notResolved })
  })

  const resolvedOutcomeIds = resolvedOutcomes.map((outcome) =>
    addNode(pctLabel(outcome.label, outcome.weight), outcome.color),
  )
  resolvedOutcomes.forEach((outcome, index) => {
    links.push({ source: resolvedStatusId, target: resolvedOutcomeIds[index], value: outcome.weight })
  })

  const notResolvedOutcomeIds = UNIVERSAL_NOT_RESOLVED.map((outcome) =>
    addNode(pctLabel(outcome.label, outcome.weight), outcome.color),
  )
  UNIVERSAL_NOT_RESOLVED.forEach((outcome, index) => {
    links.push({ source: notResolvedStatusId, target: notResolvedOutcomeIds[index], value: outcome.weight })
  })

  const allOutcomes = [...resolvedOutcomes, ...UNIVERSAL_NOT_RESOLVED]
  const allOutcomeIds = [...resolvedOutcomeIds, ...notResolvedOutcomeIds]

  allOutcomes.forEach((outcome, index) => {
    const outcomeId = allOutcomeIds[index]
    if (!outcome.subOutcomes.length) {
      const phantomId = addNode(`__phantom_${outcome.key}__`, outcome.color)
      links.push({ source: outcomeId, target: phantomId, value: outcome.weight })
      return
    }

    outcome.subOutcomes.forEach((subOutcome) => {
      const subId = addNode(pctLabel(subOutcome.label, subOutcome.weight), subOutcome.color)
      links.push({ source: outcomeId, target: subId, value: subOutcome.weight })
    })
  })

  return { nodes, links, nodeColors }
}

export interface SubOutcomeBreakdownRow {
  outcome: string
  total: number
  [key: string]: string | number
}

const OUTCOME_WORKING_HOURS_TREND_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const OUTCOME_WORKING_HOURS_MONTHLY_BASE = [6, 7, 8, 9, 9, 10]
const SUB_OUTCOME_BREAKDOWN_TOTAL = 1350

const OUTCOME_TREND_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const OUTCOME_TREND_TOTALS = [21, 23, 21, 24, 23, 27]

function getOutcomeKeys(industry: FrontDeskIndustryId) {
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  const resolvedKeys = resolvedOutcomes.map((outcome) => outcome.key)
  const notResolvedKeys = UNIVERSAL_NOT_RESOLVED.map((outcome) => outcome.key)
  return [...resolvedKeys, ...notResolvedKeys]
}

function getOutcomeWeights(industry: FrontDeskIndustryId) {
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  const weights: Record<string, number> = {}
  resolvedOutcomes.forEach((outcome) => {
    weights[outcome.key] = outcome.weight
  })
  UNIVERSAL_NOT_RESOLVED.forEach((outcome) => {
    weights[outcome.key] = outcome.weight
  })
  return weights
}

function splitByWeights(total: number, weights: Record<string, number>, keys: string[]) {
  const weightTotal = keys.reduce((sum, key) => sum + weights[key], 0)
  let assigned = 0
  const row: Record<string, number> = {}
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      row[key] = total - assigned
      return
    }
    const value = Math.round(total * weights[key] / weightTotal)
    row[key] = value
    assigned += value
  })
  return row
}

export function getOutcomeTrendSeries(industry: FrontDeskIndustryId): BarSeries[] {
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  const resolvedSeries = resolvedOutcomes.map((outcome) => ({
    key: outcome.key,
    label: outcome.label,
    color: outcome.color,
  }))
  const notResolvedSeries = UNIVERSAL_NOT_RESOLVED.map((outcome) => ({
    key: outcome.key,
    label: outcome.label,
    color: outcome.color,
  }))
  return [...resolvedSeries, ...notResolvedSeries]
}

export function getOutcomeTrendData(industry: FrontDeskIndustryId) {
  const keys = getOutcomeKeys(industry)
  const weights = getOutcomeWeights(industry)
  return OUTCOME_TREND_MONTHS.map((month, index) => ({
    month,
    ...splitByWeights(OUTCOME_TREND_TOTALS[index], weights, keys),
  }))
}

function splitWorkingHours(officeTotal: number, afterTotal: number, monthTotal: number) {
  if (monthTotal <= 0) return { officeHours: 0, afterHours: 0 }
  const afterRatio = afterTotal / (officeTotal + afterTotal)
  const afterHours = Math.min(monthTotal, Math.round(monthTotal * afterRatio))
  const officeHours = monthTotal - afterHours
  if (officeHours === 0 && monthTotal > 0) return { officeHours: monthTotal - 1, afterHours: 1 }
  return { officeHours, afterHours }
}

export function getOutcomeWorkingHoursBreakdown(industry: FrontDeskIndustryId) {
  return getSankeyOutcomeDefs(industry).map((outcome, index) => ({
    label: outcome.label,
    officeHours: Math.round(160 + outcome.weight * 7 + index * 14),
    afterHours: Math.round(8 + outcome.weight * 0.55),
  }))
}

export function getOutcomeTrendOptions(industry: FrontDeskIndustryId): string[] {
  return getSankeyOutcomeDefs(industry).map((outcome) => outcome.label)
}

export function buildOutcomeWorkingHoursTrend(industry: FrontDeskIndustryId, outcomeLabel: string) {
  const breakdown = getOutcomeWorkingHoursBreakdown(industry)
  const row = breakdown.find((entry) => entry.label === outcomeLabel) ?? breakdown[0]
  const outcome = getSankeyOutcomeDefs(industry).find((entry) => entry.label === outcomeLabel)
  const weight = outcome?.weight ?? 10

  return OUTCOME_WORKING_HOURS_TREND_MONTHS.map((month, index) => {
    const monthTotal = Math.max(2, Math.round(OUTCOME_WORKING_HOURS_MONTHLY_BASE[index] * weight / 10))
    const { officeHours, afterHours } = splitWorkingHours(row.officeHours, row.afterHours, monthTotal)
    return { month, officeHours, afterHours }
  })
}

export const SUB_OUTCOME_EMPTY_CELL = '—'

export function getSubOutcomeBreakdownColumns(industry: FrontDeskIndustryId): Column<SubOutcomeBreakdownRow>[] {
  const subOutcomeColumns = getAllSubOutcomes(industry).map((sub) => ({
    key: sub.key,
    label: sub.label,
    width: Math.max(96, Math.min(160, sub.label.length * 8)),
    sortable: true,
  }))

  return [
    { key: 'outcome', label: 'Outcome', width: 180, sortable: true, truncate: false },
    { key: 'total', label: 'Total', width: 72, sortable: true },
    ...subOutcomeColumns,
  ]
}

export function getSubOutcomeBreakdownData(industry: FrontDeskIndustryId): SubOutcomeBreakdownRow[] {
  const outcomes = getSankeyOutcomeDefs(industry)
  const allSubs = getAllSubOutcomes(industry)
  const weightTotal = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0)

  return outcomes.map((outcome) => {
    const total = Math.round(SUB_OUTCOME_BREAKDOWN_TOTAL * outcome.weight / weightTotal)
    const row: SubOutcomeBreakdownRow = { outcome: outcome.label, total }

    allSubs.forEach((sub) => {
      row[sub.key] = SUB_OUTCOME_EMPTY_CELL
    })

    if (outcome.subOutcomes.length) {
      distributeSubOutcomes(row, total, outcome.subOutcomes)
    }

    return row
  })
}

export interface LocationBreakdownRow {
  location: string
  total: number
  [key: string]: string | number
}

const BASE_LOCATION_ROWS: Array<{ location: string; total: number }> = [
  { location: 'North Clinic', total: 297 },
  { location: 'South Clinic', total: 257 },
  { location: 'Downtown Clinic', total: 230 },
  { location: 'East Clinic', total: 203 },
  { location: 'West Clinic', total: 189 },
  { location: 'Uptown Clinic', total: 176 },
]

function buildLocationOutcomeRows(industry: FrontDeskIndustryId): LocationBreakdownRow[] {
  const keys = getOutcomeKeys(industry)
  const weights = getOutcomeWeights(industry)
  return BASE_LOCATION_ROWS.map((row) => ({
    location: row.location,
    total: row.total,
    ...splitByWeights(row.total, weights, keys),
  }))
}

function getAllSubOutcomes(industry: FrontDeskIndustryId): SubOutcomeDef[] {
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  const infoSubs = resolvedOutcomes.find((outcome) => outcome.key === 'informationProvided')?.subOutcomes ?? []
  const universalSubs = UNIVERSAL_NOT_RESOLVED.flatMap((outcome) => outcome.subOutcomes)
  return [...infoSubs, ...universalSubs]
}

function distributeSubOutcomes(
  target: Record<string, string | number>,
  parentTotal: number,
  subs: SubOutcomeDef[],
) {
  if (!subs.length || parentTotal <= 0) return
  const weightTotal = subs.reduce((sum, sub) => sum + sub.weight, 0)
  let assigned = 0
  subs.forEach((sub, index) => {
    if (index === subs.length - 1) {
      target[sub.key] = parentTotal - assigned
      return
    }
    const value = Math.round(parentTotal * sub.weight / weightTotal)
    target[sub.key] = value
    assigned += value
  })
}

function buildLocationSubOutcomeRows(industry: FrontDeskIndustryId): LocationBreakdownRow[] {
  const outcomeRows = buildLocationOutcomeRows(industry)
  const { resolvedOutcomes } = getIndustryOutcomeConfig(industry)
  const infoOutcome = resolvedOutcomes.find((outcome) => outcome.key === 'informationProvided')

  return outcomeRows.map((row) => {
    const next: LocationBreakdownRow = { location: String(row.location), total: Number(row.total) }

    if (infoOutcome) {
      distributeSubOutcomes(next, Number(row.informationProvided ?? 0), infoOutcome.subOutcomes)
    }

    UNIVERSAL_NOT_RESOLVED.forEach((outcome) => {
      distributeSubOutcomes(next, Number(row[outcome.key] ?? 0), outcome.subOutcomes)
    })

    return next
  })
}

export function getLocationOutcomeColumns(industry: FrontDeskIndustryId): Column<LocationBreakdownRow>[] {
  const outcomeColumns = getOutcomeTrendSeries(industry).map((series) => ({
    key: series.key,
    label: series.label,
    width: Math.max(96, Math.min(156, series.label.length * 8)),
    sortable: true,
  }))

  return [
    { key: 'location', label: 'Location', width: 140, sortable: true },
    { key: 'total', label: 'Total', width: 72, sortable: true },
    ...outcomeColumns,
  ]
}

export function getLocationSubOutcomeColumns(industry: FrontDeskIndustryId): Column<LocationBreakdownRow>[] {
  const subOutcomes = getAllSubOutcomes(industry)
  const subColumns = subOutcomes.map((sub) => ({
    key: sub.key,
    label: sub.label,
    width: Math.max(96, Math.min(156, sub.label.length * 8)),
    sortable: true,
  }))

  return [
    { key: 'location', label: 'Location', width: 140, sortable: true },
    { key: 'total', label: 'Total', width: 72, sortable: true },
    ...subColumns,
  ]
}

export function getLocationBreakdownForIndustry(
  industry: FrontDeskIndustryId,
  dimension: string,
): { columns: Column<LocationBreakdownRow>[]; data: LocationBreakdownRow[] } {
  switch (dimension) {
    case 'Channel': {
      const data = buildLocationOutcomeRows(industry).map((row) => {
        const call = Math.round(row.total * 0.6)
        const text = Math.round(row.total * 0.3)
        return { location: row.location, total: row.total, call, text, webchat: row.total - call - text }
      })
      return {
        columns: [
          { key: 'location', label: 'Location', width: 140, sortable: true },
          { key: 'total', label: 'Total', width: 72, sortable: true },
          { key: 'call', label: 'Call', width: 72, sortable: true },
          { key: 'text', label: 'Text', width: 72, sortable: true },
          { key: 'webchat', label: 'Webchat', width: 88, sortable: true },
        ],
        data,
      }
    }
    case 'Status': {
      const data = buildLocationOutcomeRows(industry).map((row) => {
        const resolved = Math.round(row.total * 0.67)
        return { location: row.location, total: row.total, resolved, notResolved: row.total - resolved }
      })
      return {
        columns: [
          { key: 'location', label: 'Location', width: 140, sortable: true },
          { key: 'total', label: 'Total', width: 72, sortable: true },
          { key: 'resolved', label: 'Resolved', width: 96, sortable: true },
          { key: 'notResolved', label: 'Not resolved', width: 120, sortable: true },
        ],
        data,
      }
    }
    case 'Sub-outcomes':
      return {
        columns: getLocationSubOutcomeColumns(industry),
        data: buildLocationSubOutcomeRows(industry),
      }
    default:
      return {
        columns: getLocationOutcomeColumns(industry),
        data: buildLocationOutcomeRows(industry),
      }
  }
}

export function getIndustryOutcomeLabels(industry: FrontDeskIndustryId) {
  const { resolvedOutcomes, informationSubOutcomes } = getIndustryOutcomeConfig(industry)
  return {
    resolvedOutcomes: resolvedOutcomes.map((outcome) => outcome.label),
    informationSubOutcomes: informationSubOutcomes.map((sub) => sub.label),
    notResolvedOutcomes: UNIVERSAL_NOT_RESOLVED.map((outcome) => outcome.label),
  }
}
