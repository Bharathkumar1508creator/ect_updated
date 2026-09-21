# Phase 5 - Performance and Assets

Checkpoint date: 2026-09-21
Production changes: none
Database schema changes: none
Production data changes: none

## Completed work

### Images

- Inventoried 312 image/video assets totaling 242,933,323 bytes and traced 251 assets to source references.
- Generated WebP alternatives only when the result saved at least 10% and passed a minimum 38 dB decoded-image comparison.
- Kept 65 verified WebP alternatives: 39.62 MiB of referenced source images became 10.37 MiB, saving 29.26 MiB when served.
- Retained every original image as a rollback and compatibility source.
- Added 150 responsive derivatives and connected 129 image tags with `srcset` and `sizes`.
- Added correct intrinsic dimensions to 183 static image tags, async decoding to 183 tags, and native lazy loading to 142 below-fold tags.
- Tuned navbar and admin logo variants to their actual rendered sizes.
- Left all existing database-managed source files and database paths unchanged.
- Added non-destructive 960px WebP card derivatives for existing project media. The measured six-card payload fell from 5.69 MiB to 0.46 MiB, saving 5.23 MiB on the Projects page.
- Added admin-side optimization for future Project, Project Section, Social Media Card, and Digital Marketing Overview uploads. New images are orientation-corrected, limited to 1920px, and saved as WebP. Unchanged FieldFile values pass through without rewriting media.

### Videos

- Created H.264 fast-start copies for the nine public videos while retaining all originals.
- Reduced the referenced video set from 31.02 MiB to 16.77 MiB.
- Added nine WebP posters totaling about 377 KiB.
- Videos use `preload="none"`, show a poster and controls, and wait for a visitor to start playback.
- Browser verification proved zero MP4 requests before play and successful playback for all nine videos after play.
- Retained the unreferenced 88.91 MiB `about-vid.mp4`; it was not removed because production dependency status is not yet proven.

### Caching and frontend requests

- Enabled Django `ManifestStaticFilesStorage`, which gives CSS, JavaScript, images, and video files content-hashed production URLs.
- Removed 93 manual `?v=` cache strings that were inconsistent across pages.
- Production `collectstatic` now validates and post-processes 656 static files.
- Moved the Tailwind build input and an unused UTF-16 scratch stylesheet from public static collection to `home/assets/css`; the Tailwind npm command was updated and the compiled output remains public.
- Removed 65 duplicated Google Fonts tags and eight CSS font imports.
- Every document now makes one Montserrat stylesheet request, and 119 named font declarations were normalized to Montserrat.
- Preserved Google Analytics/Tag Manager, Zoho Bigin, Zoho SalesIQ, MapLibre, Font Awesome, social links, and all external-service behavior.

## Measured result

The source repository is intentionally larger because originals are retained alongside optimized assets. Network delivery is smaller because templates select WebP/responsive files, video bytes are not requested until play, and production static URLs are immutable content hashes.

- Referenced image saving: 29.26 MiB across optimized originals
- Referenced video saving: about 14.25 MiB when videos are played
- Existing project-card media saving: 5.23 MiB across the measured six-card listing
- Initial video transfer: posters only, about 377 KiB across all nine videos
- Responsive variants: about 5.02 MiB total for 150 device-appropriate files

## Verification

- Django system check: passed
- Migration drift check: no changes
- Full Django suite: 49 tests passed
- New upload optimization and original-preserving media-variant tests: passed
- Production collectstatic: 656 files copied and 656 post-processed
- Static/code references: 584 checked, zero missing
- JavaScript syntax: all files passed
- Static image dimension audit: zero missing intrinsic dimensions
- Chrome runtime matrix: 39 cases (13 pages at 320, 768, and 1440px)
- Runtime HTTP failures: 0
- Document overflow cases: 0
- Page errors: 0
- Failed local requests: 0
- Non-Montserrat body fonts: 0
- Premature video requests: 0
- Video playback failures: 0
- Local image failures during progressive-scroll verification: 0
- Responsive image references observed in the runtime matrix: 521
- Git diff integrity: passed

Audit evidence is stored outside the repository at:

- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\assets.csv`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\image-optimization.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\video-optimization.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\responsive-images.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\reference-validation.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\runtime-browser.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\runtime-lazy-images.json`
- `C:\Users\nithi\Documents\Codex\2026-09-18\test\outputs\phase5-audit\runtime-video-play.json`

## Preserved behavior and data

No database migration, row, existing uploaded media file, administrator account, blog, project, testimonial, service, subscriber, live-server file, or third-party record changed. The original ZIP remains untouched. No live deployment is authorized by this checkpoint.

Existing database images were deliberately not bulk-converted because their paths are stored in production data. A separate backed-up media migration can be designed later if real production storage measurements justify it.

## Work carried forward

Phase 6 covers all technical, on-page, structured-data, canonical, social, sitemap, robots, and Coimbatore/Tamil Nadu local SEO repairs. Native Firefox, Safari, Android, and iOS execution remains in Phase 7.
