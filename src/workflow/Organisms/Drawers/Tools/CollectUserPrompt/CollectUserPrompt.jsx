import React from 'react';
import { DrawerHeader } from '../../../../elemental-stubs';
import VariableChip from '../../../../Molecules/Inputs/VariableChip/VariableChip';

const font = '"Roboto", arial, sans-serif';

const COLORS = {
  primary: '#212121',
  secondary: '#757575',
  border: '#cccccc',
  required: '#de1b0c',
  white: '#ffffff',
};

export default function CollectUserPrompt({
  title = 'Collect user prompt',
  onBack,
  onSave,
}) {
  return (
    <div style={{ width: 650, maxWidth: '100%', background: COLORS.white, fontFamily: font, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
      <DrawerHeader
        title={title}
        onBack={onBack}
        actions={[{ label: 'Save', onClick: onSave }]}
      />

      <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.primary }}>Collect from</span>
            <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.required }}>*</span>
          </div>
          <div style={{ display: 'flex', padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 4 }}>
            <VariableChip value="User prompt" type="variable" readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
