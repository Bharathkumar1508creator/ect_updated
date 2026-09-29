from django.db import migrations


AUTHOR_PROFILE_URL = "https://www.ragupathinamachivayam.com/"

ARTICLE_UPDATES = {
    "why-software-development-important-businesses-2026": {
        "hero_image": "blog/software-development-business-2026/software-development-business-2026-hero-v2.webp",
        "hero_image_alt": (
            "Modern business software development workspace with connected cloud, "
            "automation and analytics dashboards"
        ),
    },
    "zoho-consulting-services-for-business": {
        "hero_image": "blog/zoho-consulting-services-business-2026/zoho-consulting-services-2026-hero-v2.webp",
        "hero_image_alt": (
            "Zoho consulting workspace connecting sales, finance, support, projects, "
            "people and analytics"
        ),
    },
}


def refresh_article_heroes(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    for slug, values in ARTICLE_UPDATES.items():
        Blog.objects.filter(slug=slug).update(
            author="Ragupathi Namachivayam",
            author_designation="Founder & Managing Director, ECOG Groups",
            author_profile_url=AUTHOR_PROFILE_URL,
            hero_image=values["hero_image"],
            open_graph_image=values["hero_image"],
            hero_image_alt=values["hero_image_alt"],
        )


class Migration(migrations.Migration):
    dependencies = [("blog", "0014_create_zoho_consulting_guide")]

    operations = [migrations.RunPython(refresh_article_heroes, migrations.RunPython.noop)]
