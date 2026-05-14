# Tokn Color Token Architecture

> Comprehensive guide to the Design Token Forge 4-tier color system.

---

## Overview

The Tokn color system is a **4-tier pipeline** that transforms raw color values into context-aware, theme-adaptive component tokens. Each tier adds semantic meaning, ensuring that a single `data-theme` attribute switch is enough to re-skin an entire application.

```
T0 Primitives ──→ T1 Semantic Roles ──→ T2 Surface Contexts ──→ T3 Component Tokens
(raw palettes)    (purpose-based)       (layout context)        (per-component)
```

**Key principle:** Components never consume T0 primitives directly. Every color reference flows through at least T1 before reaching a component.

---

## T0 — Primitive Palettes

**File:** `packages/tokens/src/primitives.css`  
**Count:** 8 palettes × 21 steps = **168 color tokens** + 5 utility colors

### Palettes

| Palette        | Key Color (500) | CSS Prefix            | Purpose                        |
|----------------|:---------------:|-----------------------|--------------------------------|
| Brand          | `#E53F28`      | `--prim-brand-*`       | Primary brand expression       |
| Monochromatic  | `#286CE5`      | `--prim-brand-*` | UI primary / interactive     |
| Desaturated    | `#64748B`      | `--prim-desaturated-*` | Muted / slate tones            |
| Greyscale      | `#737373`      | `--prim-greyscale-*`   | True neutral greys             |
| Danger         | `#DC2626`      | `--prim-danger-*`      | Error / destructive            |
| Warning        | `#D97706`      | `--prim-warning-*`     | Caution / attention            |
| Info           | `#0EA5E9`      | `--prim-info-*`        | Informational / help           |
| Success        | `#16A34A`      | `--prim-success-*`     | Positive / confirmation        |

### 21-Step Scale

Each palette contains exactly 21 perceptually-spaced steps:

```
white → 25 → 50 → 75 → 100 → 150 → 175 → 200 → 250 → 300
→ 400 → 450 → 500 (KEY) → 550 → 600 → 700 → 750 → 800 → 850 → 900 → black
```

- **Step 500** is the **key color** — the primary representation of that palette.
- Steps **white → 300** are tints (lighter than key).
- Steps **550 → black** are shades (darker than key).
- The scale is **denser around the key** (400, 450, 500, 550) and in the extremes (white, 25, 50, 75) to enable fine-grained control.

### Utility Colors

```css
--color-white: #FFFFFF;
--color-black: #000000;
--color-fixed-white: #FFFFFF;    /* Immune to theme switching */
--color-fixed-black: #000000;    /* Immune to theme switching */
--color-fixed-primary: #1852BA;  /* Fixed brand reference */
```

---

## T1 — Semantic Role Tokens

**File:** `packages/tokens/src/semantic.css`  
**Count:** 6 roles × 18 tokens × 2 themes = **216 tokens**

### Role → Palette Mapping

| Semantic Role | Source Palette  |
|:-------------|:---------------|
| `primary`    | Monochromatic (Blue) |
| `brand`      | Brand (Orange-Red)   |
| `danger`     | Danger (Red)         |
| `success`    | Success (Green)      |
| `warning`    | Warning (Amber)      |
| `info`       | Info (Sky Blue)      |

### 18-Token Structure Per Role

Each role defines exactly **18 tokens** organized into 4 groups:

#### Content (4 tokens) — for text and icons

| Token               | Light Step | Dark Step | Purpose                    |
|---------------------|:----------:|:---------:|----------------------------|
| `content-default`   | 600        | 150       | Primary text/icon color    |
| `content-strong`    | 700        | 100       | Emphasized text            |
| `content-subtle`    | 400        | 200       | Secondary text             |
| `content-faint`     | 200        | 400       | Tertiary / hint text       |

#### Component (7 tokens) — for interactive elements (buttons, checkboxes, etc.)

| Token                      | Light Step | Dark Step | Purpose                     |
|----------------------------|:----------:|:---------:|-----------------------------|
| `component-bg-default`     | 500        | 400       | Default background          |
| `component-bg-hover`       | 600        | 300       | Hover background            |
| `component-bg-pressed`     | 700        | 250       | Active/pressed background   |
| `component-outline-default`| 300        | 500       | Default border/outline      |
| `component-outline-hover`  | 400        | 400       | Hover border                |
| `component-outline-pressed`| 500        | 300       | Pressed border              |
| `component-separator`      | 100        | 800       | Dividers within components  |

#### Container (5 tokens) — for holding regions (alerts, callouts, etc.)

| Token                | Light Step | Dark Step | Purpose                    |
|----------------------|:----------:|:---------:|----------------------------|
| `container-bg`       | 50         | 850–900   | Container background       |
| `container-hover`    | 75         | 800       | Container hover            |
| `container-pressed`  | 100        | 750–800   | Container active           |
| `container-outline`  | 200        | 600       | Container border           |
| `container-separator`| 100        | 800       | Container dividers         |

#### OnComponent Content (2 tokens) — text ON filled backgrounds

| Token            | Light Value  | Dark Value  | Purpose                    |
|------------------|:------------:|:-----------:|----------------------------|
| `on-component`   | white        | white       | Text on filled component   |
| `on-container`   | 700          | 100         | Text on tinted container   |

