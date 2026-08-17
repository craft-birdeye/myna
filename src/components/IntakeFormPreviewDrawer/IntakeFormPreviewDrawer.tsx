import { useState } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import type { IntakeFormPreviewDrawerProps } from './IntakeFormPreviewDrawer.types'
import { ChevronDown, ChevronUp, Mail, MessageSquare, Send, Sparkles } from 'lucide-react'

const COLLAPSED_SECTIONS = ['Insurance', 'Consent', 'Medical history', 'Social history'] as const
const QUICK_ACTION_ICONS = { send: Send, chat: MessageSquare, mail: Mail } as const

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-small text-text-tertiary">{label}</p>
      <p className="text-body text-text-primary">{value}</p>
    </div>
  )
}

export function IntakeFormPreviewDrawer({
  open,
  patient,
  onClose,
}: IntakeFormPreviewDrawerProps) {
  const [basicOpen, setBasicOpen] = useState(true)

  if (!patient) return null

  const { basicDetails: d } = patient

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        <div className="flex shrink-0 items-center gap-sm px-2xl pb-lg pt-2xl">
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Intake details</h2>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-2xl pb-2xl">
          <div className="flex flex-col items-center pb-xl pt-md">
            <span className="flex size-16 items-center justify-center rounded-full bg-chip-success-bg text-h3 text-chip-success-text">
              {patient.initials}
            </span>
            <h3 className="mt-md text-h3 text-text-primary">{patient.name}</h3>
            <div className="mt-md flex items-center gap-sm">
              {(['send', 'chat', 'mail'] as const).map((icon) => {
                const Ic = QUICK_ACTION_ICONS[icon]
                return (
                  <button
                    key={icon}
                    type="button"
                    aria-label={icon}
                    className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                  >
                    <Ic className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="rounded-md px-lg py-md"
            style={{ background: '#F9F7FD', border: '1px solid #B090E0' }}
          >
            <div className="flex items-center gap-xs">
              <span style={{ color: '#B090E0' }} className="flex items-center"><Sparkles className="size-4" strokeWidth={1.6} absoluteStrokeWidth /></span>
              <span className="text-body text-text-primary">AI summary</span>
            </div>
            <ul className="mt-sm space-y-xs text-body text-text-secondary">
              {patient.aiSummary.map((line) => (
                <li key={line} className="flex items-start gap-sm">
                  <span className="mt-[2px] shrink-0 text-text-tertiary">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-lg border-t border-border">
            <button
              type="button"
              onClick={() => setBasicOpen((o) => !o)}
              className="flex w-full items-center justify-between py-lg text-left"
            >
              <span className="text-body text-text-primary">Basic details</span>
              {basicOpen ? <ChevronUp className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth /> : <ChevronDown className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
            </button>
            {basicOpen && (
              <div className="grid grid-cols-2 gap-x-lg gap-y-lg pb-lg">
                <DetailField label="Age" value={d.age} />
                <DetailField label="Gender" value={d.gender} />
                <DetailField label="Phone number" value={d.phone} />
                <DetailField label="Email" value={d.email} />
                <DetailField label="Emergency contact" value={d.emergencyContact} />
                <DetailField label="Relationship" value={d.emergencyRelationship} />
                <DetailField label="Emergency contact phone number" value={d.emergencyPhone} />
                <DetailField label="Emergency contact email" value={d.emergencyEmail} />
              </div>
            )}
          </div>

          {COLLAPSED_SECTIONS.map((section) => (
            <div key={section} className="border-t border-border">
              <button
                type="button"
                className="flex w-full items-center justify-between py-lg text-left"
              >
                <span className="text-body text-text-primary">{section}</span>
                <ChevronDown className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
