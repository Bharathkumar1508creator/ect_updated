from django.db import migrations


class Migration(migrations.Migration):
    initial = True
    dependencies = [("blog", "0005_seo_editor_upgrade")]
    operations = [
        migrations.CreateModel(
            name="Subscriber",
            fields=[],
            options={
                "verbose_name": "Newsletter subscriber",
                "verbose_name_plural": "Newsletter subscribers",
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("blog.newslettersubscriber",),
        )
    ]
