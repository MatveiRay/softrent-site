# Manifesto Copy Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manifesto copy so the section communicates a simple, restrained feeling of home in both Russian and English.

**Architecture:** Keep the existing `Manifesto` component intact and update only the localized strings it renders from `src/lib/i18n.ts`. Preserve the existing four-line rendering contract so the approved Russian rhythm maps cleanly onto the current UI without introducing layout changes.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, existing in-app i18n dictionary.

---

## File Structure

- Modify: `src/lib/i18n.ts`
  - Replace `manifesto.l1`–`manifesto.l4` in both `ru` and `en`.
- Verify: `src/components/Manifesto.tsx`
  - Confirm the existing four-line mapping still matches the new text rhythm; no code change expected.

### Task 1: Replace manifesto copy in both locales

**Files:**
- Modify: `src/lib/i18n.ts`
- Verify: `src/components/Manifesto.tsx`

- [ ] **Step 1: Inspect the current manifesto keys**

Read the current `manifesto.eyebrow` and `manifesto.l1`–`manifesto.l4` entries in both locales inside `src/lib/i18n.ts`, and confirm that `src/components/Manifesto.tsx` renders those four keys in order.

- [ ] **Step 2: Update the Russian copy**

Replace the Russian manifesto lines with:

```ts
"manifesto.l1": "Мы ищем не просто жильё для поездки.",
"manifesto.l2": "Мы ищем дома, в которых легко освоиться,",
"manifesto.l3": "замедлиться",
"manifesto.l4": "и почувствовать себя на месте.",
```

- [ ] **Step 3: Update the English copy**

Replace the English manifesto lines with:

```ts
"manifesto.l1": "We look for more than a place to stay.",
"manifesto.l2": "We look for homes where it is easy to settle in,",
"manifesto.l3": "slow down",
"manifesto.l4": "and feel at home.",
```

- [ ] **Step 4: Run static verification**

Run:

```bash
npm run lint
```

Expected: command exits successfully with no new lint errors.

- [ ] **Step 5: Verify the result in the browser**

Run the local app if needed:

```bash
npm run dev
```

Open the homepage in the in-app browser and confirm:

1. The Russian manifesto shows the approved four-line text.
2. Switching to English shows the translated four-line text.
3. No unexpected wrapping or spacing regression appears in the manifesto section.

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n.ts
git commit -m "feat: update manifesto copy"
```

## Self-Review

- **Spec coverage:** The plan updates both locales, preserves the existing component structure, and verifies the approved rhythm in the rendered UI.
- **Placeholder scan:** No TODO/TBD placeholders remain.
- **Type consistency:** The plan keeps the existing `manifesto.l1`–`manifesto.l4` keys used by `Manifesto.tsx`, so no API mismatch is introduced.
