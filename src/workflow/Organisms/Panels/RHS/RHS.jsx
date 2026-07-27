import React from 'react';
import RHSSidePanelHeader from '../../../Molecules/RHS/RHSHeader/RHSHeader';
import AgentDetailsBody from './AgentDetailsBody';
import LLMTaskBody from './LLMTaskBody';
import EntityTaskBody from './EntityTaskBody';
import EntityTriggerBody from './EntityTriggerBody';
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
    showActions: true,
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

const PANEL_WIDTH = {
  procedureDetail: 500,
  createCustomProcedure: 500,
};

export default function RHS({ variant = 'agentDetails', title, bodyProps, onClose, onSave, onPreview, onBack, viewOnly = false, product = 'automotive' }) {
  const config = VARIANTS[variant];
  const Body = config.body;
  const panelWidth = PANEL_WIDTH[variant] ?? 390;

  return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: panelWidth,
        height: '100%',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0px 2px 12px 0px rgba(33, 33, 33, 0.06)',
        border: '2px solid transparent',
        overflow: 'hidden',
        fontFamily: '"Roboto", arial, sans-serif',
      }}>
        <RHSSidePanelHeader
          title={title || 'Title'}
          onPreview={viewOnly ? undefined : onPreview}
          onClose={onClose}
          onBack={onBack}
          showActions={viewOnly || variant === 'procedureDetail' || variant === 'createCustomProcedure' ? false : config.showActions}
          showMoreMenu={false}
        />

        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 15px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            pointerEvents: viewOnly ? 'none' : undefined,
            userSelect: viewOnly ? 'text' : undefined,
          }}>
            <Body {...(bodyProps || {})} viewOnly={viewOnly} product={product} />
          </div>
        </div>

      </div>
  );
}
