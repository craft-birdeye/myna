import React from 'react';
import { AiSparkleGlyphIcon } from '../../../../assets/AiSparkleGlyphIcon';
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
        <AiSparkleGlyphIcon size={22} />
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
