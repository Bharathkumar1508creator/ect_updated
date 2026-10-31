import datetime

from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Project


class StaticViewSitemap(Sitemap):
    """The site's fixed marketing pages — everything that isn't a blog
    post or a project, none of which have a per-object slug."""
    changefreq = "monthly"
    # These pages are plain templates with no updated_at, so bump this date when
    # their content changes (it is the <lastmod> search engines see).
    lastmod_date = datetime.date(2026, 10, 31)

    def items(self):
        return [
            ("index", 1.0),
            ("about", 0.8),
            ("career", 0.7),
            ("contact", 0.8),
            ("website", 0.9),
            ("software", 0.9),
            ("zoho", 0.9),
            ("hr", 0.9),
            ("digital", 0.9),
            ("it_infrastructure", 0.9),
            ("project_list", 0.7),
        ]

    def location(self, item):
        name, _ = item
        return reverse(name)

    def priority(self, item):
        _, priority = item
        return priority

    def lastmod(self, item):
        return self.lastmod_date


class ProjectSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.6

    def items(self):
        return Project.objects.filter(status="published").order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        if obj.category.slug == "digital-marketing":
            return reverse("digital_marketing_detail", args=[obj.slug])
        return reverse("project_detail", args=[obj.slug])
