# Design Token Forge — User Flow & Page Map

> **Purpose:** single source of truth for every URL a user (or
> contributor) can land on, what flow it belongs to, and what
> happens next. Update this file whenever a page is added,
> renamed, or retired.

_Last refresh: 2026-05-16_

---

## 1. Canonical user flow

```
┌────────────────────┐    + New project    ┌──────────────────┐
│  demo/index.html   │ ─────────────────▶ │  demo/onboard.   │
│  (Project hub —    │                    │  html (wizard,   │
│  landing page)     │                    │  writes via PAT) │
└─────────┬──────────┘                    └────────┬─────────┘
          │ click a project card                   │ created → reload
          ▼                                        ▼
┌──────────────────────────────────────────────────────────────┐
│  demo/editor-v2/?project=<id>                               │
│  ─────────────────────────────────────────                  │
│  • Switcher  (top-bar) — switch / DELETE / + New             │
│  • Save as default — versioned snapshot → repo (PAT)        │
│  • Deploy to Figma — delta summary → plugin                  │
└─────────┬────────────────────────────────────────────────────┘
          │
          ├── components.html (component gallery)
          ├── color-tokens.html (token ladder browser)
          └── frameworks.html (React/Vue/Svelte snippets)
```

**State-by-state coverage:**

| State | Hub (`demo/index.html`) | Editor v2 |
|---|---|---|
| 0 projects in fork | "No projects yet — Create your first project" → `onboard.html` | Switcher shows "No projects — Create your first project" |
| 1 project | Card grid (1 card) + "+ New project" | Switcher shows the single project + delete (with auto-redirect to onboard if user deletes it) |
| N projects | Card grid | Full switcher with check-mark on active + per-row delete |
| First visit on a new device | Fetches `projects.json`; populates `dtf-known-projects` cache | Editor v2 calls `syncKnownProjectsFromIndex()` on boot |

---

## 2. Pages directory

### 2.1 Active surface (linked from canonical flow)

| Path | Purpose | Reached from |
|---|---|---|
| `demo/index.html` | **Project hub** — landing page, project cards | Pages root, direct |
| `demo/onboard.html` | **New-project wizard** — PAT auth, palette pick, commits scaffold | Hub topbar `+ New project`, editor switcher empty state, post-delete (when fork hits 0 projects) |
| `demo/editor-v2/index.html` | **Editor v2** — T0/T1/T2/T3 tier editor with switcher, save-as-default, deploy | Hub project cards (with `?project=<id>`) |
| `demo/components.html` | Component gallery index | Hub topbar, hub explore cards, every component demo via `nav.js` |
| `demo/color-tokens.html` | Browse primitive → semantic → surface ladder | Hub explore card |
| `demo/frameworks.html` | React/Vue/Svelte integration snippets | Hub explore card, component pages |
| `demo/<component>.html` | Per-component demos (button, input, toggle, …) | `components.html`, `nav.js` dropdown |
| `demo/editor-v2/preview.html` | Iframe-only render surface for editor-v2 | `editor-v2/index.html` iframe |
| `demo/plugin/ui.html` | Figma plugin UI (panel) | Loaded by the Figma plugin runtime |
| `demo/shared.css`, `demo/shared.js`, `demo/nav.js`, `demo/_TEMPLATE.html`, `demo/_COMPONENT_CONFIGS.js`, `demo/_onboard-build-template.*` | Shared assets / templates | Used by demos and build pipeline |

### 2.2 Retained but unlinked from the main flow

| Path | Status | Recommendation |
|---|---|---|
| `demo/editor-legacy.html` | **Frozen** — the old monolithic Color System editor. Still functional, supports `?action=delete` URL handler. Was the only delete path before v2 grew its own. | Keep until v2 covers ALL its features (advanced AA tuning, multi-mode export). After parity → delete. Currently NOT linked from the hub anymore (removed in 2026-05-16). |
| `demo/editor-v1-archive.html` | Archived v1 editor, kept for diffing | Safe to delete — its replacement (`editor-legacy.html`) already covers archival. **Recommended: remove.** |
| `demo/color-system.html` | Old color-roles page; superseded by `editor-v2`. Only referenced from `_TEMPLATE.html`. | Move to `dead/` or delete. **Recommended: remove.** |
| `demo/color-generator.html` | Old standalone palette generator. No inbound links from active pages. | **Recommended: remove.** |
| `demo/color-integration.html` | "How It Works" page from old IA. Still referenced by `nav.js`. | Either keep (and link from hub) or delete + drop the `nav.js` entry. **Recommended: remove + update nav.js.** |
| `demo/alert.html.old`, `demo/alert.html.prev` | Backup files left over from a refactor | **Recommended: delete.** Pure cruft. |

