# Color Generator — Study & Plan

> **Status:** Research / Planning — NOT approved for implementation yet.  
> This document captures requirements, open questions, and a proposed approach for a future color palette generator that could automate T0 primitive creation from key colors.

---

## 1. Problem Statement

Currently, the 8 primitive palettes in `primitives.css` are **handcrafted** — each palette's 21 steps were manually tuned for perceptual evenness, contrast accessibility, and cross-palette harmony. This works well but creates friction when:

- A new brand/product needs a custom palette (e.g., a purple brand)
- A client wants to swap the brand color without manually re-authoring 21 steps
- The system needs to scale beyond 8 palettes for multi-brand deployments

A **Color Generator** would accept one or more key colors and produce a complete Tokn-compatible palette (21 steps) that matches the quality of the handcrafted originals.

---

## 2. What Already Exists

### Current Palette Logic (must be preserved)

The existing 21-step scale has deliberate characteristics:

1. **Non-linear distribution** — Steps are denser near the extremes (white, 25, 50, 75) and near the key (400, 450, 500, 550), sparser in the mid-range.
2. **Key at 500** — The named brand/key color always sits at step 500.
3. **White/Black anchors** — Every palette starts at `#FFFFFF` and ends at `#000000`.
4. **Perceptual spacing** — The perceived lightness difference between adjacent steps is approximately even (not the mathematical distance in hex).
5. **Hue preservation vs. shift** — Some palettes maintain hue throughout (brand), while others allow natural hue shifts at extremes (e.g., brand red shifts toward deeper burgundy in darks).
6. **Saturation curves** — Saturation isn't constant; it typically peaks around the key color and drops at both extremes (tints become pastel, shades become muted).

### Current Step Names
```
white, 25, 50, 75, 100, 150, 175, 200, 250, 300,
400, 450, 500, 550, 600, 700, 750, 800, 850, 900, black
```

### How T1 Consumes T0

The semantic layer has a fixed mapping pattern:
- Content tokens → steps 600-700 (light) / 100-200 (dark)
- Component tokens → steps 400-500 (light) / 250-400 (dark)
- Container tokens → steps 50-100 (light) / 800-900 (dark)

This means the generator must produce **usable, contrasty values** at all these critical steps. A mathematically perfect ramp that fails at step 600 for text contrast would break the entire system.

---

## 3. Open Questions (Must Resolve Before Implementation)

### Q1: Color Space for Interpolation
- **sRGB hex interpolation** is perceptually uneven (especially greens/blues).
- **OKLCH** provides perceptually uniform lightness, preserving hue better.
- **LCH (CIE)** is an alternative with wider tool support.
- **HCL** (as used by d3-color) is another option.
- **Decision needed:** Which color space produces results closest to the existing handcrafted palettes?

### Q2: Hue Rotation Strategy
- Should the generator allow intentional hue shifts (e.g., warm reds → cool dark reds)?
- Or should it lock hue and only operate on lightness/chroma?
- The existing palettes seem to allow subtle hue drift — needs analysis.

### Q3: Saturation/Chroma Curve
- What curve shape (linear, polynomial, bezier) best matches the existing palettes?
- Is it the same curve for all palettes, or does it vary by hue family?
- Warm colors (red, amber) behave differently from cool colors (blue, green) in perceptual space.

### Q4: Step Distribution Function
- The 21 steps are NOT evenly distributed on a lightness scale.
- What mathematical function (if any) maps step index → lightness value?
- Need to reverse-engineer from the existing palettes.

### Q5: White/Black Anchors
- Currently hardcoded to `#FFFFFF` and `#000000`.
- Should the generator support custom anchors (e.g., warm white `#FFFAF5`)?
- This could enable tone-mapped systems for specific brands.

### Q6: Accessibility Validation
- Each generated step must maintain a predictable contrast ratio relationship.
- Step 600 on white must meet WCAG AA (4.5:1) for body text.
- Step 500 on white should meet AA for large text (3:1).
- `on-component` (white on step 500) must meet AA.
- Should the generator auto-adjust values that fail contrast checks?

### Q7: Output Format
- Pure CSS custom properties (as current)?
- JSON tokens for multi-platform (iOS, Android, Figma)?
- Both?

### Q8: Generator Location
- Browser-only (Canvas + JS)?
- Node.js CLI tool in `packages/generator/`?
- Both (shared core algorithm)?

---

## 4. Proposed Approach (Draft)

### Phase 1: Reverse-Engineer Existing Palettes
1. Convert all 8 existing palettes from hex → OKLCH
2. Plot lightness (L), chroma (C), and hue (H) curves for each palette
3. Identify the common curve shapes and where they diverge
4. Document the "golden function" that best fits the existing data

### Phase 2: Generator Algorithm
1. **Input:** Single key color (hex or OKLCH)
2. **Convert** key to OKLCH → extract L, C, H values
3. **Anchor** step 500 = key color
4. **Distribute lightness** from L=1.0 (white) to L=0.0 (black) using the golden function
5. **Apply chroma curve** that peaks at key and tapers toward extremes
6. **Allow hue drift** of ±N degrees based on hue family rules
7. **Output** 21 hex values mapped to the standard step names
8. **Validate** WCAG contrast at critical steps; adjust if needed

### Phase 3: Integration
1. CLI command: `pnpm gen:palette --key=#E53F28 --name=brand`
2. Outputs `--prim-{name}-{step}: #hex;` for all 21 steps
3. Optional: automatically wire into `semantic.css` for a given role

### Phase 4: Interactive Explorer
1. Color picker UI in the demo that shows real-time palette generation
2. Side-by-side comparison with existing palettes
3. Export CSS snippet

---

## 5. Risk Assessment

| Risk | Impact | Mitigation |
|:-----|:------:|:-----------|
| Generated palettes don't match handcrafted quality | High | Phase 1 reverse-engineering validates against originals |
| Edge case hues (neon green, magenta) produce ugly ramps | Medium | Hue-family-specific adjustments; user preview before commit |
| OKLCH browser support gaps | Low | Generate final hex; OKLCH is computation-only |
| Breaking T1→T0 contract (bad values at critical steps) | High | Mandatory contrast validation at steps 50, 100, 200, 500, 600, 700, 900 |
| Over-engineering for v1 | Medium | Keep Phase 1-2 minimal; Phase 3-4 only after validation |

---

## 6. Immediate Next Steps

- [ ] Convert all 8 existing palettes to OKLCH and plot the curves
- [ ] Identify the lightness distribution function
- [ ] Test candidate interpolation algorithms against the "brand" palette
- [ ] Compare results side-by-side with the originals
- [ ] Write ADR-006 if approach is validated
- [ ] Discuss findings before any code is written

---

## 7. References

- [OKLCH Color Space](https://oklch.com/) — perceptually uniform color model
- [CSS Color Level 4](https://www.w3.org/TR/css-color-4/) — oklch() function
- [Leonardo by Adobe](https://leonardocolor.io/) — contrast-based color generation
- [Radix Colors](https://www.radix-ui.com/colors) — 12-step scale generation approach
- WCAG 2.1 contrast guidelines — minimum ratios for text/UI components
