import { getProcedureDetailContent } from '../../../services/procedureService.js';

/** Filled procedure detail for the "Appointment confirmation" preview (Figma reference). */
export const APPOINTMENT_CONFIRMATION_PROCEDURE_DETAIL = {
  id: 'Appointment confirmation',
  name: 'Appointment confirmation',
  whenToUse:
    'Use when the patient wants to book a new appointment or schedule a visit with a provider',
  contextChips: [
    { value: 'Provider_first_name', type: 'variable' },
    { value: 'Business_ID', type: 'variable' },
    { value: 'Products_list.PDF', type: 'attachment' },
    { value: 'www.aspendental.com', type: 'link' },
  ],
  moreContextCount: 25,
  procedureType: 'Inbound',
  stepsText: [
    '1. Step 1: Identify Patient',
    '• Ask: "Is this appointment for yourself or someone else?"assistant. How can I help you today?',
    '• Collect:',
    '- First name',
    '- Last name',
    '- DOB',
    '• Call {{Lookup_patients_list}} If patient exists:',
    '- Continue as existing patient',
    'If patient not found:',
    '- Continue as new patient',
    '2. Collect Missing Information',
  ].join('\n'),
};

const KNOWN_PROCEDURE_DETAILS = {
  'Appointment confirmation': APPOINTMENT_CONFIRMATION_PROCEDURE_DETAIL,
};

/** Strip a trailing "(Copy)" / "(Copy 2)" suffix (added when a procedure is duplicated
    elsewhere in the app) so a copy's detail view resolves to its original's real content. */
function stripCopySuffix(id) {
  return id.replace(/\s*\(copy(?:\s+\d+)?\)\s*$/i, '').trim();
}

/** Resolve a procedure's detail content for the shared "view procedure" panel, used by both
    Initiate voice call and Reminder tool. These drawers only ever place OUTBOUND calls/
    reminders, so the Type field always defaults to Outbound here regardless of how the
    underlying procedure record is classified elsewhere in the app. */
export function getProcedureDetail(procedureId, product = 'healthcare') {
  let result;

  if (KNOWN_PROCEDURE_DETAILS[procedureId]) {
    result = { ...KNOWN_PROCEDURE_DETAILS[procedureId] };
  } else {
    const baseId = stripCopySuffix(procedureId);
    if (baseId === procedureId) {
      result = getProcedureDetailContent(procedureId, {}, product);
    } else {
      const baseDetail = KNOWN_PROCEDURE_DETAILS[baseId] || getProcedureDetailContent(baseId, {}, product);
      result = baseDetail ? { ...baseDetail, id: procedureId, name: procedureId } : null;
    }
  }

  return result ? { ...result, procedureType: 'Outbound' } : result;
}
