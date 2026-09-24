# Phase 4 — Responsive UI and Accessibility

Checkpoint date: 2026-09-24
Restored after Phase 7: yes
Production changes: none
Database schema changes: none
Production data changes: none

## Completed work

### Responsive layout

- Tested 13 public pages at 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920px in both Chrome and Edge: 234 page/viewport combinations.
- Removed document-level horizontal overflow from the home consulting cards, About composition, Careers visual layers, shared footer, service tab rails, Zoho rail, and Projects carousel.
- Corrected the Careers join section at 1024px by applying its responsive layout before fixed coordinates exceeded the viewport.
- Contained animated and carousel content inside its visual viewport while retaining existing animations and the current visual design.
- Added a single-column footer at narrow mobile widths, responsive project grids, and protected media sizing.
- Corrected the 320px home audience pills and calls to action so readable labels wrap without clipping or overlap.
- Resolved all 13 overflow cases documented by Phase 7, including eleven routes at 320px, Projects at 360px, and Careers at 1024px.

### Typography and accessibility

- Standardized body text and form controls on Montserrat with system fallbacks.
- Replaced page-specific Inter and Segoe UI body defaults on IT Infrastructure and Under Construction.
- Established readable minimum sizes for functional mobile labels while keeping intentionally small decorative orbit labels.
- Added shared visible keyboard focus styling and reduced-motion handling.
- Added explicit labels, IDs, autocomplete hints, and 44px control heights to visible Zoho Bigin fields without changing field names or submission data.
- Added a labelled blog search field and 44px search button.
- Preserved exactly one H1 on every audited public page, including the visible Contact page heading added by Phase 4.
- Decorative images retain empty alternative text and aria-hidden semantics; duplicate Careers gallery images remain inside an aria-hidden copy used only for the seamless loop.

### Navigation and dialogs

- Mobile accordion controls expose aria-expanded and aria-controls state.
- The hamburger label changes between Open menu and Close menu.
- Escape closes the mobile panel and returns focus to the hamburger.
- The consultation dialog continues to move focus inside, trap keyboard focus, close on Escape, and hide correctly from assistive technology when closed.
- Touch targets for the shared newsletter and social controls are at least 44px.

## Verification

- Django system check: passed.
- Migration drift check: no changes.
- Full Django suite: 54 tests passed.
- JavaScript syntax: all 20 files passed.
- Chrome responsive matrix: 117/117 passed with zero hard failures and zero overflow cases.
- Edge responsive matrix: 117/117 passed with zero hard failures and zero overflow cases.
- Both matrices found zero missing image alternatives and zero unnamed buttons.
- Page metadata and heading checks found one title, description, canonical URL, and H1 on every audited route.
- Mobile menu, Escape focus return, contact dialog, FAQ, Zoho Recruit link, and Zoho Bigin form-presence checks passed.
- The Zoho Bigin form was not submitted, so no external record was created.
- Git diff integrity: passed.

Audit evidence is stored outside the repository at:

- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_PHASE_4_RESTORED_CHROME_AUDIT.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_PHASE_4_RESTORED_EDGE_AUDIT.json`

## Browser coverage limits

Chrome and Edge were executed locally. Android and iOS size classes were exercised through the responsive viewport matrix. Firefox and Safari are not installed or executable on this Windows host, and physical Android/iOS devices were not available. The implementation uses standards supported by current Chrome, Edge, Firefox, and Safari and avoids browser-specific layout dependencies, but native rendering on those unavailable engines and devices is not claimed.

External font, analytics, map, Zoho, and chat requests were blocked during local browser automation. This kept testing read-only and prevented third-party submissions. Their integration markup remains present.

## Preserved behavior and data

The logo-derived colors, Montserrat typography, and current design direction remain intact. Zoho Bigin, Zoho Recruit, Zoho SalesIQ, Google Analytics/Tag Manager, MapLibre, Google Fonts, and social links remain present.

No model, migration, database row, uploaded media file, administrator account, blog, project, testimonial, service, newsletter subscriber, live-server file, or third-party record was changed. Phase 5 remains skipped. No live deployment is authorized by this checkpoint.