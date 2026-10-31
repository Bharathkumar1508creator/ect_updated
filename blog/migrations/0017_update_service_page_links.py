import re

from django.db import migrations

# Service pages moved to keyword slugs; rewrite the old internal links stored in articles.
SLUGS = {
    "/website/": "/website-development-services/",
    "/software/": "/custom-software-development/",
    "/zoho/": "/zoho-consulting-services/",
    "/hr/": "/hr-consulting-services/",
    "/digital/": "/digital-marketing-agency/",
    "/it-infrastructure/": "/it-infrastructure-services/",
}
FIELDS = ("article_content", "paragraph_1", "paragraph_2", "paragraph_3", "paragraph_4", "paragraph_5")
PATTERN = re.compile(r'(href=["\'])(' + "|".join(re.escape(old) for old in SLUGS) + r')(?=["\'#?])', re.I)


def _rewrite(value):
    return PATTERN.sub(lambda m: m.group(1) + SLUGS[m.group(2).lower()], value)


def update_links(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    for blog in Blog.objects.all():
        changed = []
        for field in FIELDS:
            value = getattr(blog, field, None)
            if value:
                new = _rewrite(value)
                if new != value:
                    setattr(blog, field, new)
                    changed.append(field)
        if changed:
            # queryset.update skips Blog.save(), so updated_at and the article HTML are left alone
            Blog.objects.filter(pk=blog.pk).update(**{f: getattr(blog, f) for f in changed})


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0016_add_zoho_author_photo"),
    ]

    operations = [
        migrations.RunPython(update_links, migrations.RunPython.noop),
    ]
