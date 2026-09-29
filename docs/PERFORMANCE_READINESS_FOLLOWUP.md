# Performance readiness follow-up

## Scope

This checkpoint reduces homepage startup work while preserving the current design, content, integrations, responsive behavior, and decorative-video experience.

## Changes

- Added a repeatable `npm run build:production-assets` build that minifies the shared CSS and active JavaScript while retaining readable source files.
- Combined the shared base and navbar CSS into one production stylesheet, removing an extra render-blocking request on every public page.
- Replaced the nine Font Awesome navbar icons with accessible local SVG symbols, removing the external Font Awesome stylesheet and font download.
- Removed the unused homepage `ripple.js` request; the page had no `data-ect-hero` target for that script.
- Deferred the two homepage video files until they approach the viewport. Posters display immediately and autoplay still starts without a click.
- Removed the 0.8-second entrance delay from the above-the-fold homepage hero so its text can paint immediately.
- Loaded homepage Google Fonts and the hidden contact-popup stylesheet asynchronously, with `noscript` fallbacks.

## Measured result

The first valid clean mobile Lighthouse run after video, icon, script, and minification work improved Performance from **55 to 65**. Initial transfer fell from approximately **4.6 MiB to 1.26 MiB**, LCP improved from **7.8 s to 5.8 s**, and TBT improved from **540 ms to 380 ms**. Accessibility and SEO remained 100. Later CSS/font refinements passed browser regression tests, but their repeat Lighthouse traces returned Chrome's `NO_NAVSTART` runtime error and are not represented as a new score.

Best Practices remains 77 because Lighthouse reports two third-party-cookie/Issues-panel findings from Zoho SalesIQ/Bigin. Reaching 100 requires consent or interaction-gated loading for those integrations, which changes when chat and analytics become available and should be implemented together with the Cookie and Privacy policies.

## Verification

- 57 Django tests passed.
- Django system check passed and migration drift remains zero.
- Production asset build and manifest `collectstatic` completed for 662 assets.
- npm audit reports zero vulnerabilities.
- Chrome and Edge each passed 117 route/viewport cases from 320px to 1920px, with zero hard failures or horizontal overflow.
- Chrome and Edge each verified 13 routes, 314 image instances, and all nine decorative videos with zero failures.
- No database schema, production data, live server, external submission, or uploaded source media changed.

## Deployment requirement

Run `npm ci` and `npm run build:production-assets` before `collectstatic`. Do not deploy if the production asset build or manifest collection fails.
