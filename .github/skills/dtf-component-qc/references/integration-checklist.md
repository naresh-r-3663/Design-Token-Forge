# Integration Checklist

## Component Entry Point
- [ ] File: `packages/components/src/{component}/index.css`
- [ ] Contains exactly 2 imports:
  ```css
  @import './{component}.tokens.css';
  @import './{component}.css';
  ```
- [ ] No other content in the file

## Master Library Import
- [ ] File: `packages/components/src/index.css`
- [ ] Import line uncommented: `@import './{component}/index.css';`
- [ ] Import placed in correct category section (Inputs & Controls, Display & Feedback, etc.)
- [ ] Verify with: `grep '{component}' packages/components/src/index.css`

## Demo Index Page (`demo/index.html`)

### Card Update
- [ ] Component card changed from `<div>` to `<a>` (clickable)
- [ ] `data-status` changed from `"planned"` to `"done"`
- [ ] `data-s` on status badge changed from `"planned"` to `"done"`
- [ ] Status text changed from `Planned` to `Done`
- [ ] `href="{component}.html"` added to the `<a>` tag
- [ ] Card stats updated with actual counts: `~XX vars`, `N variants/roles`, `10 sizes`, `7 axes`
- [ ] Card placed in correct category group in the grid

### Nav Dropdown Update
- [ ] New link added to nav dropdown in `demo/index.html`
- [ ] Link follows alphabetical/build-order position within Components group
- [ ] Link format: `<a href="{comp}.html" role="menuitem">{Name} <span class="dd-hint">~XX vars</span></a>`

## Cross-Page Nav Sync

### Strategy for updating ALL demo page navs:

**Critical rule**: Always verify sed output — corrupted replacements are the #1 integration bug.

1. Identify which pages already have the preceding component link
2. Group pages by their "last nav link" — different pages may be at different states
3. For each group, append the new link after the appropriate anchor point
4. Handle `aria-current="page"` — the current-page link has extra attributes, so sed patterns must account for this

### Verification (MANDATORY after every nav update):
```bash
# Count occurrences of new component link across all pages
cd demo && for f in *.html; do
  count=$(grep -c "{new-comp}.html" "$f" 2>/dev/null)
  echo "$count $f"
done

# Check for corrupted HTML (garbled text, truncated tags)
grep -l 'role="men ' *.html       # Truncated role attribute
grep -l '="m[0-9]' *.html         # Garbled attribute values
grep -l '<a href.*<a href' *.html  # Doubled anchor tags on same line
```

- [ ] Every demo page (except editor-v1-archive.html and index.html) has exactly 1 occurrence of the new link
- [ ] No corrupted HTML found by verification grep
- [ ] Each page's own link still has `aria-current="page"` intact

## Post-Integration Smoke Test
- [ ] Open the demo page in browser — no blank screen
- [ ] Theme toggle works (light → dark → light)
- [ ] Nav dropdown opens and shows all links
- [ ] Sidebar section links scroll to correct sections
- [ ] Component renders visually (not invisible/collapsed)
- [ ] Pill bar controls change the component live
- [ ] Framework snippet tabs switch correctly
