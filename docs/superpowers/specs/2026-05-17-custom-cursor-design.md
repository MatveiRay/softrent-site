# Custom Cursor Design

## Goal

Add a subtle premium cursor treatment that complements the site’s visual language without drawing attention away from the content.

## Chosen Direction

- **Pattern:** one global floating ring
- **Visual tone:** almost invisible premium detail
- **Color:** champagne accent aligned with the existing palette
- **Interaction model:** small ring by default, gently enlarges over clickable elements

## Behavior

### Default state

- A thin champagne ring follows the pointer across the site.
- The ring should remain restrained and visually light.
- Motion should feel smooth, with a slight trailing response rather than a rigid lock to the pointer.

### Interactive state

- When the pointer is over clickable elements, the ring enlarges subtly.
- Clickable detection should work globally for links, buttons, and elements that semantically behave like clickable controls.
- The effect should remain elegant rather than theatrical.

### Hidden state

- The custom cursor should disappear when the pointer leaves the viewport or when no pointer position is available yet.
- It should be fully disabled on touch devices.
- It should also be disabled for users who prefer reduced motion.

## Implementation Shape

- Add a dedicated client component, `CustomCursor`.
- Mount it once in the root layout so it applies across the whole site.
- Keep visual styles in `globals.css`.
- Detect interactive targets through DOM ancestry rather than requiring every component to opt in manually.
- Hide the native cursor only while the custom cursor is active on supported pointer devices.

## Approximate Styling Targets

- Default diameter: around **12–14 px**
- Hover diameter: around **26–30 px**
- Border: thin champagne line using the site accent color family
- Animation: soft scale and opacity transitions with gentle pointer-follow smoothing

## Accessibility & Device Rules

- Disable on touch / coarse pointers.
- Disable when `prefers-reduced-motion: reduce`.
- Keep the native cursor available whenever the custom cursor is disabled.

## Non-Goals

- no dual-cursor system with dot + ring;
- no loud bloom, glow, or magnetic effects;
- no component-by-component hover wiring unless later needed for a special case.

## Self-Review

- No placeholders remain.
- The design is internally consistent with the approved direction.
- Scope is limited to a single global enhancement.
- Device and accessibility behavior are explicit.
