import React, { useState, useEffect } from 'react';
import {
  getProcedureById,
  resolveProcedurePanelText,
  isCustomProcedureId,
} from '../../../services/procedureService';
import { ProcedureListCard } from '../../../../components/ProcedureListCard/ProcedureListCard';
import SystemPromptInput from '../../../Molecules/Inputs/SystemPromptInput/SystemPromptInput.jsx';
import { useOptionalAgentSystemPromptStore } from '../../../../data/AgentSystemPromptStoreContext';
import styles from './ProcedureTaskBody.module.css';

export default function ProcedureTaskBody({
  initialValues = {},
  onFieldChange,
  onSelectProcedure,
  viewOnly = false,
  product = 'automotive',
}) {
  const [procedureIds, setProcedureIds] = useState(initialValues.procedureIds ?? []);
  const overrides = initialValues.procedureOverrides || {};
  const promptStore = useOptionalAgentSystemPromptStore();

  useEffect(() => {
    setProcedureIds(initialValues.procedureIds ?? []);
  }, [initialValues.procedureIds]);

  const procedures = procedureIds.map((id) => {
    const found = getProcedureById(id);
    if (found) return found;
    if (isCustomProcedureId(id)) return { id, name: 'Custom', whenToUse: '' };
    return null;
  }).filter(Boolean);
  const handleRemove = (id) => {
    const next = procedureIds.filter((pid) => pid !== id);
    setProcedureIds(next);
    onFieldChange?.('procedureIds', next);
  };

  const handleDuplicate = (id) => {
    const next = [...procedureIds, id];
    setProcedureIds(next);
    onFieldChange?.('procedureIds', next);
  };

  return (
    <div
      className={styles.body}
      style={viewOnly ? { pointerEvents: 'auto' } : undefined}
    >
      {promptStore && (
        <div className={styles.systemPrompt}>
          {viewOnly ? (
            <>
              <div className={styles.systemPromptLabelRow}>
                <span className={styles.systemPromptLabel}>System prompt</span>
                <span className={styles.systemPromptRequired} aria-hidden>*</span>
              </div>
              <textarea
                className={styles.systemPromptReadOnly}
                value={promptStore.systemPrompt}
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                rows={8}
              />
            </>
          ) : (
            <SystemPromptInput
              value={promptStore.systemPrompt}
              onChange={promptStore.setSystemPrompt}
              required
              tall
              showTriggerFields={false}
            />
          )}
        </div>
      )}

      <div className={styles.list}>
        {procedures.map((p) => {
          const { name, whenToUse } = resolveProcedurePanelText(p, overrides, product);
          return (
            <ProcedureListCard
              key={p.id}
              title={name}
              description={whenToUse}
              onClick={() => onSelectProcedure?.(p.id)}
              onEdit={!viewOnly ? () => onSelectProcedure?.(p.id) : undefined}
              onDuplicate={!viewOnly ? () => handleDuplicate(p.id) : undefined}
              onRemove={!viewOnly ? () => handleRemove(p.id) : undefined}
            />
          );
        })}
      </div>

    </div>
  );
}
