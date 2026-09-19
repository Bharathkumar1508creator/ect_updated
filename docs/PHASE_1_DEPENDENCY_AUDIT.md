# Phase 1 — Dependency and Data-Preservation Audit

Audit date: 2026-09-19  
Source: isolated repair branch `repair/all-bugs`  
Production changes: none

## Scope and evidence boundary

This audit maps the extracted source, local SQLite snapshot, migrations, templates, static files, routes, admin registrations, media fields, and third-party integrations. The local database is evidence about this copy only. An empty local table does not prove that the production table is empty.

No model, migration, table, media file, route, or helper was removed in Phase 1.

## Runtime architecture and routes

- Django 6.0.7; MySQL is intended for production and SQLite for local development.
- Applications: `home`, `blog`, and `newsletter`, plus Django admin, authentication, sessions, static files, and sitemaps.
- Public pages cover Home, About, Careers, Contact, Projects, Digital Marketing, HR, IT Infrastructure, Software, Website Development, Zoho, Blog, `sitemap.xml`, and `robots.txt`.
- Most marketing pages retain duplicate `.html` aliases. They are active routes; Phase 6 must redirect them to clean canonical URLs rather than delete them.
- Primary source origin: `https://ecogcoretechnologies.com`.

## Templates and content dependencies

Active shared templates are the navbar, footer, Google tag, favicon, contact popup, Zoho Bigin form, and Zoho SalesIQ components. The index page renders database-backed projects, testimonials, and latest blogs. Project details use reusable media, related-project, and next-project components.

| Query/model | Current state | Preservation decision |
|---|---|---|
| `SiteSettings` | Queried globally; fields are not rendered | Preserve table/admin data; review redundant query later |
| `Service` | Six records queried on Home; no `services` loop rendered | Preserve all service content as requested |
| `TeamMember` | Queried by About; no `team_members` binding | Preserve all rows/media |
| `Career` | Queried by Careers; page uses static copy and Zoho Recruit links | Stop local application handling in Phase 2; preserve history |
| `FAQ` | Admin registered; no public query/binding | Preserve pending production count |

Templates with no runtime render/include reference are `home/templates/digital_overview.html` and `home/templates/components/contact_form.html`. The active contact form is the separate Bigin component. Both candidates remain until regression tests prove removal is harmless.

## Local data inventory

Counts make this checkpoint reproducible and do not describe production.

| Data group | Local rows | Dependency | Decision |
|---|---:|---|---|
| Django users | 1 | Admin authentication | Preserve |
| Site settings/services/team | 0/0/0 | Views/admin | Preserve |
| Testimonials | 10 | Home/admin | Preserve |
| FAQs | 0 | Admin | Preserve |
| Legacy `home.Category`/`home.Blog` | 0/0 | No view/admin dependency | Legacy candidates; retain tables pending production verification |
| Contact messages | 0 | Local POST/admin | Disable new local writes; retain history |
| Careers/job applications | 0/0 | Local POST/admin/resumes | Disable endpoint; retain rows/files pending verified export |
| Project categories/projects/sections | 2/6/6 | Public pages/sitemap/admin | Preserve |
| Social cards/marketing overview | 0/0 | Detail views/admin | Preserve |
| Blog categories/tags/articles | 1/5/1 | Public blog/feed/sitemap/admin | Preserve |
| Blog redirects/revisions | 0/11 | Redirect/history/admin | Preserve |
| Blog image assets/comments | 0/0 | Admin/public path | Preserve |
| Newsletter subscribers | 0 | Public endpoint/proxy admin | Preserve |

`newsletter.Subscriber` is an active proxy over `blog.NewsletterSubscriber`, not a second subscriber table.

## Media and migrations

Media fields cover services, team, testimonials, legacy blogs, resumes, project hero/section/SEO media, social cards, marketing overview media, and blog author/hero/content/Open Graph/library media. The local snapshot references six project hero images plus one blog author image and one WebP hero. Production backup must copy the entire media directory with its matching database.

