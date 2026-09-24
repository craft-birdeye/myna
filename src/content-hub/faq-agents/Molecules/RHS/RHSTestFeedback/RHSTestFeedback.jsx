import React from 'react';
import { Button } from '../../../elemental-stubs';
import { TextArea } from '../../../elemental-stubs';

export default function RHSTestFeedback({ value, onChange, onSubmit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <TextArea
        name="feedback"
        label="Your feedback"
        value={value}
        onChange={onChange}
        noFloatingLabel
        rows={4}
        placeholder="Output look wrong? Provide feedback to improve your prompt"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="secondary"
          label="Submit to revise prompt"
          disabled={!value || !value.trim()}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
}
