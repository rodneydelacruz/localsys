# Dark Mode Redesign — Modern Dark Polish Pass

## Goal

Improve the existing dark mode of the Barangay Records System with a polish pass: better contrast, surface depth, smoother transitions, and a refined palette — without changing the overall architecture or component structure.

## Current Issues

- **Surface depth**: bg (#1A1513) vs card (#25201C) — ~5% luminance difference, surfaces blend together
- **Border contrast**: #3D322C on #1A1513 — ~2:1 ratio, barely visible
- **Muted text**: #9A8D80 on #25201C — ~4:1, below WCAG AA for small text
- **No elevation system**: all surfaces use the same card color regardless of hierarchy
- **Transitions**: only `body` gets a CSS transition — components and cards snap instantly on theme switch

## Direction: Modern Dark

Near-black base with cooler undertones. Gold kept as a restrained accent for active states, the login seal, and the page header gold bar. Surface hierarchy defined by border treatments rather than fill differences.

## Palette

| Token | Current | New | Role |
|-------|---------|-----|------|
| `--bg` | `#1A1513` | `#0B0A09` | Main background (near-black) |
| `--card` | `#25201C` | `#141211` | Card surface |
| `--card-fg` | `#D4C5B5` | `#E5DCD0` | Card text |
| `--fg` | `#D4C5B5` | `#E5DCD0` | Body text |
| `--primary` | `#8BAFC9` | `#608B99` | Cool muted teal-blue |
| `--primary-fg` | `#1A1513` | `#0B0A09` | Primary button text |
| `--secondary` / `--muted` | `#2D2824` | `#1C1917` | Muted/secondary surfaces |
| `--muted-fg` | `#9A8D80` | `#948A7E` | Muted text (~7:1 on card) |
| `--accent` | `#2D2824` | `#1C1917` | Hover states |
| `--accent-fg` | `#D4C5B5` | `#E5DCD0` | Accent text |
| `--destructive` | `#E85550` | `#D94A45` | Philippine red, slightly cooler |
| `--destructive-fg` | `#FFFFFF` | `#FFFFFF` | — |
| `--border` | `#3D322C` | `#2A2622` | Borders |
| `--input` | `#3D322C` | `#2A2622` | Input borders |
| `--ring` | `#D4A84B` | `#C9953E` | Gold focus ring |

Named color variables:

| Token | Current | New | Role |
|-------|---------|-----|------|
| `--capiz` | `#1A1513` | `#0B0A09` | Page bg / login page wrapper |
| `--barangay` | `#8BAFC9` | `#608B99` | Cool teal-blue |
| `--gold` | `#D4A84B` | `#C9953E` | Active sidebar, header bar, seal |
| `--narra` | `#D4C5B5` | `#C4B4A0` | Warmer brown for greeting text |
| `--bamboo` | `#3D322C` | `#2A2622` | Section borders, dividers |
| `--red-pinoy` | `#E85550` | `#D94A45` | Destructive actions |

## Surface Elevation System

Three tiers, differentiated by border treatment rather than fill color:

1. **Base** (`bg` `#0B0A09`): no border, flat
2. **Card** (`#141211`): 1px solid `#2A2622` border + `box-shadow: inset 0 1px 0 rgba(255,255,255,0.03)`
3. **Elevated** (modals, popovers, dropdowns): same `#141211` fill, `#2A2622` border + `box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(96,139,153,0.08)` + `backdrop-filter: blur(8px)`
4. **Active/selected card**: border switches to `rgba(201,149,62,0.3)` — subtle gold glow

## Transitions

Staggered transition timing on theme switch:

| Selectors | Properties | Duration | Delay |
|-----------|-----------|----------|-------|
| `body` | `background-color, color` | 300ms | 0 |
| `.card, .sidebar, aside, nav` | `background-color, border-color` | 350ms | 50ms |
| `.btn, button, input, select, .badge` | `background-color, border-color, color` | 300ms | 80ms |

All transitions respect `prefers-reduced-motion: reduce` (set to `none`).

## Theme Toggle Animation

Replace `theme-spin` keyframe with `theme-swirl`:

```css
@keyframes theme-swirl {
  from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}
```

## Component-Specific Changes

### ThemeToggle
- Remove `hover:ring-1 hover:ring-ring` from the button
- Replace with a subtle `hover:bg-accent` (already present) and `hover:shadow-sm`
- Keep `active:scale-90` for press feedback

### Cards
- Apply the new card elevation (`#141211` fill + `#2A2622` border + inset shadow)
- No changes to the card component code itself — all driven by CSS variables
- `.card-active` variant for selected states (gold border glow)

### PageHeader
- Gold accent bar (left vertical div) stays
- Bottom border rule: use `border-bamboo` (`#2A2622`) with `h-[1.5px]` instead of `h-px` for better visibility

### Sidebar
- Active nav item: keep `bg-gold/10 text-gold` (unchanged)
- Inactive items: `text-muted-foreground` → works with new contrast values

### Login Page
- `bg-capiz` on the wrapper div (line 40 in LoginPage.tsx) currently points to `#F8F5F0` in light mode — in dark mode this already uses the dark `--capiz` variable. No change needed, just verify the variable works correctly.

### Error States
- Toast borders: `border-red-pinoy/30` (was hardcoded `/30` — already uses variable, just verify)
- Form error box: `bg-red-pinoy/8` border `border-red-pinoy/20`

## Files to Modify

1. **`src/index.css`** — Update `.dark` block palette values, add elevation box-shadows, add staggered transitions to `*`, replace `theme-spin` with `theme-swirl`, add elevated surface styles
2. **`src/components/ThemeToggle.tsx`** — Remove hover ring, keep existing structure
3. **`src/pages/Dashboard.tsx`** — Verify border color uses variable (currently `border-bamboo/50`)
4. **Login page** — Verify `bg-capiz` resolves correctly in dark mode

No changes to component color classes — all done via CSS variables.
