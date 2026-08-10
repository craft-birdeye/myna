import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface SkeletonCardProps {
  position: { x: number; y: number };
  delay?: number;
  contentType?: 'facebook' | 'instagram' | 'linkedin' | 'blog' | 'landing' | 'email' | 'reel';
  currentStep?: number;
}

const CONTENT_STEPS: Record<string, string[]> = {
  blog: [
    'Researching topic and sources',
    'Outlining key sections',
    'Writing introduction',
    'Developing main content',
    'Adding supporting visuals',
    'Finalizing and reviewing',
  ],
  facebook: [
    'Crafting the concept',
    'Writing engaging copy',
    'Selecting hashtags',
    'Reviewing for clarity',
  ],
  reel: [
    'Writing the script',
    'Planning scene flow',
    'Structuring the edit',
    'Adding final touches',
  ],
  landing: [
    'Designing page structure',
    'Writing compelling copy',
    'Crafting the layout',
    'Optimizing for conversion',
  ],
  email: [
    'Writing subject line',
    'Composing body content',
    'Crafting call-to-action',
    'Testing readability',
  ],
};

const CheckIcon = () => (
  <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="#4CAE3D" />
    <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="size-[16px] flex items-center justify-center">
    <div className="size-[14px] rounded-full border-2 border-gray-300 border-t-purple-600 animate-spin" />
  </div>
);

const UpcomingCircle = () => (
  <div className="size-[16px] flex items-center justify-center">
    <div className="size-[14px] rounded-full border-2 border-border" />
  </div>
);

export const SkeletonCard = ({
  position,
  delay = 0,
  contentType = 'facebook',
  currentStep,
}: SkeletonCardProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = CONTENT_STEPS[contentType] || CONTENT_STEPS.facebook;

  useEffect(() => {
    if (currentStep !== undefined) {
      setActiveStep(currentStep);
      return;
    }
    const timer = setInterval(() => {
      setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, [currentStep, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: contentType === 'blog' || contentType === 'landing' || contentType === 'email' ? 650 : 550,
      }}
      className="bg-white rounded-lg relative"
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-[-1px] rounded-[13px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #7C3AED, #A78BFA, #DDD6FE, #A78BFA, #7C3AED)',
          backgroundSize: '300% 100%',
          animation: 'gradient-shift 4s ease-in-out infinite',
        }}
      />
      {/* White inset to create border effect */}
      <div className="absolute inset-0 bg-white rounded-lg pointer-events-none" />

      <div className="relative p-[16px] flex flex-col gap-[12px]">
        {/* Header shimmer */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-[8px]">
            <div className="w-[20px] h-[20px] rounded-full animate-shimmer" />
            <div className="w-[20px] h-[20px] rounded-full animate-shimmer" />
            <div className="w-[100px] h-[14px] rounded-[4px] animate-shimmer" />
            <div className="w-[40px] h-[20px] rounded-[4px] animate-shimmer" />
          </div>
        </div>

        {/* Progress Checklist */}
        <div className="relative rounded-lg w-full">
          <div className="absolute border border-border inset-0 pointer-events-none rounded-lg" />
          <div className="p-[24px] flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[12px]">
              {steps.map((step, index) => {
                const isCompleted = index < activeStep;
                const isActive = index === activeStep;
                const isUpcoming = index > activeStep;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.25 }}
                    className="flex items-start gap-[12px]"
                  >
                    <div className="shrink-0 mt-[2px]">
                      {isCompleted && (
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                          <CheckIcon />
                        </motion.div>
                      )}
                      {isActive && <LoadingSpinner />}
                      {isUpcoming && <UpcomingCircle />}
                    </div>
                    <span
                      className={`text-[13px] leading-[20px] transition-colors duration-300 ${
                        isUpcoming ? 'text-text-secondary' : 'text-text-primary'
                      }`}
                    >
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
