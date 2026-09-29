"""Idempotent bootstrap for the one required blog article.

Used by blog/migrations/0008_ensure_required_blog.py (so a fresh database
gets the article automatically on `migrate`) and by the
`ensure_required_blog` management command (so it can be re-run safely at
any time, e.g. after connecting to a different database).

Deliberately avoids any blanket ``Blog.objects.exclude(pk=...).delete()``.
The only deletion this module performs is for a legacy stub record whose
content fields are all genuinely empty — see `_delete_empty_legacy_stub`.
"""
import math
from pathlib import Path

from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.text import slugify

from .utils import prepare_article_html

TARGET_SLUG = "website-development-ultimate-guide-for-business"
PREVIOUS_TARGET_SLUG = "website-development-guide-2026"
TARGET_TITLE = "Website Development: The Ultimate Guide for Businesses in 2026"
LEGACY_SLUG = "website-intro"
LEGACY_TITLE = "Why Every Business Needs a Professional Website"

CATEGORY_NAME = "Website"

HERO_IMAGE = "blog/website-development-guide-2026/website-development-guide-cover.webp"
HERO_IMAGE_ALT = (
    "Responsive business website development displayed across desktop, tablet and mobile devices"
)
HERO_DESCRIPTION = (
    "A practical 2026 guide to planning, designing, developing, optimizing, "
    "and launching a modern business website."
)
META_TITLE = "Website Development: Ultimate Guide for Businesses in 2026"
META_DESCRIPTION = (
    "Discover the ultimate guide to website development for businesses in 2026, "
    "including types, features, technologies, SEO, AI, costs, and future trends."
)
PRIMARY_KEYWORD = "website development"
SECONDARY_KEYWORDS = (
    "business website development, website development guide, web development process, "
    "website development cost, responsive business website"
)
CANONICAL_URL = "https://ecogcoretechnologies.com/blog/website-development-ultimate-guide-for-business/"

AUTHOR_NAME = "Ragupathi Namachivayam"
AUTHOR_DESIGNATION = "Founder & Managing Director, ECOG Groups"
AUTHOR_PROFILE_URL = "https://www.ragupathinamachivayam.com/"
AUTHOR_PHOTO = "blog/authors/ragupathi-namachivayam.png"
AUTHOR_BIO = (
    "Rooted in a farming family from a small village in Tamil Nadu, my upbringing "
    "instilled in me honesty, discipline, and a strong work ethic. Over the years, "
    "my professional journey has spanned Mechanical Engineering, manufacturing, "
    "engineering design, sales, leadership, and entrepreneurship.\n\n"
    "Today, as the leader of ECOG Group, my core purpose is to build sustainable "
    "businesses that create opportunities, empower people, and make a lasting, "
    "positive impact on society."
)

TAG_NAMES = (
    "Website Development",
    "Business Website",
    "Web Design",
    "SEO",
    "Digital Transformation",
)

CONTENT_FILE = Path(__file__).resolve().parent / "content" / "website-development-guide-2026.html"


def _article_html():
    return CONTENT_FILE.read_text(encoding="utf-8")


def _blank(value):
    return not str(value or "").strip()


def _content_is_empty(blog):
    fields = (
        "article_content", "paragraph_1", "paragraph_2", "paragraph_3",
        "paragraph_4", "paragraph_5",
    )
    if any(not _blank(getattr(blog, name)) for name in fields):
        return False
    if str(getattr(blog, "hero_image", "") or ""):
        return False
    if str(getattr(blog, "content_image", "") or ""):
        return False
    return True


def _get_or_create_tag(BlogTag, name):
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


def _delete_empty_legacy_stub(Blog, keep_pk):
    """Remove a legacy placeholder article, but only if it is truly empty.

    Never touches the required article, and never deletes a record that has
    any real content — protecting genuine data from accidental loss.
    """
    candidates = list(Blog.objects.exclude(pk=keep_pk).filter(slug=LEGACY_SLUG))
    candidates += list(
        Blog.objects.exclude(pk=keep_pk).filter(title=LEGACY_TITLE).exclude(slug=LEGACY_SLUG)
    )
    for stub in candidates:
        if _content_is_empty(stub):
            stub.delete()


