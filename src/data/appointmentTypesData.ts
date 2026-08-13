/** Unique appointment types from Front desk → Resources → Appointment type.
    Names and descriptions match the L2 table (first occurrence of each name). */

export interface AppointmentTypeOption {
  id: string
  name: string
  description: string
}

export const APPOINTMENT_TYPES: AppointmentTypeOption[] = [
  { id: 'new-patient-exam', name: 'New Patient Exam', description: 'Comprehensive initial exam + X-rays' },
  { id: 'routine-cleaning', name: 'Routine Cleaning', description: 'Prophylaxis + polishing' },
  { id: 'emergency-visit', name: 'Emergency Visit', description: 'Urgent pain or dental injury' },
  { id: 'invisalign-consultation', name: 'Invisalign Consultation', description: 'Orthodontic assessment + treatment plan' },
  { id: 'tooth-filling', name: 'Tooth Filling', description: 'Composite or amalgam restoration' },
  { id: 'whitening-treatment', name: 'Whitening Treatment', description: 'In-office bleaching session' },
]
