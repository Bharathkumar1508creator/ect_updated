from uuid import uuid4

from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Verify that the configured default cache can write, read and delete a value."

    def handle(self, *args, **options):
        key = f"deployment-check:{uuid4().hex}"
        expected = uuid4().hex
        try:
            cache.set(key, expected, timeout=30)
            actual = cache.get(key)
            cache.delete(key)
        except Exception as exc:
            raise CommandError(f"Default cache is unavailable: {exc}") from exc

        if actual != expected:
            raise CommandError("Default cache failed the write/read verification.")

        self.stdout.write(self.style.SUCCESS("Default cache write/read/delete check passed."))
