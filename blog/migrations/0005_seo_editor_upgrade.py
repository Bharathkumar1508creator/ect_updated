from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def migrate_legacy_content(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    for blog in Blog.objects.filter(article_content=""):
        parts = [
            value for value in (
                blog.paragraph_1,
                blog.paragraph_2,
                blog.paragraph_3,
                blog.paragraph_4,
                blog.paragraph_5,
            ) if value
        ]
        if parts:
            blog.article_content = "\n".join(parts)
            blog.save(update_fields=["article_content"])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("blog", "0004_remove_bloggalleryvideo_blog_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="blog",
            name="article_content",
            field=models.TextField(blank=True, help_text="Main rich-text article body"),
        ),
        migrations.RunPython(migrate_legacy_content, migrations.RunPython.noop),
        migrations.AddField(model_name="blog", name="author_bio", field=models.TextField(blank=True, max_length=600)),
        migrations.AddField(model_name="blog", name="author_designation", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="blog", name="author_photo", field=models.ImageField(blank=True, null=True, upload_to="blog/authors/")),
        migrations.AddField(model_name="blog", name="author_profile_url", field=models.URLField(blank=True)),
        migrations.AddField(model_name="blog", name="editorial_notes", field=models.TextField(blank=True)),
        migrations.AddField(model_name="blog", name="hero_image_alt", field=models.CharField(blank=True, max_length=200)),
        migrations.AddField(model_name="blog", name="include_in_sitemap", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="blog", name="last_edited_by", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="edited_blog_posts", to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name="blog", name="last_reviewed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="blog", name="open_graph_description", field=models.CharField(blank=True, max_length=300)),
        migrations.AddField(model_name="blog", name="open_graph_title", field=models.CharField(blank=True, max_length=150)),
        migrations.AddField(model_name="blog", name="primary_keyword", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="blog", name="related_blogs", field=models.ManyToManyField(blank=True, related_name="recommended_by", to="blog.blog")),
        migrations.AddField(model_name="blog", name="reviewed_by", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="blog", name="robots_follow", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="blog", name="robots_index", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="blog", name="search_intent", field=models.CharField(choices=[("informational", "Informational"), ("commercial", "Commercial"), ("transactional", "Transactional"), ("navigational", "Navigational")], default="informational", max_length=20)),
        migrations.AddField(model_name="blog", name="secondary_keywords", field=models.CharField(blank=True, help_text="Comma-separated supporting keywords", max_length=300)),
        migrations.AddField(model_name="blog", name="sitemap_priority", field=models.DecimalField(decimal_places=1, default=Decimal("0.7"), max_digits=2)),
        migrations.AddField(model_name="blog", name="twitter_description", field=models.CharField(blank=True, max_length=300)),
        migrations.AddField(model_name="blog", name="twitter_title", field=models.CharField(blank=True, max_length=150)),
        migrations.AddField(model_name="blogcategory", name="meta_description", field=models.CharField(blank=True, max_length=160)),
        migrations.AddField(model_name="newslettersubscriber", name="consent_given", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="newslettersubscriber", name="source", field=models.CharField(blank=True, default="Website footer", max_length=120)),
        migrations.AlterField(model_name="blog", name="author", field=models.CharField(default="ECT Editorial Team", max_length=100)),
        migrations.AlterField(model_name="blog", name="meta_keywords", field=models.CharField(blank=True, help_text="Legacy field; retained for existing data. Google does not use it for ranking.", max_length=200)),
        migrations.AlterField(model_name="blog", name="publish_date", field=models.DateTimeField(default=django.utils.timezone.now)),
        migrations.AlterField(model_name="blog", name="reading_time", field=models.PositiveIntegerField(default=1, help_text="Calculated automatically")),
        migrations.AlterField(model_name="blog", name="slug", field=models.SlugField(blank=True, max_length=200, unique=True)),
        migrations.AlterField(model_name="blog", name="status", field=models.CharField(choices=[("draft", "Draft"), ("seo_review", "SEO Review"), ("content_review", "Content Review"), ("approved", "Approved"), ("scheduled", "Scheduled"), ("published", "Published")], default="draft", max_length=20)),
        migrations.AlterField(model_name="blogcategory", name="name", field=models.CharField(max_length=100, unique=True)),
        migrations.AlterField(model_name="blogtag", name="name", field=models.CharField(max_length=100, unique=True)),
        migrations.AlterModelOptions(name="blog", options={"ordering": ("-publish_date",)}),
        migrations.AlterModelOptions(name="blogcategory", options={"ordering": ("name",), "verbose_name_plural": "Blog Categories"}),
        migrations.AlterModelOptions(name="blogtag", options={"ordering": ("name",)}),
        migrations.AlterModelOptions(name="newslettersubscriber", options={"ordering": ("-subscribed_at",)}),
        migrations.CreateModel(
            name="BlogSlugRedirect",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("old_slug", models.SlugField(max_length=200, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("blog", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="old_slugs", to="blog.blog")),
            ],
        ),
        migrations.CreateModel(
            name="BlogRevision",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("snapshot", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("blog", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="revisions", to="blog.blog")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="BlogImageAsset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="blog/editor/%Y/%m/")),
                ("original_filename", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("-created_at",)},
        ),
    ]
