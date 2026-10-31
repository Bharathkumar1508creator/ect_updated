from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch
import io
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from newsletter.models import Subscriber

from .migration_guards import block_unreviewed_destructive_blog_migration
from .models import Blog, BlogCategory, BlogSlugRedirect, BlogTag, NewsletterSubscriber
from .utils import extract_faq_items, extract_toc, normalize_article_url, prepare_article_html


class ArticleHtmlTests(TestCase):
    def test_sanitizes_scripts_adds_unique_toc_ids_and_secures_external_links(self):
        result = prepare_article_html(
            '<script>alert(1)</script><h2>SEO Guide</h2><h2>SEO Guide</h2>'
            '<a href="https://example.com" target="_blank">Source</a>'
        )
        self.assertNotIn("script", result)
        self.assertIn('id="seo-guide"', result)
        self.assertIn('id="seo-guide-2"', result)
        self.assertIn('rel="noopener noreferrer"', result)

    def test_numbered_heading_ids_are_safe_css_targets(self):
        result = prepare_article_html("<h2>7 Ways Software Helps</h2>")
        self.assertIn('id="section-7-ways-software-helps"', result)

    def test_nested_apostrophe_entity_is_decoded_in_heading_and_toc(self):
        source = (
            '<h2 id="why-zoho-alone-isnx27t-enough">'
            "Why Zoho Alone Isn&amp;#x27;t Enough"
            "</h2>"
        )
        result = prepare_article_html(source)
        self.assertIn('id="why-zoho-alone-isnt-enough"', result)
        self.assertEqual(
            extract_toc(result),
            [{"id": "why-zoho-alone-isnt-enough", "text": "Why Zoho Alone Isn't Enough"}],
        )

    def test_extracts_faq_questions_and_answers_for_structured_data(self):
        html = prepare_article_html(
            "<h2>Frequently Asked Questions</h2>"
            "<h3>1. What is Zoho consulting?</h3>"
            "<p>It aligns Zoho applications with business requirements.</p>"
        )
        self.assertEqual(
            extract_faq_items(html),
            [{
                "question": "What is Zoho consulting?",
                "answer": "It aligns Zoho applications with business requirements.",
            }],
        )

    @override_settings(SITE_URL="https://ecogcoretechnologies.com")
    def test_normalizes_supported_internal_link_formats(self):
        self.assertEqual(normalize_article_url("blog/what-is-seo/"), "/blog/what-is-seo/")
        self.assertEqual(normalize_article_url("127.0.0.1:8000/website-development-services/"), "/website-development-services/")
        self.assertEqual(
            normalize_article_url("https://ecogcoretechnologies.com/custom-software-development/"),
            "/custom-software-development/",
        )
        self.assertEqual(normalize_article_url("javascript:alert(1)"), "")


