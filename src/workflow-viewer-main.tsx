/**
 * Standalone entry — mounts the real workflow *editor* (WorkflowEditorScreen /
 * AgentBuilder, full edit mode) in isolation, addressed by query params.
 * Exists so a plain static HTML page that can't import from src/ (the Super
 * Agent prototype, public/super-agent-prototype.html) can still embed the
 * literal production canvas via <iframe>, rather than a hand-drawn clone.
 *
 * Deliberately NOT the view-only variant (WorkflowViewerTab / viewOnly +
 * viewChromeActions) — every dashboard agent's Workflow tab lands straight
 * on the full editable canvas (floating AI-Trigger-Procedures-Actions-
 * Controls palette, node cards, connectors), not behind a View-only/Edit
 * switcher. AgentBuilder's own floating back button and name/status/
 * Preview/Activate/kebab pill are hidden via CSS below — orphaned controls
 * once embedded with no surrounding dashboard chrome to belong to — but the
 * Preview/Run-test button inside that hidden pill is still the real trigger
 * for AgentBuilder's own preview/test-run panel, so the caller's own Preview
 * button (Super Agent's AgentScreen header) reaches it by postMessage: see
 * the "workflow-viewer:trigger-preview" listener below.
 *
 * `combineControlsLeft` is passed explicitly (new AgentBuilder prop) so the
 * bottom-left toolbar collapses to the "100% ▾ | undo/redo/orientation | ?"
 * grouping the real Front desk / Review response canvases use in production
 * (normally implied by `sep1Chrome`, which also relabels the LHS palette and
 * changes the errors chip — side effects this isolated embed doesn't want).
 *
 * Two addressing modes:
 *  - ?instanceName=Front+desk+agent&product=automotive&displayName=...
 *      Looks the workflow up the same way the dashboard itself does
 *      (WorkflowEditorScreen), for agents that have a real dashboard workflow.
 *  - ?data=<base64(encodeURIComponent(JSON({ nodes, nodeDetails, agentName })))>
 *      Mounts AgentBuilder directly against caller-supplied nodes/nodeDetails,
 *      for agents that only exist in the caller's own prototype.
 */
import React, { Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './contenthub-vars.css'
import { ProcedureStoreProvider } from './data/ProcedureStoreContext'
import { WorkflowEditorScreen } from './screens/WorkflowEditorScreen'
// @ts-ignore
import AgentBuilderRaw from './workflow/AgentBuilder/AgentBuilder'

const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<any>

interface RawWorkflowPayload {
  nodes: unknown[]
  nodeDetails: Record<string, unknown>
  agentName?: string
}

function decodeRawPayload(raw: string): RawWorkflowPayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(raw)))
  } catch {
    return null
  }
}

function RawWorkflowEmbed({ nodes, nodeDetails, agentName }: RawWorkflowPayload) {
  const title = agentName || 'Agent'
  return (
    <AgentBuilder
      key={title}
      pageTitle={title}
      appTitle={title}
      onClose={() => {}}
      product="automotive"
      moduleSlug="myna"
      moduleContext="myna"
      sectionContext="workflow"
      navItems={[]}
      initialNodes={nodes}
      initialNodeDetails={nodeDetails}
      procedures={[]}
      showProceduresPalette={false}
      existingAgent
      combineControlsLeft
    />
  )
}

/* AgentBuilder's own preview/test-run panel has no controlled prop for its
 * open state (it's internal `useState`) — the real button that flips it is
 * still in the DOM, just hidden by the .wf-embed CSS below, so this clicks
 * it programmatically rather than reaching into AgentBuilder's internals.
 *
 * This whole page is a real navigation inside an <iframe> (not a React
 * remount) — the caller's postMessage can easily fire before this page has
 * finished loading its own JS and attached the listener below, in which
 * case it's silently dropped. So on mount this announces "ready" to the
 * parent; the parent (public/super-agent-prototype.html's WfHeaderActions)
 * queues the trigger until that arrives, mirroring the same queue/flush
 * pattern SuperAgentApp.tsx already uses for its own cross-iframe messages. */
function useTriggerPreviewBridge() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== 'workflow-viewer:trigger-preview') return
      const btn = document.querySelector<HTMLButtonElement>('.ab-header-runtest-btn, .rr-chrome-run-test')
      btn?.click()
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'workflow-viewer:ready' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])
}

function Root() {
  useTriggerPreviewBridge()
  const params = new URLSearchParams(window.location.search)
  const instanceName = params.get('instanceName')
  const product = params.get('product') ?? 'automotive'
  const displayName = params.get('displayName') ?? undefined
  const data = params.get('data')

  let body: React.ReactNode
  if (instanceName) {
    body = (
      <WorkflowEditorScreen
        agentName={instanceName}
        displayName={displayName}
        product={product}
        agentStatus="Active"
        existingAgent
        combineControlsLeft
        onClose={() => {}}
      />
    )
  } else if (data) {
    const payload = decodeRawPayload(data)
    body = payload ? <RawWorkflowEmbed {...payload} /> : <div>Invalid workflow data</div>
  } else {
    body = <div>Missing instanceName or data</div>
  }

  return (
    <ProcedureStoreProvider>
      {/* This canvas is embedded with nothing else around it (no dashboard
          TopBar/L1 rail, no agent-list "Back" destination), so AgentBuilder's
          own floating back button and name/status/Preview/Activate/kebab
          pill — both meant to float over the canvas above the dashboard's
          own chrome — just add a redundant, disconnected pair of controls.
          Hidden rather than not rendered: AgentBuilder always renders them
          whenever `onClose` is set, which WorkflowEditorScreen requires. */}
      <style>{`
        .wf-embed .rr-chrome-back-cluster,
        .wf-embed .rr-chrome-top { display: none !important; }
      `}</style>
      <div className="wf-embed" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Suspense fallback={null}>{body}</Suspense>
      </div>
    </ProcedureStoreProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
