import { useLayoutEffect, useState } from 'react';

/** Count chips that fit within the first two flex-wrap lines. */
export function countVisibleForTwoLines(containerEl) {
  if (!containerEl) return 0;
  const items = [...containerEl.querySelectorAll('[data-chip-measure]')];
  if (!items.length) return 0;

  const lineTops = [];
  items.forEach((el) => {
    const top = el.offsetTop;
    if (!lineTops.some((t) => Math.abs(t - top) <= 1)) lineTops.push(top);
  });
  lineTops.sort((a, b) => a - b);

  if (lineTops.length <= 2) return items.length;

  const secondLineTop = lineTops[1];
  return items.filter((el) => el.offsetTop <= secondLineTop + 1).length;
}

export function useTwoLineChipCollapse({ enabled, expanded, itemCount, measureRef }) {
  const [visibleCount, setVisibleCount] = useState(itemCount);

  useLayoutEffect(() => {
    if (!enabled || expanded) {
      setVisibleCount(itemCount);
      return undefined;
    }

    const measure = () => {
      const count = countVisibleForTwoLines(measureRef.current);
      setVisibleCount(count > 0 ? count : itemCount);
    };

    measure();

    const node = measureRef.current?.parentElement;
    const ro = node && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null;
    ro?.observe(node);
    window.addEventListener('resize', measure);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enabled, expanded, itemCount, measureRef]);

  const hiddenCount = enabled && !expanded ? Math.max(0, itemCount - visibleCount) : 0;

  return {
    visibleCount: enabled && !expanded ? visibleCount : itemCount,
    hiddenCount,
    showViewMore: hiddenCount > 0,
  };
}
