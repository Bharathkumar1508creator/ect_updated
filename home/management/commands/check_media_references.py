import re
from pathlib import Path
from urllib.parse import unquote, urlparse

from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db.models import FileField, TextField


class Command(BaseCommand):
    help = "Fail when a database FileField or local /media/ URL references a missing file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--list",
            action="store_true",
            dest="list_references",
            help="Print every normalized media path referenced by the database.",
        )

    def handle(self, *args, **options):
        media_root = Path(settings.MEDIA_ROOT).resolve()
        media_url = settings.MEDIA_URL.rstrip("/") + "/"
        url_pattern = re.compile(
            rf"(?:https?://[^\s\"']+)?{re.escape(media_url)}([^\s\"'<>?#]+)",
            re.IGNORECASE,
        )
        references = set()

        for model in apps.get_models():
            file_fields = [field for field in model._meta.fields if isinstance(field, FileField)]
            text_fields = [field for field in model._meta.fields if isinstance(field, TextField)]
            selected_fields = [field.name for field in (*file_fields, *text_fields)]
            if not selected_fields:
                continue

            for row in model._default_manager.values(*selected_fields).iterator():
                for field in file_fields:
                    value = row.get(field.name)
                    if value:
                        references.add(str(value).replace("\\", "/").lstrip("/"))

                for field in text_fields:
                    value = row.get(field.name) or ""
                    for match in url_pattern.finditer(str(value)):
                        path = unquote(urlparse(match.group(1)).path).lstrip("/")
                        if path:
                            references.add(path)

        missing = []
        unsafe = []
        if options["list_references"]:
            for reference in sorted(references):
                self.stdout.write(reference)
        for reference in sorted(references):
            candidate = (media_root / reference).resolve()
            try:
                candidate.relative_to(media_root)
            except ValueError:
                unsafe.append(reference)
                continue
            if not candidate.is_file():
                missing.append(reference)

        self.stdout.write(f"Checked {len(references)} database media reference(s).")
        if unsafe:
            for reference in unsafe:
                self.stderr.write(self.style.ERROR(f"Unsafe media reference: {reference}"))
        if missing:
            for reference in missing:
                self.stderr.write(self.style.ERROR(f"Missing media file: {reference}"))

        if unsafe or missing:
            raise CommandError(
                f"Media validation failed: {len(missing)} missing, {len(unsafe)} unsafe."
            )

        self.stdout.write(self.style.SUCCESS("All database media references exist."))
