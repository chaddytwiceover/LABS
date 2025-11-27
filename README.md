# LABS

Experimental projects subdomain for CHADDYTWICEOVER.

## Design System

This subdomain implements the CHADDYTWICEOVER design system - a brutalist-inspired approach with the following principles:

- **Emergent aesthetics** - Form follows purpose, beauty emerges naturally
- **Exposed structure** - Visible grid, borders, and scaffolding
- **Dense, information-rich** - Every element earns its space
- **Explicit over implicit** - Clear labels, obvious interactions
- **Performance IS design** - Fast load times, smooth animations

## Color Palette

- **stone-950** (#0c0a09) - Primary background
- **stone-900** (#1c1917) - Secondary background  
- **stone-800** (#292524) - Borders, dividers
- **stone-100** (#f5f5f4) - Primary text
- **teal-400** (#2dd4bf) - Primary accent ("muted zest")
- **amber-500** (#f59e0b) - Highlights, warnings

## Typography

Monospace font stack for technical aesthetic:
```
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
```

## Features

- Visible 50px × 50px grid background
- Cursor trail effect with radial blur
- Responsive mobile-first design
- Section numbering (01, 02, 03)
- Bordered components exposing structure
- Smooth 300ms transitions
- Arrow indicators on hover
- Project filtering and search
- LocalStorage persistence

## File Structure

```
/
├── index.html          # Main page
├── lab.css            # Design system styles
├── lab.js             # Interactions & filtering
├── projects.json      # Project data
└── README.md          # Documentation
```

## Development

Open `index.html` directly in a browser, or use a simple HTTP server:

```bash
python3 -m http.server 8080
```

Then navigate to `http://localhost:8080`

## Deployment

### DigitalOcean App Platform

This repository is configured for DigitalOcean App Platform deployment. The configuration is located in `.do/app.yaml`.

#### Quick Deploy

1. Fork or clone this repository to your GitHub account
2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Click "Create App" and select "GitHub"
4. Choose this repository
5. App Platform will automatically detect the `.do/app.yaml` configuration
6. Review settings and click "Create Resources"

The app will be deployed as a static site with automatic deployments on push to the main branch.

#### Manual Configuration

If you prefer to configure manually:
- **Source**: GitHub repository
- **Type**: Static Site
- **Output Directory**: `/`
- **Index Document**: `index.html`

## Philosophy

**"Design is how it works"**

Emergent aesthetics. Exposed structure. Information-dense.

---

© 2025 CHADDYTWICEOVER