All local migrations are applied. Application leaves are `home.0006`, `blog.0008`, and `newsletter.0001`. Historical migration `blog.0007_single_live_blog_and_author_defaults` deletes every blog except a selected target. It must never be edited or re-run manually.

Migration rules:

1. Never edit, rename, squash, or delete an applied migration.
2. Back up the matching database and media before deployment.
3. Compare production migration history and row counts before schema work.
4. Add only idempotent, reversible forward migrations.
5. Disable obsolete write paths before retiring ORM state.
6. Retain legacy tables until production rows/files are exported and verified; prefer state-only retirement to table drops.
7. Test migration and restoration against a production backup before deployment.

## Contact and Careers behavior

The Contact page and popup use Zoho Bigin, but `/contact/` also accepts a local POST and writes `ContactMessage`. Phase 2 must disable that obsolete path while retaining Bigin.

Careers visibly links to Zoho Recruit and has no resume form, but `/career/` still accepts a crafted POST, creates `JobApplication`, and uploads a resume. Phase 2 must disable that write behavior without dropping historical data or media.

## Third-party integrations

| Integration | Evidence | Decision |
|---|---|---|
| Google Analytics | Shared GA4 tag component | Active; preserve |
| Google Tag Manager | No `GTM-...` container found | Not present in source; do not invent one |
| Zoho Bigin | Generated form used on Contact and popup | Preserve generated mapping; test later with labelled submissions |
| Zoho SalesIQ | Shared widget on public pages | Preserve |
| Zoho Recruit | Careers CTAs link to portal | Preserve |
| Google Fonts | Used throughout | Consolidate later; retain Montserrat |
| MapLibre | Contact page map CSS/JS and tiles | Preserve with later fallback |
| Social links | Footer Facebook, Instagram, LinkedIn, YouTube, WhatsApp | Preserve |

Other runtime hosts include Font Awesome, Lucide, Carto/OpenStreetMap tiles, Unsplash, Picsum, `i.pravatar.cc`, and a Netlify-hosted Zoho link. They require later availability, privacy, performance, and content review.

## Static/frontend findings

- `STATICFILES_DIRS = [BASE_DIR / 'home']` exposes the entire `home` source tree to static discovery. Django can resolve `models.py`, templates, and migrations; a dry run finds 493 files. Phase 2 must scope this to public asset directories.
- Templates contain 209 unique static references. Four are missing: `img/logo10.jpeg`, `img/logo11.jpeg`, `img/logo12.jpeg`, and `img/logo13.jpeg` on Digital Marketing.
- Checked asset roots contain 207 PNG, 34 JPEG, 4 JPG, 1 JFIF, 4 SVG, 10 MP4, 20 CSS, and 19 JavaScript files.
- Project pages omit shared base/contact-popup JavaScript loaded by other public pages. Phase 3 must reconcile behavior.
- Typography is not Montserrat-only. Styles explicitly select Inter, Outfit, Poppins, Hind, Manrope, Plus Jakarta Sans, Segoe UI, and Arial; one declaration misspells `Montserratt`. Phase 4 will standardize typography and responsive sizes while preserving the design.

## Maintenance/generated candidates

No runtime import, Django setting, package script, template include, or URL references these files: `add_csrf.py`, `parse_html.py`, `dom_tree.txt`, `patch_nav.py`, `replace_footer.py`, `replace_script.py`, `script.py`, `home/sync_blocks.py`, and `out.html`. They are removal candidates after a clean regression checkpoint, not runtime dependencies.

## Conclusion

Active systems to carry through repairs are authentication/admin, projects, testimonials, the newer blog, newsletter, Bigin, SalesIQ, Zoho Recruit, analytics, maps, fonts, and social links. Services, team, FAQs, site settings, legacy blog tables, local contacts, and local applications still require preservation even when current templates do not display them.

Phase 2 can harden settings and disable obsolete local form writes without deleting data. Destructive schema cleanup remains blocked until production backups, migration history, row counts, and media exports are verified.