### 2.3 Repo-root pages (NOT published to Pages; never linked)

Pages publishes only `dist/` (see `.github/workflows/deploy-tokens.yml`).
None of the following are part of the publish artifact:

| Path | Notes | Recommendation |
|---|---|---|
| `index.html` (root) | 1779-line monolithic "Tokn — Design System Portal" mockup | **Recommended: delete.** Pre-DTF prototype. |
| `interactive.html` | 763 lines, prototype | **Recommended: delete.** |
| `mockup.html`, `mockup-v2.html` | Static mockups (724 + 921 lines) | **Recommended: delete.** |
| `complete.html`, `complete-backup.html` | Old "complete" prototype + its backup. `validate.js` still reads `complete.html`. | **Recommended: delete both** and remove `validate.js` (or rewrite if its rule is still useful). |

### 2.4 Plugin / packages

| Path | Purpose |
|---|---|
| `packages/figma-plugin/` | Source of the Figma plugin (loaded into Figma directly, not via Pages) |
| `packages/components/`, `packages/tokens/`, `packages/generator/`, `packages/sync-server/` | npm-publishable packages |

---

## 3. URL/route contracts

| Route | Owner | Contract |
|---|---|---|
| `demo/index.html` | Hub | Reads `projects.json` (relative or `/Design-Token-Forge/projects.json`); seeds `dtf-known-projects` localStorage by handing off via card click. |
| `demo/editor-v2/?project=<id>` | Editor v2 | On boot: writes `dtf-active-project` from query, strips param, then loads. Falls back to last-active if no param. |
| `demo/onboard.html?return=<url>` (planned) | Onboard | Currently always returns to `editor-v2/`. **TODO:** honour `?return=` so deep-link-after-create works. |
| `demo/editor-legacy.html?project=<id>&action=delete` | Legacy | Was the v2 delete handoff target. **NO LONGER USED** as of 2026-05-16 — v2 deletes in-place. |
| `demo/editor-legacy.html?keep=1` | Legacy | Bypass any auto-action params. Still works. |

---

## 4. State keys (localStorage / sessionStorage)

| Key | Owner | Purpose |
|---|---|---|
| `dtf-active-project` | All | Currently-loaded project id. |
| `dtf-known-projects` | All | Cached `projects.json` content for the local fork. Refreshed on every editor-v2 boot. |
| `dtf-theme` | All | `light` / `dark`. |
| `dtf-gh-pat` | onboard + editor-v2 + legacy | GitHub PAT (`repo` scope). |
| `dtf-gh-user` | onboard + editor-v2 + legacy | GitHub username (cached from `/user`). |
| `ev2-draft-<projectId>` | editor-v2 | Per-project unsaved-draft snapshot. Cleared on project switch. |
| `dtf-migration-ack-<projectId>` | editor-v2 | Migration-banner acknowledgement, version-scoped. |

---

## 5. Outstanding gaps

1. **Onboard return URL** — `onboard.html` always lands on `editor-v2/` after create. Should honour `?return=`.
2. **Hub doesn't show "set as default" version** — once a project has a `latestVersion`, surface it on the card (e.g. "v1.2.0 · Updated 3 days ago").
3. **Cross-fork projects** — when projects.json lists a project owned by another user, the local fork can't write to it. Hub should label these "read-only" or hide them behind a toggle.
4. **`shared.css` cache busting drift** — each demo page hard-codes `?v=20260516a` independently. Centralise.
5. **`nav.js` link map is stale** — references `color-integration.html` which is recommended for removal.

---

## 6. Cleanup proposal (separate commit, requires sign-off)

Group A — pure cruft, zero risk:
- `demo/alert.html.old`
- `demo/alert.html.prev`
- `complete-backup.html`

Group B — superseded by editor-v2, no live inbound links:
- `demo/editor-v1-archive.html`
- `demo/color-system.html` (+ remove ref in `_TEMPLATE.html`)
- `demo/color-generator.html`
- `demo/color-integration.html` (+ remove entry in `nav.js`)

Group C — unpublished prototypes at repo root:
- `index.html`
- `interactive.html`
- `mockup.html`
- `mockup-v2.html`
- `complete.html` (+ delete `validate.js` or rewrite)

Group D — keep but link properly:
- `demo/editor-legacy.html` (keep; remove last hub references; eventually retire when v2 reaches parity)

**Do not delete:**
- Anything under `packages/`, `projects/`, `scripts/`, `specs/`, `docs/`, `src/`, `tests/`, `tokn-deploy/`.
- `demo/_TEMPLATE.html`, `demo/_COMPONENT_CONFIGS.js`, `demo/_onboard-*` (build templates).
