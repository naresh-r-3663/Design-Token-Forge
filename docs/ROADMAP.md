<!-- status: current -->
<!-- last-verified: 2026-06-18 -->

# Design Token Forge — Progressive Roadmap

## How to Use This Roadmap

Each phase has a **skill** that guides the AI through every step. You (the designer) just need to:
1. Tell the AI which phase/task to work on
2. The AI loads the matching skill automatically
3. The skill has checklists and verification commands — the AI runs them
4. If all checks pass → the work is correct

**You never need to review code manually.** The skills are the reviewer.

---

## Phase 1: Make It Installable

**Skill:** `dtf-build-infra`
**Status:** Not started
**Goal:** Teams can `npm install @design-token-forge/tokens` and get working CSS

### Tasks

- [x] **1.1** Install PostCSS + autoprefixer + cssnano
- [x] **1.2** Create `postcss.config.js` at project root
- [x] **1.3** Add build scripts to `packages/tokens/package.json` (→ `dist/`)
- [x] **1.4** Add build scripts to `packages/components/package.json` (→ `dist/`)
- [x] **1.5** Update `package.json` exports to point to `dist/` (not `src/`)
- [x] **1.6** Remove `private: true` from token and component packages
- [x] **1.7** Add `.browserslistrc` for browser targets
- [x] **1.8** Update `.gitignore` to exclude `packages/*/dist/` (already covered)
- [x] **1.9** Set up changesets for versioning (`@changesets/cli`)
- [x] **1.10** Bump versions to `0.1.0` (first real release)
- [x] **1.11** Add `publish-packages.yml` GitHub Actions workflow
- [x] **1.12** Run all verification commands from the skill
- [x] **1.13** First npm publish (ready — needs NPM_TOKEN secret in GitHub)

### Tasks — Typography tokens (ADR-008)

- [x] **1.14** Fix `letter-spacing` em → percent at the Figma sync boundary
- [x] **1.15** `typography-presets.js` with 5 starter kits
- [x] **1.16** `generateTypographyTokens()` in generator (emits font primitives)
- [x] **1.17** "Pick a starting feel" step in onboard wizard
- [x] **1.18** `typographyConfig` slot in `projects/<id>/config.json` schema

**Done when:** `npm install @design-token-forge/tokens` works and the consumer gets minified, autoprefixed CSS.

---

## Phase 2: Make It Usable

**Skills:** `dtf-theme-generator` + `dtf-a11y-rtl`
**Status:** Not started
**Goal:** A developer can install, customize, and use DTF in 30 minutes

### Tasks — Theme Generator
- [x] **2.1** Build CLI entry point (`packages/generator/src/cli.js`)
- [x] **2.2** Build theme-generator module (palette-engine → CSS output)
- [x] **2.3** Test: `dtf --color "#E53F28" --name "test" -o /tmp/test.css`
- [x] **2.4** Write `docs/getting-started.md` (install → import → use → customize)

