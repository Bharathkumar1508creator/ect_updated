from django.db import migrations


def ensure_required_blog(apps, schema_editor):
    from blog.blog_seed import ensure_required_blog as _ensure

    Blog = apps.get_model("blog", "Blog")
    BlogCategory = apps.get_model("blog", "BlogCategory")
    BlogTag = apps.get_model("blog", "BlogTag")
    _ensure(Blog, BlogCategory, BlogTag)


class Migration(migrations.Migration):
    dependencies = [("blog", "0007_single_live_blog_and_author_defaults")]

    operations = [migrations.RunPython(ensure_required_blog, migrations.RunPython.noop)]
