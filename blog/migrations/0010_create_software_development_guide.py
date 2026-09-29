import math
from pathlib import Path

from django.db import migrations
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.text import slugify


TITLE = "Why Software Development Is Important for Businesses in 2026: Benefits, Trends & Business Impact"
SLUG = "why-software-development-important-businesses-2026"
META_TITLE = "Software Development in 2026: Benefits for Business Growth"
META_DESCRIPTION = (
    "Discover how software development helps businesses automate processes, "
    "improve efficiency, enhance customer experience, scale faster, and stay competitive."
)
CANONICAL_URL = f"https://ecogcoretechnologies.com/blog/{SLUG}/"


def create_software_guide(apps, schema_editor):
    from blog.utils import prepare_article_html

    Blog = apps.get_model("blog", "Blog")
    BlogCategory = apps.get_model("blog", "BlogCategory")
    BlogTag = apps.get_model("blog", "BlogTag")

    category, _ = BlogCategory.objects.get_or_create(
        slug="software-development",
        defaults={"name": "Software Development"},
    )
    content_path = (
        Path(__file__).resolve().parents[1]
        / "content"
        / "software-development-business-2026.html"
    )
    html = prepare_article_html(content_path.read_text(encoding="utf-8"))

    blog = Blog.objects.filter(slug=SLUG).first()
    if blog is None:
        blog = Blog(slug=SLUG)
    blog.title = TITLE
    blog.category_id = category.pk
    blog.main_headline = TITLE
    blog.hero_description = (
        "A practical guide to using custom software, automation, AI, cloud systems, "
        "integrations, and data to improve business performance in 2026."
    )
    blog.hero_media_type = "image"
    blog.hero_image_alt = (
        "Indian business team using connected custom software, automation, analytics, and cloud systems"
    )
    blog.article_content = html
    blog.reading_time = max(1, math.ceil(len(strip_tags(html).split()) / 220))
    blog.status = "published"
    blog.featured = False
    blog.publish_date = timezone.now()
    blog.meta_title = META_TITLE
    blog.meta_description = META_DESCRIPTION
    blog.primary_keyword = "Software Development"
    blog.secondary_keywords = (
        "custom software development, business software, business automation, "
        "software development benefits, software development trends 2026"
    )
    blog.search_intent = "informational"
    blog.canonical_url = CANONICAL_URL
    blog.robots_index = True
    blog.robots_follow = True
    blog.include_in_sitemap = True
    blog.sitemap_priority = "0.8"
    blog.open_graph_title = TITLE
    blog.open_graph_description = META_DESCRIPTION
    blog.twitter_title = TITLE
    blog.twitter_description = META_DESCRIPTION
    blog.author = "Ragupathi Namachivayam"
    blog.author_designation = "Founder & Managing Director, ECOG Groups"
    blog.last_reviewed_at = timezone.now()
    blog.save()

    for name in (
        "Software Development", "Custom Software", "Business Automation",
        "Artificial Intelligence", "Digital Transformation",
    ):
        tag = BlogTag.objects.filter(name__iexact=name).first()
        if tag is None:
            base = slugify(name)[:90] or "tag"
            candidate = base
            number = 2
            while BlogTag.objects.filter(slug=candidate).exists():
                candidate = f"{base}-{number}"
                number += 1
            tag = BlogTag.objects.create(name=name, slug=candidate)
        blog.tags.add(tag)


class Migration(migrations.Migration):
    dependencies = [("blog", "0009_update_website_development_guide")]
    operations = [migrations.RunPython(create_software_guide, migrations.RunPython.noop)]
