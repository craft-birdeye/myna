import React from 'react';
import iconAgentsPurple from '../../../../assets/icon-agents-purple.svg';
import './StartNode.css';

export default function StartNode({
  title = 'Agent workflow',
  subtitle = 'All locations',
  subtitleIsLink = false,
  selected = false,
  onSubtitleClick = null,
}) {
  return (
    <div className={`start-node${selected ? ' start-node--selected' : ''}`}>
      <div className="start-node__icon">
        <span
          className="ai-gradient-icon start-node__icon-gradient"
          style={{
            WebkitMaskImage: `url(${iconAgentsPurple})`,
            maskImage: `url(${iconAgentsPurple})`,
          }}
          aria-hidden
        />
      </div>
      <div className="start-node__content">
        <span className="start-node__title">{title}</span>
        {subtitleIsLink ? (
          <button type="button" className="start-node__subtitle-link" onClick={onSubtitleClick}>
            {subtitle}
          </button>
        ) : (
          <span className="start-node__subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
