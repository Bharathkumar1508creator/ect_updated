import math
from pathlib import Path

from django.db import migrations
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.text import slugify


TITLE = "Why Businesses Need Zoho Consulting Services in 2026: Benefits, Solutions & Business Impact"
SLUG = "zoho-consulting-services-for-business"
META_TITLE = "Expert Zoho Consulting Services to Accelerate Growth"
META_DESCRIPTION = (
    "Unlock expert Zoho Consulting Services to automate workflows, optimize CRM, "
    "boost productivity, and streamline operations for faster business growth."
)
HERO_IMAGE = "blog/zoho-consulting-services-business-2026/zoho-consulting-services-2026-infographic.webp"


def create_zoho_guide(apps, schema_editor):
    from blog.utils import prepare_article_html

    Blog = apps.get_model("blog", "Blog")
    BlogCategory = apps.get_model("blog", "BlogCategory")
    BlogTag = apps.get_model("blog", "BlogTag")

    category, _ = BlogCategory.objects.get_or_create(
        slug="zoho-consulting",
        defaults={"name": "Zoho Consulting"},
    )
    source = (
        Path(__file__).resolve().parents[1]
        / "content"
        / "zoho-consulting-services-business-2026.html"
    )
    html = prepare_article_html(source.read_text(encoding="utf-8"))

    blog = Blog.objects.filter(slug=SLUG).first() or Blog(slug=SLUG)
    blog.title = TITLE
    blog.category_id = category.pk
    blog.main_headline = TITLE
    blog.hero_description = (
        "A practical guide to Zoho consulting, CRM implementation, customization, "
        "integration, automation, support, and measurable business impact."
    )
    blog.hero_media_type = "image"
    blog.hero_image = HERO_IMAGE
    blog.hero_image_alt = (
        "Zoho consulting services infographic covering process assessment, app selection, "
        "workflow customization, integration, training and support"
    )
    blog.article_content = html
    blog.reading_time = max(1, math.ceil(len(strip_tags(html).split()) / 220))
    blog.status = "published"
    blog.featured = False
    blog.publish_date = timezone.now()
    blog.meta_title = META_TITLE
    blog.meta_description = META_DESCRIPTION
    blog.primary_keyword = "Zoho Consulting Services"
    blog.secondary_keywords = (
        "Zoho consultants, Zoho CRM consulting, Zoho CRM implementation, "
        "Zoho customization, Zoho integration services, Zoho support services"
    )
    blog.search_intent = "commercial"
    # Keep the default canonical dynamic so changing SITE_URL later updates
    # the public canonical host without rewriting this record.
    blog.canonical_url = ""
    blog.robots_index = True
    blog.robots_follow = True
    blog.include_in_sitemap = True
    blog.sitemap_priority = "0.8"
    blog.open_graph_title = TITLE
    blog.open_graph_description = META_DESCRIPTION
    blog.open_graph_image = HERO_IMAGE
    blog.twitter_title = TITLE
    blog.twitter_description = META_DESCRIPTION
    blog.author = "Ragupathi Namachivayam"
    blog.author_designation = "Founder & Managing Director, ECOG Groups"
    blog.last_reviewed_at = timezone.now()
    blog.save()

    for name in (
        "Zoho Consulting",
        "Zoho CRM",
        "CRM Implementation",
        "Workflow Automation",
        "Digital Transformation",
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
    dependencies = [("blog", "0013_replace_software_guide_images")]
    operations = [migrations.RunPython(create_zoho_guide, migrations.RunPython.noop)]
