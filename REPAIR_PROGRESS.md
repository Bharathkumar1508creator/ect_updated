# ECT Website Repair Progress

## Workspace safety

- Original archive: `D:\Ecog\ECT-UP\ECT_codex\18-9-26.zip`
- Original SHA-256: `103A0BC0849529ABAFE79FFA7C60AB3787E908B6AA058F244D8AE6719B3485FD`
- Baseline commit: `d9ffde1`
- Baseline tag: `baseline-18-9-26`
- Repair branch: `repair/all-bugs`
- Live deployment: prohibited until the repaired copy passes all gates, the user reviews it, and production backups are verified.
- Sensitive/local files excluded from commits: `.env`, SQLite databases, database backups, resume uploads, virtual environments, caches, and collected static output.

## Checkpoint policy

Every phase must:

1. Begin from a clean working tree and the last passing checkpoint.
2. Record the exact scope and affected files here.
3. Run relevant Django, JavaScript, browser, accessibility, SEO, and asset checks.
4. Keep production data migrations reversible and review them separately.
5. Commit only after required checks pass or a known baseline limitation is documented.
6. Never deploy an incomplete or failing phase.
7. Record the commit hash, checks, remaining work, and rollback point.

If Codex usage stops, resume this task, inspect `git status`, read this file, verify the last checkpoint, and continue with the first pending phase.

## Status

| Phase | Scope | Status | Checkpoint |
|---|---|---|---|
| 0 | Isolated workspace, source baseline, exclusions, repair workflow | Complete | `checkpoint-phase-0` |
| 1 | Dependency and data-preservation inventory | Complete | `checkpoint-phase-1` |
| 2 | Security, settings, contact handling, and removal of local career uploads | Complete | `checkpoint-phase-2` |
| 3 | Shared navigation, popup, project pages, media logic, and integration resilience | Complete | `checkpoint-phase-3` |
| 4 | Responsive layouts, Montserrat typography, accessibility, and cross-browser behavior | Complete, including Website subtitle follow-up | `checkpoint-phase-4-website-subtitle` |
| 5 | Selected image/video optimization, WebP delivery, posters, caching, fonts, and frontend performance | Complete — including srcset follow-up | `checkpoint-phase-5-srcset` |
| 6 | Complete technical, on-page, and Coimbatore/Tamil Nadu local SEO | Complete | `checkpoint-phase-6` |
| 7 | Automated regression tests and full viewport/browser QA | Complete | `checkpoint-phase-7` |
| 8 | Final clean package, review evidence, deployment guide, and rollback guide | Complete | `checkpoint-phase-8` |
| 9 | Live VPS backup and deployment | Blocked until explicit approval | — |

## Phase details

### Phase 0 — Workspace setup

- Create a clean extraction separate from the original ZIP.
- Record the original archive checksum.
- Create an immutable Git baseline tag.
- Create the `repair/all-bugs` branch.
- Exclude credentials and production-like databases from version control.
- Establish baseline checks and this progress record.

### Phase 1 — Dependency and preservation audit

- Map templates, views, models, migrations, static files, admin registrations, third-party integrations, and routes.
- Prove which legacy files and functions are unused before removal.
- Inventory database tables and media relationships without changing production data.
- Design safe migrations that preserve accounts, blogs, projects, testimonials, services, and subscribers.
- Confirm Google Tag Manager/Analytics, Zoho Bigin, Zoho SalesIQ, MapLibre, fonts, and social links.

Completed in `docs/PHASE_1_DEPENDENCY_AUDIT.md`. No runtime files or database rows were changed. The audit records active dependencies, dormant CMS bindings, legacy candidates, local row counts, media fields, migration hazards, missing assets, static-source exposure, external services, and non-destructive migration rules.

### Phase 2 — Security and backend correctness

- Restrict static-file discovery to public assets.
- Remove local contact storage while preserving the contact page and Zoho Bigin submission.
- Remove or disable local career application/resume handling; keep Zoho Recruit redirects.
- Validate public inputs, add rate-limiting strategy, and harden error handling.
- Sanitize trusted rich content and eliminate destructive migration behavior safely.
- Separate development and production configuration without committing secrets.

Completed in `docs/PHASE_2_SECURITY_AND_BACKEND.md`. Contact and Careers are external-service-only, historical tables remain as read-only archives, public assets are isolated under app static storage, production settings fail closed, public writes are rate-limited, rich HTML is sanitized, and the destructive historical blog migration is guarded. No schema or production data changed.

### Phase 3 — Functional repair

- Load shared navigation and popup behavior consistently.
- Repair project listing/detail media and missing-image fallbacks.
- Correct YouTube parsing, Open Graph images, filename case, and career JavaScript.
- Preserve and verify third-party integrations with graceful fallbacks.
- Repair duplicate or conflicting frontend initialization.

