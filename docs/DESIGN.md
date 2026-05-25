---
name: Linia Command
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 1px
  margin-sm: 12px
  margin-md: 20px
  container-max: 100%
---

# DESIGN.md — Linia Command

## Brand & Style

The design system is engineered for high-stakes IT cutover management, where precision and rapid information processing are non-negotiable. The brand personality is "Mission Control": authoritative, ultra-reliable, and strictly utilitarian. It is designed for engineers and project leads who operate in high-pressure environments where every second of downtime is quantified.

The design style is **Modern Technical / Minimalist**, leaning into a terminal-inspired aesthetic without sacrificing modern usability. It prioritizes data density, using sharp geometry and a strict grid to evoke the feeling of a sophisticated instrument panel. Visual flourish is discarded in favor of functional clarity and "at-a-glance" status monitoring.

## Colors

The palette is rooted in an "Obsidian" dark mode to reduce eye strain during long-haul migration windows. Color is used exclusively as a functional signal:

- **Primary (Electric Blue):** Interactive states, "Ready" actions, and primary focus.
- **Success (Emerald):** Completed tasks and healthy system states.
- **Warning (Safety Amber):** In-progress tasks or potential blockers.
- **Error (Ruby):** Failed steps or critical path disruptions.
- **Surface & Borders:** A range of deep grays and blacks to create a layered terminal effect. Borders are high-contrast against the background to define the rigorous grid.

## Typography

The typographic system utilizes a dual-font approach to balance readability with technical precision.

- **Inter** is the primary workhorse for body text and descriptive labels, ensuring legibility at small sizes.
- **JetBrains Mono** is reserved for technical data, IDs, timestamps, and status labels, reinforcing the "Mission Control" aesthetic and ensuring character alignment in data tables.
- **Hanken Grotesk** provides a sharp, contemporary feel for headers and dashboard summaries.

All caps should be used sparingly for `mono-label` types to denote section headers or metadata categories.

## Layout & Spacing

This design system employs a **Fluid Technical Grid**. Unlike consumer apps, the layout maximizes screen real estate to provide a comprehensive view of the cutover timeline.

- **The Grid:** A 12-column layout with 1px borders acting as gutters, creating a "tiled" look.
- **Density:** High density is the default. Padding within elements is kept to a strict 8px or 12px minimum to pack information without sacrificing touch/click targets.
- **Reflow:** On mobile, complex tables collapse into high-density cards, but the primary experience is optimized for desktop and large-scale command center displays.

## Elevation & Depth

In this design system, depth is communicated through **Tonal Layers** and **Rigid Outlines** rather than soft shadows.

