// src/components/QuickViewDrawer/patientSections.tsx
import { useState } from 'react'
import { PatientDetail } from './QuickViewDrawer.types'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function FieldRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-md last:mb-0">
      <p className="text-small text-text-secondary">{label}</p>
      <p className="text-body text-text-primary">{value || '-'}</p>
    </div>
  )
}

export function SubHeader({ label }: { label: string }) {
  return (
    <p className="mb-xs mt-lg text-small uppercase tracking-wider text-text-tertiary">{label}</p>
  )
}

export function AccordionSection({
  title,
  defaultOpen = false,
  isFirst = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  isFirst?: boolean
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultOpen)

  return (
    <div className={isFirst ? '' : 'border-t border-border'}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-lg py-sm hover:bg-surface-hover"
      >
        <span className="text-body text-text-primary">{title}</span>
        {expanded ? <ChevronUp className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth /> : <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
      </button>

      {expanded && (
        <div className="px-lg pb-lg pt-sm">
          {children}
        </div>
      )}
    </div>
  )
}

export function AppointmentInfoSection({ p }: { p: PatientDetail }) {
  return (
    <>
      <FieldRow label="Booked for" value={p.patient} />
      <FieldRow label="Status" value="Booked" />
      <FieldRow label="Email" value={p.email} />
      <FieldRow label="Phone number" value={p.phone} />
      <FieldRow label="Date of birth" value={p.dateOfBirth} />
      <FieldRow label="Insurance provider" value={p.insuranceProvider} />
      <FieldRow label="Insurance name" value={p.insuranceName} />
      <FieldRow label="Appointment type" value={p.appointmentType} />
      <FieldRow label="Appointment time" value={p.appointmentTime} />
      <FieldRow label="Location" value={p.location} />
      <FieldRow label="Question / statement" value={p.questionText} />
    </>
  )
}

export function BasicDetailsSection({ p }: { p: PatientDetail }) {
  return (
    <>
      <FieldRow label="Age" value={p.age} />
      <FieldRow label="Gender" value={p.gender} />
      <FieldRow label="Phone number" value={p.phone} />
      <FieldRow label="Email" value={p.email} />
      <FieldRow label="Emergency contact" value={p.emergencyContact} />
      <FieldRow label="Relationship" value={p.emergencyRelationship} />
      <FieldRow label="Emergency contact phone" value={p.emergencyPhone} />
      <FieldRow label="Emergency contact email" value={p.emergencyEmail} />
    </>
  )
}

export function InsuranceSection({ p }: { p: PatientDetail }) {
  return (
    <>
      <FieldRow label="Insurance provider" value={p.insuranceProvider} />
      <FieldRow label="Member / Subscriber ID" value={p.memberId} />
      <FieldRow label="Group number" value={p.groupNumber} />
      <FieldRow label="Secondary insurance" value={p.secondaryInsurance ?? '-'} />
    </>
  )
}

export function ConsentSection({ p }: { p: PatientDetail }) {
  return (
    <>
      <FieldRow label="Consent to treatment" value={p.consentTreatment} />
      <FieldRow label="HIPAA acknowledgment" value={p.consentHipaa} />
      <FieldRow label="Financial responsibility" value={p.consentFinancial} />
    </>
  )
}

export function MedicalHistorySection({ p }: { p: PatientDetail }) {
  return (
    <>
      <SubHeader label="Current medications" />
      {p.medications?.length ? (
        p.medications.map((m, i) => (
          <FieldRow key={i} label={m.name} value={`${m.dosage} · ${m.frequency}`} />
        ))
      ) : (
        <FieldRow label="Medications" value="-" />
      )}

      <SubHeader label="Drug allergies" />
      {p.drugAllergies?.length ? (
        p.drugAllergies.map((a, i) => (
          <FieldRow key={i} label={a.medicine} value={a.reaction} />
        ))
      ) : (
        <FieldRow label="Drug allergies" value="-" />
      )}

      <SubHeader label="Non-drug allergies" />
      {p.nonDrugAllergies?.length ? (
        p.nonDrugAllergies.map((a, i) => (
          <FieldRow key={i} label={a.allergen} value={a.reaction} />
        ))
      ) : (
        <FieldRow label="Non-drug allergies" value="-" />
      )}

      <SubHeader label="Preferred pharmacy" />
      <FieldRow label="Pharmacy" value={p.preferredPharmacy} />

      <SubHeader label="Medical conditions" />
      {p.medicalConditions?.length ? (
        p.medicalConditions.map((c, i) => (
          <FieldRow key={i} label="Condition" value={c} />
        ))
      ) : (
        <FieldRow label="Medical conditions" value="-" />
      )}

      <SubHeader label="Surgical history" />
      {p.surgicalHistory?.length ? (
        p.surgicalHistory.map((s, i) => (
          <FieldRow key={i} label={s.procedure} value={s.year} />
        ))
      ) : (
        <FieldRow label="Surgical history" value="-" />
      )}

      <SubHeader label="Family history" />
      {p.familyHistory?.length ? (
        p.familyHistory.map((f, i) => (
          <FieldRow key={i} label={f.condition} value={f.relation} />
        ))
      ) : (
        <FieldRow label="Family history" value="-" />
      )}

      <SubHeader label="Hospitalizations" />
      {p.hospitalizations?.length ? (
        p.hospitalizations.map((h, i) => (
          <FieldRow key={i} label={h.condition} value={h.year} />
        ))
      ) : (
        <FieldRow label="Hospitalizations" value="-" />
      )}
    </>
  )
}

export function SocialHistorySection({ p }: { p: PatientDetail }) {
  return (
    <>
      <FieldRow label="Tobacco / Smoking" value={p.tobacco} />
      <FieldRow label="Alcohol consumption" value={p.alcohol} />
      <FieldRow label="Drug usage" value={p.drugUsage} />
      <FieldRow label="Exercise" value={p.exercise} />
    </>
  )
}
