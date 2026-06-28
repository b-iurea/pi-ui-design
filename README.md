# ◈ ui-design

Visual frontend prototyping tool for [pi](https://github.com/earendil-works/pi-coding-agent). Drag, drop, theme, export — zero dependencies, runs in the browser.

```
/pi: ui-design start   → launch on http://localhost:8765
/pi: ui-design stop    → kill the server
/pi: ui-design status  → check if running
```

## Install

Clone into your pi extensions folder:

```bash
cd ~/.pi/extensions
git clone <url> ui-design
```

Start: `/pi: ui-design start` (opens browser automatically).

## What it does

Build a UI skeleton from a palette of 40+ components — heading, card, navbar, table, hero, modal, pricing, etc. Drag them into a tree, edit properties, change colors and spacing. The tool auto-saves to `.ui-design/` in the project root.

The generated code is available in three formats:

- **HTML+CSS** — standalone page with inline styles
- **React JSX** — component with style objects
- **Tailwind** — utility-first classes

## The workflow

This tool is half of a two-step process:

1. **You** drag a rough prototype together in the browser — just structure, placeholder copy, and rough layout. Think of it as sketching a wireframe.
2. **The LLM** reads it with the `read_ui_design` tool and treats it as a **blueprint** — then builds the real, production-quality frontend with full detail, modern design, animations, real content, and responsive layout.

The prototype shows *what goes where*. The LLM builds *what it looks like*.

## Layout

```
┌─────────────────────────────────────────────────────┐
│  Top bar — theme controls, dark mode, export        │
├──────┬───────────────────────────────┬──────────────┤
│      │                               │              │
│      │  Canvas — drag, nest,         │  Code panel  │
│      │  reorder components           │  HTML/React  │
│      │                               │  /Tailwind   │
│      │  ┌ Properties panel ─┐        │              │
│      │  │ edit props of     │        │              │
│      │  │ selected comp     │        │              │
│      │  └───────────────────┘        │              │
│      │                               │              │
├──────┴───────────────────────────────┴──────────────┤
│  Bottom bar — save status, component count          │
└─────────────────────────────────────────────────────┘
```

### Palette

Components are grouped by category: Layout, Typography, Buttons, Forms, Media, Navigation, Cards, Feedback, Data, Sections. Click to add, drag to reorder. Container types (Container, Flex Row/Col, Grid, Sidebar) accept children — drop components into them.

### Theme

| Control | What it does |
|---------|-------------|
| Primary | Canvas accent — buttons, badges, progress bars |
| Secondary | Canvas secondary accent |
| Bg | Canvas background (light mode) |
| Text | Canvas text color (light mode) |
| Spacing | Compact / Normal / Spacious |
| Radius | None → XL |
| Font | Inter, Georgia, Space Grotesk, DM Sans, JetBrains Mono |
| Dark mode | Toggle canvas dark/light |

The tool chrome (logo, sidebar, toolbar buttons) stays at `#024345` regardless of theme changes.

### Canvas

- Click a component to select it and edit its properties
- Drag by the handle (↕) to reorder; drag into child zones to nest
- Delete with Delete/Backspace or the ✕ button
- Containers show a + drop zone; click ＋ on the handle to add children

## API

The plugin registers one tool:

- **`read_ui_design`** — reads the prototype from `.ui-design/` and returns the HTML + component tree + theme. The tool description (visible to the LLM) explicitly instructs it to treat the prototype as a **skeleton/blueprint** and build the real frontend from it with full detail, modern design, and proper code. The `details` field also contains explicit instructions the LLM sees after reading the prototype.

## Files

```
ui-design/
├── index.ts          # pi plugin entry — server, command, tool
├── public/
│   ├── index.html    # app shell
│   ├── style.css     # all styles
│   └── app.js        # all logic — no framework, no build
└── .ui-design/       # auto-saved designs (per project)
    ├── current.html  # last generated HTML
    └── current-design.json  # full component tree + theme
```

## Contributing

It's one HTML file, one CSS, one JS, one server. Open `public/app.js` and go.