### Tasks — Accessibility & RTL
- [x] **2.5** Add `:focus-visible` to input, select, textarea (tooltip is non-interactive — skipped)
- [x] **2.6** Convert all 20 component CSS files to logical properties
- [ ] **2.7** Add CSS `@layer` structure — DEFERRED (postcss-import doesn't support layer imports yet)
- [x] **2.8** Add min tap-target enforcement to all 13 interactive components
- [x] **2.9** Run full a11y verification script — ALL PASS

### Tasks — CSS API Reference
- [ ] **2.10** Auto-generate token reference doc from YAML specs
- [ ] **2.11** Publish as searchable HTML in demo site

**Done when:** New developer can follow getting-started guide and have a branded button rendering in < 30 minutes. All components pass a11y verification.

---

## Phase 3: Make It Complete

**Skills:** `dtf-component-build` + `dtf-component-qc`
**Status:** In progress (20/38 through pipeline)
**Goal:** All 38 L1 components at gold-standard quality

### Tasks — Remaining Components (26)

#### Display & Feedback (existing but below gold standard)
- [x] **3.1** File Upload → gold standard remediation
- [x] **3.2** Avatar → gold standard remediation
- [x] **3.3** Badge → gold standard remediation
- [x] **3.4** Tooltip → gold standard remediation
- [x] **3.5** Alert → gold standard remediation
- [x] **3.6** Toast → gold standard remediation
- [x] **3.7** Progress Bar → gold standard remediation
- [x] **3.8** Progress Ring → gold standard remediation

#### Display & Feedback (new)
- [ ] **3.9** Spinner (spec → tokens → CSS → demo)
- [ ] **3.10** Skeleton (spec → tokens → CSS → demo)
- [ ] **3.11** KBD (spec → tokens → CSS → demo)

#### Layout & Structure (7 new)
- [ ] **3.12** Card
- [ ] **3.13** Divider
- [ ] **3.14** Accordion
- [ ] **3.15** Tabs
- [ ] **3.16** Table
- [ ] **3.17** List/ListItem
- [ ] **3.18** Pagination

#### Navigation (4 new)
- [ ] **3.19** Link
- [ ] **3.20** Breadcrumb
- [ ] **3.21** Menu/Dropdown
- [ ] **3.22** Navbar

#### Overlay (4 new)
- [ ] **3.23** Modal/Dialog
- [ ] **3.24** Drawer
- [ ] **3.25** Popover
- [ ] **3.26** Sheet

**Done when:** `docs/components/inventory.md` shows ✅ for Spec + Tokens CSS + Component CSS + Demo for all 38 components. All pass `dtf-component-qc`.

---

## Phase 4: Make It Interoperable

**Skills:** `dtf-framework-wrapper` + `dtf-token-interop`
**Status:** Not started
**Goal:** Teams using React, Tailwind, or other tools can consume DTF

### Tasks — React Wrappers
- [x] **4.1** Set up `packages/react/` with TypeScript + tsconfig
- [x] **4.2** Create Button wrapper (typed, ref-forwarding)
- [x] **4.3** Create Input wrapper
- [x] **4.4** Create all remaining component wrappers (all 25)
- [ ] **4.5** Publish `@design-token-forge/react` to npm (needs NPM_TOKEN secret)

### Tasks — Token Format Export
- [x] **4.6** Build W3C DTCG export script → `dist/tokens.dtcg.json` (421 tokens)
- [x] **4.7** Build Tailwind preset export → `dist/tailwind-preset.mjs/.cjs` (417 var() refs)
- [x] **4.8** Build Style Dictionary export → `dist/style-dictionary/` (408 tokens)
- [x] **4.9** Add export scripts to root `package.json` (`export:all`) + wired into tokens `build.mjs`

### Tasks — Vue/Svelte (stretch)
- [ ] **4.10** `packages/vue/` — Vue 3 wrappers
- [ ] **4.11** `packages/svelte/` — Svelte wrappers

**Done when:** React team can `npm install @design-token-forge/react` and use typed components. Tailwind team can add DTF as a preset.

---

## Phase 5: Polish & Scale

**No dedicated skill** — uses all existing skills as needed
**Status:** Future
**Goal:** Production-grade for enterprise adoption

### Tasks
- [ ] **5.1** Performance: CSS containment (`contain:`) on complex components
- [ ] **5.2** Unit tests for sync server and palette engine
- [ ] **5.3** Contribution guide (CONTRIBUTING.md)
- [ ] **5.4** Migration guides (from Bootstrap, Material, Tailwind)
- [ ] **5.5** Interactive Storybook or equivalent docs site
- [ ] **5.6** Figma library file with all components (linked to DTF variables)
- [ ] **5.7** Performance budget monitoring (CSS size tracking per release)

---

## How Skills Prevent Hallucination

Each skill contains:

1. **Exact file paths** — the AI knows where to read and write
2. **Code templates** — the AI copies patterns, doesn't invent
3. **Bash verification commands** — the AI runs checks that produce ✅/❌ output
4. **Anti-patterns** — explicitly forbidden mistakes (learned from real bugs)
5. **Cross-references** — skills reference each other (e.g., component build → QC)
6. **Gold standard references** — always compare to button.html / button.css / button.tokens.css

If the AI deviates, the verification commands will fail. The skill system is self-correcting.
