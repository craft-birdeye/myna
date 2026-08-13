// Booking templates — the shared, reusable form-fields/services/providers unit that both
// front-desk agents and appointment widgets inherit from. A widget carries its own
// appearance/URL/embed settings; a template carries none of that — see CLAUDE.md §5.

import { APPOINTMENT_TYPES } from './appointmentTypesData'

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'multiple-choice'

export const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multiple-choice', label: 'Multiple choice' },
]

export interface TemplateField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  /** Seeded default fields (First name, Email, …) can't be removed; user-added fields can. */
  system?: boolean
}

export interface FieldGroup {
  id: string
  name: string
  /** Appointment type ids this group's extra fields apply to. */
  mappedServiceIds: string[]
  extraFields: TemplateField[]
}

export interface BookingTemplate {
  id: string
  name: string
  baseFields: {
    myself: TemplateField[]
    someoneElse: TemplateField[]
  }
  /** Appointment type ids offered by this template. Empty = all types. */
  serviceIds: string[]
  /** Provider ids offered by this template. Empty = all providers. */
  providerIds: string[]
  fieldGroups: FieldGroup[]
  /** Human-readable consumers shown in the list's "Used by" column. */
  usedBy: string[]
  createdBy: string
  createdDate: string
}

export interface BookingService {
  id: string
  label: string
  description: string
}

export interface BookingProvider {
  id: string
  label: string
}

/** Same unique types as Front desk → Resources → Appointment type. */
export const BOOKING_SERVICES: BookingService[] = APPOINTMENT_TYPES.map((t) => ({
  id: t.id,
  label: t.name,
  description: t.description,
}))

export const BOOKING_PROVIDERS: BookingProvider[] = [
  { id: 'nancy-chen', label: 'Dr. Nancy Chen' },
  { id: 'raj-singh', label: 'Dr. Raj Singh' },
  { id: 'amelia-patel', label: 'Dr. Amelia Patel' },
  { id: 'any-available', label: 'Any available provider' },
]

export const DEFAULT_MYSELF_FIELDS: TemplateField[] = [
  { id: 'first-name', label: 'First name', type: 'text', required: true, system: true },
  { id: 'last-name', label: 'Last name', type: 'text', system: true },
  { id: 'phone-number', label: 'Phone number', type: 'number', required: true, system: true },
  { id: 'email', label: 'Email', type: 'text', required: true, system: true },
  { id: 'gender', label: 'Gender', type: 'multiple-choice', required: true, system: true },
  { id: 'dob', label: 'Date of birth (MM/DD/YYYY)', type: 'date', required: true, system: true },
]

export function defaultSomeoneElseFields(): TemplateField[] {
  return [
    ...DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
    { id: 'relationship', label: 'Relationship to patient', type: 'text', required: true, system: true },
  ]
}

