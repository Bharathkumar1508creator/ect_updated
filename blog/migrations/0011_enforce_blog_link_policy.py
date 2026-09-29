from pathlib import Path

from django.db import migrations


WEBSITE_SLUG = "website-development-ultimate-guide-for-business"
SOFTWARE_SLUG = "why-software-development-important-businesses-2026"


def enforce_blog_link_policy(apps, schema_editor):
    """Apply the reviewed article sources without changing unrelated posts."""
    from blog.utils import prepare_article_html

    Blog = apps.get_model("blog", "Blog")
    content_dir = Path(__file__).resolve().parents[1] / "content"
    sources = {
        WEBSITE_SLUG: content_dir / "website-development-guide-2026.html",
        SOFTWARE_SLUG: content_dir / "software-development-business-2026.html",
    }
    for slug, source in sources.items():
        blog = Blog.objects.filter(slug=slug).first()
        if blog is None:
            continue
        blog.article_content = prepare_article_html(source.read_text(encoding="utf-8"))
        blog.save(update_fields=["article_content"])


class Migration(migrations.Migration):
    dependencies = [("blog", "0010_create_software_development_guide")]
    operations = [migrations.RunPython(enforce_blog_link_policy, migrations.RunPython.noop)]
