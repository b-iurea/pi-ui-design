# pi-ui-design → Figma-like Redesign — Implementation Plan

## Overview

Transform the existing pi-ui-design prototype tool from a functional tree-based editor into a Figma-like visual design experience, while keeping zero-dependency, single-page architecture.

## Architecture

```
pi-ui-design/
├── index.ts              # unchanged — server, commands, tools
├── public/
│   ├── index.html        # RESTRUCTURED — Figma-like layout, Font Awesome CDN
│   ├── style.css         # REWRITTEN — Figma dark theme, snap guides, transitions
│   └── app.js            # REWRITTEN — modular IIFE, all new features
└── .ui-design/           # auto-saved designs + snapshots
```

## Files to Modify

### 1. `public/index.html` — Figma-like DOM structure

- Top toolbar: Move tools (select, hand, frame, text, rectangle, ellipse), undo/redo, zoom controls
- Left sidebar: Layers panel (tree with visibility lock toggles) + Assets/Design library tabs
- Center: Infinite canvas container (transform-based zoom/pan) + floating toolbar above
- Right sidebar: Design Inspector (4 sections: Position, Typography, Layout, Effects) + Code/Preview tabs
- Bottom bar: Zoom percentage, component count, save status, auto-save toggle
- Font Awesome CDN (6.5+) for all icons

### 2. `public/style.css` — Figma dark theme

- Color palette: #1e1e1e panels, #2c2c2c canvas, #383838 borders, #0d99ff accent
- Dot grid background on canvas
- Smooth transitions on all interactive elements
- Figma-like scrollbar styling
- Snap guide lines (blue 1px dashed lines)
- Resize handles (8-points on selection)
- Multi-select marquee (translucent blue rect)
- Layer tree with indent lines
- Comment pins/bubbles
- Toast notifications (bottom-right)
- Selection border with 2px offset stroke
- Hover states with overlay tint

### 3. `public/app.js` — Figma-like functionality

- **State Management** — Module pattern using IIFE namespace. State: tree, selectedIds (Set), zoom, pan, masters map, comments, snapshots, clipboard
- **Infinite Canvas** — transform: translate(x,y) scale(z) on a canvas-layer div. Middle-mouse pan, Ctrl+scroll zoom. Smooth easing.
- **Multi-Select** — Shift+click to add/remove. Marquee drag on empty canvas space.
- **Resize Handles** — 8 handles on selected component. Drag to resize, visual feedback, snapping to grid.
- **Snapping** — During drag/resize, snap to nearest component edge within 6px. Shows guide lines. Snaps to parent edges, sibling edges, and grid lines.
- **Duplicate** — Ctrl+D to duplicate selected component(s) with offset.
- **Inline Text Editing** — Double-click a text component, contentEditable=true, blur/enter to save.
- **Layers Panel** — Tree view with expand/collapse, visibility toggle, lock toggle, drag to reorder.
- **Inspector** — 4 sectioned panels:
  1. Position & Size (x, y, w, h, rotation)
  2. Typography (font, size, weight, line-height, letter-spacing, alignment)
  3. Layout (display, flex-direction, justify, align, gap, padding)
  4. Effects (background, border-radius, border, shadow, opacity)
- **Master/Instance Components** — Store masters in `state.masters`. Instances have `masterId`. Edit master → all instances update. Detach instance to unlink.
- **Comments** — Pin comments to components. Panel shows all comments with thread, resolved toggle.
- **Snapshots** — Versioned auto-saves. `state.snapshots[]` with timestamps. Panel to view/restore/delete snapshots.
- **Code Generators** — Keep existing HTML/React/Tailwind. Add Vue (v-bind/v-for/v-if), Svelte ({#each}), Angular (*ngFor,*ngIf, [style.bind]). Add CSS Modules and Styled Components variants.
- **Live Preview** — render generated code in an `<iframe>` with `srcdoc`.
- **Component Library** — Palette organized by category with visual mini-previews. Search. Drag to canvas.
- **Keyboard Shortcuts** — All Figma-like: V=Move, H=Hand, F=Frame, T=Text, R=Rectangle, O=Ellipse, L=Line, Shift+A=Auto layout, Ctrl+D=Duplicate, Ctrl+G=Group, Ctrl+Shift+G=Ungroup, +/-=Zoom, 0=Fit, 1=100%
- **Save/Load** — Auto-save to .ui-design/current-design.json + snapshots array. Load on init.

## Migration Path

1. Old format (flat components array) still loads successfully
2. New format (tree + masters + comments + snapshots) auto-saves
3. Backward-compatible read

## Testing

1. `cd /path/to/pi-ui-design && git checkout feat/figma-like-redesign`
2. `npm link` or place in pi extensions folder
3. Start: `/pi: ui-design start`
4. Verify: canvas loads, components can be added, dragged, resized, properties edited
5. Verify: zoom/pan works (middle-click drag, ctrl+scroll)
6. Verify: multi-select (shift+click, marquee)
7. Verify: duplicate (Ctrl+D)
8. Verify: inline text editing (double-click)
9. Verify: layers panel reorder
10. Verify: inspector shows sections
11. Verify: export generates correct code for all 6 formats
12. Verify: live preview renders correctly
13. Verify: save/load preserves state
14. Verify: snapshots are saved and restorable
15. Verify: comments can be added and resolved
