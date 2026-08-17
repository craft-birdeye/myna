#!/usr/bin/env python3
"""
Copies the Content Hub module from contenthub 2.0 into MYNA and fixes all import paths.
Run from inside myna-main:  python3 setup-content-hub.py
"""
import os
import shutil
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENTHUB_SRC = os.path.join(os.path.dirname(SCRIPT_DIR), "contenthub 2.0", "src")
MYNA_SRC = os.path.join(SCRIPT_DIR, "src")

if not os.path.isdir(CONTENTHUB_SRC):
    print(f"ERROR: Cannot find contenthub 2.0 source at:\n  {CONTENTHUB_SRC}")
    sys.exit(1)

print(f"Source : {CONTENTHUB_SRC}")
print(f"Dest   : {MYNA_SRC}")
print()


# ── helpers ───────────────────────────────────────────────────────────────────

def copy_dir(src, dst):
    if os.path.isdir(src):
        os.makedirs(dst, exist_ok=True)
        shutil.copytree(src, dst, dirs_exist_ok=True)
        print(f"  Copied dir  → {os.path.relpath(dst, SCRIPT_DIR)}")
    else:
        print(f"  WARNING: source dir not found: {src}")

def copy_file(src, dst):
    if os.path.isfile(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  Copied file → {os.path.relpath(dst, SCRIPT_DIR)}")
    else:
        print(f"  WARNING: source file not found: {src}")

def fix_imports_in_dir(directory, extra_replacements=None):
    """Walk all .ts/.tsx files in directory and fix import paths."""
    # General replacements: @/app/... → @/contenthub-ui/ or @/content-hub/ etc.
    general = [
        # UI primitives
        ('from "@/app/components/ui/', 'from "@/contenthub-ui/'),
        ("from '@/app/components/ui/", "from '@/contenthub-ui/"),
        # Layout helpers → contenthub-ui
        ('from "@/app/components/layout/', 'from "@/contenthub-ui/'),
        ("from '@/app/components/layout/", "from '@/contenthub-ui/"),
        # Hooks
        ('from "@/app/hooks/', 'from "@/hooks/'),
        ("from '@/app/hooks/", "from '@/hooks/"),
        # content-hub sub-components
        ('from "@/app/components/content-hub/', 'from "@/content-hub/'),
        ("from '@/app/components/content-hub/", "from '@/content-hub/"),
        # Other top-level app components (FilterPane, L2Nav…)
        ('from "@/app/components/', 'from "@/content-hub/'),
        ("from '@/app/components/", "from '@/content-hub/"),
        # lib/utils
        ('from "@/lib/', 'from "@/contenthub-ui/'),
        ("from '@/lib/", "from '@/contenthub-ui/"),
    ]
    # extra_replacements run BEFORE general ones (more specific first)
    replacements = (extra_replacements or []) + general

    count = 0
    for root, _, files in os.walk(directory):
        for fname in files:
            if not (fname.endswith('.ts') or fname.endswith('.tsx')):
                continue
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                original = f.read()
            updated = original
            for old, new in replacements:
                updated = updated.replace(old, new)
            if updated != original:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(updated)
                count += 1
    print(f"  Fixed imports in {count} files under {os.path.relpath(directory, SCRIPT_DIR)}")

def fix_contenthub_ui_internal(directory):
    """Inside contenthub-ui, @/contenthub-ui/X refs become ./X (relative)."""
    replacements = [
        ('from "@/contenthub-ui/', 'from "./'),
        ("from '@/contenthub-ui/", "from './"),
    ]
    count = 0
    for root, _, files in os.walk(directory):
        for fname in files:
            if not (fname.endswith('.ts') or fname.endswith('.tsx')):
                continue
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                original = f.read()
            updated = original
            for old, new in replacements:
                updated = updated.replace(old, new)
            if updated != original:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(updated)
                count += 1
    print(f"  Fixed internal @/ refs in {count} files under {os.path.relpath(directory, SCRIPT_DIR)}")


# ── 1. contenthub-ui ──────────────────────────────────────────────────────────
print("==> 1. Copying UI primitives (contenthub-ui)...")
copy_dir(
    os.path.join(CONTENTHUB_SRC, "app", "components", "ui"),
    os.path.join(MYNA_SRC, "contenthub-ui"),
)

# Layout helpers + primitives that live in components/ root of contenthub 2.0
for fname in ["appShellClasses.ts", "mainViewTitleClasses.ts", "modalOverlayClasses.ts",
              "L2NavLayout.tsx", "L2NavLayout.v1.tsx", "SlidingSidePanel.tsx",
              "slidePanelConstants.ts"]:
    # Check both /layout/ and root of components
    src_layout = os.path.join(CONTENTHUB_SRC, "app", "components", "layout", fname)
    src_root   = os.path.join(CONTENTHUB_SRC, "app", "components", fname)
    src = src_layout if os.path.isfile(src_layout) else src_root
    copy_file(src, os.path.join(MYNA_SRC, "contenthub-ui", fname))

# utils.ts — write inline (cn utility with clsx + tailwind-merge)
utils_path = os.path.join(MYNA_SRC, "contenthub-ui", "utils.ts")
with open(utils_path, "w", encoding="utf-8") as f:
    f.write('import { clsx, type ClassValue } from "clsx";\n')
    f.write('import { twMerge } from "tailwind-merge";\n')
    f.write('export function cn(...inputs: ClassValue[]) {\n')
    f.write('  return twMerge(clsx(inputs));\n')
    f.write('}\n')
print("  Wrote contenthub-ui/utils.ts")


# ── 2. hooks ──────────────────────────────────────────────────────────────────
print("\n==> 2. Copying hooks...")
hooks_dir = os.path.join(MYNA_SRC, "hooks")
os.makedirs(hooks_dir, exist_ok=True)
hook_src = os.path.join(CONTENTHUB_SRC, "app", "hooks", "usePersistedState.ts")
hook_dst = os.path.join(hooks_dir, "usePersistedState.ts")
if os.path.isfile(hook_src):
    copy_file(hook_src, hook_dst)
else:
    with open(hook_dst, "w", encoding="utf-8") as f:
        f.write("import { useState, useEffect } from 'react';\n")
        f.write("export function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T) => void] {\n")
        f.write("  const [state, setState] = useState<T>(() => {\n")
        f.write("    try { const s = sessionStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }\n")
        f.write("    catch { return defaultValue; }\n")
        f.write("  });\n")
        f.write("  useEffect(() => {\n")
        f.write("    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}\n")
        f.write("  }, [key, state]);\n")
        f.write("  return [state, setState];\n")
        f.write("}\n")
    print("  Wrote fallback usePersistedState.ts")


# ── 3. content-hub components ─────────────────────────────────────────────────
print("\n==> 3. Copying content-hub components...")
copy_dir(
    os.path.join(CONTENTHUB_SRC, "app", "components", "content-hub"),
    os.path.join(MYNA_SRC, "content-hub"),
)

# Top-level files that content-hub depends on (live in components/ root, not content-hub/)
for fname in ["ContentHubL2NavPanel.tsx", "FilterPane.tsx", "FilterPane.v1.tsx",
              "FilterPanel.tsx", "FilterPanel.v1.tsx", "l1StripIconTokens.ts"]:
    copy_file(
        os.path.join(CONTENTHUB_SRC, "app", "components", fname),
        os.path.join(MYNA_SRC, "content-hub", fname),
    )


# ── 4. Fix import paths ───────────────────────────────────────────────────────
print("\n==> 4. Fixing import paths...")

# content-hub: extra rules for files that were originally in components/ root
# (they used relative ./L2NavLayout and ./ui/X imports instead of @/ imports)
content_hub_extra = [
    # ./L2NavLayout → @/contenthub-ui/L2NavLayout
    ('from "./L2NavLayout"',      'from "@/contenthub-ui/L2NavLayout"'),
    ("from './L2NavLayout'",      "from '@/contenthub-ui/L2NavLayout'"),
    ('from "./L2NavLayout.v1"',   'from "@/contenthub-ui/L2NavLayout.v1"'),
    ("from './L2NavLayout.v1'",   "from '@/contenthub-ui/L2NavLayout.v1'"),
    # ./ui/X → @/contenthub-ui/X
    ('from "./ui/',               'from "@/contenthub-ui/'),
    ("from './ui/",               "from '@/contenthub-ui/"),
    # ./content-hub/X → @/content-hub/X
    ('from "./content-hub/',      'from "@/content-hub/'),
    ("from './content-hub/",      "from '@/content-hub/"),
]
fix_imports_in_dir(os.path.join(MYNA_SRC, "content-hub"), extra_replacements=content_hub_extra)

# contenthub-ui: fix general @/app/... paths first
fix_imports_in_dir(os.path.join(MYNA_SRC, "contenthub-ui"))
# Then make internal contenthub-ui cross-refs relative (./X instead of @/contenthub-ui/X)
fix_contenthub_ui_internal(os.path.join(MYNA_SRC, "contenthub-ui"))


# ── 5. Create contenthub-vars.css ─────────────────────────────────────────────
print("\n==> 5. Writing contenthub-vars.css...")
css_path = os.path.join(MYNA_SRC, "contenthub-vars.css")
with open(css_path, "w", encoding="utf-8") as f:
    f.write(""":root {
  --font-size: 13px;
  --table-label-size: 12px;
  --button-height-xs: 24px;
  --button-height-sm: 32px;
  --button-height: 34px;
  --button-height-lg: 44px;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --background: #ffffff;
  --foreground: #0d0d12;
  --card: #ffffff;
  --card-foreground: #0d0d12;
  --popover: #ffffff;
  --popover-foreground: #0d0d12;
  --primary: #1E44CC;
  --primary-foreground: #ffffff;
  --secondary: #eef0f8;
  --secondary-foreground: #1E44CC;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #1E44CC;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --ring: #1E44CC;
  --radius: 0.625rem;
  --sidebar: #f8f9fa;
  --sidebar-foreground: #0d0d12;
  --sidebar-primary: #1E44CC;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f0f1f5;
  --sidebar-accent-foreground: #1a1a2e;
  --sidebar-border: rgba(0, 0, 0, 0.1);
  --sidebar-ring: #1E44CC;
  --app-shell-border: #d4d8e2;
  --app-shell-gutter: #e0e5eb;
  --app-shell-rail: #e0e5eb;
  --app-shell-l1-nav-highlight: #dbe1e9;
  --app-shell-l1-nav-pressed: #d0d6e0;
  --app-shell-l2-surface: #f0f1f5;
  --app-shell-main: var(--background);
  --app-shell-l2-row-hover: #eaecef;
  --app-shell-l2-row-active: #e6e8ee;
  --app-shell-l2-content-muted: #f2f3f6;
  --font-weight-thin: 300;
  --font-weight-extralight: 300;
  --font-weight-light: 300;
  --font-weight-normal: 300;
  --font-weight-medium: 400;
  --font-weight-semibold: 400;
  --font-weight-bold: 500;
  --font-weight-extrabold: 600;
  --font-weight-black: 700;
  --slide-duration: 220ms;
  --slide-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes agents-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes agents-sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
""")
print(f"  Wrote {os.path.relpath(css_path, SCRIPT_DIR)}")


print("\n" + "="*50)
print("  Done! Now run these 3 commands:")
print("  1. npm install")
print("  2. rm -rf node_modules/.vite")
print("  3. npm run dev")
print("="*50)
