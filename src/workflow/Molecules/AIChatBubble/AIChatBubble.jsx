import React from 'react';
import './AIChatBubble.css';

function SparkleAvatar({ size = 14 }) {
  const gradId = 'ai-chat-bubble-sparkle-grad';
  return (
    <span className="ai-chat-bubble__sparkle" aria-hidden style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <defs>
          <linearGradient id={gradId} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9b6cf0" />
            <stop offset="55%" stopColor="#6834b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
          fill={`url(#${gradId})`}
        />
      </svg>
    </span>
  );
}

export default function AIChatBubble({ message, options = [], onOptionSelect }) {
  return (
    <div className="ai-chat-bubble">
      <div className="ai-chat-bubble__avatar">
        <SparkleAvatar size={14} />
      </div>
      <div className="ai-chat-bubble__body">
        <p className="ai-chat-bubble__message">{message}</p>
        {options.length > 0 && (
          <div className="ai-chat-bubble__options">
            {options.map((opt, i) => (
              <button
                key={i}
                className="ai-chat-bubble__option"
                onClick={() => onOptionSelect?.(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
