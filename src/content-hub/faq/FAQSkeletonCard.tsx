import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CheckIcon, LoadingSpinner, UpcomingCircle } from '../shared/StepIcons';

const FAQ_STEPS = [
  'Researching question',
  'Generating answer',
  'Scoring for brand voice',
  'Finalizing',
];

interface FAQSkeletonCardProps {
  position: { x: number; y: number };
  faqIndex: number;
  delay?: number;
  onComplete?: () => void;
}

export const FAQSkeletonCard = ({ position, faqIndex, delay = 0, onComplete }: FAQSkeletonCardProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);
  // Use a ref so the effect never re-runs due to onComplete identity changes
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    FAQ_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setActiveStep(i + 1);
        if (i === FAQ_STEPS.length - 1) {
          setDone(true);
          onCompleteRef.current?.();
        }
      }, delay * 1000 + (i + 1) * 900);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]); // intentionally omit onComplete — using ref instead

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 500,
      }}
      className="bg-white rounded-lg relative"
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-[-1px] rounded-[13px] pointer-events-none"
        style={{
          background: done
            ? '#4CAE3D'
            : 'linear-gradient(90deg, #7C3AED, #A78BFA, #DDD6FE, #A78BFA, #7C3AED)',
          backgroundSize: '300% 100%',
          animation: done ? 'none' : 'gradient-shift 4s ease-in-out infinite',
          transition: 'background 0.4s ease',
        }}
      />
      <div className="absolute inset-0 bg-white rounded-lg pointer-events-none" />

      <div className="relative p-[16px] flex flex-col gap-[12px]">
        {/* Header shimmer */}
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
              <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3 5h6M3 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] text-muted-foreground">FAQ {faqIndex + 1}</span>
          </div>
          <div className="w-[80px] h-[14px] rounded-[4px] animate-shimmer" />
        </div>

        {/* Progress checklist */}
        <div className="relative rounded-lg w-full">
          <div className="absolute border border-border inset-0 pointer-events-none rounded-lg" />
          <div className="p-[16px] flex flex-col gap-[12px]">
            {FAQ_STEPS.map((step, index) => {
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              const isUpcoming = index > activeStep;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.2 }}
                  className="flex items-start gap-[10px]"
                >
                  <div className="mt-[2px]">
                    {isCompleted && <CheckIcon />}
                    {isActive && <LoadingSpinner />}
                    {isUpcoming && <UpcomingCircle />}
                  </div>
                  <span className={`text-[13px] leading-[20px] transition-colors duration-300 ${isUpcoming ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
