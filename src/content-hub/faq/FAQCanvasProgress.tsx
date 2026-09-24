import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FAQSkeletonCard } from './FAQSkeletonCard';
import { ZoomIn, ZoomOut } from 'lucide-react';

const FAQ_CARD_W = 500;
const FAQ_CARD_GAP = 32;
const FAQ_COLS = 3;
const FAQ_ROW_H = 240;
const FAQ_COUNT = 12;

function getPosition(index: number) {
  const col = index % FAQ_COLS;
  const row = Math.floor(index / FAQ_COLS);
  return {
    x: col * (FAQ_CARD_W + FAQ_CARD_GAP) + 60,
    y: row * FAQ_ROW_H + 60,
  };
}

interface FAQCanvasProgressProps {
  onAllComplete: () => void;
}

export const FAQCanvasProgress = ({ onAllComplete }: FAQCanvasProgressProps) => {
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const allCompleteRef = useRef(false);
  const onAllCompleteRef = useRef(onAllComplete);
  useEffect(() => { onAllCompleteRef.current = onAllComplete; }, [onAllComplete]);

  // Safety timer: last card (index 11, delay 1.65s) finishes at 1650 + 4*900 = 5250ms.
  // Fire at 6000ms regardless of callback state to guarantee transition.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!allCompleteRef.current) {
        allCompleteRef.current = true;
        setCompletedCards(new Set(Array.from({ length: FAQ_COUNT }, (_, i) => i)));
        onAllCompleteRef.current();
      }
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  const handleCardComplete = useCallback((index: number) => {
    setCompletedCards(prev => {
      const next = new Set(prev).add(index);
      if (next.size === FAQ_COUNT && !allCompleteRef.current) {
        allCompleteRef.current = true;
        setTimeout(() => onAllCompleteRef.current(), 600);
      }
      return next;
    });
  }, []);

  const completedCount = completedCards.size;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  }, [isPanning]);

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(prev => Math.max(0.3, Math.min(2, prev * (e.deltaY < 0 ? 1.05 : 0.95))));
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  return (
    <div className="flex-grow h-full bg-muted overflow-hidden relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background rounded-lg z-30 shadow-sm border border-border">
        <div className="flex flex-row items-center px-4 py-2 gap-4">
          <span className="text-[13px] text-foreground text-nowrap">
            {completedCount < FAQ_COUNT
              ? `Generating FAQs · ${completedCount}/${FAQ_COUNT} done`
              : '✓ All FAQs generated'}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
              <ZoomOut size={16} strokeWidth={1.6} className="text-foreground" />
            </button>
            <span className="text-[13px] text-muted-foreground text-nowrap">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
              <ZoomIn size={16} strokeWidth={1.6} className="text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ position: 'relative' }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '300%',
            height: '300%',
          }}
        >
          {Array.from({ length: FAQ_COUNT }).map((_, i) => (
            <FAQSkeletonCard
              key={i}
              faqIndex={i}
              position={getPosition(i)}
              delay={i * 0.15}
              onComplete={() => handleCardComplete(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
