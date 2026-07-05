### Task 1: Design Tokens & Animation Utility Foundation

**Files:**
- Modify: `src/index.css` (full file)

- [ ] **Step 1: Add surface and text tokens to `@theme` block**

Add these lines inside the existing `@theme` block (after line 23, before the Filipino color tokens):

```css
  --color-surface-raised: var(--surface-raised);
  --color-surface-overlay: var(--surface-overlay);
  --color-text-subtle: var(--text-subtle);
```

- [ ] **Step 2: Define new custom properties in `:root`**

Add inside `:root` after line 130 (`--red-pinoy: #CE1126;`):

```css
  --surface-raised: #FFFFFF;
  --surface-overlay: rgba(0, 0, 0, 0.4);
  --text-subtle: #A09688;
```

- [ ] **Step 3: Define dark mode overrides for new tokens**

Add inside `.dark` after line 161 (`--red-pinoy: #D94A45;`):

```css
  --surface-raised: #1C1917;
  --surface-overlay: rgba(0, 0, 0, 0.6);
  --text-subtle: #7A7064;
```

- [ ] **Step 4: Warm dark mode base**

Change line 136 in `.dark` from `--bg: #0B0A09;` to `--bg: #12100E;`.

- [ ] **Step 5: Remove universal transition, replace with targeted selector**

Replace lines 87-91 (the `*, *::before, *::after { transition: ... }` block) with:

```css
a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
    transition: none;
  }
}
```

- [ ] **Step 6: Replace animation keyframes with `@utility` motion classes**

Remove lines 35-85 (the `--animate-*` definitions in `@theme`, all `@keyframes`, `.theme-icon-enter`, and the old `@media (prefers-reduced-motion: reduce)` block). Add after the `@theme` block:

```css
@utility motion-fade-in {
  animation: motion-fade-in 0.3s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@utility motion-slide-up {
  animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@utility motion-scale-in {
  animation: motion-scale-in 0.2s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@utility motion-lift {
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

@utility motion-press {
  &:active {
    transform: scale(0.97);
  }
}

@utility motion-stagger-50 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 50ms);
    }
  }
}

@utility motion-stagger-75 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 75ms);
    }
  }
}

@utility motion-stagger-100 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 100ms);
    }
  }
}

@keyframes motion-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes motion-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes motion-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 7: Preserve the `.theme-icon-enter` utility for theme toggle**

Add this after the `@keyframes` block:

```css
@keyframes theme-swirl {
  from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

.theme-icon-enter {
  animation: theme-swirl 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}
```

- [ ] **Step 8: Clean up leftover reduced-motion block**

Remove lines 184-188 (the second `@media (prefers-reduced-motion: reduce)` around body transition) — body already has a specific transition with its own reduced-motion check on line 181-182.

**Verification:** Run `npm run build` and confirm no errors. The CSS file should compile cleanly with new utilities available.

- [ ] **Step 9: Commit**

```bash
git add src/index.css
git commit -m "feat(design): add design tokens, animation utilities, warm dark mode"
```