**Special case:** Warning `on-component` uses `#451A03` (dark amber) in both themes for contrast on the bright amber background.

### Light ↔ Dark Inversion Pattern

The core pattern is **step inversion**:
- **Light theme:** Content uses dark steps (600–700), containers use light tints (50–100)
- **Dark theme:** Content uses light steps (100–200), containers use deep shades (800–900)
- **Components** shift moderately: light uses step 500 (key), dark uses step 400

---

## T2 — Surface Context Tokens

**File:** `packages/tokens/src/surfaces.css`  
**Count:** 8 surfaces × 16 tokens × 2 themes = **256 tokens**

### Surface Hierarchy

**Brightness order** (lightest → darkest in light theme):
```
Bright > Base > Dim > Deep
```

**Elevation order** (highest → lowest):
```
Float > Over-container > Container > Base
```

| Surface          | Light bg   | Dark bg   | Use Case                         |
|:----------------|:----------:|:---------:|----------------------------------|
| `bright`         | `#FFFFFF`  | `#1E1E1E` | Elevated cards, highlighted areas |
| `base`           | `#FAFAFA`  | `#141414` | Default page canvas              |
| `container`      | `#FFFFFF`  | `#1E1E1E` | Cards, panels (above base)       |
| `over-container` | `#FFFFFF`  | `#282828` | Modals, dialogs                  |
| `float`          | `#FFFFFF`  | `#303030` | Menus, dropdowns, popups         |
| `dim`            | `#F2F2F2`  | `#101010` | Muted / recessed areas           |
| `deep`           | `#E8E8E8`  | `#0A0A0A` | Sidebars, wells                  |
| `accent`         | `#EFF4FF`  | `#0C1428` | Primary-tinted backgrounds       |

### 16-Token Structure Per Surface

| Token           | Category   | Purpose                         |
|:---------------|:-----------|:--------------------------------|
| `bg`            | Background | Base surface background          |
| `hover`         | Background | Hover state                      |
| `pressed`       | Background | Active/pressed state             |
| `outline`       | Border     | Surface border                   |
| `separator`     | Border     | Dividers between regions         |
| `ct-default`    | Content    | Default text color on surface    |
| `ct-strong`     | Content    | Emphasized text on surface       |
| `ct-subtle`     | Content    | Secondary text on surface        |
| `ct-faint`      | Content    | Tertiary / hint text on surface  |
| `cm-bg`         | Component  | Component background on surface  |
| `cm-bg-hover`   | Component  | Component hover on surface       |
| `cm-bg-pressed` | Component  | Component pressed on surface     |
| `cm-outline`    | Component  | Component border on surface      |
| `cm-outline-hover` | Component | Component hover border        |
| `cm-outline-pressed`| Component| Component pressed border       |
| `cm-separator`  | Component  | Component dividers on surface    |

---

## T3 — Component Tokens

**File:** Each component in `packages/components/src/<component>/`  
**Count:** Variable per component (74–246 tokens each)

Component tokens reference T1 semantic tokens as defaults, allowing override at any level:

```css
/* Example: Button */
--btn-bg: var(--primary-component-bg-default);
--btn-bg-hover: var(--primary-component-bg-hover);
--btn-label-color: var(--primary-on-component);
```

The cascade enables:
1. **Global theming** — change T0/T1, all components update
2. **Surface context** — place a component on `surface-accent`, it adapts
3. **Component override** — set `--btn-bg: red` on a specific instance
4. **Instance override** — inline style on a single element

---

## Color Token Counts Summary

| Tier         | Scope                     | Count |
|:------------|:--------------------------|------:|
| T0 Primitives | 8 palettes × 21 steps   | 168   |
| T0 Utility    | Fixed colors             | 5     |
| T1 Semantic   | 6 roles × 18 × light    | 108   |
| T1 Semantic   | 6 roles × 18 × dark     | 108   |
| T2 Surfaces   | 8 surfaces × 16 × light | 128   |
| T2 Surfaces   | 8 surfaces × 16 × dark  | 128   |
| **Total**     |                          | **~645** |

With light/dark duplication, the system resolves to **~645 color definitions** at any given time. Non-color tokens (spacing, typography, radius, shadows, motion, z-index, opacity) are documented separately in `extras.css`.

---

## File Structure

```
packages/tokens/src/
├── index.css          ← @import aggregator
├── primitives.css     ← T0: 8 palettes + spacing + typography
├── semantic.css       ← T1: 6 roles × light/dark
├── surfaces.css       ← T2: 8 surfaces × light/dark
└── extras.css         ← Non-color tokens (radius, shadows, motion, z-index, opacity)
```

---

## Design Principles

1. **No hardcoded colors in components** — every visual value is a CSS custom property
2. **Theme switching via data attribute** — `[data-theme="dark"]` on `<html>`
3. **Additive layering** — each tier adds meaning without breaking the one below
4. **Perceptual spacing** — palette steps are visually equidistant, not mathematically
5. **Contrast-first** — `on-component` and `on-container` guarantee readable text
6. **Warning exception** — amber `on-component` uses dark text for contrast on bright yellow
7. **Framework-agnostic** — pure CSS, no build step required for theming
