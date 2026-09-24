"use client";

import * as React from "react";
import {
  MAIN_VIEW_HEADER_BAND_CLASS,
  MAIN_VIEW_PRIMARY_HEADING_CLASS,
  MAIN_VIEW_SUBHEADING_CLASS,
} from "@/contenthub-ui/mainViewTitleClasses";
import { cn } from "@/contenthub-ui/utils";

export interface MainCanvasViewHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Merged onto the outer band — avoid `border-b` here; the title row stays open into the body (use inner cards/toolbars for dividers). */
  className?: string;
  /** Merged after {@link MAIN_VIEW_PRIMARY_HEADING_CLASS} (e.g. `font-normal` for report-style dashboards). */
  titleClassName?: string;
  /** Default `h1` for full-width main canvas bodies. */
  titleAs?: "h1" | "h2";
}

/**
 * Shared title row for main canvas views — matches Appointments / Payments / Listings chrome
 * (`px-6 pt-5 pb-4`, title + optional subline + optional right actions).
 */
export function MainCanvasViewHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  titleAs = "h1",
}: MainCanvasViewHeaderProps) {
  const TitleTag = titleAs;

  return (
    <div className={cn(MAIN_VIEW_HEADER_BAND_CLASS, className)}>
      <div className="min-w-0">
        <TitleTag className={cn(MAIN_VIEW_PRIMARY_HEADING_CLASS, titleClassName)}>{title}</TitleTag>
        {description != null && description !== false ? (
          <p className={MAIN_VIEW_SUBHEADING_CLASS}>{description}</p>
        ) : null}
      </div>
      {actions != null ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
