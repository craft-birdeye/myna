import { useMemo, useState } from 'react'
import {
  Chip,
  CustomizeColumnsDrawer,
  DataTable,
  FilterPanel,
  HeaderSearchField,
  Icon,
  MessageDrawer,
  PatientCell,
  QuickSendModal,
  QuickViewDrawer,
  SendReminderDrawer,
  ViewActivityDrawer,
  Tabs,
  TopNav,
  type ChipProps,
  type Column,
  type ColumnOption,
  type FilterField,
  type PatientDetail,
} from '../components'
import iconInbox from '../assets/icon-inbox.svg'
import iconMail from '../assets/icon-mail.svg'

export interface IntakePatient {
  patient: string
  location: string
  appointmentDate: string
  bookedOn: string
  formType: string
  sentVia: string
  sentOn: string
  status: string
  [key: string]: string
}

export interface IntakeDetailArgs {
  detail: PatientDetail
  row: IntakePatient
  appointmentTime?: string
  appointmentType?: string
  insuranceProvider?: string
  fromTabLabel?: string
}

const TABS = [
  { id: 'overdue',     label: 'Overdue',     count: 11 },
  { id: 'not-started', label: 'Not started', count: 13 },
  { id: 'in-progress', label: 'In progress', count: 6  },
  { id: 'completed',   label: 'Completed',   count: 4  },
  { id: 'all',         label: 'All',         count: 32 },
]

const TAB_STATUS_MAP: Record<string, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  'completed':   'Completed',
}

const TODAY_DATE = 'May 27'

function parseIntakeDate(appointmentDate: string): number {
  const t = new Date(`${appointmentDate}, 2026`).getTime()
  return Number.isNaN(t) ? 0 : t
}

