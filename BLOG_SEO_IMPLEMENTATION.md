# ECT Blog SEO Administration Upgrade

## What changed

- Replaced the five fixed paragraph editors with one flexible rich-text article editor.
- Added right-side Paragraph, H2–H6, Image, Internal Link and External Link controls.
- Kept the article title as the only H1.
- Added authenticated image upload with image validation, resizing and WebP conversion.
- Added a searchable internal-link list for ECT pages and published articles.
- Added live H2 TOC preview, SEO checklist, character counters and search preview.
- Added focus and secondary keywords, search intent, social metadata, author details and review fields.
- Added indexing, canonical, sitemap and publication-workflow controls.
- Added Draft → SEO Review → Content Review → Approved → Scheduled → Published statuses.
- Added automatic reading-time calculation, HTML sanitization and H2 IDs.
- Added public sticky H2 table of contents with current-section highlighting and mobile collapse.
- Added BlogPosting JSON-LD, Open Graph, Twitter metadata, canonical URL and robots directives.
- Added XML sitemap and robots.txt endpoints.
- Added old-slug 301 redirects and revision snapshots.
- Added related-article selection with category fallback.
- Added missing-image fallback handling for hero, listing, article and related media.
- Corrected mobile/tablet hero rendering so the complete image is shown without cropping or stretching.
- Corrected article bullet and numbered-list rendering despite the site's global list reset.
- Normalized common internal-link formats before saving and added server-side route/anchor checking.
- Added searchable tag selectors and a reusable editor image library.
- Added browser autosave/restore and a staff-only draft preview.
- Added visible moderated comments, an RSS feed and breadcrumb structured data.
- Added an in-admin field map and publishing guide.
- Configured Ragupathi Namachivayam as the editable default author.
- Removed the four empty legacy blog records while retaining their media files.
- Added a separate Newsletter admin section with activate, deactivate and CSV export actions.
- Connected the footer Newsletter form to the database; it previously showed a simulated success only.
- Removed the obsolete duplicate Home Blog and Category entries from the admin menu.

## Existing content safety

Migration `blog/0005_seo_editor_upgrade.py` copies the old paragraph fields into the new article editor. Migration `blog/0007_single_live_blog_and_author_defaults.py` keeps the completed 2026 website-development guide and removes the obsolete empty blog records. Media files are intentionally retained.

## Local Windows commands

From PowerShell in the project folder:

```powershell
cd C:\Users\nithi\Downloads\solo-zip\work_blog_update
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
$env:DJANGO_USE_SQLITE="True"
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open `http://127.0.0.1:8000/admin/` for administration and `http://127.0.0.1:8000/blog/` for the public blog. Use `/admin/`, not `/blog/admin/`.

## Deployment

1. Back up the production database and media directory.
2. Copy the updated source files over the existing project.
3. Keep the existing production `.env`; add the new values shown in `.env.example`.
4. Set `SITE_URL` to the exact live HTTPS origin, without a trailing slash.
5. Run `python manage.py migrate`.
6. Run `python manage.py collectstatic` for the production static-file setup.
7. Configure the production web server to serve `/static/` from `staticfiles/` and `/media/` from the project `media/` directory. Django serves media automatically only during local development.
8. Restart the Django application.
9. Open the website-development article in admin, run the link checker, preview it and save.
10. Submit `/sitemap.xml` and `/blog/feed.xml` in the appropriate search/feed tools.

Use these production environment values:

```text
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=ecogcoretechnologies.com,www.ecogcoretechnologies.com
SITE_URL=https://ecogcoretechnologies.com
```

## Content rules enforced before direct publishing

- The article body must not be empty.
- The body must contain at least one H2.
- H1 is not allowed inside the body because the title is already H1.
- Every article-body image must have alt text.
- Scheduled articles must have a future publish date.

The SEO percentage is an editorial checklist, not a Google ranking score.
