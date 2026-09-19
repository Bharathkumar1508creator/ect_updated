import re
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import connection

from blog.blog_seed import TARGET_SLUG
from blog.models import Blog

HREF_RE = re.compile(r'<a\b[^>]*\bhref=["\']([^"\']*)["\']', re.I)


class Command(BaseCommand):
    help = (
        "Print a safe, read-only diagnostic report of the active database, "
        "media configuration, users and blog content. Never prints passwords, "
        "secret keys or password hashes."
    )

    def handle(self, *args, **options):
        w = self.stdout.write
        style = self.style

        w(style.MIGRATE_HEADING("== Database =="))
        db = settings.DATABASES["default"]
        engine = db["ENGINE"]
        w(f"Engine: {engine}")
        if "sqlite3" in engine:
            path = Path(db["NAME"])
            w(f"SQLite file: {path}")
            w(f"File exists: {path.exists()}")
            if path.exists():
                w(f"File size: {path.stat().st_size} bytes")
        else:
            w(f"Database name: {db.get('NAME')}")
            w(f"Host: {db.get('HOST')}:{db.get('PORT')}")
            w(f"User: {db.get('USER')}")
            w("Password: [hidden]")

        w("")
        w(style.MIGRATE_HEADING("== Migrations =="))
        with connection.cursor() as cursor:
            cursor.execute("SELECT app, name FROM django_migrations ORDER BY app, id")
            rows = cursor.fetchall()
        w(f"Applied migration count: {len(rows)}")
        for app, name in rows:
            if app == "blog":
                w(f"  blog.{name}")

        w("")
        w(style.MIGRATE_HEADING("== Users =="))
        User = get_user_model()
        for user in User.objects.order_by("id").values("username", "is_superuser", "is_staff", "is_active"):
            flags = []
            if user["is_superuser"]:
                flags.append("superuser")
            if user["is_staff"]:
                flags.append("staff")
            if not user["is_active"]:
                flags.append("INACTIVE")
            w(f"  {user['username']} ({', '.join(flags) or 'no special flags'})")
        if not User.objects.exists():
            w(style.WARNING("  No users found."))

        w("")
        w(style.MIGRATE_HEADING("== Blogs =="))
        blogs = list(Blog.objects.order_by("id").values("id", "title", "slug", "status"))
        for row in blogs:
            w(f"  #{row['id']} [{row['status']}] {row['title']!r} (slug={row['slug']})")
        if not blogs:
            w(style.WARNING("  No blog records found."))

        w("")
        w(style.MIGRATE_HEADING("== Required blog =="))
        required = Blog.objects.filter(slug=TARGET_SLUG).first()
        if not required:
            w(style.ERROR(f"  MISSING: no blog with slug={TARGET_SLUG!r}"))
            w("  Run: python manage.py ensure_required_blog")
        else:
            w(f"  Found: #{required.pk}, status={required.status}")
            w(f"  Article content length: {len(required.article_content or '')} characters")
            w(f"  Hero image (DB value): {required.hero_image or '(empty)'}")
            if required.hero_image:
                hero_path = Path(settings.MEDIA_ROOT) / str(required.hero_image)
                w(f"  Hero image file exists: {hero_path.exists()}")
            w(f"  Canonical URL: {required.canonical_url or '(empty)'}")

            html = required.article_content or ""
            hrefs = HREF_RE.findall(html)
            site_host = (settings.SITE_URL or "").split("//")[-1].split("/")[0].lower()
            internal = sum(
                1 for h in hrefs
                if h.startswith("/") or h.startswith("#") or (site_host and site_host in h.lower())
            )
            external = len(hrefs) - internal
            w(f"  Links in article: {len(hrefs)} total, {internal} internal, {external} external")

            img_srcs = re.findall(r'<img\b[^>]*\bsrc=["\']([^"\']*)["\']', html, re.I)
            missing_images = []
            for src in img_srcs:
                media_url = settings.MEDIA_URL
                if src.startswith(media_url):
                    rel = src[len(media_url):].lstrip("/")
                    if not (Path(settings.MEDIA_ROOT) / rel).exists():
                        missing_images.append(src)
            w(f"  Article <img> tags: {len(img_srcs)} total, {len(missing_images)} missing on disk")
            for missing in missing_images:
                w(style.WARNING(f"    missing: {missing}"))

        w("")
        w(style.MIGRATE_HEADING("== Media =="))
        w(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        w(f"MEDIA_URL: {settings.MEDIA_URL}")
        w(f"MEDIA_ROOT exists: {Path(settings.MEDIA_ROOT).exists()}")
