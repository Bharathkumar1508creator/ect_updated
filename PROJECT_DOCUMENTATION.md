# ECOG Core Technologies Website — Current Project Documentation

Last verified: 6 October 2026

## Current status

The application is a Django 6 website and content-management system for ECOG Core Technologies. It includes marketing pages, service pages, careers, contact workflows, project case studies, a database-backed blog, SEO endpoints, responsive front-end behavior, consent-aware third-party integrations, operational health checks, and production backup tooling.

The current production-readiness assessment is **91/100**. The codebase is suitable for controlled staging and production deployment after the target server values and external services are configured and validated. The score is below 100 because live MySQL, Redis, SMTP, domain/TLS, Nginx, Gunicorn, Zoho submission, and physical-device validation cannot be completed in the local development environment. A restore rehearsal is also still recommended.

### Readiness breakdown

| Area | Score | Current evidence |
| --- | ---: | --- |
| Application behavior | 20/20 | 99 Django tests and all front-end interaction checks pass |
| Security and dependencies | 19/20 | Security settings are environment-driven; Python dependencies are consistent; npm reported zero vulnerabilities after TinyMCE 7.9.3 was installed |
| Data and recovery | 18/20 | Schema checks, media checks, cache checks, backup script, and protected MySQL credentials are present; a live restore rehearsal remains |
| Front-end, accessibility, and performance | 18/20 | 234 responsive route/width cases passed without hard failures; one 1030px home-card overflow warning remains documented below |
| Deployment and integrations | 16/20 | Gunicorn/systemd/Nginx examples, readiness endpoints, and preflight checks exist; live infrastructure and held external-service work remain |

## Technology stack

- Python 3 and Django 6.0.7
- MySQL/MariaDB in production through `mysqlclient`; SQLite is permitted for development only
- Redis-backed Django cache in production
- Gunicorn behind Nginx on Linux/VPS deployments
- Pillow for image handling and generated media variants
- Tailwind CSS 4.3.0, Clean CSS, and Terser for production assets
- Locally hosted variable web fonts and Poppins weights
- Locally hosted TinyMCE 7.9.3 for blog administration
- Vanilla JavaScript for page interactions, filtering, media loading, consent, and service animations

Pinned Python dependencies are maintained in `requirements.txt`. Front-end build dependencies and scripts are maintained in `package.json` and `package-lock.json`.

## Main application areas

The `home` application supplies the primary website pages and project case studies. Public routes include the home page, About, Career, Contact, Projects, Digital Marketing, HR Consulting, IT Infrastructure, Software Development, Website Development, Zoho Consulting, and the under-construction page. Legacy `.html` routes redirect permanently to their canonical trailing-slash routes.

The `blog` application supplies the blog index, category and tag archives, article detail pages, previews, RSS feed, newsletter subscription, author information, article media, metadata, comments, and administration tools.

The project also supplies:

- `/admin/` for Django administration
- `/health/` for a lightweight process health response
- `/ready/` for dependency-aware readiness reporting
- `/sitemap.xml` and `/robots.txt` for search engines
- Dynamic project routes at `/projects/<slug>/`
- Dynamic digital-marketing routes at `/digital-marketing/<slug>/`
- Dynamic blog routes at `/blog/<slug>/`

## Project structure

- `ect/`: settings, root URLs, middleware, health/readiness logic, WSGI/ASGI entry points, and test runner
- `home/`: marketing pages, service pages, projects, forms, models, templates, static assets, and operational management commands
- `blog/`: blog models, views, templates, feeds, admin editor, SEO behavior, and tests
- `media/`: user-managed and project media; must be persisted outside disposable releases in production
- `deploy/`: example Nginx, systemd, and backup configuration
- `scripts/`: front-end audits, browser audits, media audits, production asset helpers, and backup automation
- `package.json`: front-end build and test commands
- `requirements.txt`: pinned Python production dependencies

## Environment configuration

Copy `.env.example` to a secure environment file outside the repository for production. Never commit real secrets.

Required or important variables include:

