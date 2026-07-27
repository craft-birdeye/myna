export interface HealthcareIntegration {
  id: string
  iconBg: string
  iconLabel: string
  name: string
  description: string
}

export const HEALTHCARE_INTEGRATION_CATALOG: HealthcareIntegration[] = [
  {
    id: 'allscripts',
    iconBg: '#E87722',
    iconLabel: 'A',
    name: 'Allscripts',
    description: 'Sync patient records and appointments from Allscripts EHR.',
  },
  {
    id: 'epic',
    iconBg: '#C8102E',
    iconLabel: 'E',
    name: 'Epic',
    description: 'Connect to Epic to manage patient charts and scheduling.',
  },
  {
    id: 'cerner',
    iconBg: '#005A9C',
    iconLabel: 'C',
    name: 'Cerner',
    description: 'Access Cerner patient data and appointment workflows.',
  },
  {
    id: 'ecw',
    iconBg: '#1B3A6B',
    iconLabel: 'ECW',
    name: 'ECW',
    description: 'Schedule and manage appointments in eClinicalWorks.',
  },
  {
    id: 'athena',
    iconBg: '#0B7A75',
    iconLabel: 'A',
    name: 'Athena health',
    description: 'Sync appointments and patient demographics from Athenahealth.',
  },
  {
    id: 'drchrono',
    iconBg: '#F47B20',
    iconLabel: 'Dr',
    name: 'Dr Chrono',
    description: 'Pull patient intake and scheduling data from DrChrono.',
  },
  {
    id: 'nexttech',
    iconBg: '#6BBF4B',
    iconLabel: 'N',
    name: 'NextTech',
    description: 'Integrate NextTech practice management and EHR records.',
  },
]

/** Integrations connected at the account level (multiple allowed). */
export const DEFAULT_ACCOUNT_CONNECTED_INTEGRATION_IDS = ['allscripts', 'epic', 'athena', 'ecw']

/** All catalog integrations shown as connected in the new-agent setup wizard. */
export const DEFAULT_WIZARD_CONNECTED_INTEGRATION_IDS = HEALTHCARE_INTEGRATION_CATALOG.map(
  (item) => item.id,
)

/** Single integration selected for the front desk agent. */
export const DEFAULT_AGENT_SELECTED_INTEGRATION_ID = 'allscripts'

export function getHealthcareIntegration(id: string): HealthcareIntegration | undefined {
  return HEALTHCARE_INTEGRATION_CATALOG.find((item) => item.id === id)
}
