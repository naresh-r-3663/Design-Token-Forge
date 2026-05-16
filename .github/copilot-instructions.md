<!-- Design Token Forge — Copilot workspace instructions -->

## Project

Design Token Forge — a unified token system + variable-exhaustive L1 component library.

## Key rules for AI assistants

1. Read `.instructions.md` at project root for full context before making changes.
2. All component styling uses CSS custom properties. NEVER hardcode visual values.
3. Variable naming: `--{prefix}-{property}` for components, `--{category}-{name}-{scale}` for global tokens.
4. Use data attributes for variants/states: `data-variant="primary"`, `data-size="base"`.
5. Every component must cover 7 axes: Shape, Dimension, Surface, Typography, Slots, Motion, A11y.
6. Specs go in `/specs/`, docs go in `/docs/`, code goes in `/packages/`.
7. **Always run the relevant skill** before starting any multi-step task (see Available Skills below).
8. **Every skill has verification commands** — run them before considering a task complete.
9. **Never skip checklist items** — if a checklist says `- [ ]`, it must be verified.

## Available Skills (use `/` in chat to invoke)

| Skill | When to Use |
|---|---|
| `dtf-component-qc` | Reviewing/auditing existing components for consistency and quality |
| `dtf-component-build` | Building a new component end-to-end (spec → tokens → CSS → demo) |
| `dtf-build-infra` | Setting up CSS bundling, npm packaging, versioning, CI/CD |
| `dtf-a11y-rtl` | Adding focus-visible, logical properties, RTL, CSS layers, tap targets |
| `dtf-framework-wrapper` | Creating React/Vue/Svelte typed wrapper components |
| `dtf-theme-generator` | Building the brand customization CLI and getting-started docs |
| `dtf-token-interop` | Exporting tokens to W3C DTCG, Tailwind preset, Style Dictionary |

## Progressive Roadmap

See `docs/ROADMAP.md` for the phased plan. Skills are designed to match roadmap phases:
- Phase 1 (Installable): `dtf-build-infra`
- Phase 2 (Usable): `dtf-theme-generator` + `dtf-a11y-rtl`
- Phase 3 (Complete): `dtf-component-build` + `dtf-component-qc`
- Phase 4 (Interoperable): `dtf-framework-wrapper` + `dtf-token-interop`

## Key docs to reference

- Architecture: `docs/architecture/overview.md`
- Global tokens: `docs/tokens/global-tokens.md`
- Component template: `docs/components/variable-spec-template.md`
- Component inventory: `docs/components/inventory.md`
- Decision records: `docs/decisions/adrs.md`
- Roadmap: `docs/ROADMAP.md`
- **UI consistency checklist**: `docs/CONSISTENCY.md` — canonical vocabulary, action verbs,
  WCAG strings, class naming, microcopy. **Update in the same PR** whenever a new pattern
  ships.
