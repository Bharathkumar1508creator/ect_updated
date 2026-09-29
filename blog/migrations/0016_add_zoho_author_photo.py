from django.db import migrations


ARTICLE_SLUGS = (
    "why-software-development-important-businesses-2026",
    "zoho-consulting-services-for-business",
)
AUTHOR_PHOTO = "blog/authors/ragupathi-namachivayam.png"


def add_zoho_author_photo(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    Blog.objects.filter(slug__in=ARTICLE_SLUGS).update(author_photo=AUTHOR_PHOTO)


class Migration(migrations.Migration):
    dependencies = [("blog", "0015_refresh_software_and_zoho_heroes")]

    operations = [migrations.RunPython(add_zoho_author_photo, migrations.RunPython.noop)]
