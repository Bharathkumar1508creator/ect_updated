from django.core.management.base import BaseCommand

from blog.blog_seed import TARGET_SLUG, ensure_required_blog
from blog.models import Blog, BlogCategory, BlogTag


class Command(BaseCommand):
    help = (
        "Create or update the required 'Website Development' blog article "
        f"(slug={TARGET_SLUG}) without ever duplicating it. Safe to run on a "
        "fresh database or repeatedly on an existing one."
    )

    def handle(self, *args, **options):
        blog, created = ensure_required_blog(Blog, BlogCategory, BlogTag)
        verb = "Created" if created else "Verified/updated"
        self.stdout.write(self.style.SUCCESS(
            f"{verb} blog #{blog.pk} '{blog.title}' (slug={blog.slug}, status={blog.status})"
        ))
