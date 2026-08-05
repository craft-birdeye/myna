import React, { useState } from 'react';
import './AIPromptBox.css';

export default function AIPromptBox({ placeholder, onSend, onAttach }) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue('');
  };

  return (
    <div className="ai-prompt-box">
      <textarea
        className="ai-prompt-box__textarea"
        placeholder={placeholder || 'What would you like to build? For example: Review response agent replying autonomously.'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        rows={2}
      />
      <div className="ai-prompt-box__toolbar">
        <div className="ai-prompt-box__tools">
          <button className="ai-prompt-box__tool-btn" onClick={onAttach} title="Add">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="ai-prompt-box__tool-btn" title="Dictate">
            <span className="material-symbols-outlined">mic</span>
          </button>
        </div>
        <button
          className={`ai-prompt-box__send-btn${value.trim() ? ' ai-prompt-box__send-btn--active' : ''}`}
          onClick={handleSend}
          title="Send"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}
