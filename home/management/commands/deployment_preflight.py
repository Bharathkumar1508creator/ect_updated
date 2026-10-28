import os
import tempfile
from io import StringIO
from pathlib import Path
from urllib.parse import urlsplit

from django.conf import settings
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.storage import staticfiles_storage
from django.core.checks import run_checks
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from home.models import Project


class Command(BaseCommand):
    help = "Run database, cache, media, static-file and security checks before deployment."

    critical_static_assets = (
        "css/base.min.css",
        "js/base.min.js",
        "vendor/tinymce/tinymce.min.js",
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--production",
            action="store_true",
            help="Require production-only environment, security, MySQL, Redis and manifest settings.",
        )

    def handle(self, *args, **options):
        production = options["production"]
        failures = []

        def verify(label, callback):
            try:
                detail = callback()
            except Exception as exc:
                failures.append((label, str(exc)))
                self.stdout.write(self.style.ERROR(f"FAIL  {label}: {exc}"))
            else:
                suffix = f": {detail}" if detail else ""
                self.stdout.write(self.style.SUCCESS(f"PASS  {label}{suffix}"))

        verify("Django checks", lambda: self._check_django(production))
        verify("Environment", lambda: self._check_environment(production))
        verify("Database", self._check_database)
        verify("Our Work content", self._check_our_work_content)
        verify("Cache", self._check_cache)
        verify("Media storage", self._check_media_storage)
        verify("Media references", self._check_media_references)
        verify("Static assets", lambda: self._check_static_assets(production))

        if failures:
            names = ", ".join(label for label, _detail in failures)
            raise CommandError(f"Deployment preflight failed ({len(failures)} check(s)): {names}.")

        mode = "production" if production else "development"
        self.stdout.write(self.style.SUCCESS(f"Deployment preflight passed in {mode} mode."))

    @staticmethod
    def _run_command(name, **options):
        output = StringIO()
        call_command(name, stdout=output, stderr=output, **options)
        return output.getvalue().strip().splitlines()[-1] if output.getvalue().strip() else "ok"

    def _check_django(self, production):
        messages = run_checks(include_deployment_checks=production)
        if messages:
            summary = "; ".join(f"{message.id}: {message.msg}" for message in messages)
            raise CommandError(summary)
        return "system and deployment checks are clean" if production else "system checks are clean"

    def _check_environment(self, production):
        if not production:
            return "production-only validation skipped"

        missing = [
            name
            for name in (
                "DJANGO_SECRET_KEY",
                "DJANGO_ALLOWED_HOSTS",
                "DJANGO_CSRF_TRUSTED_ORIGINS",
                "SITE_URL",
                "DB_NAME",
                "DB_USER",
                "DB_PASSWORD",
                "REDIS_URL",
                "DJANGO_MEDIA_ROOT",
            )
            if not os.environ.get(name, "").strip()
        ]
        if missing:
            raise CommandError("Missing required production variables: " + ", ".join(missing))
        if settings.DEBUG:
            raise CommandError("DJANGO_DEBUG must be False.")
        if settings.DATABASES["default"]["ENGINE"] != "django.db.backends.mysql":
            raise CommandError("Production must use the MySQL backend.")
        if not Path(settings.MEDIA_ROOT).is_absolute():
            raise CommandError("DJANGO_MEDIA_ROOT must be an absolute path to the served media directory.")
        cache_backend = settings.CACHES["default"]["BACKEND"]
        if cache_backend != "django.core.cache.backends.redis.RedisCache":
            raise CommandError("Production must use the shared Redis cache backend.")
        site = urlsplit(settings.SITE_URL)
        if site.scheme != "https" or not site.hostname:
            raise CommandError("SITE_URL must be an absolute HTTPS URL.")
        unsafe_hosts = {"*", "localhost", "127.0.0.1", "[::1]"}
        if not settings.ALLOWED_HOSTS or unsafe_hosts.intersection(settings.ALLOWED_HOSTS):
            raise CommandError("DJANGO_ALLOWED_HOSTS must contain only explicit production hosts.")
        if not all(
            getattr(settings, name, False)
            for name in ("SECURE_SSL_REDIRECT", "SESSION_COOKIE_SECURE", "CSRF_COOKIE_SECURE")
        ):
            raise CommandError("HTTPS redirect and secure session/CSRF cookies must be enabled.")
        return "required variables and production security settings are present"

    def _check_database(self):
        return self._run_command("check_database", require_current=True)

    def _check_our_work_content(self):
        required = {'ecog-products', 'excel-packs', 'ics'}
        published = set(
            Project.objects.filter(slug__in=required, status='published')
            .values_list('slug', flat=True)
        )
        missing = sorted(required - published)
        if missing:
            raise CommandError(
                'Missing published Our Work projects: '
                + ', '.join(missing)
                + '. Run python manage.py migrate before deployment.'
            )
        return 'EcoG Products, Excel Packs, and ICS are published'

    def _check_cache(self):
        return self._run_command("check_cache")

    def _check_media_storage(self):
        media_root = Path(settings.MEDIA_ROOT)
        media_root.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(prefix="ect-preflight-", dir=media_root):
            pass
        return "media directory is writable"

    def _check_media_references(self):
        return self._run_command("check_media_references")

    def _check_static_assets(self, production):
        missing = [asset for asset in self.critical_static_assets if not finders.find(asset)]
        if missing:
            raise CommandError("Missing source static assets: " + ", ".join(missing))
        if production:
            for asset in self.critical_static_assets:
                staticfiles_storage.url(asset)
            return "source assets and production manifest entries are available"
        return "source assets are available; production manifest check skipped"
