# Custom Cursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle global champagne-ring cursor that follows the mouse, grows over clickable elements, and disables itself for touch or reduced-motion users.

**Architecture:** Create a dedicated client-side `CustomCursor` component that owns pointer tracking, device capability detection, and interactive-state detection. Mount it once in the root layout and keep the visual treatment plus native-cursor overrides in `globals.css`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, CSS media queries.

---

## File Structure

- Create: `src/components/CustomCursor.tsx`
  - Handles pointer movement, smoothing loop, interaction detection, and hidden/disabled states.
- Modify: `src/app/layout.tsx`
  - Mounts the cursor globally inside the app shell.
- Modify: `src/app/globals.css`
  - Adds cursor styling, scale states, native cursor suppression, and coarse-pointer / reduced-motion safeguards.

### Task 1: Add the global cursor component

**Files:**
- Create: `src/components/CustomCursor.tsx`

- [ ] **Step 1: Create the component shell**

Create a client component that returns `null` until it confirms support for:

```ts
window.matchMedia("(pointer: fine)").matches &&
!window.matchMedia("(prefers-reduced-motion: reduce)").matches
```

- [ ] **Step 2: Track pointer position and visibility**

Implement pointer listeners for:

```ts
pointermove
pointerenter
pointerleave
```

Store the target pointer position in refs so movement does not trigger React re-renders on every event.

- [ ] **Step 3: Add smooth follow behavior**

Use `requestAnimationFrame` with interpolation so the ring eases toward the latest target position rather than snapping exactly to it.

Desired behavior:

```ts
current += (target - current) * 0.18;
```

- [ ] **Step 4: Detect interactive targets**

On pointer movement, determine whether the event target is inside:

```ts
a,
button,
[role="button"],
input,
textarea,
select,
[data-cursor="interactive"]
```

Toggle a hover state when the pointer enters or leaves those elements.

- [ ] **Step 5: Render the ring**

Render a single fixed-position element with data attributes or class names reflecting:

- visible / hidden
- interactive / default

### Task 2: Mount and style the cursor globally

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Mount `CustomCursor` once in the root layout**

Import and render:

```tsx
<CustomCursor />
```

inside the root providers so it is available across all pages.

- [ ] **Step 2: Add base styles**

Define a global rule for the custom cursor ring:

```css
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(212, 184, 150, 0.9);
  border-radius: 999px;
  pointer-events: none;
  z-index: 120;
  transform: translate3d(-50%, -50%, 0);
  opacity: 0;
  transition:
    width 220ms ease,
    height 220ms ease,
    border-color 220ms ease,
    opacity 180ms ease;
}
```

- [ ] **Step 3: Add interaction and visibility states**

Define:

```css
.custom-cursor[data-visible="true"] {
  opacity: 1;
}

.custom-cursor[data-interactive="true"] {
  width: 28px;
  height: 28px;
  border-color: rgba(212, 184, 150, 1);
}
```

- [ ] **Step 4: Hide the native cursor only when custom cursor is active**

Add a root-level class such as:

```css
html.custom-cursor-enabled,
html.custom-cursor-enabled body,
html.custom-cursor-enabled a,
html.custom-cursor-enabled button {
  cursor: none;
}
```

The component should toggle that class on `<html>` only while the feature is enabled.

- [ ] **Step 5: Add safety media rules**

Ensure the custom cursor never appears in unsupported contexts:

```css
@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .custom-cursor {
    display: none !important;
  }
}
```

### Task 3: Verify behavior

**Files:**
- Verify: `src/components/CustomCursor.tsx`
- Verify: `src/app/layout.tsx`
- Verify: `src/app/globals.css`

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: no new lint errors introduced by the cursor files.

- [ ] **Step 2: Verify desktop behavior in browser**

Run the local app if needed:

```bash
npm run dev
```

Open the homepage and confirm:

1. A small champagne ring follows the pointer.
2. The ring enlarges over links, buttons, and clickable cards.
3. The ring hides when the pointer leaves the viewport.
4. The native cursor is hidden only while the custom cursor is active.

- [ ] **Step 3: Verify reduced-motion behavior**

Emulate or override reduced-motion and confirm the custom cursor is not shown.

- [ ] **Step 4: Verify touch / coarse-pointer behavior**

Use responsive emulation or a coarse-pointer environment and confirm:

1. The custom cursor is not shown.
2. The native cursor rules are not force-applied.

- [ ] **Step 5: Commit**

```bash
git add src/components/CustomCursor.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: add custom cursor"
```

## Self-Review

- **Spec coverage:** The plan covers the global ring, hover enlargement, touch disablement, reduced-motion disablement, and integration points from the spec.
- **Placeholder scan:** No TODO/TBD placeholders remain.
- **Type consistency:** `CustomCursor` is the only new component name used across the plan and is mounted once from `layout.tsx`.
