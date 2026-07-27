// Automotive procedure library — 34 procedures across 6 categories.
// IDs match the display names used in the LHS drawer dropdowns so drag-and-drop
// correctly seeds procedureIds without a separate name→id mapping step.

/** Sentinel ID for workflow-only custom procedures (not yet in the library). */
export const CUSTOM_PROCEDURE_ID = '__custom__';

export function isCustomProcedureId(id) {
  return id === CUSTOM_PROCEDURE_ID || id === 'Custom';
}

// ── Live procedure registry ───────────────────────────────────────────────
// AgentBuilder calls setLiveProcedures() on mount so that procedures created
// or edited in the Procedure Library are immediately visible on the canvas.
// Keyed by BOTH id and name so drag-and-drop (which uses name as the key) and
// node-detail lookups (which may use id) both hit the same entry.
let _liveRegistry = {};

export function setLiveProcedures(procedures) {
  _liveRegistry = {};
  if (!Array.isArray(procedures)) return;
  procedures.forEach((p) => {
    if (p.id)   _liveRegistry[p.id]   = p;
    if (p.name) _liveRegistry[p.name] = p;
  });
}

// Convert procedureData.ts context items to the workflow chip format.
function liveContextToChips(context) {
  if (!Array.isArray(context)) return [];
  const kindMap = { context: 'variable', file: 'attachment', link: 'link' };
  return context.map((c) => ({ value: c.label, type: kindMap[c.kind] || 'variable' }));
}

// Serialize rich ProcedureStep[] (with Bullet/Token structure) to a flat
// numbered-step string so the RHS detail panel can display it.
function richStepsToText(steps) {
  return steps.map((s, i) => {
    if (!s || typeof s !== 'object' || !s.title) return `${i + 1}.${s}`;
    const title = `${i + 1}.${s.title}`;
    if (!s.bullets || s.bullets.length === 0) return title;
    const bullets = s.bullets
      .map((b) => {
        const text = (b.tokens || [])
          .map((t) => (typeof t === 'string' ? t : `{{${t.label}}}`))
          .join('');
        return `• ${text.trim()}`;
      })
      .filter(Boolean)
      .join('\n');
    return bullets ? `${title}\n${bullets}` : title;
  }).join('\n');
}

