# Phase 4 Follow-up — Website Hero Subtitle

Checkpoint date: 2026-09-24
Production changes: none
Database schema/data changes: none

## Confirmed problems

- The Website hero subtitle rendered at 12px on desktop because a later shared typography rule overrode the page's intended 16px declaration.
- At 320px, the subtitle was forced to `white-space: nowrap`; its text was 310px wide inside a 288px container, clipping the ending “finish.”

## Repairs

- Added a Website-scoped rule with enough specificity to preserve a 16px desktop subtitle, matching the rendered “WEB SOLUTIONS” label.
- Set the mobile subtitle to 14px with normal wrapping and automatic height so the complete sentence remains visible.
- Bumped the Website stylesheet query version to ensure browsers fetch the correction.

## Verification

- Chrome checks passed at 320, 360, 390, 440, 1024, and 1920px.
- At 1024px and 1920px, the hero subtitle and “WEB SOLUTIONS” label both render at 16px with 24px line height.
- At 320–440px, the complete subtitle is visible with no horizontal or vertical clipping.
- Zero page errors and zero horizontal-overflow cases.
- Django: 54 tests passed.
- Migration drift: none.
- JavaScript: all 20 project files passed syntax checks.
- Diff integrity: passed.

Evidence:

- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_WEBSITE_SUBTITLE_AUDIT.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_WEBSITE_SUBTITLE_320.png`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\ECT_WEBSITE_SUBTITLE_1920.png`

## Safety

No production file, database, uploaded media, third-party record, or live domain was changed. Phase 5 remains skipped.