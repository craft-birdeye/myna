import React from 'react';
import iconAgentsTwoStarSparkle from '../../../../assets/icon-agents-two-star-sparkle.svg';
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
            WebkitMaskImage: `url("${iconAgentsTwoStarSparkle}")`,
            maskImage: `url("${iconAgentsTwoStarSparkle}")`,
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
