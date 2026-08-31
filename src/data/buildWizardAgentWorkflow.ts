import type { AgentWorkflow } from './agentWorkflows'
import type { WizardAgentDraft } from './wizardAgentConfig.types'
import { WIZARD_LOCATIONS } from './wizardLocations'

const WIZARD_NODES: AgentWorkflow['nodes'] = [
  {
    id: 'fd-1',
    flowType: 'trigger',
    data: {
      subtype: 'Conversation trigger',
      headerLabel: 'Conversation trigger',
      title: 'Conversation trigger',
      hasToggle: true,
      toggleEnabled: true,
      hasAiIcon: false,
      titlePlaceholder: 'Enter trigger name',
      descriptionPlaceholder: 'Enter description',
    },
  },
  {
    id: 'fd-2',
    flowType: 'procedures',
    data: {
      title: 'Follow procedures',
      subtype: 'Procedures',
      hasToggle: true,
      toggleEnabled: true,
      hasAiIcon: false,
      titlePlaceholder: 'Enter task name',
      descriptionPlaceholder: 'Enter description',
    },
  },
]

function channelDescription(draft: WizardAgentDraft): string {
  const parts: string[] = []
  if (draft.selectedChannels.includes('voice')) parts.push('voice')
  if (draft.selectedChannels.includes('webchat')) parts.push('chat')
  if (draft.selectedChannels.includes('text')) parts.push('text')
  if (parts.length === 0) return 'voice, chat, or text'
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} or ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, or ${parts[parts.length - 1]}`
}

export function buildWizardAgentWorkflow(draft: WizardAgentDraft): AgentWorkflow {
  const procedureIds = draft.selectedProcedureIds
    .map((id) => draft.procedureCatalog.find((item) => item.id === id)?.title)
    .filter((title): title is string => Boolean(title))

  const channels = channelDescription(draft)

  const locations = draft.selectedLocationIds
    .map((id) => {
      const loc = WIZARD_LOCATIONS.find((l) => l.id === id)
      return loc ? { id: loc.id, name: loc.name } : null
    })
    .filter((loc): loc is { id: string; name: string } => loc !== null)

  return {
    nodes: WIZARD_NODES,
    nodeDetails: {
      '__start__': {
        agentName: draft.agentName,
        goals:
          'Answer all inbound calls, texts, and chats. Handle general questions, book, cancel, and reschedule appointments, verify insurance, and bring in a human when something is too complex to handle.',
        outcomes: [
          "1. Patient's query is resolved or routed without human intervention",
          '2. Appointment is confirmed, modified, or cancelled and reflected in the system',
          '3. No patient is left waiting without a response or a clear next step',
          '4. Escalations include a full summary of the conversation and identified intent',
        ].join('\n'),
        locations,
      },
      'fd-1': {
        triggerName: 'Conversation trigger',
        description: `Agent triggers when a ${channels} conversation starts`,
        voiceConditions: draft.selectedChannels.includes('voice')
          ? [{ field: 'event', operator: 'is', value: 'Incoming call' }]
          : [],
        webchatConditions:
          draft.selectedChannels.includes('webchat') || draft.selectedChannels.includes('text')
            ? [{ field: 'event', operator: 'is', value: 'Message received' }]
            : [],
        voiceRows: draft.selectedChannels.includes('voice')
          ? [{ id: 'voice-1', condition: 'incoming_call', time: 'during_business' }]
          : [],
        webChatRows:
          draft.selectedChannels.includes('webchat') || draft.selectedChannels.includes('text')
            ? [{ id: 'web-1', condition: 'message_received', time: 'during_business' }]
            : [],
      },
      'fd-2': {
        procedureIds,
      },
    },
  }
}
