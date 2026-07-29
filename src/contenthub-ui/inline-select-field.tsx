"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "./utils";
import {
  FLOATING_PANEL_LIST_PADDING_CLASSNAME,
  FLOATING_PANEL_SURFACE_CLASSNAME,
} from "./floatingPanelSurface";

export type InlineSelectFieldSize = "sm" | "md";

export type InlineSelectFieldProps = {
  value: string;
  options: readonly string[] | string[];
  onChange: (v: string) => void;
  label?: string;
  size?: InlineSelectFieldSize;
  className?: string;
};

/**
 * Compact custom select (not Radix Select). Menu uses the same shell as the L1 profile popover
 * and is portaled so it is not clipped by overflow-hidden ancestors.
 */
export function InlineSelectField({
  value,
  options,
  onChange,
  label,
  size = "sm",
  className,
}: InlineSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const isMd = size === "md";
  const triggerText = isMd ? "text-[13px]" : "text-[12px]";
  const optionText = isMd ? "text-[13px] py-2" : "text-[12px] py-2";

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuBox(null);
      return;
    }
    const root = rootRef.current;
    const measure = () => {
      const r = root.getBoundingClientRect();
      setMenuBox({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const menu =
    open && menuBox && portalTarget
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              aria-hidden
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
            />
            <div
              role="listbox"
              className={cn(
                FLOATING_PANEL_SURFACE_CLASSNAME,
                FLOATING_PANEL_LIST_PADDING_CLASSNAME,
                "fixed z-[110] flex max-h-[min(240px,calc(100vh-24px))] flex-col gap-xs overflow-y-auto outline-none",
                // Override surface defaults to match Front Desk canonical dropdown
                "rounded-sm border border-border bg-surface",
              )}
              style={{
                top: menuBox.top,
                left: menuBox.left,
                width: menuBox.width,
                minWidth: menuBox.width,
              }}
            >
              {options.map((opt) => {
                const selected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full shrink-0 items-center justify-between rounded-sm px-md text-left transition-colors duration-150",
                      optionText,
                      selected
                        ? "bg-surface-selected text-text-primary"
                        : "text-text-primary hover:bg-surface-hover",
                    )}
                    style={{ fontWeight: 400 }}
                  >
                    <span className="min-w-0 truncate">{opt}</span>
                    {selected && (
                      <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </>,
          portalTarget,
        )
      : null;

  return (
    <div className={cn("w-full", className)} ref={rootRef}>
      {label ? (
        <label
          className="mb-2 block text-[12px] tracking-[-0.24px] text-text-secondary"
          style={{ fontWeight: 400 }}
        >
          {label}
        </label>
      ) : null}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-[34px] w-full items-center justify-between rounded-md border bg-surface px-md text-text-primary transition-colors",
            open
              ? "border-primary ring-[3px] ring-primary/10"
              : "border-border-selected hover:bg-surface-l2",
            triggerText,
          )}
          style={{ fontWeight: 400 }}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="min-w-0 truncate text-left">{value}</span>
          <ChevronDown
            size={16}
            strokeWidth={1.6}
            absoluteStrokeWidth
            className={cn(
              "shrink-0 text-text-icon transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {menu}
      </div>
    </div>
  );
}