Completed in `docs/PHASE_3_FUNCTIONAL_REPAIR.md`. Project pages now use the shared navigation, footer, Zoho Bigin popup, and SalesIQ shell; YouTube, video, missing-media, Open Graph, and category-routing paths are repaired; navigation supports mouse, keyboard, and touch; placeholder routes and alerts no longer override real links; and optional third-party failures no longer stop unrelated page behavior. No schema, data, uploaded media, or live-server changes were made.

### Phase 4 — Responsive UI and accessibility

Restored after Phase 7 at the user's request and revalidated against the current SEO and regression checkpoints.


- Preserve the current visual design, logo-derived palette, and Montserrat typography.
- Test representative widths: 320, 360, 390, 430, 768, 1024, 1280, 1440, and 1920px.
- Remove horizontal overflow and fixed-coordinate failures.
- Standardize responsive type, spacing, shared breakpoints, menus, dialogs, forms, carousels, and media.
- Repair labels, heading structure, keyboard behavior, focus handling, iframe titles, and alt text.
- Cover current Chrome, Edge, Firefox, Safari, Android, and iOS behavior.

Completed in `docs/PHASE_4_RESPONSIVE_ACCESSIBILITY.md`, with manual-test corrections recorded in `docs/PHASE_4_OVERFLOW_CSP_FOLLOWUP.md`, `docs/PHASE_4_FOOTER_IMPORT_FOLLOWUP.md`, `docs/PHASE_4_REMAINING_CSS_IMPORT_FOLLOWUP.md`, and `docs/PHASE_4_WEBSITE_SUBTITLE_FOLLOWUP.md`. Manual testing exposed shared-footer overflow at 320px, transformed Projects cards crossing 320px/360px, a Careers horizontal rail at 1024px, mobile Website hero paint overflow, incomplete SalesIQ CSP sources, an obsolete footer override on IT Infrastructure/Software, and five ignored late CSS imports across four served stylesheets. These are repaired. The latest Chrome and Edge matrices passed 234 combined cases with zero overflow and zero hard failures; focused checks confirmed identical mobile footers, zero late-import issues, a 16px desktop Website subtitle matching the WEB SOLUTIONS label, and complete unclipped mobile subtitle text. Native Firefox, Safari, and physical Android/iOS execution remains unavailable.

### Phase 5 — Selected performance and assets

Completed in `docs/PHASE_5_SELECTED_PERFORMANCE.md` for the user-approved items **1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, and 16**. The responsive-image filename correction is recorded in `docs/PHASE_5_SRCSET_FOLLOWUP.md`.

- Static images now have intrinsic dimensions, asynchronous decoding, appropriate lazy loading, quality-checked WebP delivery, and responsive candidates. Original PNG/JPEG files remain preserved.
- Project cards use non-destructive cached WebP variants, and future affected admin uploads are orientation-safe, capped at 1920 pixels, and converted to WebP. Existing uploads and database rows remain unchanged.
- Nine static videos use optimized H.264 copies and WebP posters while preserving muted inline autoplay, looping, and no controls. Project-detail videos retain controls.
- Manifest static storage provides content-hashed asset URLs. Hostinger/Nginx cache and compression steps are documented separately and have not been applied to the live server.
- Duplicate Google Fonts requests are consolidated without changing font-family declarations. Development-only Tailwind source and temporary CSS are outside public static discovery.
- Items 10 and 15 remain excluded by design.

### Phase 6 — SEO

- Use `https://ecogcoretechnologies.com/` as the canonical origin.
- Redirect `www` and duplicate `.html` routes to canonical URLs.
- Repair titles, descriptions, headings, canonical tags, social metadata, sitemaps, robots rules, and internal links.
- Add and validate appropriate Organization, LocalBusiness, Service, Breadcrumb, Article, FAQ, and project schema.
- Target Website Development, Custom Software Development, Zoho Consulting, Digital Marketing, HR Consulting, and IT Infrastructure Services for Coimbatore and Tamil Nadu.
- Preserve Google Search Console, Analytics, Google Business Profile details, and existing business content.

Completed in `docs/PHASE_6_SEO.md`. Canonical non-www and clean-route redirects, complete page metadata, local/service/project/article structured data, crawl controls, sitemap/robots coverage, and heading semantics are implemented. FAQ rich-result markup is intentionally omitted because current Google eligibility is limited to authoritative government and health sites. No schema, data, uploaded media, third-party submission, or live-server change was made.

### Phase 7 — Regression and QA

- Add tests for backend validation, redirects, canonical metadata, sitemap behavior, media fallbacks, and database preservation.
- Test navigation, dialogs, Zoho flows, Zoho Recruit redirects, projects, blog, newsletter, forms, external dependencies, and error states.
- Run responsive browser checks at the full viewport matrix.
- Submit clearly labelled Zoho Bigin test enquiries only during authorized end-to-end verification.
- Record known external-service limits separately.