- `DJANGO_SECRET_KEY`: long, random production secret
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS`: deployed domain names
- `DJANGO_USE_SQLITE=False` in production
- `DJANGO_CSRF_TRUSTED_ORIGINS`: full HTTPS origins
- `DJANGO_SECURE_SSL_REDIRECT=True`
- `DJANGO_SECURE_HSTS_SECONDS`: enable after HTTPS is confirmed everywhere
- `DJANGO_TRUST_PROXY_SSL_HEADER=True` only when Nginx overwrites the trusted header and the application port is not public
- `DJANGO_TRUST_X_FORWARDED_FOR=True` only when the proxy safely replaces untrusted forwarding values
- `DJANGO_PUBLIC_FORM_RATE_LIMIT` and `DJANGO_PUBLIC_FORM_RATE_WINDOW`
- `REDIS_URL`: required in production for shared rate limits and cache behavior
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`
- `DB_SSL_CA` when the database provider requires TLS verification
- `SITE_URL` and blog publisher metadata

Production SMTP values remain intentionally unconfigured until the mail provider is selected. Configure those values before relying on email delivery from public forms.

## Local setup

Create and activate a Python virtual environment, then install dependencies:

```powershell
python -m pip install -r requirements.txt
npm install
python manage.py migrate
python manage.py runserver
```

The Django development server warning is expected locally. It must not be used as the production application server.

## Builds and verification

Build production front-end assets with:

```powershell
npm run build:production-assets
```

Run application and front-end tests with:

```powershell
python manage.py test
npm test
python -m pip check
python manage.py check
python manage.py makemigrations --check --dry-run
```

Operational checks are available as Django management commands:

```powershell
python manage.py check_database --require-current
python manage.py check_cache
python manage.py check_media_references
python manage.py deployment_preflight
python manage.py deployment_preflight --production
python manage.py warm_media_variants
```

`deployment_preflight` validates Django checks, environment requirements, database schema, cache operations, media storage, database media references, and static asset availability. The production mode is expected to fail on a development machine when production secrets, Redis, HTTPS settings, and trusted origins are absent.

## Verification completed on 6 October 2026

- Django test suite: **99 tests passed**
- Django system checks: no issues
- Migration drift check: no model changes detected
- Python dependency check: no broken requirements
- Front-end test suite: passed JavaScript syntax, consent behavior, SalesIQ/Bigin checks, project filtering, blog/card/service interactions, and feature audits
- Production asset build: passed
- Database schema check: current
- Development cache write/read/delete check: passed
- Media-reference check: 41 database references checked and all files exist
- Development deployment preflight: all seven checks passed
- npm dependency audit: zero vulnerabilities after installing TinyMCE 7.9.3; the registry advisory endpoint was temporarily unavailable during the final repeat, so the successful prior result is the recorded evidence
- Responsive browser audit: 13 routes at 18 viewport widths, totaling **234 cases**, with no hard failures, missing image alternatives, unnamed buttons, or failed interaction checks

The responsive widths were 320, 360, 375, 390, 414, 440, 480, 600, 768, 820, 960, 1024, 1030, 1280, 1366, 1440, 1536, and 1920 pixels.

## Current front-end behavior

The site uses responsive layouts from small phones through full desktop screens. Project and blog lists use database content and scalable card patterns. Project filters and related-content rows support touch and mouse interaction. Service-page card media changes with the active animated item. Blog article pages include responsive hero content, article metadata, author presentation, table of contents, related content, newsletter subscription, and comment UI.

Local font files are used for templates and administrator-created content, so content added through Django admin inherits the same site typography unless custom inline markup overrides it. TinyMCE is self-hosted to avoid a third-party editor runtime dependency.

Images use local/static or media storage and responsive variants where implemented. Required third-party license files remain next to their distributed assets.

## Admin-managed content

The Django admin controls blog content and project/case-study content. The blog editor uses the local TinyMCE distribution. Project detail content, imagery, ordering, categories, related projects, and text remain database-driven; responsive template changes must preserve these model relationships instead of hard-coding one project.

Before replacing production data:

1. Create a database backup and a media archive.
2. Confirm the backup checksums.
3. Run migrations on a staging copy.
4. Verify admin image uploads, blog edits, project edits, and public rendering.

## Security controls

- Debug mode, hosts, trusted origins, TLS redirect, HSTS, cookie security, proxy trust, database, and cache behavior are environment-driven.
- Production checks reject weak or development-oriented configuration.
- Public form throttling uses a shared Redis cache in production.
- Proxy headers are trusted only when explicitly enabled for a correctly configured Nginx boundary.
- Secrets and MySQL backup credentials are kept outside the repository.
- Content Security Policy and consent-aware loaders restrict or defer third-party scripts.
- Required third-party assets are self-hosted where completed, including fonts and TinyMCE.
- Health and readiness endpoints support load-balancer and operational monitoring.

