"use client";

import { Columns3 } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "./utils";

export type AppDataTableColumnSettingsTriggerProps = Omit<ButtonProps, "children"> & {
  /** Passed to `aria-label` and `title` (e.g. `Tag columns`). */
  sheetTitle?: string;
};

/**
 * Icon-only control matching the in-table Columns affordance in {@link AppDataTable},
 * for use in {@link MainCanvasViewHeader} when the column sheet is controlled externally.
 */
export function AppDataTableColumnSettingsTrigger({
  sheetTitle = "Columns",
  className,
  ...props
}: AppDataTableColumnSettingsTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("shrink-0", className)}
      aria-label={sheetTitle}
      title={sheetTitle}
      {...props}
    >
      <Columns3 className="size-4 shrink-0" aria-hidden />
    </Button>
  );
}
