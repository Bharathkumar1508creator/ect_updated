import math

from django.db import migrations
from django.utils.html import strip_tags


NEW_SLUG = "website-development-ultimate-guide-for-business"
OLD_SLUG = "website-development-guide-2026"
TITLE = "Website Development: The Ultimate Guide for Businesses in 2026"
META_TITLE = "Website Development: Ultimate Guide for Businesses in 2026"
META_DESCRIPTION = (
    "Discover the ultimate guide to website development for businesses in 2026, "
    "including types, features, technologies, SEO, AI, costs, and future trends."
)
CANONICAL_URL = (
    "https://ecogcoretechnologies.com/blog/"
    "website-development-ultimate-guide-for-business/"
)


def update_guide(apps, schema_editor):
    from blog.blog_seed import _article_html
    from blog.utils import prepare_article_html

    Blog = apps.get_model("blog", "Blog")
    BlogSlugRedirect = apps.get_model("blog", "BlogSlugRedirect")
    blog = (
        Blog.objects.filter(slug=NEW_SLUG).first()
        or Blog.objects.filter(slug=OLD_SLUG).first()
        or Blog.objects.filter(title=TITLE).first()
    )
    if not blog:
        return

    html = prepare_article_html(_article_html())
    blog.slug = NEW_SLUG
    blog.title = TITLE
    blog.main_headline = TITLE
    blog.article_content = html
    blog.meta_title = META_TITLE
    blog.meta_description = META_DESCRIPTION
    blog.canonical_url = CANONICAL_URL
    blog.open_graph_title = TITLE
    blog.open_graph_description = META_DESCRIPTION
    blog.twitter_title = TITLE
    blog.twitter_description = META_DESCRIPTION
    blog.reading_time = max(1, math.ceil(len(strip_tags(html).split()) / 220))
    blog.status = "published"
    blog.save()
    BlogSlugRedirect.objects.update_or_create(
        old_slug=OLD_SLUG,
        defaults={"blog_id": blog.pk},
    )


class Migration(migrations.Migration):
    dependencies = [("blog", "0008_ensure_required_blog")]
    operations = [migrations.RunPython(update_guide, migrations.RunPython.noop)]
