# Dark Mode Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish dark mode with deeper bg, better contrast, 3-level surface elevation, staggered transitions, and refined palette.

**Architecture:** All visual changes driven by CSS custom properties in the `.dark` block in `index.css`. One component file (ThemeToggle) gets a minor class adjustment. No new components, no state changes.

**Tech Stack:** Tailwind CSS v4, CSS custom properties, React 19 + TypeScript

## Global Constraints

- All color values must use the exact hex codes from the spec table
- All changes must respect `prefers-reduced-motion: reduce`
- No new Tailwind plugins or dependencies
- No changes to component logic or state management
- Existing semantic color class names (`bg-card`, `text-muted-foreground`, etc.) must continue working — only the variable values change

---

### Task 1: Update dark mode palette in `index.css`

**Files:**
- Modify: `src/index.css` (lines 119-148)

**Interfaces:**
- Consumes: The existing `.dark` CSS variables block
- Produces: Updated token values consumed by all components via `@theme` mappings

- [ ] **Step 1: Read the current file to confirm line ranges**

Read `src/index.css` lines 119-148.

- [ ] **Step 2: Replace the `.dark` block with the new palette**

Edit `src/index.css`, replacing lines 119-148:

```
.dark {
  color-scheme: dark;

  --bg: #0B0A09;
  --fg: #E5DCD0;
  --card: #141211;
  --card-fg: #E5DCD0;
  --popover: #141211;
  --popover-fg: #E5DCD0;
  --primary: #608B99;
  --primary-fg: #0B0A09;
  --secondary: #1C1917;
  --secondary-fg: #E5DCD0;
  --muted: #1C1917;
  --muted-fg: #948A7E;
  --accent: #1C1917;
  --accent-fg: #E5DCD0;
  --destructive: #D94A45;
  --destructive-fg: #FFFFFF;
  --border: #2A2622;
  --input: #2A2622;
  --ring: #C9953E;

  --capiz: #0B0A09;
  --barangay: #608B99;
  --gold: #C9953E;
  --narra: #C4B4A0;
  --bamboo: #2A2622;
  --red-pinoy: #D94A45;
}
```

- [ ] **Step 3: Verify the file**

Read lines 87-148 of `index.css` to confirm `:root` light mode is untouched and `.dark` has the correct values.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(dark): update palette with deeper bg, cooler primary, better contrast"
```

---

### Task 2: Add surface elevation styles

**Files:**
- Modify: `src/index.css` (after line 148)

**Interfaces:**
- Consumes: The `.dark` block from Task 1
- Produces: Elevated surface variant for modals/popovers/dropdowns

- [ ] **Step 1: Add elevated surface utility after the `.dark` block**

Edit `src/index.css`, adding after line 148 (after the `.dark` closing brace):

```css
.dark .elevated {
  background-color: #141211;
  border-color: #2A2622;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(96,139,153,0.08);
  backdrop-filter: blur(8px);
}
```

- [ ] **Step 2: Override `shadow-sm` in dark mode for subtle card depth**

Edit `src/index.css`, adding inside the `.dark` block after `--red-pinoy`:

```css
  --shadow-sm: inset 0 1px 0 rgba(255,255,255,0.03);
```

This replaces the default drop shadow (invisible on near-black bg) with a subtle inner highlight on card edges.

- [ ] **Step 3: Verify**

Read `index.css` to confirm the elevated class and `--shadow-sm` override are in place.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(dark): add surface elevation system with elevated utility class"
```

---

### Task 3: Add staggered transitions

**Files:**
- Modify: `src/index.css` (after theme-swirl, around line 75)

**Interfaces:**
- Consumes: The existing `@media (prefers-reduced-motion: reduce)` block
- Produces: Smooth staggered transitions on theme switch for all elements

- [ ] **Step 1: Add universal transition rule**

Edit `index.css`, adding after the `@media (prefers-reduced-motion: reduce)` block (after line 85):

```css
*,
*::before,
*::after {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none;
  }
}
```

- [ ] **Step 2: Verify the transitions are in the right place**

Read lines 67-95 of `index.css` to confirm transitions are added after the reduced-motion block (not inside it).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(dark): add staggered universal transitions for theme switch"
```

---

### Task 4: Update theme toggle animation

**Files:**
- Modify: `src/index.css` (keyframe + utility class)

**Interfaces:**
- Consumes: The current `theme-spin` keyframe and `.theme-icon-enter` class
- Produces: Smoother `theme-swirl` animation

- [ ] **Step 1: Replace the `theme-spin` keyframe with `theme-swirl`**

Edit `index.css`, replacing lines 67-70:

```css
@keyframes theme-swirl {
  from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

.theme-icon-enter {
  animation: theme-swirl 0.3s ease;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat(dark): smoother theme-toggle swirl animation"
```

---

### Task 5: Clean up ThemeToggle hover styles

**Files:**
- Modify: `src/components/ThemeToggle.tsx` (line 11)

**Interfaces:**
- Consumes: `ThemeToggle` component
- Produces: Cleaner hover without ring

- [ ] **Step 1: Remove `hover:ring-1 hover:ring-ring` from the button class**

Edit `src/components/ThemeToggle.tsx`, line 11:

Before:
```
className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:text-foreground hover:ring-1 hover:ring-ring active:scale-90"
```

After:
```
className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-90"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ThemeToggle.tsx
git commit -m "refactor(dark): remove hover ring from theme toggle for cleaner look"
```

---

### Task 6: Verify PageHeader bottom border thickness

**Files:**
- Read-only: `src/components/ui/PageHeader.tsx` (line 26)

- [ ] **Step 1: Check the current border thickness**

Read `src/components/ui/PageHeader.tsx` line 26 to confirm the bottom border uses `border-b` (which is 1px by default). If it does, no change needed — the new `--bamboo` value (`#2A2622`) will automatically apply.

- [ ] **Step 2: Verify LoginPage bg variable**

Read `src/auth/LoginPage.tsx` line 40. Confirm the `bg-capiz` class is used. In dark mode, `--capiz` resolves to `#0B0A09` (from Task 1), so no change needed.

- [ ] **Step 3: Commit if any changes were needed**

If no changes needed, skip this step. Otherwise:
```bash
git add src/components/ui/PageHeader.tsx
git commit -m "style(dark): thicken page header border in dark mode"
```

---

### Task 7: Final verification pass

- [ ] **Step 1: Build the project**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run the dev server and visually verify**

```bash
npm run dev
```

Toggle between light and dark mode. Verify:
- Dark bg is `#0B0A09` (nearly black)
- Cards have visible `#2A2622` borders
- Sidebar active state uses gold accent
- Page header gold bar is visible
- Theme toggle animates smoothly
- Transition is smooth when switching themes

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.
