import React from 'react';
import iconAgentsPurple from '../../../../assets/icon-agents-purple.svg';
import './StartNode.css';

export default function StartNode({
  title = 'Agent workflow',
  subtitle = 'All locations',
  subtitleIsLink = false,
  selected = false,
}) {
  return (
    <div className={`start-node${selected ? ' start-node--selected' : ''}`}>
      <div className="start-node__icon">
        <img src={iconAgentsPurple} alt="" className="start-node__icon-img" />
      </div>
      <div className="start-node__content">
        <span className="start-node__title">{title}</span>
        {subtitleIsLink ? (
          <span className="start-node__subtitle-link">{subtitle}</span>
        ) : (
          <span className="start-node__subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