export const PROCEDURES = [
  // ── Inbound General ──────────────────────────────────────────────────────
  { id: 'Greeting & Intent Detection', name: 'Greeting & Intent Detection', category: 'Inbound General', whenToUse: 'Every inbound call/chat/text session begins.', tools: ['Intent classifier', 'Knowledge base'], steps: ['Answer with dealership-branded greeting including agent name', 'Ask how the caller can be helped today', 'Use intent classifier to detect department and purpose', 'Confirm detected intent with caller', 'Route to appropriate procedure based on intent'], escalation: 'If intent cannot be determined after 2 attempts, transfer to human.' },
  { id: 'Department Transfer', name: 'Department Transfer', category: 'Inbound General', whenToUse: 'Caller requests specific department or intent maps to another department.', tools: ['Check business hours', 'CRM update', 'Trigger escalation'], steps: ['Confirm the department the caller wants to reach', 'Check business hours for the target department', 'If open, perform warm transfer with context summary', 'If closed, offer voicemail or callback scheduling', 'Log transfer in CRM with reason code'], escalation: 'If transfer fails 2x, offer direct callback from department.' },
  { id: 'General Inquiry', name: 'General Inquiry', category: 'Inbound General', whenToUse: 'Caller has a question not matching a specific procedure.', tools: ['Knowledge base', 'CRM update'], steps: ['Listen to the full question before responding', 'Search knowledge base for matching answer', 'Provide concise answer with source attribution', 'Ask if the caller has additional questions', 'Log inquiry topic in CRM for analytics'], escalation: 'If no knowledge base match found, transfer to human agent.' },
  { id: 'Handle Unclear Message', name: 'Handle Unclear Message', category: 'Inbound General', whenToUse: 'STT confidence is low or caller intent is ambiguous.', tools: ['ElevenLabs STT', 'Intent classifier', 'Trigger escalation'], steps: ['Apologize and ask the caller to rephrase', 'Offer 2-3 common intent options as suggestions', 'If still unclear, attempt one more rephrasing request', 'If unresolved, transfer to human agent'], escalation: 'After 2 failed clarification attempts, immediate human transfer.' },
  { id: 'Emergency / Urgent Handling', name: 'Emergency / Urgent Handling', category: 'Inbound General', whenToUse: 'Caller reports safety issue, vehicle breakdown, or emergency.', tools: ['Trigger escalation', 'CRM update'], steps: ['Acknowledge urgency immediately', 'If life-threatening, instruct caller to dial 911', 'For roadside emergencies, provide roadside assistance number', 'For urgent service needs, attempt immediate live transfer to service', 'Log emergency contact in CRM with priority flag'], escalation: 'Immediate human transfer for all emergency calls.' },
  { id: 'Talk to Human', name: 'Talk to Human', category: 'Inbound General', whenToUse: 'Caller explicitly requests a human agent.', tools: ['Trigger escalation', 'CRM update', 'Check business hours'], steps: ['Acknowledge the request without resistance', 'Ask if there is a specific person or department they need', 'Attempt warm transfer with conversation context', 'If no one available, offer callback with estimated wait time', 'Log request and outcome in CRM'], escalation: 'Always transfer; never deny a human transfer request.' },
  { id: 'Spanish Language Handling', name: 'Spanish Language Handling', category: 'Inbound General', whenToUse: 'Caller speaks Spanish or requests Spanish assistance.', tools: ['ElevenLabs STT', 'Voice identity', 'Intent classifier'], steps: ['Detect Spanish language via STT language detection', 'Switch agent language to Spanish', 'Continue with standard procedures in Spanish', 'If Spanish agent unavailable, offer callback from bilingual staff'], escalation: 'If no Spanish capability available, transfer to bilingual human.' },

  // ── Service ───────────────────────────────────────────────────────────────
  { id: 'Schedule Service Appointment', name: 'Schedule Service Appointment', category: 'Service', whenToUse: 'Caller wants to book a service appointment.', tools: ['DMS integration', 'Schedule appointment', 'VIN decode', 'Send confirmation', 'CRM update'], steps: ['Collect vehicle year, make, model, and mileage', 'Ask for the type of service needed', 'Look up VIN if available for service history context', 'Check available appointment slots in DMS', 'Confirm date, time, and service advisor', 'Send confirmation via SMS/email', 'Create appointment record in DMS'], escalation: 'If no slots available within 48 hours, transfer to service advisor.' },
  { id: 'Repair / Diagnostic Triage', name: 'Repair / Diagnostic Triage', category: 'Service', whenToUse: 'Caller describes a vehicle problem or warning light.', tools: ['Knowledge base', 'DMS integration', 'Schedule appointment', 'VIN decode'], steps: ['Collect symptom description and vehicle information', 'Ask clarifying questions about onset, frequency, severity', 'Check knowledge base for common diagnostic guidance', 'Assess urgency level (safe to drive vs. immediate attention)', 'If urgent, attempt same-day appointment booking', 'If not urgent, schedule next available appointment', 'Provide interim safety guidance'], escalation: 'If symptoms suggest safety risk, immediately transfer to service manager.' },
  { id: 'Recall Inquiry', name: 'Recall Inquiry', category: 'Service', whenToUse: 'Caller asks about recalls on their vehicle.', tools: ['VIN decode', 'NHTSA recall lookup', 'DMS integration', 'Schedule appointment', 'Send confirmation'], steps: ['Collect VIN or year/make/model', 'Query NHTSA recall database for open recalls', 'Report recall status and description to caller', 'If open recall exists, offer to schedule recall service', 'Confirm parts availability for recall repair', 'Book appointment and send confirmation'], escalation: 'If recall parts unavailable, transfer to service advisor for special order.' },
  { id: 'Service Status Check', name: 'Service Status Check', category: 'Service', whenToUse: 'Caller inquires about an in-progress repair.', tools: ['DMS integration', 'Voice identity', 'Send confirmation'], steps: ['Verify caller identity and vehicle', 'Look up active repair order in DMS', 'Provide current status and estimated completion time', 'If additional work was found, relay the details and cost', 'Offer to send status update via text'], escalation: 'If status unclear or additional authorization needed, transfer to service advisor.' },
  { id: 'Reschedule / Cancel Appointment', name: 'Reschedule / Cancel Appointment', category: 'Service', whenToUse: 'Caller wants to change or cancel an existing appointment.', tools: ['DMS integration', 'Schedule appointment', 'Send confirmation', 'CRM update'], steps: ['Verify caller identity and locate appointment', 'Confirm which appointment to modify', 'For reschedule: offer next available slots', 'For cancellation: confirm cancellation and reason', 'Update DMS record and send confirmation', 'If within 24 hours, note for no-show analytics exclusion'], escalation: 'If appointment is for recall or safety issue, attempt to retain before canceling.' },
  { id: 'Warranty Inquiry', name: 'Warranty Inquiry', category: 'Service', whenToUse: 'Caller asks about warranty coverage.', tools: ['VIN decode', 'DMS integration', 'Knowledge base'], steps: ['Collect VIN and current mileage', 'Look up warranty status via DMS/OEM integration', 'Explain coverage periods and what is/is not covered', 'If service is needed, offer to schedule under warranty', 'Provide disclaimer that final coverage determination is by service advisor'], escalation: 'If warranty dispute or denial, transfer to service manager.' },

  // ── Sales ─────────────────────────────────────────────────────────────────
  { id: 'New Vehicle Inquiry', name: 'New Vehicle Inquiry', category: 'Sales', whenToUse: 'Caller interested in purchasing a new vehicle.', tools: ['Inventory search', 'CRM update', 'Lead routing', 'Schedule appointment'], steps: ['Ask about desired vehicle type, features, and budget', 'Search real-time inventory for matching vehicles', 'Present top 2-3 matching options with key specs and pricing', 'Offer to schedule a test drive', 'Capture lead information in CRM', 'Route to appropriate sales consultant'], escalation: 'If caller requests specific pricing negotiation, transfer to sales manager.' },
  { id: 'Used / CPO Vehicle Inquiry', name: 'Used / CPO Vehicle Inquiry', category: 'Sales', whenToUse: 'Caller interested in pre-owned or certified vehicles.', tools: ['Inventory search', 'VIN decode', 'CRM update', 'Lead routing'], steps: ['Ask about preferences: make, model, year range, budget, features', 'Search used/CPO inventory for matches', 'Highlight CPO certification benefits if applicable', 'Share vehicle history summary (accident-free, service records)', 'Offer to schedule viewing or test drive', 'Capture lead and assign to used car sales'], escalation: 'If caller wants to negotiate price, transfer to used car manager.' },
  { id: 'Trade-In Valuation', name: 'Trade-In Valuation', category: 'Sales', whenToUse: 'Caller wants to know trade-in value of their current vehicle.', tools: ['Knowledge base', 'CRM update', 'Schedule appointment'], steps: ['Collect vehicle year, make, model, trim, mileage', 'Ask about vehicle condition (excellent/good/fair/poor)', 'Provide estimated range based on market data', 'Add disclaimer that final value requires in-person inspection', 'Offer to schedule in-person appraisal'], escalation: 'Never quote a firm trade-in value; always present as estimate range.' },
  { id: 'Finance Pre-Qualification', name: 'Finance Pre-Qualification', category: 'Sales', whenToUse: 'Caller asks about financing options or payment estimates.', tools: ['Knowledge base', 'CRM update', 'Lead routing', 'Schedule appointment'], steps: ['Explain general financing options available', 'Provide typical rate ranges without committing to specific rates', 'Explain that pre-qualification requires F&I department review', 'Offer to schedule appointment with finance manager', 'Capture lead with finance interest flag'], escalation: 'Never provide specific rate quotes; transfer to F&I for detailed discussion.' },
  { id: 'Test Drive Scheduling', name: 'Test Drive Scheduling', category: 'Sales', whenToUse: 'Caller wants to schedule a test drive.', tools: ['Inventory search', 'Schedule appointment', 'Send confirmation', 'CRM update', 'Lead routing'], steps: ['Confirm the vehicle(s) of interest', 'Verify vehicle availability on lot', 'Collect caller name, phone, and preferred date/time', 'Check sales consultant availability', 'Book test drive and send confirmation', 'Create/update lead in CRM'], escalation: 'If requested vehicle not in stock, offer similar alternatives or incoming inventory.' },
  { id: 'Internet Lead Qualification', name: 'Internet Lead Qualification', category: 'Sales', whenToUse: 'Following up on an online form submission or website inquiry.', tools: ['CRM update', 'Inventory search', 'Lead routing', 'Schedule appointment', 'Send confirmation'], steps: ['Reference the specific vehicle or inquiry from the lead source', 'Confirm continued interest and timeline', 'Ask qualifying questions: budget, trade-in, financing needs', 'Present relevant inventory matches', 'Offer immediate test drive or appointment', 'Update lead status in CRM with qualification notes'], escalation: 'If lead is hot (ready to buy today), immediate transfer to available sales consultant.' },

  // ── Parts ─────────────────────────────────────────────────────────────────
  { id: 'Parts Availability & Pricing', name: 'Parts Availability & Pricing', category: 'Parts', whenToUse: 'Caller inquires about parts availability or pricing.', tools: ['DMS integration', 'VIN decode', 'Knowledge base'], steps: ['Collect part description or part number', 'If VIN available, decode for exact fitment', 'Search parts inventory in DMS', 'Provide availability status and price range', 'Offer to place order if not in stock', 'Transfer to parts counter for complex orders'], escalation: 'For complex or special-order parts, transfer to parts department.' },

  // ── After-Hours ───────────────────────────────────────────────────────────
  { id: 'After-Hours Lead Capture', name: 'After-Hours Lead Capture', category: 'After-Hours', whenToUse: 'Sales inquiry received outside business hours.', tools: ['Check business hours', 'CRM update', 'Send confirmation', 'Lead routing'], steps: ['Inform caller of current business hours', 'Capture name, phone, email, and vehicle interest', 'Assure callback first thing next business day', 'Send confirmation text with business hours', 'Create priority lead in CRM for morning follow-up'], escalation: 'N/A — all after-hours leads queued for next-day follow-up.' },
  { id: 'After-Hours Service Request', name: 'After-Hours Service Request', category: 'After-Hours', whenToUse: 'Service inquiry received outside business hours.', tools: ['Check business hours', 'CRM update', 'Send confirmation'], steps: ['Inform caller of service department hours', 'Assess urgency of the service need', 'For emergencies, provide roadside assistance number', 'For non-urgent, capture details and schedule callback', 'Send confirmation text with next available service hours'], escalation: 'For true emergencies, provide emergency contact number if configured.' },

  // ── Outbound ──────────────────────────────────────────────────────────────
  { id: 'Lead Follow-Up Call', name: 'Lead Follow-Up Call', category: 'Outbound', whenToUse: 'Internet lead received — outbound call initiated within 5 minutes.', tools: ['CRM update', 'Inventory search', 'Schedule appointment', 'Send confirmation', 'Lead routing'], steps: ['Introduce self and reference the specific inquiry', 'Confirm interest and ask qualifying questions', 'Present matching inventory options', 'Offer to schedule test drive or appointment', 'If no answer, leave voicemail and send follow-up SMS', 'Update lead status in CRM'], escalation: 'If lead requests manager or has buying objection beyond script.' },
  { id: 'Missed Call Callback', name: 'Missed Call Callback', category: 'Outbound', whenToUse: 'Inbound call was missed — callback initiated within 15 minutes.', tools: ['CRM update', 'Intent classifier', 'Send confirmation'], steps: ['Apologize for missed call and ask how to help', 'Follow standard intent detection procedure', 'Route to appropriate department procedure', 'If no answer, send SMS with callback options'], escalation: 'Standard escalation per detected intent.' },
  { id: 'Appointment Confirmation', name: 'Appointment Confirmation', category: 'Outbound', whenToUse: 'Appointment is scheduled — confirmation journey begins.', tools: ['DMS integration', 'Send confirmation', 'Schedule appointment'], steps: ['Send immediate SMS confirmation with appointment details', '24 hours before: send SMS reminder with confirm/reschedule options', '2 hours before: place voice call for final confirmation', 'Process response: confirmed, rescheduled, or cancelled', 'Update appointment status in DMS'], escalation: 'If customer requests reschedule, attempt automated rebooking.' },
  { id: 'No-Show Re-Engagement', name: 'No-Show Re-Engagement', category: 'Outbound', whenToUse: 'Customer missed scheduled appointment without canceling.', tools: ['DMS integration', 'CRM update', 'Send confirmation', 'Schedule appointment'], steps: ['Wait 2 hours after missed appointment time', 'Send empathetic SMS acknowledging missed appointment', 'Offer easy one-click rescheduling link', 'If no response in 24 hours, follow up with voice call', 'Update CRM with no-show status and re-engagement outcome'], escalation: 'After 3 failed re-engagement attempts, flag for manual outreach.' },
  { id: 'Lease Maturity Outreach', name: 'Lease Maturity Outreach', category: 'Outbound', whenToUse: 'Customer lease matures within 90 days.', tools: ['CRM update', 'DMS integration', 'Inventory search', 'Lead routing', 'Send confirmation', 'Schedule appointment'], steps: ['Send initial SMS introducing lease-end options', 'Present three paths: lease new, purchase current, return', 'Offer to schedule consultation with sales consultant', 'Follow up at 60, 30, and 14 days if no response', 'Route engaged leads to sales team with lease details'], escalation: 'If customer has questions about payoff or fees, transfer to F&I.' },
  { id: 'Equity Mining Outreach', name: 'Equity Mining Outreach', category: 'Outbound', whenToUse: 'Vehicle equity analysis identifies upgrade opportunity.', tools: ['CRM update', 'DMS integration', 'Inventory search', 'Lead routing', 'Send confirmation'], steps: ['Send personalized SMS highlighting potential savings', 'Reference specific upgrade paths based on current vehicle', 'Offer no-obligation appraisal appointment', 'If interested, schedule with sales consultant'], escalation: 'If customer questions equity calculation, transfer to sales manager.' },
  { id: 'Service Lapse Re-Engagement', name: 'Service Lapse Re-Engagement', category: 'Outbound', whenToUse: 'Customer has not visited for service in 6+ months.', tools: ['DMS integration', 'CRM update', 'Send confirmation', 'Schedule appointment', 'Knowledge base'], steps: ['Send friendly SMS noting time since last visit', 'Highlight recommended maintenance based on mileage estimate', 'Offer convenient scheduling link', 'Include any current service specials or coupons'], escalation: 'N/A — informational outreach only.' },
  { id: 'CSI Follow-Up', name: 'CSI Follow-Up', category: 'Outbound', whenToUse: 'Customer completed service or purchase within last 48 hours.', tools: ['CRM update', 'Send confirmation', 'Tone analysis'], steps: ['Send satisfaction survey via SMS', 'If negative response detected, alert service/sales manager immediately', 'If positive, thank customer and request online review', 'Log survey response in CRM'], escalation: 'Negative CSI score triggers immediate manager notification.' },
  { id: 'NHTSA Recall Notification', name: 'NHTSA Recall Notification', category: 'Outbound', whenToUse: 'New recall issued affecting vehicles in customer database.', tools: ['NHTSA recall lookup', 'VIN decode', 'DMS integration', 'CRM update', 'Send confirmation', 'Schedule appointment'], steps: ['Identify affected vehicles in CRM/DMS via VIN matching', 'Send SMS notification about the recall with details', 'Explain safety implications and recommended action', 'Offer to schedule recall service appointment', 'Follow up if no response within 7 days'], escalation: 'If customer expresses safety concern, immediate transfer to service.' },
  { id: 'Orphan Customer Introduction', name: 'Orphan Customer Introduction', category: 'Outbound', whenToUse: "Customer's assigned salesperson has left the dealership.", tools: ['CRM update', 'Send confirmation', 'Lead routing'], steps: ['Send introductory SMS from new assigned representative', 'Reference purchase history and relationship context', 'Offer assistance with any current vehicle needs', 'Invite for complimentary vehicle health check'], escalation: 'N/A — relationship-building outreach only.' },
  { id: 'Welcome / Onboarding', name: 'Welcome / Onboarding', category: 'Outbound', whenToUse: 'New vehicle purchase or lease completed within 7 days.', tools: ['CRM update', 'Send confirmation', 'Knowledge base'], steps: ['Send welcome SMS with key contacts and service info', 'Provide link to schedule first complimentary service', 'Share tips for vehicle technology and features', 'Introduce loyalty program if applicable'], escalation: 'N/A — informational outreach only.' },
  { id: 'Unsold Showroom Follow-Up', name: 'Unsold Showroom Follow-Up', category: 'Outbound', whenToUse: 'Customer visited showroom but did not purchase.', tools: ['CRM update', 'Inventory search', 'Send confirmation', 'Lead routing'], steps: ['Send thank-you SMS within 2 hours of visit', 'Reference specific vehicles they viewed', 'Address any stated objections from visit notes', 'Offer additional inventory options or incentives', 'Schedule follow-up call for next day'], escalation: 'If customer indicates competitor offer, alert sales manager.' },

  // ── Healthcare Frontdesk ─────────────────────────────────────────────────────
  {
    id: 'Handle general inquiry',
    name: 'Handle general inquiry',
    category: 'Healthcare Frontdesk',
    whenToUse: 'Patient asks a general query related to the hospital or anything that should come from the knowledge base — website, FAQs, hours, location, insurance, services, doctors.',
    tools: ['knowledge_base', 'update_state', 'transfer_to_human', 'agent_turn'],
    steps: [
      'Identify the core need (general information, service details, location, billing, health concern) and determine if it\'s about {{location_name}} or a general healthcare question.',
      'If caller asks which hospital is the best fit: check history for caller location and service need; ask for any missing detail; query knowledge_base → LOCATIONS_FILE.txt and recommend naturally.',
      'For {{location_name}} general inquiries, provide accurate information from knowledge_base. For general healthcare questions, give non-diagnostic information and advise consulting a medical professional.',
      'For appointment requests or complex issues → route to router node. For human/frustration → call update_state then transfer to router node.',
      '"Is there anything else I can help you with today?" → If done: CSAT 1-5 scale → "Thank you so much — have a great day!"',
    ],
    escalation: 'Appointment requests, billing disputes, medical history discussions, or patient frustration → transfer to router node after calling update_state.',
  },
  {
    id: 'Talk to human',
    name: 'Talk to human',
    category: 'Healthcare Frontdesk',
    whenToUse: 'Patient explicitly asks to speak with a person, real agent, receptionist, or human — or expresses frustration with the AI.',
    tools: ['escalate_to_staff'],
    steps: [
      '"Of course — let me connect you with one of our team members. I\'ll pass along a quick note so you won\'t have to repeat yourself." Do not try to solve the issue first. Do not ask why.',
      'Invoke Escalate_to_staff with reason=human_requested.',
    ],
    escalation: 'Always honour human transfer requests immediately — no retention attempts.',
  },
  {
    id: 'Handle emergency or urgent concern',
    name: 'Handle emergency or urgent concern',
    category: 'Healthcare Frontdesk',
    whenToUse: "Patient describes worsening symptoms, medication reaction, post-visit concern they feel can't wait, anxiety about results, or any time-sensitive medical issue (but not life-threatening).",
    tools: ['appointment_management_agent', 'escalate_to_staff'],
    steps: [
      'State clearly: "If this is life-threatening — difficulty breathing, chest pain, loss of consciousness — please hang up and call 911 right now." Wait briefly. If patient confirms life-threatening → end conversation with 911 instruction.',
      '"I hear you — that sounds really uncomfortable. Let\'s get you taken care of." Ask one question only: is this a reaction, a worsening symptom, or a new concern? (agent_turn). Do not assess, diagnose, or advise.',
      'If same-day appointment is appropriate → invoke Appointment_Management_agent with visit_type=urgent.',
      'If immediate clinical eyes needed → invoke Escalate_to_staff with queue=nurse_line, priority=high.',
      'Always confirm next step explicitly: "I\'m connecting you to our nurse line now" or "You\'re booked at 2pm — please come straight in."',
      'Invoke Close_session.',
    ],
    escalation: 'Immediate escalation to nurse line for any clinical urgency. Life-threatening → 911.',
  },
  // ── Healthcare Waitlist ──────────────────────────────────────────────────────
  {
    id: 'Waitlist slot confirmation',
    name: 'Waitlist slot confirmation',
    category: 'Healthcare Waitlist',
    whenToUse: 'Agent is calling outbound to confirm a newly opened slot with a patient on the waitlist.',
    tools: ['initiate-voice-call-hc', 'fetch-waitlist-hc'],
    steps: [
      'Greet the patient and identify the open appointment slot.',
      'Confirm the patient is still interested and available for the slot.',
      'Book the appointment if the patient accepts.',
      'Update the waitlist status and notify the scheduling system.',
      'Send a confirmation message to the patient.',
    ],
    escalation: 'If the patient declines, mark slot as rejected and offer to the next patient on the waitlist.',
  },
  // ── Healthcare Pre-visit ─────────────────────────────────────────────────────
  {
    id: 'Form not filled',
    name: 'Form not filled',
    category: 'Healthcare Pre-visit',
    whenToUse: 'Patient has not completed their pre-visit intake form before the appointment date.',
    tools: ['send-communication', 'initiate-voice-call-hc'],
    steps: [
      'Greet the patient and confirm their upcoming appointment details.',
      'Inform them their intake form has not been completed yet.',
      'Provide the intake form link and explain the importance of completing it before the visit.',
      'Offer to resend the form link via email or SMS.',
      'If the patient is unable to complete the form digitally, offer to assist or escalate to front desk staff.',
      'Confirm next steps and close the interaction.',
    ],
    escalation: 'If patient cannot complete the form, escalate to front desk agent for manual intake.',
  },
  {
    id: 'Handle unclear message',
    name: 'Handle unclear message',
    category: 'Healthcare Frontdesk',
    whenToUse: "Patient's message is too vague, ambiguous, or out-of-scope to match any other procedure's trigger with confidence.",
    tools: ['escalate_to_staff'],
    steps: [
      '"I want to make sure I help you with the right thing — could you tell me a little more about what you\'re looking for?" (agent_turn). Wait for response. Other procedures may now fire if the new message matches their trigger.',
      'If still unclear: "Are you calling about an appointment, a question about your care, or something else?" (agent_turn). Wait for response. Match against procedure triggers.',
      'Never say "I don\'t understand." Instead: "Let me get someone from our team who can help you directly." Invoke Escalate_to_staff with reason=message_unclear_after_2_attempts.',
    ],
    escalation: 'After 2 failed clarification attempts, escalate to staff immediately.',
  },
];