def ensure_required_blog(Blog, BlogCategory, BlogTag):
    """Create or update the required website-development-guide-2026 article.

    Idempotent: safe to call on a fresh database, and safe to call again on
    a database that already has the article (never duplicates, never resets
    an editor's later changes to fields that already have content).
    """
    category, _ = BlogCategory.objects.get_or_create(
        slug="website", defaults={"name": CATEGORY_NAME}
    )

    blog = (
        Blog.objects.filter(slug=TARGET_SLUG).first()
        or Blog.objects.filter(slug=PREVIOUS_TARGET_SLUG).first()
        or Blog.objects.filter(title=TARGET_TITLE).first()
    )
    creating = blog is None
    if creating:
        blog = Blog(slug=TARGET_SLUG, title=TARGET_TITLE)

    if _blank(blog.title):
        blog.title = TARGET_TITLE
    if _blank(blog.slug):
        blog.slug = TARGET_SLUG
    if blog.category_id is None:
        blog.category = category
    if _blank(blog.main_headline):
        blog.main_headline = TARGET_TITLE
    if _blank(blog.hero_description):
        blog.hero_description = HERO_DESCRIPTION
    if _blank(blog.hero_media_type):
        blog.hero_media_type = "image"
    if not str(blog.hero_image or ""):
        blog.hero_image = HERO_IMAGE
    if _blank(blog.hero_image_alt):
        blog.hero_image_alt = HERO_IMAGE_ALT

    if _blank(blog.article_content):
        html = prepare_article_html(_article_html())
        blog.article_content = html
        words = len(strip_tags(html).split())
        blog.reading_time = max(1, math.ceil(words / 220))

    if _blank(blog.meta_title):
        blog.meta_title = META_TITLE
    if _blank(blog.meta_description):
        blog.meta_description = META_DESCRIPTION
    if _blank(blog.primary_keyword):
        blog.primary_keyword = PRIMARY_KEYWORD
    if _blank(blog.secondary_keywords):
        blog.secondary_keywords = SECONDARY_KEYWORDS
    if _blank(blog.search_intent):
        blog.search_intent = "informational"

    # The canonical URL and published status are hard requirements for this
    # specific article, so they are always enforced rather than only
    # backfilled when blank.
    blog.canonical_url = CANONICAL_URL
    blog.status = "published"
    blog.robots_index = True
    blog.robots_follow = True
    blog.include_in_sitemap = True
    if not blog.publish_date:
        blog.publish_date = timezone.now()
    if _blank(blog.open_graph_title):
        blog.open_graph_title = TARGET_TITLE
    if _blank(blog.open_graph_description):
        blog.open_graph_description = META_DESCRIPTION
    if _blank(blog.twitter_title):
        blog.twitter_title = TARGET_TITLE
    if _blank(blog.twitter_description):
        blog.twitter_description = META_DESCRIPTION

    if _blank(blog.author):
        blog.author = AUTHOR_NAME
    if blog.author == AUTHOR_NAME:
        if _blank(blog.author_designation):
            blog.author_designation = AUTHOR_DESIGNATION
        if _blank(blog.author_bio):
            blog.author_bio = AUTHOR_BIO
        if _blank(blog.author_profile_url):
            blog.author_profile_url = AUTHOR_PROFILE_URL
        if not str(blog.author_photo or ""):
            blog.author_photo = AUTHOR_PHOTO

    blog.save()

    tags = [_get_or_create_tag(BlogTag, name) for name in TAG_NAMES]
    existing_tag_ids = set(blog.tags.values_list("id", flat=True))
    blog.tags.add(*[tag for tag in tags if tag.id not in existing_tag_ids])

    _delete_empty_legacy_stub(Blog, keep_pk=blog.pk)

    return blog, creating