- **Level 0 (Background):** Deepest Obsidian (#0A0A0B).
- **Level 1 (Surface):** Slightly elevated panels (#161618) with a 1px solid border (#27272A).
- **Level 2 (Active/Hover):** Interactive elements use a subtle inner-glow or a brighter border rather than a drop shadow.
- **Indicators:** Active states are indicated by 2px vertical accent bars on the left edge of cards or table rows, colored according to the status logic.

## Shapes

Geometry is strictly architectural.

- **Standard Radius:** 4px (Soft) is the maximum used for buttons and inputs to prevent a "bubbly" appearance.
- **Data Cells:** Table cells and header sections use 0px (Sharp) corners to maintain the integrity of the vertical and horizontal grid lines.
- **Badges:** Status pills use a 2px radius—just enough to distinguish them from surrounding text without breaking the technical aesthetic.

## Components

- **Data Tables:** The core of the system. Rows must support a "Compact" mode with 32px height. Use zebra striping with high-contrast hover states.
- **Status Badges:** Use a "Glow-on-Dark" style. A dark background with high-saturation text and a matching 1px border (e.g., Dark Green background, Emerald text).
- **Evidence Inputs:** Compact text-only evidence fields that transition to a "Verified" state once a non-empty evidence note is saved. Do not use file uploaders in the MVP.
- **Progress Indicators:** Linear, 4px tall bars. Use "Step" indicators for multi-stage migrations, where each step is a discrete block in a sequence.
- **Action Buttons:** Square-ish (4px radius). Primary buttons use a solid Electric Blue; secondary buttons use a ghost style with a subtle white border.
- **Timeline Rails:** Vertical lines connecting task nodes, using color-coding (Solid for completed, Dashed for in-progress, Red for blocked).

## Bootstrap 5.3 Usage & Customization

Linia uses **Bootstrap 5.3 as the base UI utility and component layer**, but Bootstrap must be customized heavily so the product still feels like a dense "Mission Control" application, not a default Bootstrap admin panel.

Bootstrap is used for:

- Responsive grid primitives.
- Utility classes for spacing, display, flex, sizing, and alignment.
- Base form controls.
- Buttons.
- Tables.
- Badges.
- Modals.
- Dropdowns.
- Navigation shell primitives.

Bootstrap is not used as an excuse to abandon the Linia visual system. The Linia theme must override Bootstrap defaults to preserve:

- Obsidian dark mode.
- Compact density.
- Sharp grid lines.
- Minimal border radius.
- Technical typography.
- Functional status colors.
- High-density data tables.

### Installation

Install Bootstrap and Bootstrap Icons in the Angular app:

```bash
pnpm --filter web add bootstrap bootstrap-icons
```

Use Sass customization instead of importing Bootstrap as plain CSS.

Recommended file structure:

```text
apps/web/src/styles/
├─ bootstrap-linia.scss
├─ tokens.scss
├─ components.scss
└─ utilities.scss
```

Import the customized Bootstrap entrypoint from `apps/web/src/styles.scss`:

```scss
@use './styles/bootstrap-linia';
@use './styles/components';
@use './styles/utilities';
```

### Bootstrap Sass Entrypoint

Create `apps/web/src/styles/bootstrap-linia.scss`.

This file is the only place where Bootstrap Sass should be imported and customized.

```scss
// apps/web/src/styles/bootstrap-linia.scss

// 1. Linia token values
$linia-surface: #031427;
$linia-surface-container-lowest: #000f21;
$linia-surface-container-low: #0b1c30;
$linia-surface-container: #102034;
$linia-surface-container-high: #1b2b3f;
$linia-surface-container-highest: #26364a;

$linia-on-surface: #d3e4fe;
$linia-on-surface-variant: #c1c6d7;
$linia-outline: #8b90a0;
$linia-outline-variant: #414755;

$linia-primary: #adc6ff;
$linia-primary-strong: #4b8eff;
$linia-secondary: #4edea3;
$linia-tertiary: #ffb95f;
$linia-error: #ffb4ab;

// 2. Bootstrap core overrides
$body-bg: $linia-surface;
$body-color: $linia-on-surface;

$font-family-sans-serif: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
$font-family-monospace: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

$primary: $linia-primary;
$secondary: $linia-secondary;
$success: $linia-secondary;
$warning: $linia-tertiary;
$danger: $linia-error;
$dark: $linia-surface-container-lowest;
$light: $linia-on-surface;

$border-color: $linia-outline-variant;
$border-radius: 0.25rem;
$border-radius-sm: 0.125rem;
$border-radius-lg: 0.5rem;
$border-radius-xl: 0.75rem;

$box-shadow: none;
$box-shadow-sm: none;
$box-shadow-lg: none;

$spacer: 1rem;

$table-bg: transparent;
$table-color: $linia-on-surface;
$table-border-color: $linia-outline-variant;
$table-cell-padding-y: 0.375rem;
$table-cell-padding-x: 0.5rem;
$table-hover-bg: rgba(173, 198, 255, 0.06);
$table-striped-bg: rgba(255, 255, 255, 0.025);

$input-bg: $linia-surface-container-low;
$input-color: $linia-on-surface;
$input-border-color: $linia-outline-variant;
$input-focus-border-color: $linia-primary;
$input-focus-box-shadow: 0 0 0 1px rgba(173, 198, 255, 0.35);

$btn-border-radius: 0.25rem;
$btn-border-radius-sm: 0.125rem;
$btn-border-radius-lg: 0.25rem;

// 3. Import Bootstrap after overrides
@import "bootstrap/scss/bootstrap";
@import "bootstrap-icons/font/bootstrap-icons.css";

// 4. Linia Bootstrap runtime variables
:root,
[data-bs-theme="linia"] {
  color-scheme: dark;

  --bs-body-bg: #031427;
  --bs-body-color: #d3e4fe;
  --bs-emphasis-color: #d3e4fe;
  --bs-secondary-color: #c1c6d7;
  --bs-tertiary-color: #8b90a0;

  --bs-border-color: #414755;
  --bs-border-color-translucent: rgba(139, 144, 160, 0.35);

  --bs-primary: #adc6ff;
  --bs-primary-rgb: 173, 198, 255;
  --bs-secondary: #4edea3;
  --bs-secondary-rgb: 78, 222, 163;
  --bs-success: #4edea3;
  --bs-success-rgb: 78, 222, 163;
  --bs-warning: #ffb95f;
  --bs-warning-rgb: 255, 185, 95;
  --bs-danger: #ffb4ab;
  --bs-danger-rgb: 255, 180, 171;

  --bs-link-color: #adc6ff;
  --bs-link-hover-color: #d8e2ff;

  --bs-border-radius: 0.25rem;
  --bs-border-radius-sm: 0.125rem;
  --bs-border-radius-lg: 0.5rem;
  --bs-border-radius-xl: 0.75rem;

  --linia-surface: #031427;
  --linia-surface-lowest: #000f21;
  --linia-surface-low: #0b1c30;
  --linia-surface-container: #102034;
  --linia-surface-high: #1b2b3f;
  --linia-surface-highest: #26364a;
  --linia-outline: #8b90a0;
  --linia-outline-variant: #414755;
}
```

### Angular Theme Activation

Set the Linia Bootstrap theme at the root HTML level.

In `apps/web/src/index.html`:

```html
<html lang="en" data-bs-theme="linia">
```

Do not implement theme switching in the MVP. Linia is dark-mode only for the first release.

### Bootstrap Usage Rules

Use Bootstrap classes for layout and basic behavior, then apply Linia-specific classes for product identity.

Preferred usage:

```html
<section class="container-fluid linia-shell">
  <div class="row g-0">
    <aside class="col-12 col-lg-2 linia-sidebar">
      ...
    </aside>

    <main class="col-12 col-lg-10 linia-main">
      ...
    </main>
  </div>
</section>
```

Use Bootstrap utilities when they keep the code readable:

- `d-flex`
- `align-items-center`
- `justify-content-between`
- `gap-2`
- `container-fluid`
- `row`
- `col-*`
- `table`
- `table-sm`
- `btn`
- `btn-sm`
- `badge`
- `modal`
- `dropdown`
- `form-control`
- `form-select`
- `input-group`

Avoid long unreadable utility chains. If a component needs more than 6-8 utility classes, create a Linia component class instead.

### Bootstrap Component Mapping

| Linia Need | Bootstrap Base | Linia Custom Class |
| --- | --- | --- |
| App shell | `container-fluid`, `row`, `col-*` | `.linia-shell`, `.linia-sidebar`, `.linia-main` |
| Data tables | `table table-sm table-hover` | `.linia-table` |
| Status badges | `badge` | `.linia-status-badge` |
| Primary action | `btn btn-primary btn-sm` | `.linia-btn-primary` |
| Secondary action | `btn btn-outline-light btn-sm` | `.linia-btn-secondary` |
| Forms | `form-control`, `form-select` | `.linia-input` |
| Modals | `modal`, `modal-dialog` | `.linia-modal` |
| Toolbar | `d-flex`, `gap-*` | `.linia-toolbar` |
| Alert/error state | `alert` | `.linia-alert` |

### Linia Component Layer

Create `apps/web/src/styles/components.scss` for Linia-specific component styling.

```scss
.linia-shell {
  min-height: 100vh;
  background: var(--linia-surface);
  color: var(--bs-body-color);
}

.linia-sidebar {
  min-height: 100vh;
  background: var(--linia-surface-low);
  border-right: 1px solid var(--linia-outline-variant);
}

.linia-main {
  min-height: 100vh;
  background: var(--linia-surface-lowest);
}

.linia-panel {
  background: var(--linia-surface-container);
  border: 1px solid var(--linia-outline-variant);
  border-radius: 0;
}

.linia-toolbar {
  min-height: 40px;
  padding: 8px 12px;
  background: var(--linia-surface-low);
  border-bottom: 1px solid var(--linia-outline-variant);
}

.linia-table {
  margin-bottom: 0;
  font-size: 0.875rem;
  vertical-align: middle;
  border-color: var(--linia-outline-variant);

  th {
    height: 32px;
    color: var(--bs-secondary-color);
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: var(--linia-surface-low);
    border-bottom: 1px solid var(--linia-outline-variant);
  }

  td {
    height: 32px;
    color: var(--bs-body-color);
    border-bottom: 1px solid rgba(65, 71, 85, 0.65);
  }

  tbody tr:hover {
    background: rgba(173, 198, 255, 0.06);
  }
}

.linia-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 6px;
  border: 1px solid currentColor;
  border-radius: 2px;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.linia-status-ready {
  color: #adc6ff;
  background: rgba(173, 198, 255, 0.12);
}

.linia-status-in-progress {
  color: #ffb95f;
  background: rgba(255, 185, 95, 0.12);
}

.linia-status-completed {
  color: #4edea3;
  background: rgba(78, 222, 163, 0.12);
}

.linia-status-failed {
  color: #ffb4ab;
  background: rgba(255, 180, 171, 0.12);
}

.linia-status-blocked {
  color: #8b90a0;
  background: rgba(139, 144, 160, 0.1);
}

.linia-btn-primary {
  --bs-btn-color: #002e69;
  --bs-btn-bg: #adc6ff;
  --bs-btn-border-color: #adc6ff;
  --bs-btn-hover-color: #001a41;
  --bs-btn-hover-bg: #d8e2ff;
  --bs-btn-hover-border-color: #d8e2ff;
  --bs-btn-focus-shadow-rgb: 173, 198, 255;
  font-weight: 600;
}

.linia-btn-secondary {
  --bs-btn-color: #d3e4fe;
  --bs-btn-border-color: #414755;
  --bs-btn-hover-color: #d3e4fe;
  --bs-btn-hover-bg: rgba(173, 198, 255, 0.08);
  --bs-btn-hover-border-color: #adc6ff;
}

.linia-input {
  background: var(--linia-surface-low);
  border: 1px solid var(--linia-outline-variant);
  color: var(--bs-body-color);
  border-radius: 0.25rem;

  &:focus {
    background: var(--linia-surface-container);
    border-color: var(--bs-primary);
    color: var(--bs-body-color);
    box-shadow: 0 0 0 1px rgba(173, 198, 255, 0.35);
  }
}

.linia-evidence-box {
  background: var(--linia-surface-low);
  border: 1px solid var(--linia-outline-variant);
  border-radius: 0.25rem;
  padding: 8px;
}

.linia-mono {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
```

### Status Badge Example

```html
<span class="badge linia-status-badge linia-status-ready">Ready</span>
<span class="badge linia-status-badge linia-status-in-progress">In Progress</span>
<span class="badge linia-status-badge linia-status-completed">Completed</span>
<span class="badge linia-status-badge linia-status-failed">Failed</span>
<span class="badge linia-status-badge linia-status-blocked">Blocked</span>
```

### Button Example

```html
<button type="button" class="btn btn-sm linia-btn-primary">
  Start
</button>

<button type="button" class="btn btn-sm linia-btn-secondary">
  View Audit
</button>
```

### Table Example

```html
<table class="table table-sm table-hover linia-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Task</th>
      <th>Owner</th>
      <th>Status</th>
      <th class="text-end">Action</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="linia-mono">T-001</td>
      <td>Check database connectivity</td>
      <td class="linia-mono">DBA</td>
      <td>
        <span class="badge linia-status-badge linia-status-ready">Ready</span>
      </td>
      <td class="text-end">
        <button class="btn btn-sm linia-btn-primary">Start</button>
      </td>
    </tr>
  </tbody>
</table>
```

### Evidence Input Example

Evidence is text-only in the MVP. Do not create file upload zones.

```html
<div class="linia-evidence-box">
  <label for="evidenceContent" class="form-label linia-mono">
    Evidence note
  </label>

  <textarea
    id="evidenceContent"
    class="form-control form-control-sm linia-input"
    rows="4"
    placeholder="Paste command output, validation note, or operator confirmation"
  ></textarea>
</div>
```

### Bootstrap Do / Don't

Do:

- Use Bootstrap grid and utilities for fast layout.
- Use Bootstrap tables as a base for dense task and audit tables.
- Use Bootstrap modals for evidence entry and confirmations.
- Use Bootstrap form controls with Linia overrides.
- Use Bootstrap CSS variables and Sass overrides to keep customization centralized.
- Keep dark mode fixed with `data-bs-theme="linia"`.

Don't:

- Use default Bootstrap colors without Linia overrides.
- Use default rounded cards for core execution UI.
- Use large Bootstrap spacing utilities that make the app feel like a marketing site.
- Use Bootstrap carousels, offcanvas menus, or decorative components for MVP.
- Add theme switching for MVP.
- Add file-upload UI for evidence.
- Add WebSocket-driven live UI.
