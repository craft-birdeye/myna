#!/bin/bash
# Run this ONCE from inside myna-main:
#   bash setup-content-hub.sh
# It copies the content-hub module from contenthub 2.0 into MYNA and fixes all import paths.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$(dirname "$SCRIPT_DIR")/contenthub 2.0/src"

echo "==> Source: $SRC"
echo "==> Destination: $SCRIPT_DIR/src"

# ── 1. Copy UI primitives ──────────────────────────────────────────────────────
echo "Copying UI primitives..."
mkdir -p "$SCRIPT_DIR/src/contenthub-ui"
cp -r "$SRC/app/components/ui/." "$SCRIPT_DIR/src/contenthub-ui/"

# Layout constants
cp "$SRC/app/components/layout/appShellClasses.ts"   "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true
cp "$SRC/app/components/layout/mainViewTitleClasses.ts" "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true
cp "$SRC/app/components/layout/modalOverlayClasses.ts"  "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true

# L2NavLayout + SlidingSidePanel (live in layout/ in source)
cp "$SRC/app/components/layout/L2NavLayout.tsx"     "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true
cp "$SRC/app/components/layout/L2NavLayout.v1.tsx"  "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true
cp "$SRC/app/components/layout/SlidingSidePanel.tsx" "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true
cp "$SRC/app/components/layout/slidePanelConstants.ts" "$SCRIPT_DIR/src/contenthub-ui/" 2>/dev/null || true

# cn utility
mkdir -p "$SCRIPT_DIR/src/lib"
cp "$SRC/lib/utils.ts" "$SCRIPT_DIR/src/lib/" 2>/dev/null || \
  echo "export function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }" > "$SCRIPT_DIR/src/lib/utils.ts"

# Also put utils in contenthub-ui (many components import from ./utils)
cat > "$SCRIPT_DIR/src/contenthub-ui/utils.ts" << 'EOF'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

# ── 2. Copy usePersistedState hook ─────────────────────────────────────────────
echo "Copying hooks..."
mkdir -p "$SCRIPT_DIR/src/hooks"
cp "$SRC/app/hooks/usePersistedState.ts" "$SCRIPT_DIR/src/hooks/" 2>/dev/null || \
cat > "$SCRIPT_DIR/src/hooks/usePersistedState.ts" << 'EOF'
import { useState, useEffect } from 'react';
export function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}
EOF

# ── 3. Copy content-hub components ────────────────────────────────────────────
echo "Copying content-hub components..."
mkdir -p "$SCRIPT_DIR/src/content-hub"
cp -r "$SRC/app/components/content-hub/." "$SCRIPT_DIR/src/content-hub/"

# Top-level files referenced by content-hub
cp "$SRC/app/components/ContentHubL2NavPanel.tsx" "$SCRIPT_DIR/src/content-hub/" 2>/dev/null || true
cp "$SRC/app/components/FilterPane.tsx"   "$SCRIPT_DIR/src/content-hub/" 2>/dev/null || true
cp "$SRC/app/components/FilterPane.v1.tsx" "$SCRIPT_DIR/src/content-hub/" 2>/dev/null || true
cp "$SRC/app/components/FilterPanel.tsx"  "$SCRIPT_DIR/src/content-hub/" 2>/dev/null || true
cp "$SRC/app/components/FilterPanel.v1.tsx" "$SCRIPT_DIR/src/content-hub/" 2>/dev/null || true
cp "$SRC/app/components/l1StripIconTokens.ts" "$SCRIPT_DIR/src/content-hub/" 2>/dev/null || true

# ── 4. Fix import paths ────────────────────────────────────────────────────────
echo "Fixing import paths..."

fix_imports() {
  local dir="$1"
  # @/app/components/ui/ → @/contenthub-ui/
  find "$dir" \( -name "*.tsx" -o -name "*.ts" \) | \
    xargs sed -i '' \
      -e 's|from "@/app/components/ui/|from "@/contenthub-ui/|g' \
      -e "s|from '@/app/components/ui/|from '@/contenthub-ui/|g" \
      -e 's|from "@/app/components/layout/|from "@/contenthub-ui/|g' \
      -e "s|from '@/app/components/layout/|from '@/contenthub-ui/|g" \
      -e 's|from "@/app/hooks/|from "@/hooks/|g' \
      -e "s|from '@/app/hooks/|from '@/hooks/|g" \
      -e 's|from "@/app/components/content-hub/|from "@/content-hub/|g' \
      -e "s|from '@/app/components/content-hub/|from '@/content-hub/|g" \
      2>/dev/null || true
}

fix_imports "$SCRIPT_DIR/src/content-hub"
fix_imports "$SCRIPT_DIR/src/contenthub-ui"

# Fix the top-level references in ContentHubL2NavPanel
sed -i '' \
  -e 's|from "@/app/components/|from "@/content-hub/|g' \
  -e "s|from '@/app/components/|from '@/content-hub/|g" \
  "$SCRIPT_DIR/src/content-hub/ContentHubL2NavPanel.tsx" 2>/dev/null || true

# Fix contenthub-ui internal cross-imports
find "$SCRIPT_DIR/src/contenthub-ui" \( -name "*.tsx" -o -name "*.ts" \) | \
  xargs sed -i '' \
    -e 's|from "@/app/components/ui/|from "./|g' \
    -e "s|from '@/app/components/ui/|from './|g" \
    2>/dev/null || true

echo ""
echo "✅ Done! Now run: npm install && npm run dev"
