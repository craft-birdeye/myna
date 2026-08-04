import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import { Tabs } from '../Tabs/Tabs'
import type { RunDetailsPanelProps, RunLogField, RunLogStep } from './RunDetailsPanel.types'

const TYPE_META: Record<RunLogStep['type'], { icon: string; colorClass: string; label: string }> = {
  trigger: { icon: 'bolt', colorClass: 'text-[#C2410C]', label: 'Trigger' },
  task: { icon: 'list_alt', colorClass: 'text-[#37A248]', label: 'Task' },
  delay: { icon: 'schedule', colorClass: 'text-text-icon', label: 'Delay' },
  branch: { icon: 'account_tree', colorClass: 'text-[#5071CE]', label: 'Branch' },
}

function FieldRow({ fieldKey, value }: { fieldKey: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-sm text-small">
      <RefChip kind="context" label={fieldKey} />
      <span className="min-w-0 break-words text-text-primary">{value}</span>
    </div>
  )
}

function NestedFieldBlock({ field }: { field: RunLogField }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-xs text-left text-small"
      >
        <Icon name={open ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0 text-text-tertiary" />
        <RefChip kind="context" label={field.key} />
        <span className="text-text-tertiary">{`{ ${field.properties?.length ?? 0} properties }`}</span>
      </button>
      {open && (
        <div className="ml-sm mt-xs flex flex-col gap-xs border-l border-border pl-sm">
          {field.properties?.map((p) =>
            p.properties ? (
              <NestedFieldBlock key={p.key} field={p} />
            ) : (
              <FieldRow key={p.key} fieldKey={p.key} value={p.value ?? ''} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function FieldList({ fields }: { fields: RunLogField[] }) {
  return (
    <div className="flex flex-col gap-xs">
      {fields.map((f) =>
        f.properties ? <NestedFieldBlock key={f.key} field={f} /> : <FieldRow key={f.key} fieldKey={f.key} value={f.value ?? ''} />,
      )}
    </div>
  )
}

function RunLogStepRow({ step }: { step: RunLogStep }) {
  const [outputOpen, setOutputOpen] = useState(true)
  const [inputsOpen, setInputsOpen] = useState(false)
  const [toolOpen, setToolOpen] = useState(false)
  const meta = TYPE_META[step.type]
  const outputLabel = step.outputLabel ?? (step.type === 'branch' ? 'Branch output' : 'Task output')

  return (
    <div className="relative flex gap-md">
      <div className="absolute bottom-0 left-[9px] top-[24px] w-px bg-border" aria-hidden />
      <Icon name="check_circle" size={20} fill className="relative z-10 mt-[2px] shrink-0 text-accent-positive" />
      <div className="min-w-0 flex-1 pb-2xl">
        <div className="flex items-center gap-xs text-small text-text-tertiary">
          <Icon name={meta.icon} size={16} className={`shrink-0 ${meta.colorClass}`} />
          {meta.label}
        </div>
        <p className="mt-xs text-body text-text-primary">
          {step.stepNumber}. {step.title}
        </p>

        {step.note ? (
          <p className="mt-sm text-small text-text-tertiary">{step.note}</p>
        ) : (
          <div className="mt-sm flex flex-col gap-sm">
            {step.output && (
              <div>
                <button
                  type="button"
                  onClick={() => setOutputOpen((v) => !v)}
                  className="flex items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon name={outputOpen ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0" />
                  {outputLabel}
                </button>
                {outputOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.output} />
                  </div>
                )}
              </div>
            )}

            {step.tool && (
              <div>
                <button
                  type="button"
                  onClick={() => setToolOpen((v) => !v)}
                  className="flex min-w-0 items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon name={toolOpen ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0" />
                  <span className="truncate">{`Tool : ${step.tool.name}`}</span>
                  <span className="shrink-0 text-text-tertiary">{`{ ${step.tool.properties.length} properties }`}</span>
                </button>
                {toolOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.tool.properties} />
                  </div>
                )}
              </div>
            )}

            {step.inputs && (
              <div>
                <button
                  type="button"
                  onClick={() => setInputsOpen((v) => !v)}
                  className="flex items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon name={inputsOpen ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0" />
                  View inputs
                </button>
                {inputsOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.inputs} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LogsTab({ steps }: { steps: RunLogStep[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step) => (
        <RunLogStepRow key={step.id} step={step} />
      ))}
      <div className="flex items-center gap-md">
        <Icon name="check_circle" size={20} fill className="shrink-0 text-accent-positive" />
        <span className="text-small text-text-tertiary">Completed</span>
      </div>
    </div>
  )
}

/** Right-hand "Run details" pane — Logs tab shows the trigger/task steps this run executed
 *  (expandable field/tool trees); Conversation tab renders whatever the caller passes in (e.g. a
 *  call recording player + transcript); an optional Call details tab (to the right of the other
 *  two) shows caller/call metadata. Opened from a log row's "View log" action. */
export function RunDetailsPanel({ steps, conversation, callDetails }: RunDetailsPanelProps) {
  const [tab, setTab] = useState<'logs' | 'conversation' | 'call-details'>('logs')

  return (
    <div className="preview-panel log-details-panel flex h-full w-[600px] min-w-[360px] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-[15px] pt-md">
        <Tabs
          tabs={[
            { id: 'logs', label: 'Logs' },
            { id: 'conversation', label: 'Conversation' },
            ...(callDetails ? [{ id: 'call-details', label: 'Call details' }] : []),
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as 'logs' | 'conversation' | 'call-details')}
        />
      </div>

      {tab === 'logs' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-[15px] py-lg">
          <LogsTab steps={steps} />
        </div>
      )}
      {tab === 'conversation' && (
        // No overflow/padding here — the conversation node owns its own pinned-player +
        // independently-scrolling chat layout (see `LogDetailsPanel`).
        <div className="relative min-h-0 flex-1 overflow-hidden">{conversation}</div>
      )}
      {tab === 'call-details' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-[15px] py-lg">{callDetails}</div>
      )}
    </div>
  )
}