const PATIENTS: IntakePatient[] = [
  { patient: 'John Smith',          location: 'Atlanta, GA',      appointmentDate: 'May 27', bookedOn: 'Apr 10', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Alice Johnson',       location: 'Austin, TX',       appointmentDate: 'May 27', bookedOn: 'Apr 12', formType: 'Follow-up',   sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Robert Williams',     location: 'Charlotte, NC',    appointmentDate: 'May 27', bookedOn: 'Apr 15', formType: 'Referral',    sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Mary Brown',          location: 'Phoenix, AZ',      appointmentDate: 'May 27', bookedOn: 'Apr 18', formType: 'New patient', sentVia: 'email', sentOn: 'May 20', status: 'Not started' },
  { patient: 'Michael Davis',       location: 'Denver, CO',       appointmentDate: 'May 27', bookedOn: 'Apr 20', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Jennifer Wilson',     location: 'Seattle, WA',      appointmentDate: 'May 27', bookedOn: 'Apr 22', formType: 'Referral',    sentVia: 'email', sentOn: 'May 20', status: 'Not started' },
  { patient: 'David Garcia',        location: 'San Antonio, TX',  appointmentDate: 'May 27', bookedOn: 'Apr 25', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Linda Rodriguez',     location: 'Houston, TX',      appointmentDate: 'May 27', bookedOn: 'Apr 28', formType: 'Referral',    sentVia: 'email', sentOn: 'May 20', status: 'Not started' },
  { patient: 'Christopher Martinez',location: 'Las Vegas, NV',    appointmentDate: 'May 27', bookedOn: 'May 01', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Angela Anderson',     location: 'Portland, OR',     appointmentDate: 'May 27', bookedOn: 'May 03', formType: 'Follow-up',   sentVia: 'email', sentOn: 'May 20', status: 'Not started' },
  { patient: 'Thomas Taylor',       location: 'Nashville, TN',    appointmentDate: 'May 27', bookedOn: 'May 05', formType: 'Text/Number', sentVia: 'sms',   sentOn: 'May 20', status: 'Not started' },
  { patient: 'Sarah Moore',         location: 'Minneapolis, MN',  appointmentDate: 'May 28', bookedOn: 'Apr 14', formType: 'New patient', sentVia: 'email', sentOn: 'May 21', status: 'Not started' },
  { patient: 'Kevin Jackson',       location: 'Columbus, OH',     appointmentDate: 'May 28', bookedOn: 'Apr 16', formType: 'Follow-up',   sentVia: 'sms',   sentOn: 'May 21', status: 'Not started' },
  { patient: 'Emily White',         location: 'Chicago, IL',      appointmentDate: 'May 28', bookedOn: 'Apr 18', formType: 'Referral',    sentVia: 'email', sentOn: 'May 21', status: 'In progress' },
  { patient: 'James Harris',        location: 'Miami, FL',        appointmentDate: 'May 28', bookedOn: 'Apr 20', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 21', status: 'In progress' },
  { patient: 'Patricia Clark',      location: 'Baltimore, MD',    appointmentDate: 'May 29', bookedOn: 'Apr 22', formType: 'Follow-up',   sentVia: 'email', sentOn: 'May 22', status: 'In progress' },
  { patient: 'Daniel Lewis',        location: 'Indianapolis, IN', appointmentDate: 'May 29', bookedOn: 'Apr 24', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 22', status: 'In progress' },
  { patient: 'Nancy Robinson',      location: 'Louisville, KY',   appointmentDate: 'May 29', bookedOn: 'Apr 26', formType: 'Text/Number', sentVia: 'email', sentOn: 'May 22', status: 'In progress' },
  { patient: 'Mark Walker',         location: 'Memphis, TN',      appointmentDate: 'May 30', bookedOn: 'Apr 28', formType: 'Referral',    sentVia: 'sms',   sentOn: 'May 23', status: 'In progress' },
  { patient: 'Betty Hall',          location: 'Dallas, TX',       appointmentDate: 'May 30', bookedOn: 'Apr 30', formType: 'New patient', sentVia: 'email', sentOn: 'May 23', status: 'Completed' },
  { patient: 'Steven Allen',        location: 'Oklahoma City, OK',appointmentDate: 'May 30', bookedOn: 'May 02', formType: 'Follow-up',   sentVia: 'sms',   sentOn: 'May 23', status: 'Completed' },
  { patient: 'Sandra Young',        location: 'Albuquerque, NM',  appointmentDate: 'May 31', bookedOn: 'May 04', formType: 'Referral',    sentVia: 'email', sentOn: 'May 24', status: 'Completed' },
  { patient: 'Joseph Hernandez',    location: 'El Paso, TX',      appointmentDate: 'May 31', bookedOn: 'May 06', formType: 'New patient', sentVia: 'sms',   sentOn: 'May 24', status: 'Completed' },
]

interface ColumnDef extends Column<IntakePatient> {
  locked?: boolean
}

const COLUMN_DEFS: ColumnDef[] = [
  {
    key: 'patient',
    label: 'Patient',
    width: 220,
    sortable: true,
    locked: true,
    render: (_val, row) => <PatientCell name={row.patient} location={row.location} />,
  },
  {
    key: 'appointmentDate',
    label: 'Appointment time',
    width: 200,
    sortable: true,
    render: (val, row) => {
      const time = PATIENT_DETAILS[row.patient]?.appointmentTime
      return <>{time ? `${val}, ${time}` : val}</>
    },
  },
  { key: 'formType',        label: 'Form type',         width: 180, sortable: true  },
  {
    key: 'sentVia',
    label: 'Sent via',
    width: 120,
    sortable: false,
    render: (val) => (
      <img
        src={val === 'sms' ? iconInbox : iconMail}
        alt={val === 'sms' ? 'SMS' : 'Email'}
        className="size-5"
      />
    ),
  },
  { key: 'sentOn', label: 'Sent on', width: 160, sortable: true },
]

const STATUS_CHIP_VARIANT: Record<string, ChipProps['variant']> = {
  'Completed':   'success',
  'In progress': 'warning',
  'Not started': 'neutral',
}

const STATUS_COLUMN: ColumnDef = {
  key: 'status',
  label: 'Status',
  width: 160,
  sortable: true,
  render: (val) => (
    <Chip label={val as string} variant={STATUS_CHIP_VARIANT[val as string] ?? 'neutral'} />
  ),
}

const DEFAULT_ORDER   = COLUMN_DEFS.map((c) => String(c.key))
const DEFAULT_VISIBLE = ['patient', 'appointmentDate', 'formType', 'sentVia', 'sentOn']
const DEF_BY_KEY      = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'form-type', label: 'Form type', options: opts('New patient', 'Follow-up', 'Referral', 'Text/Number'), multi: true },
  { id: 'status',    label: 'Status',    options: opts('Not started', 'In progress', 'Completed'),             multi: true },
  { id: 'sent-via',  label: 'Sent via',  options: opts('SMS', 'Email') },
  { id: 'provider',  label: 'Provider',  options: opts('Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Garcia'), multi: true },
]

// Keyed by patient name — merged with row data when Quick view is opened
const PATIENT_DETAILS: Partial<Record<string, Omit<PatientDetail, 'patient' | 'status'>>> = {
  'John Smith': {
    phone: '+1 (555) 123-4567', email: 'john.smith@gmail.com', dateOfBirth: 'Mar 15, 1998',
    insuranceProvider: 'Aetna', insuranceName: 'Aetna PPO Gold',
    appointmentType: 'New consult', appointmentTime: '10:30 AM', location: 'Atlanta, GA',
    questionText: 'I have been experiencing headaches for the past week',
  },
  'Betty Hall': {
    age: '45 years', gender: 'Female', phone: '+1 (555) 234-5678', email: 'betty.hall@gmail.com',
    dateOfBirth: 'Jun 12, 1981', insuranceName: 'Aetna PPO Gold',
    appointmentType: 'Follow-up', appointmentTime: '02:00 PM', location: 'Dallas, TX',
    questionText: 'Follow-up for blood pressure management',
    emergencyContact: 'Tom Hall', emergencyRelationship: 'Husband', emergencyPhone: '+1 (555) 234-5679', emergencyEmail: 'tom.hall@gmail.com',
    insuranceProvider: 'Aetna', memberId: 'AET-9823714', groupNumber: 'GRP-00147',
    consentTreatment: 'Accepted', consentHipaa: 'Accepted', consentFinancial: 'Accepted',
    medications: [{ name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily' }, { name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once daily at night' }],
    drugAllergies: [{ medicine: 'Penicillin', reaction: 'Hives' }],
    nonDrugAllergies: [{ allergen: 'Pollen', reaction: 'Sneezing, itchy eyes' }],
    preferredPharmacy: 'CVS Pharmacy – Main St',
    medicalConditions: ['Hypertension', 'High cholesterol'],
    surgicalHistory: [{ procedure: 'Appendectomy', year: '2010' }],
    familyHistory: [{ condition: 'Heart disease', relation: 'Father' }, { condition: 'Type 2 Diabetes', relation: 'Mother' }],
    hospitalizations: [{ condition: 'Pneumonia', year: '2018' }],
    tobacco: 'No', alcohol: 'Occasionally · 1–2 drinks/week', drugUsage: 'No', exercise: '3–4 times/week',
    aiSummary: ['Intake form completed on May 23, 2026.', 'All sections filled in: basic details, insurance, consent, medical history, and social history.'],
  },
  'Emily White': {
    age: '28 years', gender: 'Female', phone: '+1 (555) 876-5432', email: 'emily.white@gmail.com',
    dateOfBirth: 'Sep 22, 1997', insuranceName: 'UnitedHealth Choice Plus',
    appointmentType: 'Annual physical', appointmentTime: '09:00 AM', location: 'Chicago, IL',
    questionText: 'Annual checkup and flu shot',
    emergencyContact: 'Jake White', emergencyRelationship: 'Brother', emergencyPhone: '+1 (555) 876-5433', emergencyEmail: 'jake.white@gmail.com',
    consentTreatment: 'Accepted', consentHipaa: 'Accepted', consentFinancial: 'Accepted',
    tobacco: 'No', alcohol: 'No', drugUsage: 'No', exercise: 'Daily',
    aiSummary: ['Patient is in progress. Basic details, consent, and social history are complete.', 'Insurance and medical history sections are pending.'],
  },
  'Alice Johnson': {
    age: '34 years', gender: 'Female', phone: '+1 (555) 987-6543', email: 'alice.johnson@gmail.com',
    dateOfBirth: 'Feb 14, 1992', insuranceProvider: 'Cigna', insuranceName: 'Cigna Open Access Plus',
    appointmentType: 'Follow-up', appointmentTime: '11:00 AM', location: 'Austin, TX',
    questionText: 'Follow-up on allergy test results',
  },
  'Robert Williams': {
    age: '47 years', gender: 'Male', phone: '+1 (555) 321-0987', email: 'robert.williams@gmail.com',
    dateOfBirth: 'Jul 30, 1978', insuranceProvider: 'UnitedHealthcare', insuranceName: 'UnitedHealth Choice Plus',
    appointmentType: 'Referral consultation', appointmentTime: '01:30 PM', location: 'Charlotte, NC',
    questionText: 'Referred by Dr. Patel for chest pain evaluation',
  },
  'Mary Brown': {
    age: '61 years', gender: 'Female', phone: '+1 (555) 456-7890', email: 'mary.brown@gmail.com',
    dateOfBirth: 'Oct 05, 1964', insuranceProvider: 'Humana', insuranceName: 'Humana Gold Plus',
    appointmentType: 'New consult', appointmentTime: '09:30 AM', location: 'Phoenix, AZ',
    questionText: 'Experiencing joint pain in both knees',
  },
  'Michael Davis': {
    age: '29 years', gender: 'Male', phone: '+1 (555) 654-3210', email: 'michael.davis@gmail.com',
    dateOfBirth: 'Apr 22, 1997', insuranceProvider: 'Aetna', insuranceName: 'Aetna HMO Select',
    appointmentType: 'Annual physical', appointmentTime: '08:00 AM', location: 'Denver, CO',
    questionText: 'Routine annual checkup',
  },
  'Jennifer Wilson': {
    age: '38 years', gender: 'Female', phone: '+1 (555) 789-0123', email: 'jennifer.wilson@gmail.com',
    dateOfBirth: 'Nov 19, 1987', insuranceProvider: 'Blue Cross Blue Shield', insuranceName: 'BCBS Blue Advantage',
    appointmentType: 'Referral consultation', appointmentTime: '03:00 PM', location: 'Seattle, WA',
    questionText: 'Referred for dermatology consult — persistent rash',
  },
  'David Garcia': {
    age: '55 years', gender: 'Male', phone: '+1 (555) 012-3456', email: 'david.garcia@gmail.com',
    dateOfBirth: 'May 08, 1971', insuranceProvider: 'Cigna', insuranceName: 'Cigna PPO Plus',
    appointmentType: 'Procedure', appointmentTime: '07:30 AM', location: 'San Antonio, TX',
    questionText: 'Colonoscopy pre-procedure consultation',
  },
  'Linda Rodriguez': {
    age: '44 years', gender: 'Female', phone: '+1 (555) 135-7924', email: 'linda.rodriguez@gmail.com',
    dateOfBirth: 'Dec 01, 1981', insuranceProvider: 'UnitedHealthcare', insuranceName: 'UnitedHealth Navigate',
    appointmentType: 'Referral consultation', appointmentTime: '02:30 PM', location: 'Houston, TX',
    questionText: 'Referred by OB-GYN for pelvic pain assessment',
  },
  'Christopher Martinez': {
    age: '33 years', gender: 'Male', phone: '+1 (555) 246-8013', email: 'c.martinez@gmail.com',
    dateOfBirth: 'Aug 16, 1992', insuranceProvider: 'Humana', insuranceName: 'Humana Preferred PPO',
    appointmentType: 'New consult', appointmentTime: '10:00 AM', location: 'Las Vegas, NV',
    questionText: 'Chronic migraines — seeking neurological evaluation',
  },
  'Angela Anderson': {
    age: '51 years', gender: 'Female', phone: '+1 (555) 369-2580', email: 'angela.anderson@gmail.com',
    dateOfBirth: 'Mar 27, 1975', insuranceProvider: 'Aetna', insuranceName: 'Aetna Choice POS II',
    appointmentType: 'Follow-up', appointmentTime: '04:00 PM', location: 'Portland, OR',
    questionText: 'Follow-up on thyroid medication dosage',
  },
  'Thomas Taylor': {
    age: '67 years', gender: 'Male', phone: '+1 (555) 482-1597', email: 'thomas.taylor@gmail.com',
    dateOfBirth: 'Jan 14, 1959', insuranceProvider: 'Medicare', insuranceName: 'Medicare Advantage Plan',
    appointmentType: 'Annual physical', appointmentTime: '09:00 AM', location: 'Nashville, TN',
    questionText: 'Annual wellness visit and medication review',
  },
  'Sarah Moore': {
    age: '26 years', gender: 'Female', phone: '+1 (555) 591-3748', email: 'sarah.moore@gmail.com',
    dateOfBirth: 'Jun 09, 2000', insuranceProvider: 'Blue Cross Blue Shield', insuranceName: 'BCBS PPO Bronze',
    appointmentType: 'New consult', appointmentTime: '11:30 AM', location: 'Minneapolis, MN',
    questionText: 'Seeking evaluation for anxiety and sleep issues',
  },
  'Kevin Jackson': {
    age: '40 years', gender: 'Male', phone: '+1 (555) 604-8261', email: 'kevin.jackson@gmail.com',
    dateOfBirth: 'Sep 03, 1985', insuranceProvider: 'Cigna', insuranceName: 'Cigna Flex Select',
    appointmentType: 'Follow-up', appointmentTime: '01:00 PM', location: 'Columbus, OH',
    questionText: 'Follow-up after recent ER visit for back pain',
  },
  'James Harris': {
    age: '52 years', gender: 'Male', phone: '+1 (555) 345-6789', email: 'james.harris@gmail.com',
    dateOfBirth: 'Jan 08, 1974', insuranceName: 'BCBS Preferred',
    appointmentType: 'Procedure', appointmentTime: '11:00 AM', location: 'Miami, FL',
    questionText: 'Knee replacement consultation',
    insuranceProvider: 'Blue Cross Blue Shield', memberId: 'BCBS-4412839', groupNumber: 'GRP-00482',
    aiSummary: ['Patient has started the form. Insurance section is complete.', 'Basic details, consent, medical history, and social history are pending.'],
  },
  'Patricia Clark': {
    age: '48 years', gender: 'Female', phone: '+1 (555) 713-4826', email: 'patricia.clark@gmail.com',
    dateOfBirth: 'Feb 28, 1978', insuranceProvider: 'Aetna', insuranceName: 'Aetna PPO Silver',
    appointmentType: 'Follow-up', appointmentTime: '10:30 AM', location: 'Baltimore, MD',
    questionText: 'Follow-up on diabetes management and A1C results',
  },
  'Daniel Lewis': {
    age: '36 years', gender: 'Male', phone: '+1 (555) 824-9371', email: 'daniel.lewis@gmail.com',
    dateOfBirth: 'Jul 17, 1989', insuranceProvider: 'UnitedHealthcare', insuranceName: 'UnitedHealth Select Plus',
    appointmentType: 'New consult', appointmentTime: '02:00 PM', location: 'Indianapolis, IN',
    questionText: 'New patient — recurring lower back pain',
  },
  'Nancy Robinson': {
    age: '59 years', gender: 'Female', phone: '+1 (555) 935-0284', email: 'nancy.robinson@gmail.com',
    dateOfBirth: 'Nov 11, 1966', insuranceProvider: 'Humana', insuranceName: 'Humana Value PPO',
    appointmentType: 'Annual physical', appointmentTime: '08:30 AM', location: 'Louisville, KY',
    questionText: 'Annual physical and bone density screening',
  },
  'Mark Walker': {
    age: '43 years', gender: 'Male', phone: '+1 (555) 046-1735', email: 'mark.walker@gmail.com',
    dateOfBirth: 'Apr 03, 1983', insuranceProvider: 'Cigna', insuranceName: 'Cigna Healthspring Select',
    appointmentType: 'Referral consultation', appointmentTime: '03:30 PM', location: 'Memphis, TN',
    questionText: 'Referred by cardiologist for stress test',
  },
  'Steven Allen': {
    age: '31 years', gender: 'Male', phone: '+1 (555) 157-2846', email: 'steven.allen@gmail.com',
    dateOfBirth: 'Sep 25, 1994', insuranceProvider: 'Blue Cross Blue Shield', insuranceName: 'BCBS HMO Blue',
    appointmentType: 'Follow-up', appointmentTime: '12:00 PM', location: 'Oklahoma City, OK',
    questionText: 'Post-operative follow-up after shoulder surgery',
  },
  'Sandra Young': {
    age: '53 years', gender: 'Female', phone: '+1 (555) 268-3957', email: 'sandra.young@gmail.com',
    dateOfBirth: 'Jan 30, 1973', insuranceProvider: 'Aetna', insuranceName: 'Aetna Value HMO',
    appointmentType: 'Referral consultation', appointmentTime: '01:30 PM', location: 'Albuquerque, NM',
    questionText: 'Referred for endocrinology consult — thyroid nodule',
  },
  'Joseph Hernandez': {
    age: '62 years', gender: 'Male', phone: '+1 (555) 379-4068', email: 'j.hernandez@gmail.com',
    dateOfBirth: 'Jun 21, 1963', insuranceProvider: 'Medicare', insuranceName: 'Medicare Supplement Plan G',
    appointmentType: 'Procedure', appointmentTime: '07:00 AM', location: 'El Paso, TX',
    questionText: 'Pre-op clearance for hernia repair surgery',
  },
}

export function IntakeScreen({ onViewDetail: _onViewDetail }: { onViewDetail?: (args: IntakeDetailArgs) => void } = {}) {
  const [activeTab, setActiveTab] = useState('overdue')
  const [order, setOrder]         = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible]     = useState<string[]>(DEFAULT_VISIBLE)
  const [customizeOpen, setCustomizeOpen]         = useState(false)
  const [searchOpen, setSearchOpen]               = useState(false)
  const [searchQuery, setSearchQuery]             = useState('')
  const [filterOpen, setFilterOpen]               = useState(false)
  const [quickViewPatient, setQuickViewPatient]   = useState<PatientDetail | null>(null)
  const [quickViewRow, setQuickViewRow]             = useState<IntakePatient | null>(null)
  const [activityRow, setActivityRow]               = useState<IntakePatient | null>(null)
  const [sendReminderRow, setSendReminderRow]         = useState<IntakePatient | null>(null)
  const [quickSendRow, setQuickSendRow]               = useState<IntakePatient | null>(null)
  const [messagingRow, setMessagingRow]               = useState<IntakePatient | null>(null)
  const [messagingChannel, setMessagingChannel]       = useState<'message' | 'email'>('message')

  const columns = useMemo<Column<IntakePatient>[]>(() => {
    const base = order
      .filter((k) => visible.includes(k))
      .map((k) => DEF_BY_KEY.get(k))
      .filter((c): c is ColumnDef => Boolean(c))

    if (activeTab === 'all') {
      const idx = base.findIndex((c) => c.key === 'formType')
      const insert = idx !== -1 ? idx + 1 : base.length
      return [...base.slice(0, insert), STATUS_COLUMN, ...base.slice(insert)]
    }
    return base
  }, [order, visible, activeTab])

  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  const filteredData = useMemo(() => {
    const byTab = activeTab === 'all'
      ? PATIENTS
      : activeTab === 'overdue'
        ? PATIENTS.filter((r) => r.appointmentDate === TODAY_DATE)
        : PATIENTS.filter((r) => r.status === TAB_STATUS_MAP[activeTab])
    const q = searchQuery.trim().toLowerCase()
    const matched = q ? byTab.filter((r) => r.patient.toLowerCase().includes(q)) : byTab
    return [...matched].sort((a, b) => parseIntakeDate(a.appointmentDate) - parseIntakeDate(b.appointmentDate))
  }, [activeTab, searchQuery])

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <div className="flex items-center gap-sm">
              <h1 className="text-h3 text-text-primary">Manage intake</h1>
            </div>
            <div className="flex items-center gap-sm">
              <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
              <button
                type="button"
                aria-label="Customize columns"
                onClick={() => setCustomizeOpen(true)}
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="view_column" size={20} />
              </button>
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((o) => !o)}
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          </div>

          <div className="px-2xl">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="px-lg py-lg">
            <DataTable
              rowHeight={56}
              columns={columns}
              data={filteredData}
              rowAction={{
                icon: 'notifications',
                label: 'Send reminder',
                onClick: (row) => setSendReminderRow(row),
              }}
              rowMenuItems={[
                { label: 'Quick send', onClick: (row) => setQuickSendRow(row) },
                {
                  label: 'Quick view',
                  onClick: (row) => {
                    const detail = PATIENT_DETAILS[row.patient] ?? {}
                    setQuickViewRow(row)
                    setQuickViewPatient({ patient: row.patient, status: activeTab === 'overdue' ? 'Overdue' : row.status, appointmentDate: row.appointmentDate, bookedOn: row.bookedOn, sentOn: row.sentOn, ...detail })
                  },
                },
                { label: 'View activity',  onClick: (row) => setActivityRow(row) },
              ]}
            />
          </div>
        </div>

        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>

      <CustomizeColumnsDrawer
        open={customizeOpen}
        options={columnOptions}
        visibleKeys={visible}
        onClose={() => setCustomizeOpen(false)}
        onSave={(orderedKeys, visibleKeys) => {
          setOrder(orderedKeys)
          setVisible(visibleKeys)
        }}
        onRestoreDefault={() => {
          setOrder(DEFAULT_ORDER)
          setVisible(DEFAULT_VISIBLE)
        }}
      />

      <QuickViewDrawer
        open={!!quickViewPatient}
        patient={quickViewPatient}
        onClose={() => { setQuickViewPatient(null); setQuickViewRow(null) }}
        onViewDetails={() => {
          if (!quickViewPatient || !quickViewRow) return
          setQuickViewPatient(null)
          setQuickViewRow(null)
          _onViewDetail?.({
            detail: quickViewPatient,
            row: quickViewRow,
            appointmentTime: PATIENT_DETAILS[quickViewRow.patient]?.appointmentTime,
            appointmentType: PATIENT_DETAILS[quickViewRow.patient]?.appointmentType ?? 'Consultation',
            insuranceProvider: PATIENT_DETAILS[quickViewRow.patient]?.insuranceProvider,
            fromTabLabel: TABS.find(t => t.id === activeTab)?.label,
          })
        }}
        onQuickSend={() => {
          setQuickSendRow(quickViewRow)
          setQuickViewPatient(null)
          setQuickViewRow(null)
        }}
        onMessage={() => {
          setMessagingChannel('message')
          setMessagingRow(quickViewRow)
          setQuickViewPatient(null)
          setQuickViewRow(null)
        }}
        onEmail={() => {
          setMessagingChannel('email')
          setMessagingRow(quickViewRow)
          setQuickViewPatient(null)
          setQuickViewRow(null)
        }}
      />

      <QuickSendModal
        open={quickSendRow !== null}
        patient={quickSendRow?.patient ?? ''}
        email={quickSendRow ? PATIENT_DETAILS[quickSendRow.patient]?.email : undefined}
        onClose={() => setQuickSendRow(null)}
      />

      <MessageDrawer
        open={messagingRow !== null}
        patient={messagingRow?.patient ?? ''}
        status={messagingRow?.status}
        initialChannel={messagingChannel}
        onClose={() => setMessagingRow(null)}
      />

      <SendReminderDrawer
        open={!!sendReminderRow}
        patientName={sendReminderRow?.patient}
        appointmentDate={sendReminderRow?.appointmentDate}
        appointmentTime={sendReminderRow ? (PATIENT_DETAILS[sendReminderRow.patient]?.appointmentTime) : undefined}
        onClose={() => setSendReminderRow(null)}
        onSend={() => setSendReminderRow(null)} // prototype: send payload not consumed
      />

      <ViewActivityDrawer
        open={!!activityRow}
        patient={activityRow?.patient ?? ''}
        appointmentDate={activityRow?.appointmentDate}
        appointmentTime={PATIENT_DETAILS[activityRow?.patient ?? '']?.appointmentTime}
        appointmentType={PATIENT_DETAILS[activityRow?.patient ?? '']?.appointmentType ?? 'Consultation'}
        formType={activityRow?.formType}
        status={activeTab === 'overdue' ? 'Overdue' : activityRow?.status}
        bookedOn={activityRow?.bookedOn}
        insuranceProvider={PATIENT_DETAILS[activityRow?.patient ?? '']?.insuranceProvider}
        sentVia={activityRow?.sentVia}
        onClose={() => setActivityRow(null)}
        onViewAllDetails={() => {
          if (!activityRow) return
          const extra = PATIENT_DETAILS[activityRow.patient] ?? {}
          setActivityRow(null)
          _onViewDetail?.({
            detail: { patient: activityRow.patient, status: activeTab === 'overdue' ? 'Overdue' : activityRow.status, appointmentDate: activityRow.appointmentDate, bookedOn: activityRow.bookedOn, sentOn: activityRow.sentOn, ...extra },
            row: activityRow,
            appointmentTime: PATIENT_DETAILS[activityRow.patient]?.appointmentTime,
            appointmentType: PATIENT_DETAILS[activityRow.patient]?.appointmentType ?? 'Consultation',
            insuranceProvider: PATIENT_DETAILS[activityRow.patient]?.insuranceProvider,
            fromTabLabel: TABS.find(t => t.id === activeTab)?.label,
          })
        }}
      />
    </div>
  )
}
