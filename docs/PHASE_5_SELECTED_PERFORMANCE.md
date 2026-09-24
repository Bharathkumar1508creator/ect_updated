# Phase 5 — Selected performance and asset optimizations

## Scope

This checkpoint implements only the Phase 5 items approved by the user: **1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, and 16**.

Items 10 and 15 remain excluded. Decorative page videos keep their existing autoplay behavior and do not gain controls. The site's font families and visual typography are preserved.

## Completed items

1. Added intrinsic `width` and `height` metadata to static template images to reduce layout shifts.
2. Added asynchronous image decoding.
3. Added lazy loading to below-the-fold images while keeping priority content immediately available.
4. Added quality-checked WebP copies and changed eligible displayed image references to WebP. Original PNG/JPEG files remain preserved.
5. Added responsive image candidates and `sizes` metadata where useful.
6. Added non-destructive cached WebP variants for project cards under `media/.optimized/project-cards/`; source uploads are never overwritten.
7. Added orientation-safe resizing and WebP conversion for future image uploads in the affected Django admin models, capped at 1920 pixels.
8. Added optimized H.264 MP4 copies for the nine static video assets while preserving the original MP4 files.
9. Added WebP poster frames to the static videos without changing autoplay behavior.
11. Kept native video controls on project-detail videos only. Decorative videos remain muted, looping, inline, autoplaying, and without controls.
12. Enabled Django manifest static storage so collected assets use content-hashed filenames.
13. Added `docs/HOSTINGER_STATIC_CACHE.md` with safe collectstatic, Nginx caching, compression, validation, and rollback guidance.
14. Consolidated duplicate Google Fonts requests per document while preserving every existing font-family choice and required weight.
16. Moved Tailwind source and temporary development CSS out of public static discovery into `home/assets/css/`; build scripts now read from that source location.

## Preserved behavior and data

- Original PNG, JPEG, and MP4 assets remain available for rollback and comparison.
- Current visual design, Montserrat typography, Careers button padding, page layouts, colors, autoplay behavior, mute state, looping, and inline playback are preserved.
- Existing project uploads are unchanged. Optimized project-card files are disposable derived cache files.
- No database migration or production data change was introduced.
- No third-party integration was removed.
- Nothing was deployed to the live Hostinger VPS.

## Verification

- Django: 56 tests passed; system check passed; migration drift check reported no changes.
- Frontend: Tailwind production build passed; all 20 project JavaScript files passed `node --check`.
- Static delivery: `collectstatic --clear` copied and manifest-processed 656 files successfully.
- Template images: 202 static image tags have intrinsic dimensions and asynchronous decoding; the focused browser audit loaded 314 image instances with zero failures in both Chrome and Edge.
- Media: nine decorative videos passed autoplay, muted, loop, playsinline, poster, optimized-source, ready-state, and no-controls checks in both Chrome and Edge.
- Responsive browser matrix: Chrome and Edge each passed 117 route/viewport cases (234 combined) at 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920 pixels, with zero hard failures and zero horizontal-overflow cases.
- Interaction checks: mobile navigation, Escape handling, contact popup, FAQ, Zoho Recruit link, and Zoho Bigin form presence passed; no external form was submitted.

## Deployment note

The static manifest and caching configuration take effect in production only after the deployment steps in `docs/HOSTINGER_STATIC_CACHE.md` are reviewed and run. The live server remains unchanged.