/** Frontdesk RHS Procedures pane — canonical panel copy (Figma reference) */
export const FRONTDESK_PROCEDURE_PANEL = {
  'Talk to Human': {
    name: 'Talk to human',
    whenToUse: 'Patient explicitly asks to speak with a person, real agent, receptionist, or human — or expresses frustration with the AI.',
  },
  'General Inquiry': {
    name: 'Handle general inquiry',
    whenToUse: 'Patient asks a general query related to the hospital or anything answerable from the knowledge base — FAQs, hours, location, insurance, services.',
  },
  'Handle Unclear Message': {
    name: 'Handle unclear message',
    whenToUse: "Patient's message is too vague, or out-of-scope",
  },
  'Emergency / Urgent Handling': {
    name: 'Handle emergency or urgent concern',
    whenToUse: "Patient describes worsening symptoms, medication reaction, post-visit concern they feel can't wait.",
  },
};

/** RHS Procedures pane — default panel copy */
export const PROCEDURE_PANEL_DISPLAY = { ...FRONTDESK_PROCEDURE_PANEL };

/** RHS Procedures pane — healthcare / dental panel copy (IDs = display names, no overrides needed) */
export const PROCEDURE_PANEL_DISPLAY_HC = {
  'Handle general inquiry':             { name: 'Handle general inquiry',             whenToUse: 'Patient asks a general query related to the hospital or anything answerable from the knowledge base.' },
  'Handle emergency or urgent concern': { name: 'Handle emergency or urgent concern', whenToUse: "Patient describes worsening symptoms or a time-sensitive medical issue." },
  'Handle unclear message':             { name: 'Handle unclear message',             whenToUse: "Patient's message is too vague or out-of-scope." },
  'Talk to human':                      { name: 'Talk to human',                      whenToUse: 'Patient explicitly asks to speak with a person or expresses frustration.' },
};

