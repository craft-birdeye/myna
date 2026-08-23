import React from 'react';
import RHSSidePanelHeader from '../../../Molecules/RHS/RHSHeader/RHSHeader';
import RHSPanelFooter from '../../../Molecules/RHS/RHSFooter/RHSFooter';
import AgentDetailsBody from './AgentDetailsBody';
import LLMTaskBody from './LLMTaskBody';
import EntityTaskBody from './EntityTaskBody';
import EntityTriggerBody from './EntityTriggerBody';
import ReviewTriggerBody from './ReviewTriggerBody';
import BranchBody from './BranchBody';
import DelayBody from './DelayBody';
import ParallelBody from './ParallelBody';
import LoopBody from './LoopBody';
import SubAgentBody from './SubAgentBody';
import ControlBranchBody from './ControlBranchBody';
import StartBody from './StartBody';
import ConversationTriggerBody from './ConversationTriggerBody';
import ProcedureTaskBody from './ProcedureTaskBody';
import ProcedureDetailBody from './ProcedureDetailBody';
import VoiceCallTaskBody from './VoiceCallTaskBody';
import SendResponseTaskBody from './SendResponseTaskBody';
import styles from './RHS.module.css';

const VARIANTS = {
  start: {
    body: StartBody,
    showActions: false,
    showPromptStrength: false,
  },
  agentDetails: {
    body: AgentDetailsBody,
    showActions: false,
    showPromptStrength: false,
  },
  llmTask: {
    body: LLMTaskBody,
    showActions: true,
    showPromptStrength: true,
  },
  entityTask: {
    body: EntityTaskBody,
    showActions: true,
    showPromptStrength: false,
  },
  voiceCallTask: {
    body: VoiceCallTaskBody,
    showActions: true,
    showPromptStrength: false,
  },
  sendResponseTask: {
    body: SendResponseTaskBody,
    showActions: true,
    showPromptStrength: false,
  },
  entityTrigger: {
    body: EntityTriggerBody,
    showActions: true,
    showPromptStrength: false,
  },
  reviewTrigger: {
    body: ReviewTriggerBody,
    showActions: false,
    showPromptStrength: false,
  },
  branch: {
    body: BranchBody,
    showActions: false,
    showPromptStrength: false,
  },
  delay: {
    body: DelayBody,
    showActions: false,
    showPromptStrength: false,
  },
  parallel: {
    body: ParallelBody,
    showActions: false,
    showPromptStrength: false,
  },
  loop: {
    body: LoopBody,
    showActions: true,
    showPromptStrength: false,
  },
  subagent: {
    body: SubAgentBody,
    showActions: false,
    showPromptStrength: false,
  },
  controlBranch: {
    body: ControlBranchBody,
    showActions: false,
    showPromptStrength: false,
  },
  conversationTrigger: {
    body: ConversationTriggerBody,
    showActions: true,
    showPromptStrength: false,
  },
  procedureTask: {
    body: ProcedureTaskBody,
    showActions: true,
    showPromptStrength: false,
  },
  procedureDetail: {
    body: ProcedureDetailBody,
    showActions: true,
    showPromptStrength: false,
  },
  createCustomProcedure: {
    body: ProcedureDetailBody,
    showActions: false,
    showPromptStrength: false,
  },
};

/** Renders as <fieldset> in read-only mode (so nested controls are natively disabled),
 *  otherwise a plain <div>. */
function FieldsetOrDiv({ as: Tag = 'div', children, ...rest }) {
  return <Tag {...rest}>{children}</Tag>;
}

const PANEL_WIDTH = {
  procedureDetail: 500,
  createCustomProcedure: 500,
};

const DEFAULT_PANEL_WIDTH = 450;

export default function RHS({ variant = 'agentDetails', title, bodyProps, onClose, onSave, onPreview, onBack, viewOnly = false, product = 'automotive', inlineFooter = false, subtitle = null, saveLabel, showPromptStrength: showPromptStrengthProp, titleLayoutMenu = null, titleTabMenu = null }) {
  const config = VARIANTS[variant];
  const Body = config.body;
  const panelWidth = PANEL_WIDTH[variant] ?? DEFAULT_PANEL_WIDTH;
  const showPromptStrength = showPromptStrengthProp ?? config.showPromptStrength;
  const resolvedSaveLabel = saveLabel ?? 'Save';

  return (
      <div className={styles['rhs-panel']} style={{ width: panelWidth }}>
        <RHSSidePanelHeader
          title={title || 'Title'}
          subtitle={subtitle}
          onPreview={viewOnly ? undefined : onPreview}
          onClose={onClose}
          onBack={onBack}
          showActions={viewOnly || variant === 'procedureDetail' || variant === 'createCustomProcedure' ? false : config.showActions}
          showMoreMenu={false}
          titleLayoutMenu={titleLayoutMenu}
          titleTabMenu={titleTabMenu}
        />

        {/* `inlineFooter`: body shrinks-to-fit instead of stretching, so a short panel lets
            the Save button sit right under the content. Once the content is tall enough to
            scroll the body fills the space again and the footer lands at the bottom as usual. */}
        <div
          className={`${styles['rhs-panel__body']}${inlineFooter ? ` ${styles['rhs-panel__body--inline']}` : ''}`}
        >
          {/* Read-only mode uses a disabled <fieldset>, not just pointer-events: that natively
              disables every nested control so Tab-and-type can't edit the panel either. The
              pointer-events guard stays for non-form click handlers (swatch pickers etc.). */}
          <FieldsetOrDiv
            as={viewOnly ? 'fieldset' : 'div'}
            {...(viewOnly ? { disabled: true, className: 'rhs-readonly' } : {})}
            style={{
              pointerEvents: viewOnly ? 'none' : undefined,
              userSelect: viewOnly ? 'text' : undefined,
              ...(viewOnly ? { border: 0, margin: 0, padding: 0, minWidth: 0 } : {}),
            }}
          >
            <Body
              {...(bodyProps || {})}
              viewOnly={viewOnly}
              product={product}
              allowStepsExpand={
                bodyProps?.allowStepsExpand
                ?? (variant === 'procedureDetail' || variant === 'createCustomProcedure')
              }
            />
          </FieldsetOrDiv>
        </div>

        {!viewOnly && (
          <RHSPanelFooter
            onSave={onSave}
            saveLabel={resolvedSaveLabel}
            showPromptStrength={showPromptStrength}
          />
        )}
      </div>
  );
}