Completed in `docs/PHASE_7_REGRESSION_QA.md`. The 54-test Django suite, migration-drift check, and all 20 JavaScript syntax checks passed. Chrome and Edge passed 234 combined route/viewport cases with zero hard failures, zero missing image alternatives, and zero unnamed buttons; interaction checks passed without submitting the Zoho Bigin form. The 13 overflow cases found at this checkpoint were subsequently resolved by the restored Phase 4 checkpoint. Native Firefox, Safari, Android, and iOS testing remains unavailable on this Windows host. No schema, data, uploaded media, external submission, or live-server change was made.

### Phase 8 — Reviewable handoff

Completed in `docs/PHASE_8_HANDOFF.md` and `docs/HOSTINGER_VPS_DEPLOYMENT_ROLLBACK.md`.

- The release includes consolidated scope, verification evidence, data and migration review, production-input checklist, known limits, and package-safety rules.
- Backup-first Hostinger deployment, atomic release switching, production validation, application rollback, conditional database recovery, and cleanup are documented.
- Example systemd/Gunicorn and Nginx configurations are available in `deploy/`; exact VPS paths, service user, certificate directives, service name, and database settings must be verified before use.
- The Linux WSGI dependency is pinned in `requirements.txt`.
- The clean ZIP is generated from tracked files at `checkpoint-phase-8`, with a SHA-256 companion file and an external release manifest.
- The live VPS, database, media, Nginx configuration, DNS, and third-party services remain unchanged.

### Phase 9 — Live deployment

This phase begins only after:

- The user reviews and accepts the repaired copy.
- Database, media, project, `.env`, Nginx, and application-service backups are verified.
- Deployment and rollback commands are reviewed.
- Explicit live-deployment authorization is received.

### Performance readiness follow-up

Completed in `docs/PERFORMANCE_READINESS_FOLLOWUP.md`. Production CSS and active JavaScript now have a repeatable minified build; shared navbar CSS is merged into the base production bundle; external Font Awesome is replaced by local SVG icons; the unused homepage ripple request is removed; below-the-fold homepage videos load near the viewport while retaining automatic muted playback; and above-the-fold font, popup-style, and hero-paint delays are reduced. The first valid clean mobile Lighthouse comparison improved Performance from 55 to 65 and reduced initial transfer from about 4.6 MiB to 1.26 MiB. Optional Analytics and SalesIQ now require cookie consent, Bigin loads on form interaction, and a clean audit reports Accessibility, Best Practices, and SEO at 100. Professional policy content and a valid final production Performance trace remain pending.

### Projects interaction follow-up

Completed in `docs/PROJECT_FILTER_INTERACTION_FOLLOWUP.md`. Category filters and pagination now update only the Projects listing while retaining real URLs, Back/Forward behavior, keyboard focus, live status announcements, and non-JavaScript fallback navigation. Dynamically inserted project media is reinitialized safely. Visible card and button shadows are removed, and buttons use consistent hover, press, focus, and reduced-motion behavior.

## Checkpoint log