class BlogSeoTests(TestCase):
    def setUp(self):
        # "Website" already exists once migration 0008 seeds the required
        # article's category on a fresh database, so reuse it instead of
        # assuming an empty BlogCategory table.
        self.category, _ = BlogCategory.objects.get_or_create(name="Website")

    def make_blog(self, **overrides):
        values = {
            "title": "SEO Friendly Website Guide",
            "category": self.category,
            "hero_description": "A useful guide to SEO friendly websites.",
            "article_content": '<p>Introduction.</p><h2>Technical SEO</h2><p><a href="/website-development-services/">Website service</a></p>',
            "primary_keyword": "SEO Friendly Website",
            "status": Blog.Status.PUBLISHED,
        }
        values.update(overrides)
        return Blog.objects.create(**values)

    def test_model_prepares_content_and_calculates_metadata(self):
        blog = self.make_blog()
        self.assertIn('id="technical-seo"', blog.article_content)
        self.assertEqual(blog.meta_title, blog.title)
        self.assertGreaterEqual(blog.reading_time, 1)
        self.assertTrue(blog.toc_items)

    @override_settings(
        SITE_URL="https://ecogcoretechnologies.com",
        BLOG_DEFAULT_AUTHOR_NAME="Ragupathi Namachivayam",
        BLOG_DEFAULT_AUTHOR_DESIGNATION="Founder & Managing Director, ECOG Groups",
        BLOG_DEFAULT_AUTHOR_PROFILE_URL="https://www.ragupathinamachivayam.com/",
        BLOG_DEFAULT_AUTHOR_PHOTO="blog/authors/ragupathi-namachivayam.png",
        BLOG_DEFAULT_AUTHOR_BIO="Biography",
    )
    def test_automatic_author_canonical_and_social_metadata_remain_editable(self):
        blog = self.make_blog(author="", canonical_url="", open_graph_title="", twitter_title="")
        self.assertEqual(blog.author, "Ragupathi Namachivayam")
        self.assertEqual(blog.author_designation, "Founder & Managing Director, ECOG Groups")
        self.assertEqual(blog.canonical_url, f"https://ecogcoretechnologies.com{blog.get_absolute_url()}")
        self.assertEqual(blog.open_graph_title, blog.meta_title)
        self.assertEqual(blog.twitter_title, blog.open_graph_title)

    def test_detail_outputs_meta_schema_and_server_rendered_toc(self):
        blog = self.make_blog()
        response = self.client.get(blog.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<link rel="canonical"', html=False)
        self.assertContains(response, 'application/ld+json')
        self.assertContains(response, 'href="#technical-seo"', html=False)
        self.assertContains(response, "SEO Friendly Website Guide")
        self.assertContains(response, "responsive5")
        self.assertContains(response, "?v=7")
        content = response.content.decode()
        self.assertLess(content.index('class="blog-hero"'), content.index('class="blog-detail-header"'))
        self.assertLess(content.index('class="blog-hero"'), content.index('class="blog-article-layout'))
        self.assertLess(content.index('class="blog-newsletter-section"'), content.index('class="blog-comments"'))

    def test_scheduled_publication_visibility(self):
        future = self.make_blog(
            title="Future Post",
            slug="future-post",
            status=Blog.Status.SCHEDULED,
            publish_date=timezone.now() + timedelta(days=1),
        )
        self.assertFalse(Blog.objects.publicly_visible().filter(pk=future.pk).exists())
        past = self.make_blog(
            title="Ready Scheduled Post",
            slug="ready-scheduled-post",
            status=Blog.Status.SCHEDULED,
            publish_date=timezone.now() - timedelta(minutes=1),
        )
        self.assertTrue(Blog.objects.publicly_visible().filter(pk=past.pk).exists())

    def test_old_slug_redirects_permanently(self):
        blog = self.make_blog(slug="new-address")
        BlogSlugRedirect.objects.create(blog=blog, old_slug="old-address")
        response = self.client.get("/blog/old-address/")
        self.assertEqual(response.status_code, 301)
        self.assertEqual(response.url, blog.get_absolute_url())

    def test_sitemap_excludes_noindex_articles(self):
        included = self.make_blog(slug="included")
        self.make_blog(title="Hidden", slug="hidden", robots_index=False)
        response = self.client.get("/sitemap.xml")
        self.assertContains(response, included.get_absolute_url())
        self.assertNotContains(response, "/blog/hidden/")

    def test_listing_hides_categories_without_visible_articles(self):
        blog = self.make_blog()
        empty = BlogCategory.objects.create(name="Empty Category")
        response = self.client.get(reverse("blog:blog_list"))
        self.assertContains(response, blog.category.name)
        self.assertNotContains(response, empty.name)

    def test_category_listing_uses_nine_article_load_more_batches(self):
        scalable_category = BlogCategory.objects.create(name="Scalable Insights")
        articles = [
            self.make_blog(
                title=f"Scalable insight {index}",
                category=scalable_category,
                publish_date=timezone.now() - timedelta(minutes=index),
            )
            for index in range(12)
        ]
        url = reverse("blog:blog_list_category", args=[scalable_category.slug])

        first = self.client.get(url)
        self.assertEqual(first.status_code, 200)
        self.assertContains(first, 'class="card"', count=9)
        self.assertContains(first, "Load More Articles")
        self.assertContains(first, "data-blog-grid")
        self.assertContains(first, "data-blog-visible-count>9</strong>")
        self.assertContains(first, "data-blog-total>12</strong>")
        self.assertNotContains(first, 'class="pagination"')
        self.assertContains(first, "responsive1")

        second = self.client.get(
            url,
            {"page": 2},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )
        self.assertEqual(second.status_code, 200)
        self.assertContains(second, 'class="card"', count=3)
        self.assertNotContains(second, "data-blog-load-more")
        for article in articles[:3]:
            self.assertContains(first, article.title)

    def test_related_articles_use_fallback_image(self):
        blog = self.make_blog()
        related = self.make_blog(title="Related without media", slug="related-without-media")
        blog.related_blogs.add(related)
        response = self.client.get(blog.get_absolute_url())
        self.assertContains(response, "Related without media")
        self.assertContains(response, "data-fallback-src")

    def test_rss_feed_contains_published_article(self):
        blog = self.make_blog()
        response = self.client.get(reverse("blog:blog_feed"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, blog.title)


class NewsletterTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_footer_subscription_is_stored_and_duplicates_are_safe(self):
        url = reverse("blog:subscribe_newsletter")
        response = self.client.post(
            url,
            {"email": "Reader@Example.com", "source": "Website footer"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)
        self.assertEqual(NewsletterSubscriber.objects.get().email, "reader@example.com")
        self.client.post(
            url,
            {"email": "reader@example.com"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_newsletter_proxy_has_separate_admin_app(self):
        self.assertEqual(Subscriber._meta.app_label, "newsletter")

    def test_invalid_email_is_rejected(self):
        response = self.client.post(
            reverse("blog:subscribe_newsletter"),
            {"email": "not-an-email"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(NewsletterSubscriber.objects.exists())

    @override_settings(PUBLIC_FORM_RATE_LIMIT=2, PUBLIC_FORM_RATE_WINDOW=60)
    def test_subscription_rate_limit_returns_429(self):
        url = reverse("blog:subscribe_newsletter")
        for email in ("one@example.com", "two@example.com"):
            response = self.client.post(
                url,
                {"email": email},
                HTTP_X_REQUESTED_WITH="XMLHttpRequest",
                REMOTE_ADDR="192.0.2.10",
            )
            self.assertEqual(response.status_code, 200)
        response = self.client.post(
            url,
            {"email": "three@example.com"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
            REMOTE_ADDR="192.0.2.10",
        )
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["Retry-After"], "60")
        self.assertEqual(NewsletterSubscriber.objects.count(), 2)


class MigrationSafetyTests(TestCase):
    def test_destructive_migration_is_blocked_when_articles_exist(self):
        category, _ = BlogCategory.objects.get_or_create(name="Migration guard")
        Blog.objects.create(
            title="Second preserved article",
            category=category,
            article_content="<h2>Keep</h2><p>Keep this article.</p>",
            status=Blog.Status.DRAFT,
        )
        with patch(
            "blog.migration_guards.MigrationRecorder.applied_migrations",
            return_value=set(),
        ):
            with self.assertRaisesMessage(RuntimeError, "historical delete operation"):
                block_unreviewed_destructive_blog_migration(
                    sender=None,
                    app_config=SimpleNamespace(label="blog"),
                    using=connection.alias,
                )


class BlogAdminTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="editor", email="editor@example.com", password="test-password"
        )
        self.client.force_login(self.user)

    def test_add_page_contains_custom_block_editor_and_seo_sidebar(self):
        response = self.client.get(reverse("admin:blog_blog_add"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Paragraph +")
        self.assertContains(response, "Live TOC preview")
        self.assertContains(response, "Live SEO check")
        self.assertContains(response, "Open admin guide")
        self.assertContains(response, "/static/vendor/tinymce/tinymce.min")
        self.assertNotContains(response, "cdnjs.cloudflare.com/ajax/libs/tinymce")

    def test_preview_requires_staff_and_renders_draft(self):
        category = BlogCategory.objects.create(name="Preview")
        blog = Blog.objects.create(
            title="Draft preview",
            category=category,
            status=Blog.Status.DRAFT,
            article_content="<h2>Preview section</h2><p>Draft body.</p>",
        )
        response = self.client.get(reverse("blog:blog_preview", kwargs={"pk": blog.pk}))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Draft preview — only logged-in staff")

    def test_server_link_checker_validates_internal_routes(self):
        response = self.client.post(
            reverse("admin:blog_blog_validate_links"),
            {"html": '<a href="/website-development-services/">Website</a><a href="/missing-page/">Missing</a>'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["invalid_count"], 1)

    def test_tag_autocomplete_endpoint_finds_existing_tags(self):
        # Migration 0008 already seeds this tag on a fresh database.
        BlogTag.objects.get_or_create(name="Website Development")
        response = self.client.get(
            reverse("admin:autocomplete"),
            {"app_label": "blog", "model_name": "blog", "field_name": "tags", "term": "website"},
        )
        self.assertEqual(response.status_code, 200)
        result_texts = [item["text"] for item in response.json()["results"]]
        self.assertIn("Website Development", result_texts)

    def test_editor_image_upload_is_optimized_to_webp(self):
        from PIL import Image

        raw = io.BytesIO()
        Image.new("RGB", (40, 40), "green").save(raw, format="PNG")
        upload = SimpleUploadedFile("example.png", raw.getvalue(), content_type="image/png")
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            response = self.client.post(reverse("admin:blog_blog_upload_image"), {"file": upload})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["location"].endswith(".webp"))
