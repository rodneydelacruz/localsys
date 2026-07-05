### Task 3: UI Primitive Components Refresh

**Files:**
- Modify: `src/components/ThemeToggle.tsx`
- Modify: `src/components/ui/ConfirmDialog.tsx`
- Modify: `src/components/ui/PageHeader.tsx`

- [ ] **Step 1: ThemeToggle — verify animation works**

No code change needed for ThemeToggle. The `key` prop on the icons (`key="moon"` / `key="sun"`) combined with the existing `.theme-icon-enter` CSS class already provides the swirl animation. Verify it works by checking that `theme-icon-enter` class is still applied to the icons.

- [ ] **Step 2: ConfirmDialog — use motion-scale-in and motion-fade-in**

In `src/components/ui/ConfirmDialog.tsx`:

Find the backdrop div (look for `animate-fade-in` in the class string) and replace `animate-fade-in` with `motion-fade-in`.

Find the dialog panel div (look for `animate-scale-in` in the class string) and replace `animate-scale-in` with `motion-scale-in`.

- [ ] **Step 3: PageHeader — use motion-fade-in**

In `src/components/ui/PageHeader.tsx`:
Find `animate-fade-in` in the outer wrapper's className and replace with `motion-fade-in`.

**Verification:** Run `npm run dev`, trigger a confirm dialog (delete record), verify it scales in with the new motion class. Check page headers render properly.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeToggle.tsx src/components/ui/ConfirmDialog.tsx src/components/ui/PageHeader.tsx
git commit -m "feat(ui): update primitives with motion utilities"
```
