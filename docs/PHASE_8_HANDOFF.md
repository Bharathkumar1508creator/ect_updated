# Phase 8 — Final reviewable handoff

## Release scope

This handoff packages the repaired ECOG Core Technologies website from the isolated `repair/all-bugs` branch. It consolidates completed Phases 0–7 and all approved Phase 4 and Phase 5 follow-ups. The live Hostinger VPS is unchanged.

Latest pre-handoff application checkpoint: `checkpoint-phase-5-srcset`.
Phase 8 release checkpoint: `checkpoint-phase-8`.

## Result

- Security and production settings fail closed when required secrets or database settings are absent.
- Contact enquiries go only to Zoho Bigin; the website does not store new contact submissions.
- Careers directs candidates to Zoho Recruit; local resume submission is disabled.
- Existing historical contact and career tables remain preserved as read-only archives.
- Navigation, contact popup, project routes, media rendering, integrations, and fallbacks are repaired.
- Responsive layouts are validated from 320px through 1920px with no recorded horizontal overflow in Chrome or Edge.
- Current Montserrat typography, logo-derived colors, visual design, and Careers button spacing are preserved.
- Technical, on-page, structured-data, canonical, sitemap, robots, social, and Coimbatore/Tamil Nadu SEO repairs are included.
- Approved image and video performance work is included, with originals retained.
- Responsive-image filenames are URL-safe and no longer generate `srcset` parsing warnings.

## Data and migration review

- No application migration file changed between `baseline-18-9-26` and this release.
- `makemigrations --check --dry-run` reports no model drift.
- Deployment must still run `migrate --plan` and then `migrate` after a verified production database backup so Django can confirm the live migration history.
- Never replace the live database or the live media directory with files from this package.
- Preserve production administrators, blog articles, projects, testimonials, services, subscribers, and all uploaded media.
- The package contains tracked public media required by repository content. Merge those files into shared production media with `rsync --ignore-existing`; do not delete or overwrite production uploads.

## Verification evidence

- Django suite: 57 tests passed.
- Django system check: passed.
- Migration drift: none.
- Project JavaScript: 20 files passed syntax checks.
- Tailwind production build: passed.
- Manifest static collection: 656 files copied and post-processed.
- Responsive matrix: 234 Chrome/Edge page-and-viewport cases passed with zero hard failures and zero horizontal-overflow cases.
- Responsive images: 688 Chrome/Edge instances passed with zero malformed candidates, parsing warnings, or failed local images.
- Media behavior: nine decorative videos retained muted inline autoplay, looping, posters, optimized sources, and no controls; project-detail videos retain controls.
- Interaction checks passed for mobile navigation, Escape handling, contact popup, FAQ, Zoho Recruit link, and Zoho Bigin form presence. No external form was submitted.

## Package safety

The release ZIP is created with `git archive` from the Phase 8 checkpoint. It contains tracked source and required public assets only. It excludes the real `.env`, databases, generated `staticfiles`, virtual environments, caches, test outputs, local backups, and untracked production uploads.

## Required production inputs

Before deployment, the server administrator must identify and verify:

- Current project directory, Linux service user, systemd application service, and active Nginx site file.
- Production Python version and virtual environment.
- Production MySQL/MariaDB database name and least-privilege credentials.
- Persistent media directory.
- Real `.env` file and its owner/mode.
- Existing Google Analytics/Tag Manager, Zoho Bigin, Zoho SalesIQ, and domain configuration.
- Fresh database, media, `.env`, Nginx, and systemd backups.

Use `docs/HOSTINGER_VPS_DEPLOYMENT_ROLLBACK.md` for the complete backup, deployment, validation, and rollback sequence.

## Known validation limits

- Native Safari, native Firefox, and physical Android/iOS devices were not available on this Windows test host. Responsive layouts use standards-compatible CSS and were exercised in Chrome and Edge Chromium.
- Content Security Policy remains report-only so inline legacy code and required third-party resources can be observed safely before enforcement.
- Zoho Bigin was detected but no test enquiry was submitted.
- Legal policy page content remains deferred for later professional drafting as requested.
- Exact VPS paths, Linux username, systemd unit name, and database credentials must be verified on the live server before applying the example deployment files.
