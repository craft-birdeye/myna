"use client";

import * as React from "react";

export type SegmentedToggleItem<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

export interface SegmentedToggleProps<T extends string> {
  items: SegmentedToggleItem<T>[];
  value: T;
  onChange: (value: T) => void;
  iconOnly?: boolean;
  ariaLabel?: string;
  className?: string;
  /** "filled" (default) = gray container, white active pill.
   *  "outline" = white container with border, gray active pill. */
  variant?: "filled" | "outline";
}

export function SegmentedToggle<T extends string>({
  items,
  value,
  onChange,
  iconOnly = false,
  ariaLabel,
  className,
  variant = "filled",
}: SegmentedToggleProps<T>) {
  const containerClass = variant === "outline"
    ? "bg-background border border-border/70 rounded-lg p-[3px]"
    : "bg-[#f0f1f5] dark:bg-[#262b35] rounded-md p-[2px]";

  const activeClass = variant === "outline"
    ? "bg-muted text-foreground"
    : "bg-white dark:bg-[#333a47] text-[#212121] dark:text-[#e4e4e4]";

  const inactiveClass = variant === "outline"
    ? "text-muted-foreground hover:text-foreground"
    : "text-[#888] dark:text-[#6b7280] hover:text-[#555] dark:hover:text-[#c0c6d4]";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex h-[var(--button-height)] items-stretch ${containerClass} ${className ?? ""}`}
    >
      {items.map((item) => {
        const active = item.value === value;
        const sizing = iconOnly ? "h-full aspect-square" : "h-full px-3";
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-pressed={active}
            aria-label={iconOnly ? item.label : undefined}
            title={iconOnly ? item.label : undefined}
            className={`flex items-center justify-center gap-1 rounded-md text-[12px] transition-all duration-200 ${sizing} ${active ? activeClass : inactiveClass}`}
          >
            {item.icon}
            {!iconOnly && <span>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
