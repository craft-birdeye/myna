import React, { useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import VariableChip from '../../../Molecules/Inputs/VariableChip/VariableChip';
import FieldPickerModal from '../../Modals/FieldPickerModal/FieldPickerModal';

const font = '"Roboto", arial, sans-serif';

function SectionLabel({ label, showInfo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 18 }}>
      <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '18px', letterSpacing: '-0.24px', color: '#212121', fontFamily: font }}>
        {label}
      </span>
      {showInfo && <i className="icon_phoenix-info" style={{ fontSize: 16, color: '#8f8f8f', cursor: 'pointer' }} />}
    </div>
  );
}

/* Variable chip input box — shows chips + an {x} add trigger */
function LoopOverField({ chips, onAdd, onRemove }) {
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);

  return (
    <>
      <div style={{
        border: '1px solid #d1d5db',
        borderRadius: 4,
        padding: '6px 8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        minHeight: 38,
        background: '#fff',
        boxSizing: 'border-box',
      }}>
        {chips.map((chip, i) => (
          <VariableChip
            key={i}
            value={chip}
            type="variable"
            onDelete={() => onRemove(i)}
          />
        ))}
        <button
          type="button"
          onClick={() => setFieldPickerOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            height: 26,
            padding: '1px 6px 1px 0',
            background: '#fff',
            border: '1px solid #d1e5f9',
            borderRadius: 4,
            cursor: 'pointer',
            color: '#9aaac4',
            fontSize: 11,
            fontFamily: font,
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 25,
            height: 24,
            background: '#ecf5fd',
            borderRight: '1px solid #d1e5f9',
            marginRight: 4,
            fontSize: 11,
            color: '#1976d2',
            fontFamily: 'monospace',
          }}>{'{x}'}</span>
        </button>
      </div>
      {fieldPickerOpen && (
        <FieldPickerModal
          onClose={() => setFieldPickerOpen(false)}
          onSelectField={(value) => {
            onAdd(value);
            setFieldPickerOpen(false);
          }}
          showTriggerFields
        />
      )}
    </>
  );
}

export default function LoopBody({ initialValues = {}, onFieldChange }) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [loopMode, setLoopMode] = useState(initialValues.loopMode ?? 'manual');
  const [chips, setChips] = useState(
    initialValues.loopOver ? [initialValues.loopOver] : []
  );

  const handleAddChip = (val) => {
    const next = [...chips, val];
    setChips(next);
    onFieldChange?.('loopOver', next[0] ?? null);
  };

  const handleRemoveChip = (i) => {
    const next = chips.filter((_, idx) => idx !== i);
    setChips(next);
    onFieldChange?.('loopOver', next[0] ?? null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormInput
        name="loopName"
        type="text"
        label="Name"
        placeholder="Enter name"
        value={name}
        onChange={(e) => { setName(e.target.value); onFieldChange?.('name', e.target.value); }}
        required
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={(e) => { setDescription(e.target.value); onFieldChange?.('description', e.target.value); }}
        noFloatingLabel
        required
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '18px', color: '#212121', fontFamily: font }}>
          How should this loop run?
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormInput
            type="radio"
            name="loopMode"
            value="manual"
            label="Manual"
            checked={loopMode === 'manual'}
            onChange={() => { setLoopMode('manual'); onFieldChange?.('loopMode', 'manual'); }}
            labelInside
          />
          <FormInput
            type="radio"
            name="loopMode"
            value="variable"
            label="Set from variable"
            checked={loopMode === 'variable'}
            onChange={() => { setLoopMode('variable'); onFieldChange?.('loopMode', 'variable'); }}
            labelInside
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SectionLabel label="Loop over" showInfo />
        <LoopOverField chips={chips} onAdd={handleAddChip} onRemove={handleRemoveChip} />
        <span style={{ fontSize: 11, lineHeight: '16px', color: '#8f8f8f', fontFamily: font }}>
          Select the variable to iterate over
        </span>
      </div>
    </div>
  );
}