/** Default procedure IDs for Frontdesk agent procedures node */
export const FRONTDESK_PROCEDURE_IDS = [
  'Talk to Human',
  'General Inquiry',
  'Handle Unclear Message',
  'Emergency / Urgent Handling',
];

export function getProcedurePanelDefaults(product) {
  return product === 'healthcare' || product === 'dental'
    ? PROCEDURE_PANEL_DISPLAY_HC
    : PROCEDURE_PANEL_DISPLAY;
}

export function resolveProcedurePanelText(procedure, overrides = {}, product) {
  const defaults = getProcedurePanelDefaults(product);
  const id = procedure.id;
  return {
    name: overrides[id]?.name || defaults[id]?.name || (isCustomProcedureId(id) ? 'Custom' : procedure.name),
    whenToUse: overrides[id]?.whenToUse || defaults[id]?.whenToUse || procedure.whenToUse || procedure.description || '',
  };
}

export function getProcedureById(id) {
  if (_liveRegistry[id]) return _liveRegistry[id];
  return PROCEDURES.find((p) => p.id === id) || null;
}

export function getProceduresByIds(ids = []) {
  return ids.map((id) => getProcedureById(id)).filter(Boolean);
}

/** Shared automotive context chips */
const AUTO_BASE_CHIPS = [
  { value: 'Location.name',  type: 'variable' },
  { value: 'Location.brand', type: 'variable' },
  { value: 'Customer.name',  type: 'variable' },
  { value: 'Customer.phone', type: 'variable' },
];

