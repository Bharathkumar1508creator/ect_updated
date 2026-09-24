# Phase 5 follow-up — Responsive image srcset parsing

## Problem

Responsive image candidates whose filenames contained spaces or other unsafe characters were emitted inside `srcset` attributes. Browsers split `srcset` candidates on whitespace, so values such as `/static/img/ECT LOGO-128.webp 128w` were parsed as an invalid URL plus unknown descriptors. Chrome and Edge then dropped those candidates and logged messages including `Failed parsing 'srcset' attribute value` and `Dropped srcset candidate`.

## Repair

- Renamed all 66 generated WebP assets containing spaces or unsafe punctuation to URL-safe filenames.
- Updated all 95 references across templates, CSS, and JavaScript.
- Preserved the original PNG/JPEG source assets and image appearance.
- Added `ResponsiveImageMarkupTests` to reject whitespace in future static paths used inside `srcset`.
- Added `scripts/srcset_browser_audit.py` to verify browser console messages, candidate syntax, local image responses, and loaded image state.

## Verification

- 57 Django tests passed, including the new regression test.
- Django system check passed and no migration changes were detected.
- `collectstatic --clear` copied and manifest-processed 656 files.
- Chrome: 26 page/viewport cases, 344 responsive-image elements, zero malformed candidates, zero `srcset` console warnings, zero failed local images.
- Edge: 26 page/viewport cases, 344 responsive-image elements, zero malformed candidates, zero `srcset` console warnings, zero failed local images.
- Viewports covered: 320px and 1440px across all 13 main routes.

No production server or database was changed.
