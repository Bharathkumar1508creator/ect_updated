# Phase 4 - Responsive UI and Accessibility

Checkpoint date: 2026-09-21
Production changes: none
Database schema changes: none
Production data changes: none

## Completed work

### Responsive layout

- Tested 13 public pages at 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920px: 117 page/viewport combinations.
- Removed document-level horizontal overflow from the home consulting cards, About composition, Careers visual layers, shared footer, service tab rails, Zoho rail, and Projects carousel.
- Corrected the Careers join section at 1024px by applying its responsive layout before fixed coordinates exceeded the viewport.
- Contained animated and carousel content inside its visual viewport while retaining the existing animations and current visual design.
- Added a single-column footer at narrow mobile widths, responsive project grids, and protected media sizing.
- Corrected the 320px home audience pills and calls to action so readable labels wrap without clipping or overlap.

### Typography and accessibility

- Standardized body text and form controls on Montserrat with system fallbacks.
- Replaced page-specific Inter and Segoe UI body defaults on IT Infrastructure and Under Construction.
- Established readable absolute minimum sizes for functional mobile labels while keeping intentionally small decorative orbit labels.
- Added shared visible keyboard focus styling and reduced-motion handling.
- Added explicit labels, IDs, autocomplete hints, and 44px control heights to the visible Zoho Bigin fields without changing field names or submission data.
- Added a labelled blog search field and search button.
- Corrected page heading structure so each audited public page has exactly one H1.
- Guarded optional Lucide initialization so a blocked third-party script does not break the About page.
- Decorative images retain empty alternative text and aria-hidden semantics; duplicate Careers gallery images remain inside an aria-hidden copy used only for the seamless loop.

### Navigation and dialogs

- Mobile accordion controls now expose aria-expanded and aria-controls state.
- The hamburger label changes between Open menu and Close menu.
- Escape closes the mobile panel and returns focus to the hamburger.
- The consultation dialog continues to move focus inside, trap keyboard focus, close on Escape, and hide correctly from assistive technology when closed.
- Touch targets for the shared newsletter and social controls are at least 44px.

## Verification

- Django system check: passed
- Migration drift check: no changes
- Full Django suite: 47 tests passed
- JavaScript syntax: 20 files passed
- Static references: 343 checked, zero missing
- Zoho Bigin invariant check: hidden payload, form ID, iframe target, validator, and WebformScriptServlet URL preserved
- Chrome responsive matrix: 117/117 returned HTTP 200
- Chrome matrix document overflow: 0 cases
- Chrome matrix page errors: 0 cases
- Chrome matrix non-Montserrat body fonts: 0 cases
- Chrome matrix unlabeled visible form controls: 0 cases
- Chrome matrix duplicate IDs: 0 cases
- Chrome matrix incorrect H1 counts: 0 cases
- Chrome and Edge interaction checks passed at 320, 390, 768, and 1440px
- Mobile menu state, accordion state, Escape behavior, focus return, dialog focus, and dialog close behavior passed
- Git diff integrity: passed

Audit evidence is stored outside the repository at:

- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase4-audit\baseline-matrix.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase4-audit\after-matrix.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase4-audit\interaction-cross-browser.json`
- Before and after screenshots in the same directory

## Browser coverage limits

Chrome and Edge were executed locally. Android and iOS size classes were exercised through the responsive viewport matrix. Firefox and Safari are not installed or executable on this Windows host, so their real rendering engines and physical Android/iOS devices remain part of the broader Phase 7 QA gate. The Phase 4 implementation uses standards supported by current Chrome, Edge, Firefox, and Safari and avoids browser-specific layout dependencies.

External font, analytics, map, Zoho, and chat requests were blocked during the local browser audit. This kept testing read-only and prevented third-party submissions. Their integration markup remains present.

## Preserved behavior and data

The logo-derived colors and current design direction remain intact. Zoho Bigin, Zoho Recruit, Zoho SalesIQ, Google Analytics/Tag Manager, MapLibre, Google Fonts, and social links remain present.

No model, migration, database row, uploaded media file, administrator account, blog, project, testimonial, service, newsletter subscriber, live-server file, or third-party record was changed.

## Work carried forward

Phase 5 will optimize images and videos, add or verify posters, improve caching, and reduce frontend transfer and execution cost without visible degradation. Full native-browser/device regression and authorized third-party submission checks remain scheduled for Phase 7.

No live deployment is authorized by this checkpoint.
