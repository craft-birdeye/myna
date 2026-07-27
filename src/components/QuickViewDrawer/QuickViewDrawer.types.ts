export interface QuickViewAppointment {
  patient: string
  provider: string
  apptType: string
  dateTime: string
  status: string
  bookedBy?: string
  internalNote?: string
}

export interface QuickViewWaitlist {
  patient: string
  provider: string
  location: string
  apptType: string
  slotPreference: string
  waitingSince: string
  status: string
  bookedBy?: string
}

// Healthcare intake patient detail (used by IntakeScreen)
export interface PatientDetail {
  patient: string
  status: string
  age?: string
  gender?: string
  phone?: string
  email?: string
  emergencyContact?: string
  emergencyRelationship?: string
  emergencyPhone?: string
  emergencyEmail?: string
  insuranceProvider?: string
  memberId?: string
  groupNumber?: string
  secondaryInsurance?: string
  consentTreatment?: string
  consentHipaa?: string
  consentFinancial?: string
  medications?: Array<{ name: string; dosage: string; frequency: string }>
  drugAllergies?: Array<{ medicine: string; reaction: string }>
  nonDrugAllergies?: Array<{ allergen: string; reaction: string }>
  preferredPharmacy?: string
  medicalConditions?: string[]
  surgicalHistory?: Array<{ procedure: string; year: string }>
  familyHistory?: Array<{ condition: string; relation: string }>
  hospitalizations?: Array<{ condition: string; year: string }>
  tobacco?: string
  alcohol?: string
  drugUsage?: string
  exercise?: string
  dateOfBirth?: string
  insuranceName?: string
  appointmentType?: string
  appointmentTime?: string
  location?: string
  questionText?: string
  appointmentDate?: string
  bookedOn?: string
  sentOn?: string
  aiSummary?: string[]
}

// Appointment/waitlist variant (ManageAppointmentsScreen / ReviewWaitlistScreen)
export interface QuickViewDrawerBaseProps {
  open: boolean
  appointment?: QuickViewAppointment | null
  waitlist?: QuickViewWaitlist | null
  onClose: () => void
  onViewDetails?: () => void
  onQuickSend?: () => void
  onMessage?: () => void
  onEmail?: () => void
}

// Intake variant (IntakeScreen)
export interface QuickViewDrawerIntakeProps {
  open: boolean
  patient: PatientDetail | null
  onClose: () => void
  onViewDetails?: () => void
  onQuickSend?: () => void
  onMessage?: () => void
  onEmail?: () => void
}

export type QuickViewDrawerProps = QuickViewDrawerBaseProps | QuickViewDrawerIntakeProps
