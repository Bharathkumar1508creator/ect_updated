# Phase 2 — Security and Backend Correctness

Checkpoint date: 2026-09-19
Production changes: none
Database schema changes: none

## Completed work

### Production configuration

- Django now fails closed when production has no strong secret key.
- SQLite is restricted to development; production requires explicit MySQL/MariaDB database name, user, and password.
- Production database connections use health checks, UTF-8 MB4, and configurable connection reuse.
- Development hosts are explicit instead of using a wildcard.
- The site timezone defaults to `Asia/Kolkata`.
- Secure session/CSRF cookies, HSTS, HTTPS redirects, strict referrer handling, cross-origin opener isolation, upload limits, and trusted origins are configured for production.
- A Permissions Policy disables unneeded browser capabilities.
- A Content Security Policy is emitted in report-only mode. It records violations without breaking current inline scripts or Zoho, analytics, map, font, and video integrations. Enforcement waits for full browser and third-party QA.
- Proxy-header trust is explicit and documented in `.env.example`.
- Sample database credentials were removed from `.env.example`.

### Static-source isolation

- Public CSS, JavaScript, images, and videos now live under `home/static/`. Their public URLs remain unchanged.
- Python source, templates, and migrations are no longer discoverable as static files.
- Asset moves were byte-identical except for the intentionally rebuilt Tailwind output and simplified contact-popup script.
- The Tailwind build paths were updated and the build succeeds.
- The four previously identified missing Digital Marketing images remain recorded for Phase 3; no placeholder was invented.

### Zoho-only enquiries and recruitment

- `/contact/` is GET-only and still renders the Zoho Bigin form. Crafted POST requests now receive HTTP 405 and cannot create `ContactMessage` rows.
- `/career/` is GET-only and retains the Zoho Recruit links. Crafted POST/file uploads receive HTTP 405 and cannot create `JobApplication` rows or resume files.
- The unused local contact form template and its AJAX submission code were removed after the Phase 1 dependency proof.
- `ContactMessage`, `Career`, and `JobApplication` tables and models remain intact.
- Their Django admin screens are read-only archives: existing records remain viewable but cannot be added, changed, or deleted.

### Input and content protection

- Newsletter and blog-comment writes now use cache-backed per-client rate limits. Defaults are eight attempts per 15 minutes; both values are configurable.
- Forwarded client addresses are trusted only when explicitly enabled for a correctly configured Nginx proxy.
- Project rich text and legacy blog content are sanitized at the rendering boundary. Scriptable tags, event attributes, and unsafe URL schemes are removed without rewriting stored historical content.
- Blog admin AJAX now reads the CSRF token from the rendered form, so HttpOnly CSRF cookies do not break image uploads or link validation.

### Migration safety

- Historical migration `blog.0007` remains unchanged because applied migration history is immutable. A pre-migration guard now blocks it if it is unapplied on a database containing multiple blog articles. The operator must stop, back up database and media, and review a non-destructive plan.
- No new migration was needed and `makemigrations --check --dry-run` reports no changes.

## Data preservation evidence

The isolated local counts remain unchanged after Phase 2: 10 testimonials, 6 projects, and 1 blog article; local contact, career, job-application, service, and newsletter tables remain at their prior counts. Test-created records use temporary test databases and are destroyed after the suite.

No database row, uploaded media file, migration record, admin account, blog, project, testimonial, service, or newsletter subscriber was modified by this phase.

## Verification

- `python manage.py check`: passed
- `python manage.py check --deploy` with temporary production-style environment values: passed with no issues
- `python manage.py makemigrations --check --dry-run`: no changes
- `python manage.py test home blog`: 40 tests passed
- Python package consistency: passed
- JavaScript syntax across application files: passed
- Tailwind CSS production build: passed
- npm audit: 0 vulnerabilities
- Static reference scan: 209 references checked; only the four previously documented Digital Marketing images are missing
- Static finder safety: Python source, templates, and migrations not found; CSS, JS, and images found

## Deployment requirements carried forward

Before a live deployment, back up and verify the production database, complete media directory, application files, `.env`, Nginx configuration, and application service configuration. Confirm the real database engine and migration history before running `migrate`.

For multiple application workers, configure a shared cache so public-form rate limits apply globally. Nginx must overwrite trusted proxy headers and the application port must not be publicly reachable before proxy trust is enabled.

No live deployment is authorized by this checkpoint.
