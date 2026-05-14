# My Design Tokens — Design Token Forge

Custom design tokens that sync directly to Figma via the DTF plugin.

## Quick Start

### 1. Create your GitHub repo

```bash
# Create a new repo on GitHub (e.g. "my-design-tokens"), then:
git init
git add .
git commit -m "Initial token setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/my-design-tokens.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. That's it — the included workflow handles the rest

### 3. Wait for first deploy

- Go to **Actions** tab and wait for the workflow to complete (~1 minute)
- Your tokens are now live at: `https://YOUR-USERNAME.github.io/my-design-tokens/`

### 4. Connect the Figma Plugin

1. Open **Design Token Forge** plugin in Figma (shared by your team lead)
2. At the bottom, expand **Server URL**
3. Enter: `https://YOUR-USERNAME.github.io/my-design-tokens`
4. Click **Save**
5. The plugin connects and shows your token count
6. Click **Create Variables** to sync all tokens into your Figma file

## Updating Tokens

1. Edit `config.json` — change brand colors, semantic mappings, etc.
2. Commit and push to `main`
3. GitHub Actions rebuilds automatically (~1 min)
4. The Figma plugin detects the change → click **Update Variables**

## config.json Reference

| Field | Description |
|-------|-------------|
| `id` | URL-safe project identifier |
| `name` | Human-readable project name |
| `paletteKeys` | Key hex colors (system generates 24-step palettes from each) |
| `semanticMap.light` | Light theme: which palette step each semantic role uses |
| `semanticMap.dark` | Dark theme: same structure |
| `surfacePaletteSrc` | Which palette each surface context uses |

### Palette Keys

Each hex color generates a 24-step palette (white → 25 → 50 → ... → 900 → black).
The system uses these for all token generation.

```json
{
  "paletteKeys": {
    "brand": "#286CE5",  ← Primary color
    "brand": "#E53F28",          ← Brand/accent
    "danger": "#DC2626",         ← Error states
    "warning": "#D97706",        ← Warning states
    "info": "#0EA5E9",           ← Informational
    "success": "#16A34A",        ← Success states
    "greyscale": "#747474",      ← Neutral greys
    "desaturated": "#71747C"     ← Muted neutrals
  }
}
```

## Local Development

```bash
node build.js
# Outputs to dist/ — open dist/index.html to verify
```

## Files

| File | Purpose |
|------|---------|
| `config.json` | Brand colors, semantic mappings, surface config |
| `build.js` | Generates Figma-compatible token JSON from config |
| `package.json` | Project metadata and scripts |
| `.github/workflows/deploy-tokens.yml` | Auto-deploys to GitHub Pages on push |

## How It Works

```
config.json → build.js → dist/tokens.json → GitHub Pages → Figma Plugin → Figma Variables
```

1. You edit `config.json` with your brand colors
2. `build.js` generates palettes and resolves all tokens
3. GitHub Actions deploys `dist/` to Pages
4. The Figma plugin polls your Pages URL
5. Detects changes → syncs variables into your Figma file
