// Procedure definitions — business-level settings.
// In production these would be fetched from Firestore; for the prototype
// they are hardcoded here so the feature works without any backend changes.

export const PROCEDURES = [
  {
    id: 'greet-and-open',
    name: 'Greet and open conversation',
    description: 'Identify caller, screen for urgency, determine intent, route to correct procedure within 10 seconds.',
    whenToUse: 'At the start of every inbound conversation — voice, chat, or text.',
    tools: ['agent_turn', 'End conversation'],
    context: ['Provider_first_name', 'Business_name', 'Business_hours'],
    steps: [
      {
        title: 'Greet the caller',
        bullets: [
          'Say: "Thank you for calling [Business_name], this is [Provider_first_name]. How can I help you today?"',
          'Wait for the caller to respond before proceeding.',
        ],
      },
      {
        title: 'Screen for urgency',
        bullets: [
          'If the caller mentions an emergency → route immediately to Handle emergency or urgent concern.',
          'If not urgent, determine the nature of the inquiry.',
        ],
      },
    ],
  },
  {
    id: 'talk-to-human',
    name: 'Talk to human',
    description: 'Patient explicitly asks to speak with a person, real agent, receptionist, or human — or expresses frustration.',
    whenToUse: 'When the caller clearly requests to speak to a human, or when they express frustration with the AI.',
    tools: ['agent_turn', 'Transfer call'],
    context: ['Provider_first_name', 'Transfer_number'],
    steps: [
      {
        title: 'Acknowledge request',
        bullets: [
          '"Of course — I\'ll connect you with a team member right away."',
          'Do not attempt to re-engage with AI-handled flows after this point.',
        ],
      },
      {
        title: 'Transfer',
        bullets: [
          'Use Transfer call tool with Transfer_number.',
          'If no agent is available, offer a callback.',
        ],
      },
    ],
  },
  {
    id: 'handle-general-inquiry',
    name: 'Handle general inquiry',
    description: 'Patient asks a general or informational question — hours, location, parking, insurance accepted.',
    whenToUse: 'When the patient has a non-urgent question about the practice, services, or logistics.',
    tools: ['agent_turn'],
    context: ['Business_hours', 'Business_address', 'Insurance_list', 'Parking_info'],
    steps: [
      {
        title: 'Identify the question type',
        bullets: [
          'Hours / location / parking → answer from context variables directly.',
          'Insurance → reference Insurance_list and confirm coverage.',
        ],
      },
      {
        title: 'Answer and confirm',
        bullets: [
          'Provide a concise, friendly answer.',
          '"Is there anything else I can help you with?"',
        ],
      },
    ],
  },
  {
    id: 'handle-emergency',
    name: 'Handle emergency or urgent concern',
    description: "Patient describes worsening symptoms, medication reaction, post-visit concern they feel can't wait, anxiety about results, or any time-sensitive medical issue (but not life-threatening).",
    whenToUse: 'When the patient flags urgency but the situation is not immediately life-threatening.',
    tools: ['agent_turn', 'End conversation'],
    context: ['Provider_first_name', 'visit_type=urgent', 'Products_list.PDF', 'www.aspendental.com'],
    steps: [
      {
        title: 'Safety check first',
        bullets: [
          'State clearly: "If this is life-threatening — difficulty breathing, chest pain, loss of consciousness — please hang up and call 911 right now."',
          'Wait briefly for response. If patient confirms life-threatening → end with 911 instruction.',
        ],
      },
      {
        title: 'Acknowledge and triage',
        bullets: [
          '"I hear you — that sounds really uncomfortable. Let\'s get you taken care of."',
          'One question only: is this a reaction, a worsening symptom, or a new concern?',
          'Do not assess, diagnose, or advise.',
        ],
      },
    ],
  },
  {
    id: 'handle-unclear-message',
    name: 'Handle unclear message',
    description: "Patient's message is too vague, or out-of-scope.",
    whenToUse: "When the patient's intent is unclear or the request is outside the agent's scope.",
    tools: ['agent_turn'],
    context: ['Provider_first_name'],
    steps: [
      {
        title: 'Clarify gently',
        bullets: [
          '"I want to make sure I understand — could you tell me a bit more about what you need?"',
          'Offer two or three common options to help guide them.',
        ],
      },
      {
        title: 'Escalate if needed',
        bullets: [
          'After two failed clarification attempts → offer to transfer to a human.',
        ],
      },
    ],
  },
];

export function getProcedureById(id) {
  return PROCEDURES.find((p) => p.id === id) || null;
}

export function getProceduresByIds(ids = []) {
  return ids.map((id) => getProcedureById(id)).filter(Boolean);
}