| Date | Phase | Commit | Verification | Notes |
|---|---|---|---|---|
| 2026-09-19 | Baseline | `d9ffde1` | Archive SHA-256 recorded | Original ZIP remains untouched |
| 2026-09-19 | Phase 0 | `checkpoint-phase-0` | Django checks, migration check, 32 blog tests, and JavaScript syntax checks passed | Isolated repair workflow ready |
| 2026-09-19 | Phase 1 | `checkpoint-phase-1` | Dependency trace, local data/media inventory, migration plan, Django checks, migration check, Python/npm dependency checks, 32 blog tests, JavaScript syntax, and static-reference scan | Audit only; no application behavior changed |
| 2026-09-19 | Phase 2 | `checkpoint-phase-2` | Django checks including production deploy check, no migration drift, 40 tests, dependency audits, JavaScript syntax, Tailwind build, and static safety checks | No schema/data/live-server changes |
| 2026-09-19 | Phase 3 | `checkpoint-phase-3` | Django checks, no migration drift, 47 tests, JavaScript syntax, 343 static references with zero missing, 13 primary-route renders, and all 6 published project renders | No schema/data/media/live-server changes |
| 2026-09-22 | Phase 6 | `checkpoint-phase-6` | Django checks, no migration drift, 53 tests, canonical/static metadata audit, sitemap/robots verification, and diff integrity | Phases 4–5 remain skipped; no schema/data/media/live-server changes |
| 2026-09-24 | Phase 7 | `checkpoint-phase-7` | 54 Django tests, no migration drift, 20 JavaScript syntax checks, and 234 Chrome/Edge browser cases with zero hard failures | Phase 4 overflow warnings retained; no schema/data/media/external-submission/live-server changes |
| 2026-09-24 | Phase 4 restored | `checkpoint-phase-4-restored` | 54 Django tests, no migration drift, 20 JavaScript syntax checks, and 234 Chrome/Edge browser cases with zero hard failures and zero overflow | Phase 5 remains skipped; no schema/data/media/external-submission/live-server changes |
| 2026-09-24 | Phase 4 manual-test follow-up | `checkpoint-phase-4-overflow-csp` | 54 Django tests, no migration drift, 20 JavaScript checks, stricter 234-case Chrome/Edge matrix with zero overflow, and real SalesIQ load with zero CSP violations | CSP remains report-only; Phase 5 remains skipped; no schema/data/media/external-submission/live-server changes |
| 2026-09-24 | Phase 4 footer/import follow-up | `checkpoint-phase-4-footer-import` | 54 Django tests, no migration drift, 20 JavaScript checks, identical shared footers at 440px, zero late-import issues, and 234 Chrome/Edge cases with zero hard failures or overflow | Phase 5 remains skipped; no schema/data/media/external-submission/live-server changes |
| 2026-09-24 | Phase 4 remaining CSS imports | `checkpoint-phase-4-css-import-complete` | 54 Django tests, no migration drift, 20 JavaScript checks, and 6 focused Chrome cases with zero import issues, page errors, or overflow | All served imports valid; Phase 5 remains skipped; no schema/data/media/external-submission/live-server changes |
| 2026-09-24 | Phase 4 Website subtitle | `checkpoint-phase-4-website-subtitle` | 54 Django tests, no migration drift, 20 JavaScript checks, and 6 Chrome widths with matched 16px desktop typography and zero subtitle clipping or overflow | Phase 5 remains skipped; no schema/data/media/external-submission/live-server changes |
| 2026-09-24 | Phase 5 selected performance | `checkpoint-phase-5-selected` | 56 Django tests, no migration drift, 20 JavaScript checks, successful 656-file manifest collection, focused image/video checks, and 234 Chrome/Edge cases with zero hard failures or overflow | Approved items 1–9, 11–14, and 16 only; originals preserved; no schema/data/external-submission/live-server changes |
| 2026-09-24 | Phase 5 srcset follow-up | `checkpoint-phase-5-srcset` | 57 Django tests, no migration drift, successful 656-file manifest collection, and 52 Chrome/Edge cases covering 688 responsive-image instances with zero malformed candidates, console warnings, or failed local images | 66 generated WebP filenames and 95 references made URL-safe; originals preserved; no schema/data/live-server changes |
| 2026-09-24 | Phase 8 final handoff | `checkpoint-phase-8` | 57 Django tests, production settings check, no migration drift, Python dependency check, Tailwind build, 20 JavaScript checks, npm audit, 656-file manifest collection, and 234 Chrome/Edge cases with zero failures or overflow | Clean tracked-file ZIP, checksum, deployment/rollback guide, and server examples; no schema/data/external-submission/live-server changes |
| 2026-09-29 | Performance readiness follow-up | `checkpoint-performance-readiness-1` | 57 Django tests, no migration drift, production asset build, npm audit, 662-file manifest collection, 234 Chrome/Edge responsive cases, and Chrome/Edge media audits with zero failures | Valid clean Lighthouse Performance improved 55→65 before later CSS/font refinements; Zoho cookie findings remain; no schema/data/external-submission/live-server changes |
| 2026-09-29 | Consent and third-party loading | `checkpoint-performance-consent` | 58 Django tests, consent/interaction network audit, 664-file manifest collection, clean Lighthouse Accessibility/Best Practices/SEO 100, and Chrome responsive/media audits with zero failures | Optional Analytics/SalesIQ require consent; Bigin loads on form interaction; final Lighthouse Performance trace hit `NO_NAVSTART`; no schema/data/external-submission/live-server changes |
| 2026-09-29 | Projects hero navbar clearance | `checkpoint-project-hero-clearance` | 7 focused Django tests and 18 Chrome/Edge viewport cases from 320px to 1920px | Transformation Projects overline and title remain below the fixed navbar with zero overflow; no data/live-server changes |
| 2026-09-29 | Projects filters and card interactions | `checkpoint-project-filter-interactions` | 58 Django tests, JavaScript syntax checks, Chrome/Edge in-page filtering and history checks, and 18 viewport cases | No full reload, visible card/button shadows, local request failures, page errors, or overflow; no data/live-server changes |
| 2026-09-29 | Projects card bottom-edge correction | `checkpoint-project-card-edge` | 58 Django tests plus Chrome/Edge card rendering and interaction audits | Removed the antialiased line below every project-card button notch; no data/live-server changes |
