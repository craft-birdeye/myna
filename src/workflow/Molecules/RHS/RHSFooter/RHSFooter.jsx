import React, { useState } from 'react';
import { Button } from '../../../elemental-stubs';
import PromptStrength from '../../PromptStrength/PromptStrength';
import styles from './RHSFooter.module.css';

const SUGGESTIONS = [
  'Add examples of reviews and expected outputs to improve accuracy',
  'Specify what to return if no product or service is mentioned',
];

export default function RHSPanelFooter({
  onSave,
  saveLabel = 'Save',
  disabled = false,
  /** R1: shown above Save when a required field inside an accordion is empty.
   *  Clicking it re-runs the same save attempt, which re-opens/re-highlights it. */
  missingFieldsWarning = false,
  showPromptStrength = false,
  promptStrength = 'Weak',
  promptFillWidth = 52,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${styles.footer}${expanded ? ` ${styles['footer--raised']}` : ''}`}>
      {showPromptStrength && expanded && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className={styles.closeSuggestions}
              aria-label="Close suggestions"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 16,
                  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                }}
              >
                close
              </span>
            </button>
          </div>
          <p className={styles.suggestionsLabel}>Suggestions to improve your prompt</p>
          <ul className={styles.suggestionsList}>
            {SUGGESTIONS.map((s) => (
              <li key={s} className={styles.suggestionsItem}>
                {s}
              </li>
            ))}
          </ul>
        </>
      )}
      {showPromptStrength && (
        <PromptStrength
          promptStrength={promptStrength}
          promptFillWidth={promptFillWidth}
          onToggle={() => setExpanded((v) => !v)}
          toggleLabel={expanded ? 'Hide' : 'View suggestions'}
        />
      )}
      {missingFieldsWarning && (
        <button
          type="button"
          className={styles.missingFieldsWarning}
          onClick={onSave}
        >
          <span className={`material-symbols-outlined ${styles.missingFieldsWarningIcon}`} aria-hidden>
            info
          </span>
          Mandatory fields missing
        </button>
      )}
      <Button
        type="primary"
        label={saveLabel}
        expanded
        disabled={disabled}
        onClick={onSave}
      />
    </div>
  );
}
