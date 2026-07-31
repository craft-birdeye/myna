import React, { Suspense } from 'react'
import {
  AUTOMOTIVE_AGENT_WORKFLOWS,
  HEALTHCARE_AGENT_WORKFLOWS,
  DENTAL_AGENT_WORKFLOWS,
} from '../data/agentWorkflows'
import { buildWizardAgentWorkflow } from '../data/buildWizardAgentWorkflow'
import { useProcedureStore } from '../data/ProcedureStoreContext'
import type { WizardAgentDraft } from '../data/wizardAgentConfig.types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import AgentBuilderRaw from '../workflow/AgentBuilder/AgentBuilder'

// Cast to accept any props so TypeScript doesn't complain about JSX prop types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<any>

const EMPTY_WORKFLOW = {
  nodes: [],
  nodeDetails: { '__start__': { agentName: '', goals: '', outcomes: '', locations: [] } },
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
  onClose: () => void
  product?: string
  agentStatus?: string
  wizardDraft?: WizardAgentDraft | null
}

export function WorkflowEditorScreen({
  agentName,
  onClose,
  product = 'automotive',
  agentStatus = 'Running',
  wizardDraft = null,
}: WorkflowEditorScreenProps) {
  const { procedures, addProcedure } = useProcedureStore()
  const agentBaseName = agentName.replace(/ - .+$/, '')
  const isHCProduct = product === 'healthcare' || product === 'dental'
  const isPreVisit = agentBaseName === 'Pre-visit agent'
  const isWaitlist = agentBaseName === 'Waitlist agent'
  const HC_FRONTDESK_SIDEBAR_NAMES = new Set([
    'General inquiry',
    'Talk to human',
    'Book, cancel, reschedule appointment',
    'Reschedule appointment',
  ])
  const filteredProcedures = procedures.filter((p) => {
    if (!isHCProduct) return p.category !== 'Healthcare Frontdesk' && p.category !== 'Healthcare Pre-visit'
    if (isPreVisit) return p.category === 'Healthcare Pre-visit'
    if (isWaitlist) return p.category === 'Healthcare Waitlist'
    return p.category === 'Healthcare Frontdesk' && HC_FRONTDESK_SIDEBAR_NAMES.has(p.name)
  })

  // For healthcare / dental, patch the __start__ node details directly here
  // so we never rely on the agentWorkflows module cache being fresh.
  const isHC = product === 'healthcare' || product === 'dental'
  const workflowMap =
    product === 'healthcare' ? HEALTHCARE_AGENT_WORKFLOWS :
    product === 'dental'     ? DENTAL_AGENT_WORKFLOWS     :
                               AUTOMOTIVE_AGENT_WORKFLOWS
  const baseWorkflow = workflowMap[agentBaseName] ?? EMPTY_WORKFLOW

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
        patched[key] = { ...(val as Record<string, unknown>), agentName }
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
    : isHC && agentBaseName === 'Front desk agent'
      ? {
          nodes: baseWorkflow.nodes,
          nodeDetails: {
            ...baseWorkflow.nodeDetails,
            '__start__': HC_FRONTDESK_START,
          },
        }
      : {
          nodes: patchNodes(baseWorkflow.nodes as unknown[]) as typeof baseWorkflow.nodes,
          nodeDetails: patchNodeDetails(baseWorkflow.nodeDetails as unknown as Record<string, unknown>) as typeof baseWorkflow.nodeDetails,
        }

  const resolvedStatus = wizardDraft ? 'Draft' : agentStatus
  const publishDisabled = false

  const AGENT_NAV_MAP: Record<string, string> = {
    'Front desk agent': 'frontdesk',
    'Reminder agent': 'inbox',
    'Outreach agent': 'marketing',
    'Pre-visit agent': 'frontdesk',
    'Waitlist agent': 'frontdesk',
  }
  const activeNavId = AGENT_NAV_MAP[agentName] ?? 'frontdesk'

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>}>
        <AgentBuilder
          key={`${agentName}::${product}::${wizardDraft ? 'wizard' : 'default'}`}
          pageTitle={agentName}
          appTitle={agentName}
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
          onAddProcedure={addProcedure}
          initialStatus={resolvedStatus}
          publishDisabled={publishDisabled}
          defaultOpenSection="Tasks"
          defaultLhsCollapsed={!wizardDraft}
        />
      </Suspense>
    </div>
  )
}