const AUTO_VEHICLE_CHIPS = [
  { value: 'Vehicle.vin',   type: 'variable' },
  { value: 'Vehicle.year',  type: 'variable' },
  { value: 'Vehicle.make',  type: 'variable' },
  { value: 'Vehicle.model', type: 'variable' },
];

const AUTO_APPT_CHIPS = [
  { value: 'Appointment.type', type: 'variable' },
  { value: 'Appointment.date', type: 'variable' },
];

/** Full RHS detail content keyed by workflow procedure ID */
export const PROCEDURE_DETAIL_CONTENT = {
  'Greeting & Intent Detection': {
    whenToUse: 'Every inbound call, webchat, or text session begins — no prior session context.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Business_hours.PDF',     type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Deliver branded greeting',
      '• Voice: "Thank you for calling {{Location.name}}. My name is Alex, your virtual front desk assistant. How can I help you today?"',
      '• Chat/SMS: "Hi! I\'m Alex, your virtual assistant at {{Location.name}}. How can I help?"',
      '• If first outbound SMS, append TCPA opt-out footer.',
      '2. Detect intent',
      '• Use {{intent_classifier}} to identify department and purpose',
      '• Confirm detected intent with the caller before routing {{agent_turn}}',
      '3. Route to procedure',
      '• Match intent to the correct procedure and transfer without delay',
      '• If intent is unclear after 2 attempts → invoke {{Handle Unclear Message}}',
    ].join('\n'),
  },
  'Department Transfer': {
    whenToUse: 'Caller requests a specific department or their intent maps to another department.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Department.name',    type: 'variable' },
      { value: 'Business_hours.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Confirm destination',
      '• Ask which department or person the caller needs {{agent_turn}}',
      '• Restate to confirm: "Got it — I\'ll transfer you to {{Department.name}}."',
      '2. Check availability',
      '• Invoke {{check_business_hours}} for the target department',
      '• If open → proceed to warm transfer',
      '• If closed → offer voicemail or callback scheduling',
      '3. Warm transfer',
      '• Announce the caller and summarize the conversation context to the receiving agent',
      '• Log transfer reason in CRM via {{crm_update}}',
      '4. Fallback',
      '• If transfer fails twice → offer direct callback from department',
    ].join('\n'),
  },
  'General Inquiry': {
    whenToUse: 'Caller has a question not matching a specific procedure — hours, directions, promotions, pricing.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Hours_and_location.PDF', type: 'attachment' },
      { value: 'Current_offers.PDF',     type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Listen fully',
      '• Let the caller finish before responding {{agent_turn}}',
      '• Do not interrupt or assume intent',
      '2. Search and answer',
      '• Search the knowledge base for a matching answer',
      '• Provide a concise answer; reference {{Hours_and_location.PDF}} or {{Current_offers.PDF}} as needed',
      '3. Close the loop',
      '• Ask if the caller has additional questions {{agent_turn}}',
      '• If unresolved → route to {{Talk to Human}}',
      '• Log inquiry topic in CRM via {{crm_update}}',
    ].join('\n'),
  },
  'Handle Unclear Message': {
    whenToUse: 'STT confidence is low or caller intent is ambiguous after the initial greeting.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
    ],
    stepsText: [
      '1. Clarify politely',
      '• "I\'m sorry — I didn\'t quite catch that. Could you rephrase?" {{agent_turn}}',
      '• Offer 2–3 common intent options: "Are you calling about service, sales, or something else?"',
      '2. Retry once',
      '• If still unclear, attempt one more rephrasing request',
      '• Keep responses short and option-based',
      '3. Escalate',
      '• If unresolved after 2 attempts → invoke {{Talk to Human}}',
      '• Log the interaction via {{crm_update}} for quality review',
    ].join('\n'),
  },
  'Emergency / Urgent Handling': {
    whenToUse: 'Caller reports a safety issue, vehicle breakdown, or time-sensitive emergency.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Roadside_assistance.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Safety first',
      '• "If this is a life-threatening emergency, please hang up and call 911."',
      '• Wait for a response before continuing {{agent_turn}}',
      '2. Acknowledge and triage',
      '• "I understand — let\'s get you taken care of right away."',
      '• One question only: is this a roadside breakdown, a safety concern, or an urgent service need?',
      '3. Route to resolution',
      '• Roadside breakdown → provide roadside assistance number from {{Roadside_assistance.PDF}}',
      '• Urgent service → invoke {{Schedule Service Appointment}} with same-day priority',
      '• Safety concern → invoke {{Escalate_to_staff}} immediately',
      '4. Confirm and close',
      '• Always confirm the next step explicitly before ending the session',
      '• Log emergency contact in CRM via {{crm_update}} with priority flag',
    ].join('\n'),
  },
  'Talk to Human': {
    whenToUse: 'Caller explicitly requests a human agent or expresses frustration with the AI.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Department.name', type: 'variable' },
    ],
    stepsText: [
      '1. Acknowledge immediately',
      '• "Absolutely — I\'ll connect you with a team member right away."',
      '• Do not argue or try to retain the caller in the AI flow.',
      '2. Gather context for handoff',
      '• Ask if there is a specific person or department they need {{agent_turn}}',
      '• Summarize the conversation for the receiving agent',
      '3. Transfer or callback',
      '• If staff available → warm transfer with full context summary',
      '• If unavailable → offer callback with estimated wait time',
      '• Log request and outcome in CRM via {{crm_update}}',
    ].join('\n'),
  },
  'Spanish Language Handling': {
    whenToUse: 'Caller speaks Spanish or explicitly requests Spanish-language assistance.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Spanish_hours.PDF',     type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Detect language',
      '• Detect Spanish via STT language identification',
      '• Switch agent language to Spanish immediately',
      '2. Continue in Spanish',
      '• Proceed with standard procedures in Spanish',
      '• All confirmations and summaries delivered in Spanish',
      '3. Fallback',
      '• If Spanish capability is unavailable → "Un momento por favor — le conectaré con un agente bilingüe."',
      '• Transfer to bilingual staff or schedule bilingual callback',
    ].join('\n'),
  },
  'Schedule Service Appointment': {
    whenToUse: 'Caller wants to book a new service appointment.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      ...AUTO_APPT_CHIPS,
      { value: 'DMS.advisor',      type: 'variable' },
      { value: 'Service_menu.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Collect vehicle info',
      '• Ask for vehicle year, make, model, and mileage',
      '• If VIN available → invoke {{vin_decode}} to pull service history context',
      '2. Identify service need',
      '• Ask for the type of service needed; reference {{Service_menu.PDF}} for common services',
      '3. Find availability',
      '• Invoke {{dms_integration}} to check open appointment slots',
      '• Offer top 2–3 time options with advisor name {{DMS.advisor}}',
      '4. Confirm booking',
      '• Confirm date {{Appointment.date}}, time, service type {{Appointment.type}}, and advisor',
      '• Invoke {{schedule_appointment}} to create the DMS record',
      '5. Send confirmation',
      '• Invoke {{send_confirmation}} via SMS/email with full appointment details',
      '• Update CRM via {{crm_update}}',
      '6. Escalate if needed',
      '• If no slots available within 48 hours → transfer to service advisor',
    ].join('\n'),
  },
  'Repair / Diagnostic Triage': {
    whenToUse: 'Caller describes a vehicle problem, warning light, or unusual symptom.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Service_history.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Collect vehicle and symptom info',
      '• Ask for vehicle year, make, model {{Vehicle.year}} {{Vehicle.make}} {{Vehicle.model}}',
      '• Gather symptom description: onset, frequency, severity {{agent_turn}}',
      '• Invoke {{vin_decode}} if VIN is available',
      '2. Assess urgency',
      '• Search knowledge base for diagnostic guidance',
      '• Determine urgency: safe to drive vs. immediate attention needed',
      '3. Schedule accordingly',
      '• If urgent → attempt same-day appointment via {{schedule_appointment}}',
      '• If not urgent → offer next available slot',
      '• Provide interim safety guidance while awaiting appointment',
      '4. Escalate',
      '• If symptoms suggest safety risk → immediately transfer to service manager',
    ].join('\n'),
  },
  'Recall Inquiry': {
    whenToUse: 'Caller asks about open recalls on their vehicle.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Recall_notice.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Collect vehicle identification',
      '• Ask for VIN or year/make/model',
      '• Invoke {{vin_decode}} to validate vehicle details',
      '2. Check recalls',
      '• Invoke {{nhtsa_recall_lookup}} with the decoded VIN',
      '• Report recall status and description to caller',
      '3. Offer service',
      '• If open recall exists → offer to schedule recall repair',
      '• Invoke {{dms_integration}} to confirm parts availability',
      '• Book appointment via {{schedule_appointment}} and send confirmation via {{send_confirmation}}',
      '4. Escalate',
      '• If recall parts unavailable → transfer to service advisor for special order',
    ].join('\n'),
  },
  'Service Status Check': {
    whenToUse: 'Caller inquires about the status of a vehicle currently in for repair.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'RO.number', type: 'variable' },
    ],
    stepsText: [
      '1. Verify caller and vehicle',
      '• Confirm caller name and vehicle details {{Customer.name}} {{Vehicle.vin}}',
      '2. Look up repair order',
      '• Invoke {{dms_integration}} to pull active repair order {{RO.number}}',
      '• Retrieve current status and estimated completion time',
      '3. Communicate status',
      '• Share status update clearly; include any additional work discovered and cost',
      '• Offer to send a status update via text via {{send_confirmation}}',
      '4. Escalate',
      '• If status is unclear or additional authorization is needed → transfer to service advisor',
    ].join('\n'),
  },
  'Reschedule / Cancel Appointment': {
    whenToUse: 'Caller wants to change or cancel an existing service or sales appointment.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      ...AUTO_APPT_CHIPS,
    ],
    stepsText: [
      '1. Verify appointment',
      '• Confirm caller identity and locate the appointment via {{dms_integration}}',
      '• Confirm which appointment to modify {{Appointment.date}} {{Appointment.type}}',
      '2. Reschedule or cancel',
      '• Reschedule → offer next available slots via {{schedule_appointment}}',
      '• Cancel → confirm cancellation and capture reason',
      '3. Update systems',
      '• Update DMS record and send confirmation via {{send_confirmation}}',
      '• Update CRM via {{crm_update}}',
      '• If within 24 hours → note for no-show analytics exclusion',
      '4. Retain if critical',
      '• If appointment is for a recall or safety issue → attempt to retain before canceling',
    ].join('\n'),
  },
  'Warranty Inquiry': {
    whenToUse: 'Caller asks about warranty coverage for their vehicle or a planned repair.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Warranty_guide.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Collect vehicle details',
      '• Ask for VIN and current mileage',
      '• Invoke {{vin_decode}} to pull vehicle record',
      '2. Look up warranty status',
      '• Invoke {{dms_integration}} to retrieve warranty coverage details',
      '• Explain coverage periods and what is/is not covered; reference {{Warranty_guide.PDF}}',
      '3. Offer next steps',
      '• If service is needed → offer to schedule under warranty via {{schedule_appointment}}',
      '• Provide disclaimer: final coverage determination is made by the service advisor',
      '4. Escalate',
      '• Warranty dispute or denial → transfer to service manager',
    ].join('\n'),
  },
  'New Vehicle Inquiry': {
    whenToUse: 'Caller is interested in purchasing or leasing a new vehicle.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Inventory_catalog.PDF',  type: 'attachment' },
      { value: 'Current_offers.PDF',     type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Qualify the need',
      '• Ask about desired vehicle type, features, and budget {{agent_turn}}',
      '2. Search inventory',
      '• Invoke {{inventory_search}} for matching new vehicles',
      '• Present top 2–3 options with key specs and pricing; reference {{Inventory_catalog.PDF}}',
      '3. Capture lead and route',
      '• Capture caller info in CRM via {{crm_update}} with vehicle interest',
      '• Offer to schedule a test drive via {{Test Drive Scheduling}}',
      '• Route to appropriate sales consultant via {{lead_routing}}',
      '4. Escalate',
      '• If caller requests specific pricing negotiation → transfer to sales manager',
    ].join('\n'),
  },
  'Used / CPO Vehicle Inquiry': {
    whenToUse: 'Caller is interested in pre-owned or certified pre-owned vehicles.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'CPO_certification.PDF',  type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Understand preferences',
      '• Ask about make, model, year range, budget, and desired features {{agent_turn}}',
      '2. Search inventory',
      '• Invoke {{inventory_search}} for used/CPO matches',
      '• Highlight CPO certification benefits if applicable; reference {{CPO_certification.PDF}}',
      '• Share vehicle history summary (accident-free, service records) via {{vin_decode}}',
      '3. Advance the conversation',
      '• Offer to schedule a viewing or test drive',
      '• Capture lead and assign to used car sales via {{lead_routing}}',
      '4. Escalate',
      '• If caller wants to negotiate price → transfer to used car manager',
    ].join('\n'),
  },
  'Trade-In Valuation': {
    whenToUse: 'Caller wants an estimate for the trade-in value of their current vehicle.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Trade_in_guide.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Collect vehicle details',
      '• Ask for year {{Vehicle.year}}, make {{Vehicle.make}}, model {{Vehicle.model}}, trim, and mileage',
      '• Invoke {{vin_decode}} if VIN is available {{Vehicle.vin}}',
      '2. Assess condition',
      '• Ask about vehicle condition: excellent / good / fair / poor {{agent_turn}}',
      '3. Provide estimate',
      '• Provide an estimated value range based on market data; reference {{Trade_in_guide.PDF}}',
      '• Always present as an estimate: "Final value requires an in-person inspection."',
      '4. Offer next step',
      '• Offer to schedule an in-person appraisal via {{schedule_appointment}}',
      '• Capture lead in CRM via {{crm_update}} with trade-in flag',
    ].join('\n'),
  },
  'Finance Pre-Qualification': {
    whenToUse: 'Caller asks about financing options, payment estimates, or pre-approval.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Finance_options.PDF',    type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Explain financing options',
      '• Outline general financing and leasing options available; reference {{Finance_options.PDF}}',
      '• Provide typical rate ranges without committing to specific numbers',
      '2. Set expectations',
      '• "Pre-qualification requires a review by our finance team — I can set that up for you."',
      '• Never provide specific rate quotes',
      '3. Advance the opportunity',
      '• Offer to schedule an appointment with the finance manager via {{schedule_appointment}}',
      '• Capture lead in CRM via {{crm_update}} with finance interest flag',
      '• Route to F&I via {{lead_routing}}',
    ].join('\n'),
  },
  'Test Drive Scheduling': {
    whenToUse: 'Caller wants to schedule a test drive for a specific vehicle.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      ...AUTO_APPT_CHIPS,
    ],
    stepsText: [
      '1. Confirm vehicle interest',
      '• Ask which vehicle(s) the caller wants to test drive {{Vehicle.year}} {{Vehicle.make}} {{Vehicle.model}}',
      '• Invoke {{inventory_search}} to verify the vehicle is on the lot',
      '2. Collect details',
      '• Gather preferred date and time {{Appointment.date}}',
      '• Confirm caller name {{Customer.name}} and phone {{Customer.phone}}',
      '3. Book the test drive',
      '• Check sales consultant availability via {{dms_integration}}',
      '• Invoke {{schedule_appointment}} to confirm the slot',
      '• Send confirmation via {{send_confirmation}}',
      '4. Update CRM',
      '• Create or update lead in CRM via {{crm_update}}',
      '• Route to assigned sales consultant via {{lead_routing}}',
      '5. Escalate',
      '• If requested vehicle is not in stock → offer similar alternatives or incoming inventory',
    ].join('\n'),
  },
  'Internet Lead Qualification': {
    whenToUse: 'Following up on an online form submission or website inquiry.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Lead.source',   type: 'variable' },
      { value: 'Vehicle.interest', type: 'variable' },
      { value: 'Inventory_catalog.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Reference the inquiry',
      '• "I\'m calling about your recent inquiry regarding {{Vehicle.interest}} from {{Lead.source}}."',
      '• Confirm continued interest and purchase timeline {{agent_turn}}',
      '2. Qualify the lead',
      '• Ask qualifying questions: budget, trade-in, financing needs',
      '• Search inventory for matching vehicles via {{inventory_search}}; reference {{Inventory_catalog.PDF}}',
      '3. Advance to appointment',
      '• Offer an immediate test drive or showroom visit via {{Test Drive Scheduling}}',
      '• If hot lead (ready to buy today) → invoke {{lead_routing}} for immediate sales transfer',
      '4. Update CRM',
      '• Update lead status in CRM via {{crm_update}} with qualification notes',
      '• Send confirmation of next step via {{send_confirmation}}',
    ].join('\n'),
  },
  'Parts Availability & Pricing': {
    whenToUse: 'Caller inquires about parts availability or pricing.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Parts_catalog.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Identify the part',
      '• Ask for part description or part number',
      '• If VIN available → invoke {{vin_decode}} for exact fitment {{Vehicle.vin}}',
      '2. Check inventory',
      '• Invoke {{dms_integration}} to search parts inventory',
      '• Provide availability status and price range; reference {{Parts_catalog.PDF}}',
      '3. Offer to order',
      '• If not in stock → offer to place a special order',
      '• Capture caller info for order follow-up via {{crm_update}}',
      '4. Escalate',
      '• For complex or special-order parts → transfer to parts department',
    ].join('\n'),
  },
  'After-Hours Lead Capture': {
    whenToUse: 'Sales inquiry received outside of dealership business hours.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      { value: 'Customer.email',     type: 'variable' },
      { value: 'Business_hours.PDF', type: 'attachment' },
      { value: 'Dealership_website_url', type: 'link' },
    ],
    stepsText: [
      '1. Set expectations',
      '• Inform caller of current business hours; reference {{Business_hours.PDF}}',
      '• "Our team will reach out first thing next business day."',
      '2. Capture lead info',
      '• Collect name {{Customer.name}}, phone {{Customer.phone}}, email {{Customer.email}}, and vehicle interest',
      '• Create priority lead in CRM via {{crm_update}} for morning follow-up',
      '3. Confirm and close',
      '• Send confirmation text with business hours and website via {{send_confirmation}}',
      '• Route lead via {{lead_routing}} for next-day outreach',
    ].join('\n'),
  },
  'After-Hours Service Request': {
    whenToUse: 'Service inquiry or request received outside of service department hours.',
    contextChips: [
      ...AUTO_BASE_CHIPS,
      ...AUTO_VEHICLE_CHIPS,
      { value: 'Business_hours.PDF',     type: 'attachment' },
      { value: 'Roadside_assistance.PDF', type: 'attachment' },
    ],
    stepsText: [
      '1. Inform of hours',
      '• "Our service department is currently closed." Share hours from {{Business_hours.PDF}}',
      '2. Assess urgency',
      '• Ask if this is an emergency or a routine service need {{agent_turn}}',
      '3. Handle accordingly',
      '• Emergency / breakdown → provide roadside assistance contact from {{Roadside_assistance.PDF}}',
      '• Non-urgent → capture details and offer to schedule for next available slot',
      '• Capture vehicle info {{Vehicle.year}} {{Vehicle.make}} {{Vehicle.model}} and caller details',
      '4. Confirm next step',
      '• Create service follow-up record in CRM via {{crm_update}}',
      '• Send confirmation text with service hours via {{send_confirmation}}',
    ].join('\n'),
  },
};