export function emptyTemplate(): BookingTemplate {
  return {
    id: `tmpl-${Date.now()}`,
    name: 'New template',
    baseFields: {
      myself: DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: BOOKING_SERVICES.map((s) => s.id),
    providerIds: BOOKING_PROVIDERS.map((p) => p.id),
    fieldGroups: [],
    usedBy: [],
    createdBy: 'You',
    createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  }
}

export const INITIAL_BOOKING_TEMPLATES: BookingTemplate[] = [
  {
    id: 'general-intake',
    name: 'General intake',
    baseFields: {
      myself: [
        ...DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
        { id: 'preferred-language', label: 'Preferred language', type: 'dropdown' },
      ],
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['routine-cleaning', 'whitening-treatment', 'new-patient-exam'],
    providerIds: ['nancy-chen', 'raj-singh'],
    fieldGroups: [
      {
        id: 'default',
        name: 'Default',
        mappedServiceIds: ['routine-cleaning', 'whitening-treatment', 'new-patient-exam'],
        extraFields: [],
      },
      {
        id: 'surgical-intake',
        name: 'Surgical intake',
        mappedServiceIds: ['tooth-filling', 'emergency-visit'],
        extraFields: [
          { id: 'pain-level', label: 'Pain level', type: 'dropdown', required: true },
          { id: 'current-medications', label: 'Current medications', type: 'text', required: true },
          { id: 'allergies', label: 'Allergies', type: 'text', required: true },
        ],
      },
      {
        id: 'insurance-verification',
        name: 'Insurance verification',
        mappedServiceIds: ['new-patient-exam', 'invisalign-consultation'],
        extraFields: [
          { id: 'insurance-provider', label: 'Insurance provider', type: 'text', required: true },
          { id: 'member-id', label: 'Member ID', type: 'text', required: true },
        ],
      },
    ],
    usedBy: ['Agent', 'Widget'],
    createdBy: 'Sarah Martinez',
    createdDate: 'Jan 15, 2026',
  },
  {
    id: 'surgical-template',
    name: 'Surgical template',
    baseFields: {
      myself: DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['tooth-filling', 'emergency-visit'],
    providerIds: ['amelia-patel'],
    fieldGroups: [
      {
        id: 'surgical-default',
        name: 'Default',
        mappedServiceIds: ['tooth-filling', 'emergency-visit'],
        extraFields: [
          { id: 'pain-level-2', label: 'Pain level', type: 'dropdown', required: true },
        ],
      },
    ],
    usedBy: [],
    createdBy: 'David Brown',
    createdDate: 'Feb 03, 2026',
  },
  {
    id: 'new-patient-intake',
    name: 'New patient intake',
    baseFields: {
      myself: [
        ...DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
        { id: 'insurance-provider-base', label: 'Insurance provider', type: 'text' },
      ],
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['new-patient-exam', 'invisalign-consultation'],
    providerIds: ['nancy-chen', 'amelia-patel'],
    fieldGroups: [
      {
        id: 'insurance-details',
        name: 'Insurance details',
        mappedServiceIds: ['new-patient-exam'],
        extraFields: [
          { id: 'member-id-2', label: 'Member ID', type: 'text', required: true },
          { id: 'group-number', label: 'Group number', type: 'text' },
        ],
      },
    ],
    usedBy: ['Widget'],
    createdBy: 'Emily Davis',
    createdDate: 'Mar 22, 2026',
  },
  {
    id: 'emergency-visit-template',
    name: 'Emergency visit',
    baseFields: {
      myself: DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['emergency-visit'],
    providerIds: [],
    fieldGroups: [
      {
        id: 'symptom-details',
        name: 'Symptom details',
        mappedServiceIds: ['emergency-visit'],
        extraFields: [
          { id: 'pain-level-3', label: 'Pain level', type: 'dropdown', required: true },
          { id: 'symptom-onset', label: 'When did symptoms start?', type: 'text', required: true },
        ],
      },
    ],
    usedBy: ['Agent'],
    createdBy: 'Christopher Garcia',
    createdDate: 'Apr 05, 2026',
  },
  {
    id: 'cosmetic-consultation',
    name: 'Cosmetic consultation',
    baseFields: {
      myself: [
        ...DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
        { id: 'desired-shade', label: 'Desired shade improvement', type: 'dropdown' },
      ],
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['whitening-treatment'],
    providerIds: ['raj-singh'],
    fieldGroups: [],
    usedBy: ['Widget'],
    createdBy: 'James Rodriguez',
    createdDate: 'May 18, 2026',
  },
  {
    id: 'treatment-plan-followup',
    name: 'Treatment plan follow-up',
    baseFields: {
      myself: DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['invisalign-consultation'],
    providerIds: ['amelia-patel', 'raj-singh'],
    fieldGroups: [
      {
        id: 'plan-review',
        name: 'Plan review',
        mappedServiceIds: ['invisalign-consultation'],
        extraFields: [
          { id: 'plan-reference', label: 'Treatment plan reference #', type: 'text', required: true },
        ],
      },
    ],
    usedBy: ['Agent', 'Widget'],
    createdBy: 'Linda White',
    createdDate: 'Jun 09, 2026',
  },
  {
    id: 'recall-cleaning',
    name: 'Recall & cleaning',
    baseFields: {
      myself: DEFAULT_MYSELF_FIELDS.map((f) => ({ ...f })),
      someoneElse: defaultSomeoneElseFields(),
    },
    serviceIds: ['routine-cleaning', 'new-patient-exam'],
    providerIds: [],
    fieldGroups: [],
    usedBy: [],
    createdBy: 'William Harris',
    createdDate: 'Jul 14, 2026',
  },
]
