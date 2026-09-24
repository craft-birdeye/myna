"use client";

import * as React from "react";

import { cn } from "./utils";

export type TextTabItem<T extends string> = {
  id: T;
  label: React.ReactNode;
  suffix?: React.ReactNode;
  disabled?: boolean;
};

export interface TextTabsRowProps<T extends string> {
  items: TextTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Optional `aria-label` for the tablist row. */
  ariaLabel?: string;
  variant?: "underline" | "plain";
  className?: string;
}

/**
 * Underline text tabs: the tablist has a full-width `border-b` baseline so gaps
 * between triggers do not break the rule; each tab uses a 2px bottom border
 * (primary or transparent) with `-mb-px` so the active indicator stacks on the baseline.
 */
export function TextTabsRow<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  variant = "underline",
  className,
}: TextTabsRowProps<T>) {
  const isPlain = variant === "plain";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap items-end gap-x-2 gap-y-2",
        !isPlain && "border-b border-border",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-2 px-2 pb-2 pt-1 text-sm font-medium transition-colors",
              !isPlain && "-mb-px",
              "border-b-2",
              isActive
                ? isPlain
                  ? "border-primary text-foreground hover:text-foreground"
                  : "border-primary text-primary hover:text-primary"
                : cn(
                    "border-transparent text-muted-foreground hover:text-foreground",
                    !isPlain && "hover:border-border",
                  ),
              item.disabled && "pointer-events-none opacity-50",
            )}
          >
            {item.label}
            {item.suffix != null ? item.suffix : null}
          </button>
        );
      })}
    </div>
  );
}
