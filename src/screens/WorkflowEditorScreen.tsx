import React, { Suspense } from 'react'
import {
  AUTOMOTIVE_AGENT_WORKFLOWS,
  HEALTHCARE_AGENT_WORKFLOWS,
  DENTAL_AGENT_WORKFLOWS,
} from '../data/agentWorkflows'
import { buildWizardAgentWorkflow } from '../data/buildWizardAgentWorkflow'
import { useProcedureStore } from '../data/ProcedureStoreContext'
import { getLastSavedCreateChat, createChatVariantForAgent, getRetainedCreateAiChat } from '../data/createAgentChatStore'
import { AGENT_INSTANCE_ISSUE_COUNTS, getAgentIssues } from '../data/agentIssues'
import type { WizardAgentDraft } from '../data/wizardAgentConfig.types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import AgentBuilderRaw from '../workflow/AgentBuilder/AgentBuilder'
import { isFrontDeskCanvasAgent } from '../workflow/LHSDrawer/LHSDrawer'

// Cast to accept any props so TypeScript doesn't complain about JSX prop types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<any>

const EMPTY_WORKFLOW = {
  nodes: [],
  nodeDetails: { '__start__': { agentName: '', goals: '', outcomes: '', locations: [] } },
}

/** Goals / outcomes for Reviews AI create-from-scratch (empty canvas). Locations stay empty. */
const REVIEW_RESPONSE_SCRATCH_START = {
  goals:
    'Executes rule-based logic to rotate through qualifying templates and publish them automatically. If technical restrictions prevent immediate posting, the response is queued as a suggestion for manual review',
  outcomes:
    'Ensure safe, effortless engagement by relying exclusively on your pre-approved templates. Eliminate manual effort and operational overhead by autonomously responding across platforms',
  locations: [] as string[],
}

const REVIEW_GENERATION_SCRATCH_START = {
  goals:
    'Request reviews from customers after a completed transaction, using email and text to maximize response rates.',
  outcomes:
    'Increase review volume across locations while saving staff time on manual follow-up.',
  locations: [] as string[],
}

// Healthcare / Dental Frontdesk start-node details — defined inline to avoid
// any module-cache staleness from agentWorkflows.ts.
const HC_FRONTDESK_START = {
  agentName: 'Front desk agent',
  goals: 'Serves as the first point of contact for inbound calls, texts, and chats, resolving patient inquiries, managing appointments, verifying insurance, and escalating complex cases when needed',
  outcomes:
    "1. Patient's query is resolved or routed without human intervention\n" +
    '2. Appointment is confirmed, modified, or cancelled and reflected in the system\n' +
    '3. Insurance verification is completed prior to appointment confirmation\n' +
    '4. No patient is left waiting without a response or a clear next step\n' +
    '5. Escalations include a full summary of the conversation and identified intent',
  locations: [
    '1001 - Mountain View, CA',
    '1002 - Seattle, WA',
    '1004 - Chicago, IL',
    '1006 - Las Vegas, NV',
    '1007 - Dallas, TX',
    '1008 - Houston, TX',
    '1009 - Phoenix, AZ',
    '1010 - San Diego, CA',
    '1011 - Portland, OR',
    '1012 - Denver, CO',
    '1013 - Atlanta, GA',
    '1014 - Miami, FL',
  ],
}

interface WorkflowEditorScreenProps {
  agentName: string
  /** Shown in the builder header and start node; workflow lookup still uses `agentName`. */
  displayName?: string
  onClose: () => void
  product?: string
  agentStatus?: string
  wizardDraft?: WizardAgentDraft | null
  aiAssistOpen?: boolean
  onAiAssistOpenChange?: (open: boolean) => void
  hideLhs?: boolean
  createAiPanelOpen?: boolean
  previewProcedureId?: string | null
  previewProcedureDetail?: Record<string, unknown> | null
  onPreviewProcedureIdChange?: (id: string | null) => void
  /** Opens the full-page Create with AI experience. */
  onOpenAiFullscreen?: () => void
  /** Docked "AI Builder" side panel (review-response chrome). */
  aiBuilderPanelOpen?: boolean
  onAiBuilderPanelOpenChange?: (open: boolean) => void
  /** Initial LHS tab when the editor mounts. */
  lhsDefaultTab?: 'Create with AI' | 'Create manually'
  /** Saved co-pilot transcript shown in the Create with AI tab after Save agent. */
  aiTranscript?: import('../data/createAgentChatStore').SavedCreateChat | null
  /** When true, Create with AI uses help-oriented copy for an already-built agent. */
  existingAgent?: boolean
  /** Hides the in-canvas title/status row (identity rendered in the header back cluster). */
  hideTopIdentity?: boolean
  /** Hides the canvas agent-details start node. Defaults to hideTopIdentity. Sep 1 keeps the card. */
  hideCanvasStartNode?: boolean
  /** Exploration editor UX (help RHS, version history, chip collapse, etc.). Sep 1 keeps the canvas agent-details card. */
  explorationChrome?: boolean
  /** Sep 1 chrome — red "N Errors" chip after the run-test icon (both Sep 1 agents). */
  sep1Chrome?: boolean
  /** RHS Save follows the content instead of pinning to the panel bottom (Response agents Sep 1 only). */
  inlineRhsFooter?: boolean
  /** Opens Settings > Account > User experience improvement program (Help center "Learn more"). */
  onOpenUxImprovementSettings?: () => void
}