function isRichProcedureSteps(steps) {
  return (
    Array.isArray(steps)
    && steps.length > 0
    && steps[0]
    && typeof steps[0] === 'object'
    && steps[0].title
  );
}

function formatProcedureSteps(steps) {
  if (!Array.isArray(steps)) return typeof steps === 'string' ? steps : '';
  // Rich ProcedureStep[] from procedureData.ts has objects with .title + .bullets
  if (isRichProcedureSteps(steps)) {
    return richStepsToText(steps);
  }
  return steps.map((s, i) => `${i + 1}.${s}`).join('\n');
}

/** Healthcare workflow IDs → canonical PROCEDURE_DETAIL_CONTENT keys */
const PROCEDURE_DETAIL_ID_ALIASES = {
  'Handle general inquiry': 'General Inquiry',
  'Handle emergency or urgent concern': 'Emergency / Urgent Handling',
  'Handle unclear message': 'Handle Unclear Message',
  'Talk to human': 'Talk to Human',
};

/** Merge library defaults, panel display names, and saved field overrides for RHS detail */
export function getProcedureDetailContent(id, fieldOverrides = {}, product) {
  const proc = getProcedureById(id);
  const panel = proc
    ? resolveProcedurePanelText(proc, {}, product)
    : { name: isCustomProcedureId(id) ? 'Custom' : id, whenToUse: '' };
  const detailKey = PROCEDURE_DETAIL_ID_ALIASES[id] ?? id;
  const detail = PROCEDURE_DETAIL_CONTENT[detailKey] || {};

  // For HC/dental products, prefer live procedure library data over hardcoded
  // PROCEDURE_DETAIL_CONTENT — the library has richer steps and correct context.
  // For automotive, the hardcoded detail still provides the best content.
  const isHC = product === 'healthcare' || product === 'dental';
  // Only prefer live library steps when they use the rich title + bullets model.
  // Flat string[] steps fall through to PROCEDURE_DETAIL_CONTENT bulleted copy.
  const liveSteps = isHC && isRichProcedureSteps(proc?.steps)
    ? (formatProcedureSteps(proc.steps) || null)
    : null;
  const liveContext = isHC && proc?.context?.length ? liveContextToChips(proc.context) : null;

  return {
    id,
    name: fieldOverrides.name || panel.name,
    whenToUse: fieldOverrides.whenToUse ?? detail.whenToUse ?? panel.whenToUse ?? proc?.whenToUse ?? '',
    whenToExit: fieldOverrides.whenToExit ?? detail.whenToExit ?? proc?.whenToExit ?? '',
    contextChips: fieldOverrides.contextChips ?? liveContext ?? detail.contextChips ?? liveContextToChips(proc?.context),
    moreContextCount: liveContext ? 0 : (detail.moreContextCount ?? 0),
    stepsText: fieldOverrides.stepsText ?? liveSteps ?? detail.stepsText ?? formatProcedureSteps(proc?.steps),
    addToLibrary: fieldOverrides.addToLibrary ?? false,
  };
}
