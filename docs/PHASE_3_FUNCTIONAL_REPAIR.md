# Phase 3 — Functional Repair

Checkpoint date: 2026-09-19
Production changes: none
Database schema changes: none
Production data changes: none

## Completed work

### Shared navigation and consultation popup

- Project listing, standard project detail, Digital Marketing project detail, and the dormant Digital Marketing overview template now load the same footer, consultation popup, navigation JavaScript, popup JavaScript, project-media JavaScript, and Zoho SalesIQ component.
- The shared desktop navigation now supports hover, click/touch, keyboard activation, Escape-to-close, outside-click closing, and synchronized aria-expanded state.
- The mobile menu now verifies that its paired panel exists before initializing.
- The project pages load the existing popup stylesheet, so the restored Zoho Bigin consultation form retains the current visual design.
- The contact page continues using its single inline Zoho Bigin form and scrolls its navigation consultation button to that form, avoiding duplicate Zoho form IDs.

### Project media and routing

- YouTube URLs are parsed and validated for watch, short, embed, Shorts, live, privacy-enhanced, and direct-ID formats. URLs from other hosts are rejected.
- Embeds use youtube-nocookie.com, have descriptive iframe titles, load lazily, and are included in the report-only Content Security Policy.
- Project cards, hero media, and project-list carousel cards show a stable fallback if media is absent or fails to load.
- Project video cards now have working manual play/pause controls. The previous template called an undefined function.
- Video detail media retains browser controls, inline playback, metadata preloading, and a poster when an image is available.
- Project card links and video controls are independent valid controls, so playing a video does not accidentally navigate away.
- Project carousel initialization handles zero or one card, pauses on hover/focus, respects reduced-motion preferences, and does not advance hidden tabs.
- Digital Marketing project links consistently use the specialized detail route. Requests to the generic route redirect to the correct Digital Marketing page.
- The Next Project component selects the correct detail route for the next project's category.
- Homepage project cards support image, video-poster, YouTube-thumbnail, and missing-media states.

### Metadata and missing assets

- Project Open Graph image URLs are built with request.build_absolute_uri(media.url), preventing malformed URLs that appended media paths to the current page URL.
- Four missing Digital Marketing logo references were inside a disabled, commented carousel. The dependency check confirmed the carousel was not rendered, so the dead block was removed rather than inventing replacement brand assets.
- The static reference scan now checks 343 template references with zero missing files.

### Interaction and integration resilience

- Contact-map initialization exits safely if MapLibre fails to load or optional map controls are absent.
- Contact FAQ animation has a non-IntersectionObserver fallback.
- Invalid links containing nested buttons were converted into single semantic links while preserving their existing visual classes and destinations.
- Placeholder JavaScript routes that overrode the product links were removed.
- Placeholder project click alerts were removed so Website and IT Infrastructure project links navigate normally.
- Careers calls to action remain direct Zoho Recruit links; invalid nested controls, debug click logging, and optional-element assumptions were removed.
- Footer social URLs were normalized and external links now use a new tab with noopener noreferrer.
- The fully commented duplicate project handler was removed after confirming it had no executable dependency.

## Verification

- python manage.py check: passed
- python manage.py makemigrations --check --dry-run: no changes
- Full Django suite: 47 tests passed
- Focused Phase 3 tests cover YouTube parsing, privacy-enhanced embeds, missing-media rendering, shared project-page behavior, absolute Open Graph images, category-aware routing, and homepage project links
- JavaScript syntax checks: passed for all modified runtime files
- Static template references: 343 checked, zero missing
- Public route smoke test: all 13 primary routes returned HTTP 200
- Existing published project smoke test: all 6 project pages returned HTTP 200
- Git diff integrity: passed

## Preserved behavior and data

Zoho Bigin, Zoho Recruit, Zoho SalesIQ, Google Analytics/Tag Manager, MapLibre, Google Fonts, and social links remain present. No production request was submitted to any third-party service.

No model, migration, database row, uploaded media file, administrator account, blog, project, testimonial, service, or newsletter subscriber was changed.

## Work carried forward

Phase 4 will perform responsive layout, Montserrat typography, accessibility, and cross-browser repairs from 320px upward. Full real-browser viewport automation and authorized third-party submission tests remain scheduled for Phase 7.

No live deployment is authorized by this checkpoint.
