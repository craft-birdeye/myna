import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CheckIcon, LoadingSpinner, UpcomingCircle } from './StepIcons';
import {
  MessageSquare, Mail, Share2, BookOpen, Megaphone, HelpCircle,
} from 'lucide-react';

export type ContentCardType = 'faq' | 'social' | 'email' | 'blog' | 'ads' | 'response';

const TYPE_META: Record<ContentCardType, {
  label: string;
  icon: React.ReactNode;
  steps: string[];
  color: string;
}> = {
  faq: {
    label: 'FAQ',
    icon: <HelpCircle size={12} strokeWidth={1.6} absoluteStrokeWidth />,
    steps: ['Researching question', 'Generating answer', 'Scoring for brand voice', 'Finalizing'],
    color: '#9FB4E5',
  },
  social: {
    label: 'Social post',
    icon: <Share2 size={12} strokeWidth={1.6} absoluteStrokeWidth />,
    steps: ['Choosing platform tone', 'Writing caption', 'Adding hashtags', 'Formatting'],
    color: '#B5A8E8',
  },
  email: {
    label: 'Email',
    icon: <Mail size={12} strokeWidth={1.6} absoluteStrokeWidth />,
    steps: ['Personalising subject', 'Crafting body', 'Adding CTA', 'Finalizing'],
    color: '#8ECBDC',
  },
  blog: {
    label: 'Blog post',
    icon: <BookOpen size={12} strokeWidth={1.6} absoluteStrokeWidth />,
    steps: ['Outlining sections', 'Generating content', 'SEO optimisation', 'Finalizing'],
    color: '#A8D8B5',
  },
  ads: {
    label: 'Ad copy',
    icon: <Megaphone size={12} strokeWidth={1.6} absoluteStrokeWidth />,
    steps: ['Crafting headline', 'Writing body', 'Adding CTA', 'Finalizing'],
    color: '#E8C5A8',
  },
  response: {
    label: 'Review response',
    icon: <MessageSquare size={12} strokeWidth={1.6} absoluteStrokeWidth />,
    steps: ['Reading review', 'Matching tone', 'Writing response', 'Brand check'],
    color: '#E8A8C5',
  },
};

interface GenericSkeletonCardProps {
  type: ContentCardType;
  /** Sequential index within its type group (0-based) */
  index: number;
  position: { x: number; y: number };
  /** Seconds to wait before the animation begins */
  delay?: number;
  onComplete?: () => void;
}

export const GenericSkeletonCard = ({
  type,
  index,
  position,
  delay = 0,
  onComplete,
}: GenericSkeletonCardProps) => {
  const meta = TYPE_META[type];
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    meta.steps.forEach((_, i) => {
      const t = setTimeout(() => {
        setActiveStep(i + 1);
        if (i === meta.steps.length - 1) {
          setDone(true);
          onCompleteRef.current?.();
        }
      }, delay * 1000 + (i + 1) * 900);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{ position: 'absolute', left: position.x, top: position.y, width: 480 }}
      className="bg-white rounded-lg relative"
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-[-3px] rounded-[14px] pointer-events-none"
        style={{
          background: done
            ? '#4CAE3D'
            : `linear-gradient(90deg, ${meta.color}, #C8B5EC, #D8BDEA, #E8C5E8, #E8D5C8, #F0E8B8, #D8E8B8, ${meta.color})`,
          backgroundSize: '400% 100%',
          animation: done ? 'none' : 'gradient-shift 5s ease-in-out infinite',
          transition: 'background 0.4s ease',
        }}
      />
      <div className="absolute inset-0 bg-white rounded-lg pointer-events-none" />

      <div className="relative p-4 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground">
            {meta.icon}
            <span className="text-[11px]">{meta.label} {index + 1}</span>
          </div>
          <div className="w-20 h-3.5 rounded-full bg-muted animate-pulse" />
        </div>

        {/* Progress checklist */}
        <div className="relative rounded-lg">
          <div className="absolute border border-border inset-0 pointer-events-none rounded-lg" />
          <div className="p-4 flex flex-col gap-2">
            {meta.steps.map((step, i) => {
              const isCompleted = i < activeStep;
              const isActive = i === activeStep;
              const isUpcoming = i > activeStep;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="mt-0.5">
                    {isCompleted && <CheckIcon />}
                    {isActive && <LoadingSpinner />}
                    {isUpcoming && <UpcomingCircle />}
                  </div>
                  <span className={`text-[13px] leading-5 transition-colors duration-300 ${isUpcoming ? 'text-text-secondary' : 'text-text-primary'}`}>
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