## External integrations and consent

The project includes Zoho SalesIQ, Zoho Bigin contact behavior, Google Analytics support, and the Contact-page map. SalesIQ is configured to remain available independently of optional analytics consent as requested. Analytics and other optional services follow the project's consent loader behavior.

External integrations must be verified against real production accounts and domains. The following work is intentionally held:

- Production SMTP provider configuration
- Self-hosting MapLibre assets for the Contact-page map
- Final production map tile-provider selection and usage limits

The application should continue to handle blocked third-party requests gracefully.

## SEO and content delivery

The project provides canonical routing, metadata, structured blog data, sitemap output, robots rules, RSS, category/tag pages, image alternatives, local author imagery, and nofollow/new-tab behavior for the specified external blog links. Production must use one canonical domain consistently. If the canonical domain changes between apex and `www`, update `SITE_URL`, allowed hosts, trusted origins, Nginx redirects, sitemap/canonical expectations, and search-console properties together.

Nginx should serve versioned static assets with long-lived immutable caching and HTML/dynamic responses with appropriate revalidation. Media caching should reflect whether filenames are immutable. Run `collectstatic` during deployment and confirm manifest-backed files before switching the release.

## Production deployment outline

1. Provision Linux, Nginx, MySQL/MariaDB, Redis, Python, and the application user.
2. Store the production `.env` outside the repository with restricted permissions.
3. Use a dedicated least-privilege database account.
4. Install pinned Python and Node dependencies.
5. Build assets and run `collectstatic`.
6. Run migrations.
7. Run `deployment_preflight --production` and resolve every failure.
8. Start Gunicorn with the example systemd service adapted to the real user and paths.
9. Enable the Nginx site, obtain TLS certificates, and verify redirects.
10. Check `/health/`, `/ready/`, primary routes, admin login, forms, media, blog, sitemap, robots, and integrations.
11. Monitor application, Nginx, database, Redis, and browser logs after release.

The examples in `deploy/` use `/var/www/ecog/current`, `/var/www/ecog/shared`, and a Unix socket under `/run/ecog/`. Adjust them consistently if the host uses different paths.

## Backups and rollback

`scripts/production_backup.py` creates a release-safe backup of the database, media, environment file, and deployment configuration according to `deploy/backup.env.example`. The MySQL password belongs in a root-owned defaults file with mode `600`, not in command history or the repository.

Before every production release:

1. Run the backup script.
2. Confirm archive creation and checksums.
3. Keep the previous application release available.
4. Deploy and run migrations plus preflight checks.
5. If validation fails, restore the previous release and, when required, the matching database/media backup.

A complete restore rehearsal on staging remains recommended before launch and after material schema changes.

## Known limitations and follow-up work

The final responsive audit produced one remaining non-fatal warning at 1030px:

- The home-page project-card description extends approximately 27 pixels beyond its expected card boundary at one animation state.

It did not produce a document-wide hard failure in the automated interaction audit. It should be visually checked again on a 1030px browser before launch.

The former Career-page gallery warning has been resolved. The gallery now uses section-level paint containment, measures the exact offset between its duplicated sets for a seamless loop, preserves animation overshoot rather than snapping, and stops automatic movement under reduced-motion preferences. It was verified at 960, 1024, 1030, 1100, and 1280 pixels without document overflow.

The following production evidence is still required:

- Run the production preflight with the real secret, domain, HTTPS, MySQL, and Redis values.
- Verify SMTP when its provider is configured.
- Submit a real Zoho Bigin test and confirm the record in Zoho.
- Verify SalesIQ and analytics in the production domain and consent states.
- Test Safari and Firefox plus physical Android and iOS devices.
- Run a backup restore rehearsal.
- Load-test the production stack at expected traffic levels.
- Confirm monitoring, log rotation, database retention, and off-server backup retention.

## Documentation policy

This file is the single maintained project-authored Markdown reference. Update it whenever architecture, dependencies, deployment requirements, operational commands, integrations, or known production limitations change. Third-party license and notice files distributed with vendor assets are legal artifacts and must not be removed or merged into this document.
