import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ToolViewerContent } from '../../Drawers/CustomToolViewer/CustomToolViewer';
import styles from './ExternalToolDetails.module.css';

function useMenuRect(open, triggerRef) {
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.bottom + 4, width: r.width });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) {
      setRect(null);
      return undefined;
    }
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  return rect;
}

/**
 * Account → action → dynamic fields for an external integration (e.g. Freshdesk)
 * inside EntityTaskBody's Tool details tab.
 */
export default function ExternalToolDetails({
  config,
  values = {},
  onChange,
  viewOnly = false,
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const accountTriggerRef = useRef(null);
  const actionTriggerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const actionMenuRef = useRef(null);

  const accountId = values.accountId || '';
  const actionId = values.actionId || '';
  const fieldValues = values.fields || {};

  const selectedAccount = useMemo(
    () => (config.accounts || []).find((a) => a.id === accountId) || null,
    [config.accounts, accountId],
  );
  const selectedAction = useMemo(
    () => (config.actions || []).find((a) => a.id === actionId) || null,
    [config.actions, actionId],
  );

  const accountMenuRect = useMenuRect(accountOpen, accountTriggerRef);
  const actionMenuRect = useMenuRect(actionOpen, actionTriggerRef);

  const emit = (patch) => {
    onChange?.({ ...values, ...patch });
  };

  useEffect(() => {
    if (!accountOpen && !actionOpen) return undefined;
    const onDoc = (e) => {
      if (accountOpen) {
        if (accountTriggerRef.current?.contains(e.target)) return;
        if (accountMenuRef.current?.contains(e.target)) return;
        setAccountOpen(false);
      }
      if (actionOpen) {
        if (actionTriggerRef.current?.contains(e.target)) return;
        if (actionMenuRef.current?.contains(e.target)) return;
        setActionOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [accountOpen, actionOpen]);

  const handleSelectAccount = (account) => {
    if (account.status === 'expired' || viewOnly) return;
    emit({ accountId: account.id, actionId: '', fields: {} });
    setAccountOpen(false);
    setActionOpen(false);
  };

  const handleSelectAction = (action) => {
    if (viewOnly) return;
    emit({ accountId, actionId: action.id, fields: {} });
    setActionOpen(false);
  };

  const actionTool = selectedAction
    ? {
        id: `${config.id}-${selectedAction.id}`,
        name: selectedAction.name,
        fields: selectedAction.fields || [],
      }
    : null;

  return (
    <div className={styles.root}>
      {/* Select account */}
      <div className={styles.fieldBlock}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Select account</span>
          <span className={styles.required} aria-hidden>*</span>
        </div>
        <p className={styles.help}>
          Choose the connected account for {config.brandName || config.name}
        </p>
        <div className={styles.dropdownWrap}>
          <button
            ref={accountTriggerRef}
            type="button"
            className={styles.selectTrigger}
            onClick={() => {
              if (viewOnly) return;
              setActionOpen(false);
              setAccountOpen((v) => !v);
            }}
            aria-expanded={accountOpen}
            aria-haspopup="listbox"
            disabled={viewOnly}
          >
            <span className={selectedAccount ? styles.selectValue : styles.selectPlaceholder}>
              {selectedAccount?.label || 'Select account'}
            </span>
            <span className="material-symbols-outlined" aria-hidden>
              expand_more
            </span>
          </button>
          {accountOpen && accountMenuRect && createPortal(
            <div
              ref={accountMenuRef}
              className={styles.menu}
              role="listbox"
              style={{
                left: accountMenuRect.left,
                top: accountMenuRect.top,
                width: accountMenuRect.width,
              }}
            >
              {(config.accounts || []).map((account) => (
                <button
                  key={account.id}
                  type="button"
                  role="option"
                  aria-selected={account.id === accountId}
                  className={`${styles.menuItem}${account.id === accountId ? ` ${styles.menuItemSelected}` : ''}${
                    account.status === 'expired' ? ` ${styles.menuItemDisabled}` : ''
                  }`}
                  onClick={() => handleSelectAccount(account)}
                  disabled={account.status === 'expired'}
                >
                  <span
                    className={`${styles.statusDot}${
                      account.status === 'expired' ? ` ${styles.statusDotExpired}` : ''
                    }`}
                  />
                  <span className={styles.menuItemText}>{account.label}</span>
                </button>
              ))}
            </div>,
            document.body,
          )}
        </div>
      </div>

      {/* Select action — only after account */}
      {selectedAccount && (
        <div className={styles.fieldBlock}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Select action</span>
            <span className={styles.required} aria-hidden>*</span>
          </div>
          <p className={styles.help}>Choose the {config.brandName || config.name} action for this step</p>
          <div className={styles.dropdownWrap}>
            <button
              ref={actionTriggerRef}
              type="button"
              className={styles.selectTrigger}
              onClick={() => {
                if (viewOnly) return;
                setAccountOpen(false);
                setActionOpen((v) => !v);
              }}
              aria-expanded={actionOpen}
              aria-haspopup="listbox"
              disabled={viewOnly}
            >
              <span className={selectedAction ? styles.selectValue : styles.selectPlaceholder}>
                {selectedAction?.name || 'Select action'}
              </span>
              <span className="material-symbols-outlined" aria-hidden>
                expand_more
              </span>
            </button>
            {actionOpen && actionMenuRect && createPortal(
              <div
                ref={actionMenuRef}
                className={styles.menu}
                role="listbox"
                style={{
                  left: actionMenuRect.left,
                  top: actionMenuRect.top,
                  width: actionMenuRect.width,
                }}
              >
                {(config.actions || []).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    role="option"
                    aria-selected={action.id === actionId}
                    className={`${styles.menuItem}${action.id === actionId ? ` ${styles.menuItemSelected}` : ''}`}
                    onClick={() => handleSelectAction(action)}
                  >
                    <span
                      className={styles.actionIcon}
                      style={{ background: config.iconBg || '#f2f4f7' }}
                      aria-hidden
                    >
                      <span className="material-symbols-outlined">{config.icon || 'build'}</span>
                    </span>
                    <span className={styles.menuItemBody}>
                      <span className={styles.menuItemTitle}>{action.name}</span>
                      {action.description && (
                        <span className={styles.menuItemDesc}>{action.description}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>,
              document.body,
            )}
          </div>
        </div>
      )}

      {/* Dynamic fields — only after action */}
      {actionTool && (
        <div className={styles.actionFields}>
          <ToolViewerContent
            key={`${actionTool.id}-${(actionTool.fields || []).map((f) => `${f.id}:${f.helpText || ''}:${f.infoText || ''}`).join('|')}`}
            tool={actionTool}
            embedded
            initialValues={fieldValues}
            onFieldValuesChange={(next) => emit({ accountId, actionId, fields: next })}
          />
        </div>
      )}
    </div>
  );
}
