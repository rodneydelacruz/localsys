# Frontend Redesign — Barangay System

**Date:** 2026-07-05
**Status:** Approved design, awaiting implementation

## Overview

Modern, enterprise-grade redesign of the Barangay Records System frontend that performs well on low-end devices. Hybrid approach — retains Filipino cultural flavor (capiz, narra, gold, bamboo palette) within a clean, professional design system. All animations use CSS-only, GPU-composited properties (`transform`, `opacity`). No JavaScript animation libraries.

## Design Tokens & Color Palette

### New tokens to add to `@theme` in `index.css`

```css
--color-surface-raised:  /* elevated surfaces (modals, dropdowns) */
--color-surface-overlay: /* backdrops, scrims */
--color-text-subtle:     /* between muted-foreground and border */
```

### Changes to existing tokens

- Filipino-named tokens (`--capiz`, `--narra`, `--gold`, `--bamboo`, `--barangay`, `--red-pinoy`) remain available as first-class theme colors with no change in value.
- Dark mode base warmed slightly from `#0B0A09` to `#12100E` for readability on low-end screens.
- Remove universal `* { transition: all ... }` in favor of targeted transitions on interactive elements only (performance win).

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#F8F5F0` | `#12100E` |
| `--card` | `#FFFFFF` | `#181512` |
| `--primary` | `#1B3A4B` | `#608B99` |
| `--gold` | `#C9953E` | `#C9953E` |
| `--border` | `#E8DFD0` | `#2A2622` |

## Animation Utility System

### Tailwind 4 `@utility` classes (in `index.css`)

All utilities wrap in `@media (prefers-reduced-motion: no-preference)` via a `motion-safe` variant. Default timing: 150ms micro-interactions, 200ms transitions, 300ms enters. Default easing: `cubic-bezier(0.16, 1, 0.3, 1)`.

| Utility | Behavior |
|---------|----------|
| `motion-fade-in` | opacity `0 → 1` over 300ms |
| `motion-slide-up` | translateY(12px) + opacity `0 → 1` over 300ms |
| `motion-scale-in` | scale(0.95) + opacity `0 → 1` over 200ms |
| `motion-press` | scale(0.97) on `:active` — 100ms |
| `motion-lift` | translateY(-2px) + shadow increase on `:hover` — 200ms |
| `motion-stagger-[n]` | cascading `animation-delay: n*index` for list children |

### What gets replaced

- 5 separate `@keyframes` → consolidated into utilities
- `animate-page-enter` → `motion-fade-in motion-slide-up`
- Inline `style={{ animationDelay }}` → `motion-stagger-{50|100}`

## Layout & Sidebar

### Layout

- CSS grid wrapper: `grid grid-cols-[auto_1fr]` replaces spacer div hack
- Main content: `<div key={pathname} class="... motion-fade-in motion-slide-up">`
- `OfflineIndicator` stays as-is

### Sidebar

| State | Desktop | Mobile |
|-------|---------|--------|
| Pinned (default) | Full width 15rem, nav labels visible | N/A — overlay drawer |
| Unpinned | Icon-only 4rem, tooltips on hover | N/A |
| Mobile | N/A | Bottom `motion-slide-up` drawer |

- Active indicator: thin gold `::before` pseudo-element on active link, CSS transition on position
- User section: condensed in collapsed mode (avatar + logout only), full info + logout in expanded
- Remove `body.style.overflow` JS — use CSS class on `<html>` instead

## Login Page

- Greeting text with gold underline accent (replaces separate gold rule div)
- Form card: `rounded-2xl`, very subtle `radial-gradient` overlay via CSS pseudo-element
- Button: loading spinner replaces text, smooth width transition
- Animations staggered via `motion-stagger`
- Error banner: refined spacing, `motion-scale-in`

## Dashboard

- 4 stat cards in responsive grid: Total Records, Pending, Approved, Rejected
- Stat card: gold top accent bar, large number, label, optional trend arrow
- Recent activity: last 5 records in compact timeline list
- Quick actions: "New Record" CTA, "View All Records" link
- All data via existing PocketBase APIs (`getList` with counts)
- Skeleton loading state (CSS shimmer, no JS)

## Records Page

- Form in slide-over panel (desktop) or bottom drawer (mobile) — replaces inline card
- Records table: columns Title, Status, Date, Actions. Sortable. Striped rows.
- Status badges with colored dot indicators (green circle = approved, amber = pending, red = rejected)
- Empty state: clean text + CTA button, no illustration
- Loading state: 3 skeleton rows with CSS shimmer
- Staggered row entry via `motion-stagger-50`

## Settings Page

- Section cards remain, padding tightened from `p-4` to `p-3`
- Auto-save toast: bottom-right position, `motion-slide-up` enter/exit
- Tag input: scale-in animation on tag add/remove
- Loading state: skeleton blocks per section shape
- Error state: minimal text + retry button

## Performance Guarantees

- Zero new JavaScript dependencies
- All animations use only `transform` and `opacity` (GPU-composited)
- No layout-triggering transitions (`width`, `height`, `top`, `left`)
- `will-change` applied only during active animations (via CSS classes, not inline)
- Universal `prefers-reduced-motion` support via `motion-safe` wrapper

## Files Changed

```
src/index.css          — design tokens + animation utilities
src/components/Layout.tsx
src/components/Sidebar.tsx
src/components/ThemeToggle.tsx
src/components/ui/ConfirmDialog.tsx
src/components/ui/PageHeader.tsx
src/auth/LoginPage.tsx
src/pages/Dashboard.tsx
src/features/records/RecordsPage.tsx
src/features/settings/SystemSettings.tsx
```
