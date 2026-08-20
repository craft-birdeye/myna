import React, { useState } from 'react';
import { FormInput, Toggle, DrawerHeader } from '../../../../elemental-stubs';

const font = '"Inter", sans-serif';

const COLORS = {
  primary: '#212121',
  secondary: '#555',
  tertiary: '#8f8f8f',
  divider: '#eaeaea',
  border: '#cccccc',
  white: '#ffffff',
};

const AUTO_APPROVE_FIELDS = [
  { id: 'faq', label: 'FAQ' },
  { id: 'comparison-page', label: 'Comparison page' },
  { id: 'how-to-article', label: 'How-to article' },
  { id: 'local-landing-page', label: 'Local landing page' },
  { id: 'structured-listing-update', label: 'Structured listing update' },
];

export default function SendToAiRecommendations({
  title = 'Send to AI recommendations',
  onBack,
  onSave,
}) {
  const [maxRecommendations, setMaxRecommendations] = useState('10');
  const [autoApprove, setAutoApprove] = useState(false);
  const [approvedFields, setApprovedFields] = useState([]);

  const toggleField = (id) =>
    setApprovedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );

  return (
    <div style={{ width: 650, maxWidth: '100%', background: COLORS.white, fontFamily: font, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
      <DrawerHeader
        title={title}
        onBack={onBack}
        actions={[{ label: 'Save', onClick: () => onSave?.({ maxRecommendations, autoApprove, approvedFields }) }]}
      />

      <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Max recommendations */}
        <div style={{ maxWidth: 320 }}>
          <FormInput
            type="number"
            name="max-recommendations"
            label="Enter maximum number of recommendations"
            value={maxRecommendations}
            min="1"
            onChange={(e) => setMaxRecommendations(e.target.value)}
          />
        </div>

        {/* Auto-approve toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, lineHeight: '20px', color: COLORS.primary }}>
            Auto-approve recommendations
          </span>
          <Toggle
            name="auto-approve-recommendations"
            checked={autoApprove}
            roundedToggle
            onChange={(value) => setAutoApprove(value)}
          />
        </div>

        {/* Fields to auto approve — only when auto-approve is on */}
        {autoApprove && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.primary }}>
              Select fields to auto approve
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {AUTO_APPROVE_FIELDS.map((field) => (
                <div
                  key={field.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 4px',
                    borderBottom: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <FormInput
                    type="checkbox"
                    name={`auto-approve-${field.id}`}
                    checked={approvedFields.includes(field.id)}
                    onChange={() => toggleField(field.id)}
                  />
                  <span style={{ fontSize: 14, lineHeight: '20px', color: COLORS.primary }}>{field.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
