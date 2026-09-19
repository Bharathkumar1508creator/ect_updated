from django.db import migrations, models
from django.utils import timezone


TARGET_SLUG = "website-development-guide-2026"


def keep_completed_article(apps, schema_editor):
    Blog = apps.get_model("blog", "Blog")
    target = Blog.objects.filter(slug=TARGET_SLUG).first()
    if not target:
        return

    # The user explicitly approved removing every old no-content article while
    # retaining its media files for future reuse.
    Blog.objects.exclude(pk=target.pk).delete()
    target.related_blogs.clear()

    target.author = "Ragupathi Namachivayam"
    target.author_designation = "Founder & Managing Director, ECOG Groups"
    target.author_bio = (
        "Rooted in a farming family from a small village in Tamil Nadu, my upbringing "
        "instilled in me honesty, discipline, and a strong work ethic. Over the years, "
        "my professional journey has spanned Mechanical Engineering, manufacturing, "
        "engineering design, sales, leadership, and entrepreneurship.\n\n"
        "Today, as the leader of ECOG Group, my core purpose is to build sustainable "
        "businesses that create opportunities, empower people, and make a lasting, "
        "positive impact on society."
    )
    target.author_photo = "blog/authors/ragupathi-namachivayam.png"
    target.author_profile_url = "https://www.ragupathinamachivayam.com/"
    target.canonical_url = "https://ecogcoretechnologies.com/blog/website-development-guide-2026/"
    target.status = "published"
    if not target.publish_date:
        target.publish_date = timezone.now()
    target.open_graph_title = target.open_graph_title or target.title
    target.twitter_title = target.twitter_title or target.open_graph_title
    target.open_graph_description = target.open_graph_description or target.meta_description
    target.twitter_description = target.twitter_description or target.open_graph_description
    target.robots_index = True
    target.robots_follow = True
    target.include_in_sitemap = True
    target.save()


class Migration(migrations.Migration):
    dependencies = [("blog", "0006_replace_website_intro_with_guide")]

    operations = [
        migrations.AddField(
            model_name="blog",
            name="auto_reading_time",
            field=models.BooleanField(
                default=True,
                help_text="Turn this off to enter and keep a custom reading time.",
            ),
        ),
        migrations.AlterField(
            model_name="blog",
            name="author",
            field=models.CharField(default="Ragupathi Namachivayam", max_length=100),
        ),
        migrations.RunPython(keep_completed_article, migrations.RunPython.noop),
    ]
