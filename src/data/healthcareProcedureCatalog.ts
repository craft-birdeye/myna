export interface HealthcareProcedureCatalogItem {
  id: string
  title: string
  description: string
  lastEdited: string
}

export const HEALTHCARE_PROCEDURE_CATALOG: HealthcareProcedureCatalogItem[] = [
  {
    id: 'greet',
    title: 'Greet and start the conversation',
    description:
      'Identifies the caller, screens for urgency, and routes them to the right procedure',
    lastEdited: '2 days ago',
  },
  {
    id: 'general',
    title: 'Handle general inquiry',
    description:
      'Answers informational questions like hours, location, insurance, and services',
    lastEdited: '5 days ago',
  },
  {
    id: 'emergency',
    title: 'Handle emergency or urgent concern',
    description: 'Detects urgent symptoms or concerns and escalates for patient safety',
    lastEdited: '1 week ago',
  },
  {
    id: 'unclear',
    title: 'Handle unclear message',
    description: "Clarifies vague or out-of-scope messages to recover the patient's intent",
    lastEdited: '1 week ago',
  },
  {
    id: 'talk-human',
    title: 'Talk to human',
    description:
      'Hands off to a live agent when the patient asks for a person or shows frustration',
    lastEdited: '3 days ago',
  },
  {
    id: 'identify-patient',
    title: 'Identify patient',
    description: 'Confirms patient identity before taking any appointment action',
    lastEdited: '4 days ago',
  },
  {
    id: 'new-patient',
    title: 'New patient intake',
    description: 'Collects details to create a record for patients not found in the system',
    lastEdited: '5 days ago',
  },
  {
    id: 'book-appointment',
    title: 'Book new appointment',
    description: 'Finds availability and schedules a new visit for the patient',
    lastEdited: '2 days ago',
  },
  {
    id: 'reschedule',
    title: 'Reschedule appointment',
    description: 'Moves an existing upcoming appointment to a new time',
    lastEdited: '3 days ago',
  },
  {
    id: 'cancel-appointment',
    title: 'Cancel appointment',
    description: 'Cancels an existing appointment and releases the slot',
    lastEdited: '4 days ago',
  },
  {
    id: 'slot-conflict',
    title: 'Handle slot conflict',
    description: 'Re-offers availability when the chosen slot was already taken',
    lastEdited: '1 week ago',
  },
  {
    id: 'slot-confirmation',
    title: 'Slot confirmation',
    description: 'Calls the patient to confirm the appointment slot',
    lastEdited: '1 week ago',
  },
]

/** Default selections for the new-agent setup wizard (step 2). */
export const DEFAULT_WIZARD_PROCEDURE_IDS = [
  'greet',
  'general',
  'identify-patient',
  'new-patient',
  'cancel-appointment',
]

/** Default selections on the agent settings tab. */
export const DEFAULT_AGENT_PROCEDURE_IDS = ['greet', 'general', 'emergency', 'unclear']
