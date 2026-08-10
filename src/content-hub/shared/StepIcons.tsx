import React from 'react';

export const CheckIcon = () => (
  <svg className="size-[16px] shrink-0" fill="none" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="#4CAE3D" />
    <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LoadingSpinner = () => (
  <div className="size-[16px] flex items-center justify-center shrink-0">
    <div className="size-[14px] rounded-full border-2 border-gray-300 border-t-purple-600 animate-spin" />
  </div>
);

export const UpcomingCircle = () => (
  <div className="size-[16px] flex items-center justify-center shrink-0">
    <div className="size-[14px] rounded-full border-2 border-border" />
  </div>
);
