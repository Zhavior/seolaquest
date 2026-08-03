# Phase 4–5 manual certification script

### Status for Codex

- This script has **not** been executed on physical devices yet in this branch.
- Treat every row as pending until dated evidence is recorded.
- Do not mark Phase 4–5 as fully passed without physical iOS + Android runs and a disposable migrated database.


Use this checklist only in a disposable test environment. Do not use live Stripe credentials, production customers, or an unmigrated shared database.

## Required environment

- Physical iPhone with current Safari and VoiceOver.
- Physical Android phone with current Chrome and TalkBack.
- Desktop Chrome or Safari for keyboard-only and zoom checks.
- Clerk development testing token and controlled test user.
- Disposable PostgreSQL database with every migration applied.
- Payment, worker, outreach, and destructive-account switches disabled.

Record the date, device, OS/browser version, route, tester, result, and screenshot/video reference for every row. A missing result is a failure, not a pass.

## Viewport and touch matrix

Test 320, 360, 375, 390, and 430 CSS pixels, plus 844×390 landscape.

For `/`, `/sign-in`, `/sign-up`, `/onboarding`, `/app`, `/app/runs`, `/app/billing`, and `/app/settings`:

1. Confirm there is no horizontal page scroll or clipped primary action.
2. Complete the route's primary action using touch only.
3. Confirm every critical action is visible without hover.
4. Open and close navigation; confirm focus returns to the menu trigger.
5. Open each available dialog and reach its final action with the software keyboard visible.
6. Confirm the page, drawer, and dialog each have only one intended scroll owner.

## Keyboard-only script

For the same routes:

1. Start at the address bar and use only Tab, Shift+Tab, Enter, Space, arrows, and Escape.
2. Confirm the skip link reaches the main content.
3. Confirm focus order follows the visible reading order and is always visible.
4. Confirm drawers and dialogs trap focus, close with Escape, and restore focus.
5. Confirm errors move or associate focus without hiding the field or action.
6. Confirm no card, filter, dismissal, or destructive action requires a pointer.

## VoiceOver and TalkBack script

Run the complete acquisition → authentication → onboarding → app navigation → billing/settings path with the screen reader enabled.

1. Navigate by headings, landmarks, links, buttons, form fields, and errors.
2. Confirm every control has an accurate name, role, state, and value.
3. Open, operate, and close the mobile drawer and every shared dialog.
4. Confirm status/error announcements are understandable and not repeated noisily.
5. Confirm focus never enters hidden or inert content.
6. Confirm the task can be completed with the screen hidden or without relying on visual position.

## Zoom, reflow, and motion

1. At desktop 200% zoom, complete authentication and operate each dialog.
2. At desktop 400% zoom or a 320 CSS-pixel reflow viewport, confirm all text and actions remain reachable without two-dimensional scrolling.
3. Enable reduced motion and confirm no unnecessary entrance, pulse, or continuous animation remains.
4. Confirm focus and validation do not force unexpected page or keyboard jumps.

## Passing decision

Phase 4–5 certification passes only when:

- `npm run test:a11y`, `npm test`, `npm run lint`, TypeScript, and the production build pass.
- Every row above has dated evidence on both physical mobile platforms.
- The complete signed-in route set works against a disposable migrated database.
- No critical/serious automated violation, hidden critical action, focus loss, horizontal overflow, or blocked customer journey remains.
