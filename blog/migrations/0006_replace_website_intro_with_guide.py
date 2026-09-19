import math
import re
from pathlib import Path

from django.db import migrations
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.text import slugify


OLD_TITLE = "Why Every Business Needs a Professional Website"
OLD_SLUG = "website-intro"
NEW_TITLE = "Website Development: The Ultimate Guide for Businesses in 2026"
NEW_SLUG = "website-development-guide-2026"
REVISION_MARKER = "website-development-guide-2026-content-migration"


def _article_html():
    content_file = (
        Path(__file__).resolve().parents[1]
        / "content"
        / "website-development-guide-2026.html"
    )
    return content_file.read_text(encoding="utf-8")


def _tag_for_name(BlogTag, name):
    tag = BlogTag.objects.filter(name__iexact=name).first()
    if tag:
        return tag

    base = slugify(name)[:90] or "tag"
    candidate = base
    number = 2
    while BlogTag.objects.filter(slug=candidate).exists():
        candidate = f"{base[:96 - len(str(number))]}-{number}"
        number += 1
    return BlogTag.objects.create(name=name, slug=candidate)


def replace_article(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    BlogTag = apps.get_model("blog", "BlogTag")
    BlogRevision = apps.get_model("blog", "BlogRevision")
    BlogSlugRedirect = apps.get_model("blog", "BlogSlugRedirect")

    blog = (
        Blog.objects.filter(slug=OLD_SLUG).first()
        or Blog.objects.filter(title=OLD_TITLE).first()
        or Blog.objects.filter(slug=NEW_SLUG).first()
    )
    if not blog:
        # Fresh installations do not contain the customer's existing article.
        return

    conflict = Blog.objects.filter(slug=NEW_SLUG).exclude(pk=blog.pk).first()
    if conflict:
        raise RuntimeError(
            f"Cannot replace {OLD_SLUG!r}: another blog already uses {NEW_SLUG!r}."
        )

    snapshot = {
        "migration_marker": REVISION_MARKER,
        "title": blog.title,
        "slug": blog.slug,
        "main_headline": blog.main_headline,
        "hero_description": blog.hero_description,
        "hero_media_type": blog.hero_media_type,
        "hero_image": str(blog.hero_image or ""),
        "hero_image_alt": blog.hero_image_alt,
        "article_content": blog.article_content,
        "content_image": str(blog.content_image or ""),
        "meta_title": blog.meta_title,
        "meta_description": blog.meta_description,
        "primary_keyword": blog.primary_keyword,
        "secondary_keywords": blog.secondary_keywords,
        "meta_keywords": blog.meta_keywords,
        "search_intent": blog.search_intent,
        "canonical_url": blog.canonical_url,
        "robots_index": blog.robots_index,
        "robots_follow": blog.robots_follow,
        "include_in_sitemap": blog.include_in_sitemap,
        "sitemap_priority": str(blog.sitemap_priority),
        "open_graph_title": blog.open_graph_title,
        "open_graph_description": blog.open_graph_description,
        "twitter_title": blog.twitter_title,
        "twitter_description": blog.twitter_description,
        "status": blog.status,
        "reading_time": blog.reading_time,
        "tag_ids": list(blog.tags.values_list("id", flat=True)),
        "related_blog_ids": list(blog.related_blogs.values_list("id", flat=True)),
    }
    BlogRevision.objects.create(blog=blog, snapshot=snapshot)

    html = _article_html()
    reading_time = max(1, math.ceil(len(strip_tags(html).split()) / 220))
    BlogSlugRedirect.objects.update_or_create(old_slug=OLD_SLUG, defaults={"blog": blog})

    updates = {
        "title": NEW_TITLE,
        "slug": NEW_SLUG,
        "main_headline": NEW_TITLE,
        "hero_description": (
            "A practical 2026 guide to planning, designing, developing, optimizing, "
            "and launching a modern business website."
        ),
        "hero_media_type": "image",
        "hero_image": "blog/website-development-guide-2026/website-development-guide-cover.webp",
        "hero_image_alt": (
            "Responsive business website development displayed across desktop, tablet and mobile devices"
        ),
        "article_content": html,
        "content_image": "",
        "reading_time": reading_time,
        "status": "draft",
        "last_reviewed_at": timezone.now(),
        "meta_title": "Website Development Guide for Businesses in 2026 | ECT",
        "meta_description": (
            "Learn the 2026 website development process, technologies, SEO, AI, costs, "
            "mistakes and launch checklist for a modern business website."
        ),
        "primary_keyword": "website development",
        "secondary_keywords": (
            "business website development, website development guide, web development process, "
            "website development cost, responsive business website"
        ),
        "meta_keywords": "",
        "search_intent": "informational",
        "canonical_url": "",
        "robots_index": True,
        "robots_follow": True,
        "include_in_sitemap": True,
        "sitemap_priority": "0.8",
        "open_graph_title": NEW_TITLE,
        "open_graph_description": (
            "Plan and launch a fast, secure, SEO-friendly business website with this practical 2026 guide."
        ),
        "twitter_title": NEW_TITLE,
        "twitter_description": (
            "A practical 2026 guide to business website strategy, technology, SEO, AI and launch."
        ),
    }
    Blog.objects.filter(pk=blog.pk).update(**updates)
    blog.refresh_from_db()

    tag_names = (
        "Website Development",
        "Business Website",
        "Web Design",
        "SEO",
        "Digital Transformation",
    )
    blog.tags.set([_tag_for_name(BlogTag, name) for name in tag_names])

    related = list(
        Blog.objects.exclude(pk=blog.pk)
        .filter(category_id=blog.category_id)
        .order_by("-publish_date")[:3]
    )
    if len(related) < 3:
        present_ids = [item.pk for item in related]
        related.extend(
            Blog.objects.exclude(pk=blog.pk)
            .exclude(pk__in=present_ids)
            .order_by("-publish_date")[: 3 - len(related)]
        )
    blog.related_blogs.set(related)


def restore_article(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    BlogRevision = apps.get_model("blog", "BlogRevision")
    BlogSlugRedirect = apps.get_model("blog", "BlogSlugRedirect")

    blog = Blog.objects.filter(slug=NEW_SLUG).first()
    if not blog:
        return
    revision = BlogRevision.objects.filter(
        blog=blog, snapshot__migration_marker=REVISION_MARKER
    ).order_by("-created_at").first()
    if not revision:
        return

    snapshot = revision.snapshot
    tag_ids = snapshot.pop("tag_ids", [])
    related_ids = snapshot.pop("related_blog_ids", [])
    snapshot.pop("migration_marker", None)
    Blog.objects.filter(pk=blog.pk).update(**snapshot)
    blog.refresh_from_db()
    blog.tags.set(tag_ids)
    blog.related_blogs.set(related_ids)
    BlogSlugRedirect.objects.filter(old_slug=OLD_SLUG, blog=blog).delete()
    revision.delete()


class Migration(migrations.Migration):
    dependencies = [("blog", "0005_seo_editor_upgrade")]

    operations = [migrations.RunPython(replace_article, restore_article)]
