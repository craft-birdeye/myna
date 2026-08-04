import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './CanvasNodeBody.css';

const GAP = 8;
const MARGIN = 8;

function isDescriptionTruncated(el) {
  if (!el) return false;
  // -webkit-line-clamp often reports scrollHeight === clientHeight; measure an unclamped clone.
  const clone = el.cloneNode(true);
  clone.classList.add('cnb__description--measure');
  clone.style.width = `${el.clientWidth}px`;
  el.parentNode?.appendChild(clone);
  const truncated = clone.scrollHeight > el.clientHeight + 1;
  clone.remove();
  return truncated;
}

function placeTooltip(tipEl, anchorEl) {
  const tip = tipEl.getBoundingClientRect();
  const anchor = anchorEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceAbove = anchor.top - MARGIN;
  const spaceBelow = vh - anchor.bottom - MARGIN;
  const placeBelow = tip.height + GAP <= spaceBelow || spaceBelow >= spaceAbove;

  let x = anchor.left + anchor.width / 2;
  const halfW = tip.width / 2;
  x = Math.min(Math.max(x, MARGIN + halfW), vw - MARGIN - halfW);

  const y = placeBelow ? anchor.bottom + GAP : anchor.top - GAP;
  return { x, y, placement: placeBelow ? 'below' : 'above' };
}

export default function CanvasNodeBody({
  stepNumber,
  title,
  description,
  nodeType = 'task',
  titlePlaceholder = 'Enter name',
  descriptionPlaceholder = 'Enter description',
}) {
  const hasTitle = Boolean(String(title || '').trim());
  const hasDescription = Boolean(String(description || '').trim());
  const descRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    setOpen(false);
    setPos(null);
  }, [description]);

  useLayoutEffect(() => {
    if (!open || !tipRef.current || !descRef.current) return;

    const next = placeTooltip(tipRef.current, descRef.current);
    setPos(next);

    function reposition() {
      if (!tipRef.current || !descRef.current) return;
      setPos(placeTooltip(tipRef.current, descRef.current));
    }

    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, description]);

  function showTooltip() {
    if (!hasDescription || !descRef.current) return;
    if (!isDescriptionTruncated(descRef.current)) return;
    setPos(null);
    setOpen(true);
  }

  function hideTooltip() {
    setOpen(false);
    setPos(null);
  }

  return (
    <div className="cnb">
      <ol className={`cnb__step cnb__step--${nodeType}`} start={stepNumber}>
        <li>
          <span className={hasTitle ? undefined : 'cnb__placeholder'}>
            {hasTitle ? title : titlePlaceholder}
          </span>
        </li>
      </ol>
      {(hasDescription || descriptionPlaceholder) && (
        <>
          <p
            ref={descRef}
            className={`cnb__description${hasDescription ? '' : ' cnb__placeholder'}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            {hasDescription ? description : descriptionPlaceholder}
          </p>
          {open && hasDescription && createPortal(
            <span
              ref={tipRef}
              className={`cnb__tooltip${pos ? '' : ' cnb__tooltip--measuring'}`}
              role="tooltip"
              data-placement={pos?.placement ?? 'below'}
              style={pos ? { left: pos.x, top: pos.y } : undefined}
            >
              {description}
            </span>,
            document.body,
          )}
        </>
      )}
    </div>
  );
}
