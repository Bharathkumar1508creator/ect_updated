from pathlib import Path

from django.db import migrations


SLUG = "why-software-development-important-businesses-2026"
HERO_IMAGE = "blog/software-development-business-2026/software-development-business-2026-infographic.webp"
HERO_ALT = (
    "Software development for business infographic showing automation, connected "
    "systems, data, customer service and scalability"
)


def replace_software_guide_images(apps, schema_editor):
    from blog.utils import prepare_article_html

    Blog = apps.get_model("blog", "Blog")
    blog = Blog.objects.filter(slug=SLUG).first()
    if blog is None:
        return

    content_path = (
        Path(__file__).resolve().parents[1]
        / "content"
        / "software-development-business-2026.html"
    )
    blog.article_content = prepare_article_html(content_path.read_text(encoding="utf-8"))
    blog.hero_media_type = "image"
    blog.hero_image = HERO_IMAGE
    blog.hero_image_alt = HERO_ALT
    blog.open_graph_image = HERO_IMAGE
    blog.save(
        update_fields=[
            "article_content",
            "hero_media_type",
            "hero_image",
            "hero_image_alt",
            "open_graph_image",
        ]
    )


class Migration(migrations.Migration):
    dependencies = [("blog", "0012_add_software_guide_images")]
    operations = [migrations.RunPython(replace_software_guide_images, migrations.RunPython.noop)]
