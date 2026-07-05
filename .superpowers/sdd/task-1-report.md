# Task 1: Design Tokens & Animation Utility Foundation

## What Was Implemented

All 8 steps from the task brief were applied to `src/index.css`:

1. **Added surface and text tokens to `@theme`**: `--color-surface-raised`, `--color-surface-overlay`, `--color-text-subtle` mapped to CSS custom properties.

2. **Defined new custom properties in `:root`**: `--surface-raised: #FFFFFF`, `--surface-overlay: rgba(0,0,0,0.4)`, `--text-subtle: #A09688`.

3. **Defined dark mode overrides**: `--surface-raised: #1C1917`, `--surface-overlay: rgba(0,0,0,0.6)`, `--text-subtle: #7A7064`.

4. **Warmed dark mode base**: Changed `.dark { --bg }` from `#0B0A09` to `#12100E`.

5. **Removed universal `* { transition }`** and replaced with targeted `a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])` selector (with reduced-motion guard).

6. **Replaced `--animate-*` keyframes with `@utility` motion classes**: `motion-fade-in`, `motion-slide-up`, `motion-scale-in`, `motion-lift`, `motion-press`, `motion-stagger-50/75/100`, plus `@keyframes` backing them.

7. **Preserved `.theme-icon-enter`** with `@keyframes theme-swirl` and added reduced-motion support.

8. **Removed duplicate reduced-motion block** around `body { transition: none }`.

## Files Changed

- `src/index.css` — 91 insertions, 41 deletions

## Testing

- `npm run build` (tsc + vite build) — **passes cleanly** (1865 modules, 403ms)

## Self-Review

| Check | Status |
|---|---|
| All new tokens added (surface-raised, surface-overlay, text-subtle) | ✅ |
| Dark mode base warmed (#12100E) | ✅ |
| Universal `* { transition }` removed, targeted selector added | ✅ |
| All 8 motion utilities present (fade-in, slide-up, scale-in, lift, press, stagger-50/75/100) | ✅ |
| `.theme-icon-enter` preserved with reduced-motion support | ✅ |
| Duplicate reduced-motion block removed | ✅ |
| `npm run build` passes | ✅ |

## Issues or Concerns

None.
