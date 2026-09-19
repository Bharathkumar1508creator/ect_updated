# ECT Website Project Structure

This is a Django project. The existing Django layout is intentionally preserved so static and media paths continue to work.

- `ect/` — project settings, URL routing, ASGI and WSGI entry points
- `home/` — main website app
  - `templates/` — public page templates and reusable components
  - `css/`, `js/`, `img/` — main website static assets
  - `migrations/` — database schema migrations
- `blog/` — blog app, templates and static assets
- `media/` — uploaded media files
- `manage.py` — Django management entry point
- `requirements.txt` — Python dependencies

## Shared tracking integrations

- `home/templates/components/google_tag.html` — Google Analytics 4
- `home/templates/components/zoho_salesiq.html` — Zoho SalesIQ

The Google tag component is included immediately after `<head>` in each public base/page template. The Zoho SalesIQ component is included immediately before `</body>`.

## Static paths

Do not move `home/css`, `home/js`, or `home/img` without updating `STATICFILES_DIRS` and all `{% static %}` references. Keeping these folders in place prevents broken CSS, JavaScript and image URLs.
