# Phase 4 Follow-up — Overflow and Zoho SalesIQ CSP

Checkpoint date: 2026-09-24
Production changes: none
Database schema/data changes: none

## Confirmed problems

Manual testing correctly found that the earlier Phase 4 audit was too permissive. It measured only the browser scrolling element after `overflow-x: clip` was applied, so it could report zero document overflow while body content or transformed/clipped components still extended beyond the viewport.

The confirmed layout defects were:

- Shared footer social controls extended beyond 320px on the public pages.
- Rotated Projects hero-carousel cards crossed the 320px and 360px viewport edges.
- Careers used a horizontally scrolling full-width hiring-step rail at 1024px.
- The Website hero's painted content widened the body metric at 320px.

The report-only CSP also omitted resources used by Zoho SalesIQ and existing Font Awesome delivery:

- `https://static.zohocdn.com` for SalesIQ scripts, styles, and possible fonts.
- `wss://vts.zohopublic.in` for the SalesIQ WebSocket.
- `https://cdnjs.cloudflare.com` for Font Awesome fonts.
- `blob:` workers created by the widget.

## Repairs

- Reflowed the footer social section on narrow screens while retaining 44px touch targets.
- Adjusted Projects phone carousel transforms so every card remains inside 320px and 360px.
- Replaced the Careers 641–1024px horizontal hiring rail with a two-column in-flow grid and limited the auto-scroll controller to 640px and below.
- Contained Website hero paint at mobile widths.
- Added the observed Zoho CDN, WebSocket, Font Awesome font, and worker sources to the report-only CSP.
- Strengthened the browser audit to check both scrolling-element and body widths, Projects transformed-card bounds, and Careers tablet rail width.

## Verification

- Chrome: 117/117 route/viewport cases passed; zero hard failures and zero overflow cases.
- Edge: 117/117 route/viewport cases passed; zero hard failures and zero overflow cases.
- Direct checks confirmed document and body widths equal 320px on the reported public pages.
- Projects cards stay within both 320px and 360px viewports.
- Careers hiring steps have equal client and scroll widths at 1024px.
- Real Zoho SalesIQ network load: zero CSP violations and zero Zoho request failures; no form was submitted.
- Django: 54 tests passed.
- Migration drift: none.
- JavaScript: all 20 files passed syntax checks.
- Diff integrity: passed.

Evidence:

- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_PHASE_4_OVERFLOW_CSP_CHROME_AUDIT.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_PHASE_4_OVERFLOW_CSP_EDGE_AUDIT.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_SALESIQ_CSP_AUDIT.json`

## Safety and limitations

The CSP remains report-only; it was not promoted to enforcement. Native Firefox, Safari, and physical Android/iOS devices were unavailable. No database, uploaded media, third-party form record, production file, or live domain was changed. Phase 5 remains skipped.