export function WorkflowEditorScreen({
  agentName,
  displayName,
  onClose,
  product = 'automotive',
  agentStatus = 'Running',
  wizardDraft = null,
  aiAssistOpen,
  onAiAssistOpenChange,
  hideLhs = false,
  createAiPanelOpen = false,
  previewProcedureId = null,
  previewProcedureDetail = null,
  onPreviewProcedureIdChange,
  onOpenAiFullscreen,
  aiBuilderPanelOpen = false,
  onAiBuilderPanelOpenChange,
  lhsDefaultTab = 'Create manually',
  aiTranscript = null,
  existingAgent,
  hideTopIdentity = false,
  hideCanvasStartNode = hideTopIdentity,
  explorationChrome = hideTopIdentity,
  sep1Chrome = false,
  inlineRhsFooter = false,
  onOpenUxImprovementSettings,
}: WorkflowEditorScreenProps) {
  const { procedures, addProcedure } = useProcedureStore()
  const agentBaseName = agentName.replace(/ - .+$/, '')
  const shownName = displayName ?? agentName
  const createChatVariant =
    createChatVariantForAgent(shownName) ?? createChatVariantForAgent(agentName)
  const resolvedAiTranscript =
    aiTranscript ??
    getRetainedCreateAiChat(shownName) ??
    getRetainedCreateAiChat(agentName) ??
    getLastSavedCreateChat(createChatVariant)
  const isHCProduct = product === 'healthcare' || product === 'dental'
  const isPreVisit = agentBaseName === 'Pre-visit agent'
  const isWaitlist = agentBaseName === 'Waitlist agent'
  // Any Front desk canvas (base agent, regional instance, create-flow title, or library template).
  const isFrontDeskAgent = isFrontDeskCanvasAgent(agentBaseName, agentName, shownName)
  const filteredProcedures = procedures.filter((p) => {
    if (!isHCProduct) return p.category !== 'Healthcare Frontdesk' && p.category !== 'Healthcare Pre-visit'
    if (isPreVisit) return p.category === 'Healthcare Pre-visit'
    if (isWaitlist) return p.category === 'Healthcare Waitlist'
    // Front desk (+ other HC agents using this canvas): full Healthcare Frontdesk library.
    return p.category === 'Healthcare Frontdesk'
  })

  // For healthcare / dental, patch the __start__ node details directly here
  // so we never rely on the agentWorkflows module cache being fresh.
  const isHC = product === 'healthcare' || product === 'dental'
  const workflowMap =
    product === 'healthcare' ? HEALTHCARE_AGENT_WORKFLOWS :
    product === 'dental'     ? DENTAL_AGENT_WORKFLOWS     :
                               AUTOMOTIVE_AGENT_WORKFLOWS
  const baseWorkflow = workflowMap[agentBaseName] ?? EMPTY_WORKFLOW
  const isEmptyScratch = !wizardDraft && (baseWorkflow.nodes?.length ?? 0) === 0
  const resolvedExistingAgent = existingAgent ?? (!isEmptyScratch && !wizardDraft)
  const reviewScratchStart = /review response/i.test(shownName)
    ? REVIEW_RESPONSE_SCRATCH_START
    : /review generation/i.test(shownName)
      ? REVIEW_GENERATION_SCRATCH_START
      : null

  // Extract region suffix from instance name (e.g. "Recall agent - North region" → "North region")
  const regionSuffix = agentName.includes(' - ') ? agentName.replace(/^.+ - /, '') : null

  // Map region label → frontdesk agent value and label
  const FRONTDESK_BY_REGION: Record<string, { value: string; label: string }> = {
    'North region': { value: 'frontdesk-north', label: 'Front desk agent - North region' },
    'East region':  { value: 'frontdesk-east',  label: 'Front desk agent - East region'  },
    'West region':  { value: 'frontdesk-west',  label: 'Front desk agent - West region'  },
  }
  const frontdeskForRegion = regionSuffix ? (FRONTDESK_BY_REGION[regionSuffix] ?? FRONTDESK_BY_REGION['North region']) : FRONTDESK_BY_REGION['North region']

  // Patch nodeDetails: set __start__.agentName to the full instance name, and remap
  // any frontdesk subagent nodes to the region-specific agent.
  function patchNodeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const patched: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(details)) {
      if (key === '__start__') {
        patched[key] = { ...(val as Record<string, unknown>), agentName: shownName }
      } else if (val && typeof val === 'object' && 'selectedAgent' in (val as Record<string, unknown>)) {
        const v = val as Record<string, unknown>
        if (typeof v.selectedAgent === 'string' && v.selectedAgent.startsWith('frontdesk-')) {
          patched[key] = { ...v, selectedAgent: frontdeskForRegion.value, name: frontdeskForRegion.label }
        } else {
          patched[key] = val
        }
      } else {
        patched[key] = val
      }
    }
    return patched
  }

  // Also patch node data.title for frontdesk subagent canvas nodes
  function patchNodes(nodes: unknown[]): unknown[] {
    return nodes.map((n: unknown) => {
      const node = n as Record<string, unknown>
      if (node.flowType === 'subagent') {
        const data = node.data as Record<string, unknown>
        if (typeof data?.title === 'string' && data.title.startsWith('Front desk agent')) {
          return { ...node, data: { ...data, title: frontdeskForRegion.label } }
        }
      }
      return node
    })
  }

  const workflow = wizardDraft
    ? buildWizardAgentWorkflow(wizardDraft)
    : isEmptyScratch && reviewScratchStart
      ? {
          nodes: [],
          nodeDetails: {
            '__start__': {
              agentName: shownName,
              goals: reviewScratchStart.goals,
              outcomes: reviewScratchStart.outcomes,
              locations: [],
            },
          },
        }
    : isHC && (agentBaseName === 'Front desk agent' || agentBaseName === 'Front desk agent (exploration)')
      ? {
          nodes: baseWorkflow.nodes,
          nodeDetails: {
            ...baseWorkflow.nodeDetails,
            '__start__': { ...HC_FRONTDESK_START, agentName: shownName },
          },
        }
      : {
          nodes: patchNodes(baseWorkflow.nodes as unknown[]) as typeof baseWorkflow.nodes,
          nodeDetails: patchNodeDetails(baseWorkflow.nodeDetails as unknown as Record<string, unknown>) as typeof baseWorkflow.nodeDetails,
        }

  // Create-from-scratch opens an empty canvas — never show "Running".
  const resolvedStatus = wizardDraft || isEmptyScratch ? 'Draft' : agentStatus
  const issueCount = AGENT_INSTANCE_ISSUE_COUNTS[agentName] ?? 0

  const AGENT_NAV_MAP: Record<string, string> = {
    'Front desk agent': 'frontdesk',
    'Front desk agent (exploration)': 'frontdesk',
    'Reminder agent': 'inbox',
    'Outreach agent': 'marketing',
    'Pre-visit agent': 'frontdesk',
    'Waitlist agent': 'frontdesk',
    'Review response agent': 'reviews',
    'Review generation agent': 'reviews',
  }
  const activeNavId = AGENT_NAV_MAP[agentBaseName] ?? 'frontdesk'

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>}>
          <AgentBuilder
            key={`${agentName}::${shownName}::${product}::${wizardDraft ? 'wizard' : 'default'}`}
            pageTitle={shownName}
            appTitle={shownName}
            onClose={onClose}
            product={product}
            activeNavId={activeNavId}
            moduleSlug="myna"
            moduleContext="myna"
            sectionContext="workflow"
            navItems={[]}
            initialNodes={workflow.nodes}
            initialNodeDetails={workflow.nodeDetails}
            procedures={filteredProcedures}
            showProceduresPalette={isFrontDeskAgent}
            onAddProcedure={addProcedure}
            initialStatus={resolvedStatus}
            publishDisabled={false}
            issueCount={issueCount}
            issues={getAgentIssues(agentName)}
            defaultOpenSection={isEmptyScratch ? 'Trigger' : 'Tasks'}
            aiAssistOpen={aiAssistOpen}
            onAiAssistOpenChange={onAiAssistOpenChange}
            hideLhs={hideLhs}
            createAiPanelOpen={createAiPanelOpen}
            previewProcedureId={previewProcedureId}
            previewProcedureDetail={previewProcedureDetail}
            onPreviewProcedureIdChange={onPreviewProcedureIdChange}
            onOpenAiFullscreen={onOpenAiFullscreen}
            aiBuilderPanelOpen={aiBuilderPanelOpen}
            onAiBuilderPanelOpenChange={onAiBuilderPanelOpenChange}
            lhsDefaultTab={lhsDefaultTab}
            aiTranscript={resolvedAiTranscript}
            existingAgent={resolvedExistingAgent}
            hideTopIdentity={hideTopIdentity}
            hideCanvasStartNode={hideCanvasStartNode}
            explorationChrome={explorationChrome}
            inlineRhsFooter={inlineRhsFooter}
            sep1Chrome={sep1Chrome}
            onOpenUxImprovementSettings={onOpenUxImprovementSettings}
          />
        </Suspense>
      </div>
    </div>
  )
}
