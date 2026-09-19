from django.contrib.sitemaps import Sitemap

from .models import Blog


class BlogSitemap(Sitemap):
    changefreq = "weekly"

    def items(self):
        return Blog.objects.indexable().order_by("-updated_at")

    def lastmod(self, obj):
        return obj.updated_at

    def priority(self, obj):
        return float(obj.sitemap_priority)
