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

The follow-up consent checkpoint gates optional Analytics and SalesIQ until the visitor accepts optional cookies. Zoho Bigin's helper script loads when the visitor starts interacting with the contact form. A fresh browser therefore makes zero requests to these services, while accepting consent loads Analytics and SalesIQ and focusing the form loads Bigin. A clean Lighthouse run confirmed Accessibility, Best Practices, and SEO at 100; its Performance trace was invalidated by Chrome's `NO_NAVSTART` runtime error and is not reported as a score. Initial transfer in that run was approximately 1.0 MiB.

The cookie controls are functional and keyboard accessible. Professional Cookie and Privacy policy copy remains a release requirement because the user previously deferred those documents.

## Verification

- 58 Django tests passed.
- Django system check passed and migration drift remains zero.
- Production asset build and manifest `collectstatic` completed for 662 assets.
- npm audit reports zero vulnerabilities.
- Chrome and Edge each passed 117 route/viewport cases from 320px to 1920px, with zero hard failures or horizontal overflow.
- Chrome and Edge each verified 13 routes, 314 image instances, and all nine decorative videos with zero failures.
- A focused consent audit verified zero optional third-party requests before consent, both optional services after acceptance, and Bigin loading on form interaction.
- No database schema, production data, live server, external submission, or uploaded source media changed.

## Deployment requirement

Run `npm ci` and `npm run build:production-assets` before `collectstatic`. Do not deploy if the production asset build or manifest collection fails.
