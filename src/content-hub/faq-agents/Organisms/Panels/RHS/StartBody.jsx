import React, { useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';

export default function StartBody({ initialValues = {} }) {
  const [agentName, setAgentName] = useState(initialValues.agentName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormInput
        name="agentName"
        type="text"
        label="Agent name"
        value={agentName}
        onChange={(e) => setAgentName(e.target.value)}
        required
      />
      <TextArea
        name="description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        noFloatingLabel
      />
    </div>
  );
}
