import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { X, RotateCcw } from "lucide-react";
import { cn } from "@/contenthub-ui/utils";
import { Button } from "@/contenthub-ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/contenthub-ui/select";

/* ─── Types ─── */
export interface FilterItem {
  id: string;
  label: string;
  value?: string;
  options?: string[];
}

interface FilterPanelProps {
  filters: FilterItem[];
  onFiltersChange?: (filters: FilterItem[]) => void;
  onApply?: () => void;
  onReset?: () => void;
  title?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  storageKey?: string;
  /** Docked column edge: `right` matches Reviews; `left` matches Agents Monitor. */
  edge?: "left" | "right";
  className?: string;
}

/* ─── Filter row ─── */
function FilterRow({
  filter,
  onValueChange,
}: {
  filter: FilterItem;
  onValueChange: (id: string, value: string) => void;
}) {
  if (!filter.options?.length) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground truncate">{filter.label}</span>
      <Select
        value={filter.value ?? ""}
        onValueChange={(value) => onValueChange(filter.id, value)}
      >
        <SelectTrigger className="h-[34px] rounded-md text-[13px]">
          <SelectValue placeholder={filter.label} />
        </SelectTrigger>
        <SelectContent>
          {filter.options.map((option) => (
            <SelectItem key={option} value={option} className="text-[13px]">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── Filter Panel ─── */
export function FilterPanel({
  filters: initialFilters,
  onFiltersChange,
  onApply,
  onReset,
  title = "Filters",
  collapsed = false,
  onToggleCollapse,
  storageKey,
  edge = "right",
  className,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterItem[]>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as FilterItem[];
          const savedIds = new Set(parsed.map((f) => f.id));
          const newFilters = initialFilters.filter((f) => !savedIds.has(f.id));
          return [...parsed, ...newFilters];
        } catch {
          /* fall through */
        }
      }
    }
    return initialFilters;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    }
  }, [filters, storageKey]);

  const didNotifyMount = useRef(false);
  useLayoutEffect(() => {
    if (didNotifyMount.current) return;
    didNotifyMount.current = true;
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const handleValueChange = useCallback(
    (id: string, value: string) => {
      const updated = filters.map((f) =>
        f.id === id ? { ...f, value } : f
      );
      setFilters(updated);
      onFiltersChange?.(updated);
    },
    [filters, onFiltersChange]
  );

  const handleReset = useCallback(() => {
    const reset = filters.map((f) => ({ ...f, value: undefined }));
    setFilters(reset);
    onFiltersChange?.(reset);
    onReset?.();
  }, [filters, onFiltersChange, onReset]);

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={cn(
          "h-full w-10 bg-background flex flex-col items-center justify-start pt-4 shrink-0 transition-colors hover:bg-surface-hover",
          edge === "left"
            ? "border-r border-border"
            : "border-l border-border",
        )}
        title="Expand filters"
      >
        <span
          className="text-[11px] text-muted-foreground mt-0"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontWeight: 400,
          }}
        >
          {title}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "bg-background flex flex-col h-full min-h-0 shrink-0 transition-colors w-[260px]",
        edge === "left"
          ? "border-r border-border"
          : "border-l border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <span className="text-sm text-text-primary">
          {title}
        </span>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-surface-hover transition-colors"
          title="Collapse filters"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 pb-2">
        <div className="flex flex-col gap-2">
          {filters.map((filter) => (
            <FilterRow
              key={filter.id}
              filter={filter}
              onValueChange={handleValueChange}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-2 border-t border-border shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex-1 gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onApply}
          className="flex-1"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
