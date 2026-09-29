"""Tests for the database-recovery fix: fresh-install blog bootstrap,
media serving, diagnostics and link preservation.
"""
import io
from importlib import reload
from html.parser import HTMLParser
from urllib.parse import urlparse

import ect.urls as ect_urls
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import clear_url_caches, reverse

from .blog_seed import TARGET_SLUG
from .models import Blog, BlogCategory
from .utils import normalize_article_url


SOFTWARE_GUIDE_SLUG = "why-software-development-important-businesses-2026"
ZOHO_GUIDE_SLUG = "zoho-consulting-services-for-business"


class ArticleLinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.links.append(dict(attrs))


def article_links(blog):
    parser = ArticleLinkParser()
    parser.feed(blog.article_content)
    return parser.links


class RequiredBlogBootstrapTests(TestCase):
    def test_migrations_create_required_blog_on_a_fresh_database(self):
        # The test database is built fresh from migrations for every test
        # run, so this proves migration 0008 creates the article without
        # needing any pre-existing legacy blog row.
        blog = Blog.objects.filter(slug=TARGET_SLUG).first()
        self.assertIsNotNone(blog, "migration 0008 must create the required blog on a fresh DB")
        self.assertEqual(blog.status, "published")
        self.assertTrue(blog.article_content)
        self.assertEqual(
            blog.canonical_url,
            "https://ecogcoretechnologies.com/blog/website-development-ultimate-guide-for-business/",
        )
        self.assertEqual(
            blog.meta_title,
            "Website Development: Ultimate Guide for Businesses in 2026",
        )
        self.assertIn("Professional website design and development", blog.article_content)
        self.assertIn("A successful website is not just a digital address", blog.article_content)
        self.assertEqual(blog.author, "Ragupathi Namachivayam")
        self.assertTrue(blog.hero_image)
        self.assertEqual(blog.tags.count(), 5)
        self.assertEqual(blog.category.slug, "website")

    def test_ensure_required_blog_command_is_idempotent(self):
        call_command("ensure_required_blog")
        call_command("ensure_required_blog")
        self.assertEqual(Blog.objects.filter(slug=TARGET_SLUG).count(), 1)

    def test_command_never_duplicates_even_after_manual_edits(self):
        blog = Blog.objects.get(slug=TARGET_SLUG)
        blog.meta_description = "A custom edit made by an editor."
        blog.save()
        call_command("ensure_required_blog")
        self.assertEqual(Blog.objects.filter(slug=TARGET_SLUG).count(), 1)
        blog.refresh_from_db()
        # Re-running must not clobber an editor's later customization.
        self.assertEqual(blog.meta_description, "A custom edit made by an editor.")
        # But the hard invariants stay correct.
        self.assertEqual(blog.status, "published")

    def test_command_does_not_delete_categories_or_unrelated_blogs(self):
        other = Blog.objects.create(
            title="Some other real article",
            category=BlogCategory.objects.create(name="Other"),
            article_content="<p>Real content that must survive.</p>",
        )
        call_command("ensure_required_blog")
        self.assertTrue(Blog.objects.filter(pk=other.pk).exists())

    def test_diagnose_project_command_runs_and_hides_secrets(self):
        out = io.StringIO()
        call_command("diagnose_project", stdout=out)
        output = out.getvalue()
        self.assertIn(TARGET_SLUG, output)
        self.assertIn("published", output)
        self.assertNotIn("1234", output)  # DB password must never be printed


class RequiredBlogPublicPageTests(TestCase):
    def test_blog_listing_returns_200(self):
        response = self.client.get(reverse("blog:blog_list"))
        self.assertEqual(response.status_code, 200)

    def test_blog_detail_returns_200(self):
        response = self.client.get(f"/blog/{TARGET_SLUG}/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Ragupathi Namachivayam")

    def test_previous_required_blog_slug_redirects_permanently(self):
        response = self.client.get("/blog/website-development-guide-2026/")
        self.assertEqual(response.status_code, 301)
        self.assertEqual(response.url, f"/blog/{TARGET_SLUG}/")

    def test_hero_image_is_served_and_returns_200(self):
        # The test runner forces DEBUG=False, which is when ect/urls.py skips
        # registering the local media-serving route (by design, matching
        # production). Reload it under DEBUG=True to exercise the same route
        # `runserver` uses locally, then restore it exactly as it was.
        blog = Blog.objects.get(slug=TARGET_SLUG)
        with override_settings(DEBUG=True):
            clear_url_caches()
            reload(ect_urls)
            try:
                response = self.client.get(blog.hero_image.url)
            finally:
                clear_url_caches()
                reload(ect_urls)
        self.assertEqual(response.status_code, 200)

    def test_toc_h2_anchor_links_are_present(self):
        blog = Blog.objects.get(slug=TARGET_SLUG)
        self.assertTrue(blog.toc_items, "article must expose H2 headings for the TOC")
        response = self.client.get(f"/blog/{TARGET_SLUG}/")
        first_anchor = blog.toc_items[0]["id"]
        self.assertContains(response, f'href="#{first_anchor}"')

    def test_lists_render_in_article_content(self):
        blog = Blog.objects.get(slug=TARGET_SLUG)
        self.assertTrue("<ul" in blog.article_content or "<ol" in blog.article_content)


class SoftwareDevelopmentGuideTests(TestCase):
    def test_migration_creates_complete_published_software_guide(self):
        blog = Blog.objects.get(slug=SOFTWARE_GUIDE_SLUG)
        self.assertEqual(blog.status, "published")
        self.assertEqual(blog.primary_keyword, "Software Development")
        self.assertEqual(
            blog.meta_title,
            "Software Development in 2026: Benefits for Business Growth",
        )
        self.assertGreater(len(blog.article_content.split()), 3000)
        self.assertIn("How to Measure the ROI of Software Development", blog.article_content)
        self.assertIn("Frequently Asked Questions", blog.article_content)
        self.assertEqual(blog.tags.count(), 5)

    def test_software_guide_has_visual_hero_and_five_contextual_images(self):
        blog = Blog.objects.get(slug=SOFTWARE_GUIDE_SLUG)
        self.assertEqual(
            str(blog.hero_image),
            "blog/software-development-business-2026/software-development-business-2026-hero-v2.webp",
        )
        self.assertEqual(str(blog.open_graph_image), str(blog.hero_image))
        self.assertTrue(blog.hero_image_alt)
        self.assertEqual(blog.author_profile_url, "https://www.ragupathinamachivayam.com/")
        self.assertEqual(blog.article_content.count("<figure>"), 5)
        self.assertEqual(blog.article_content.count('loading="lazy"'), 5)
        self.assertEqual(blog.article_content.count('width="1600" height="900"'), 5)

    def test_software_guide_renders_metadata_toc_and_faq(self):
        response = self.client.get(f"/blog/{SOFTWARE_GUIDE_SLUG}/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "What Is Software Development?")
        self.assertContains(response, "What is software development used for in business?")
        self.assertContains(response, "Software Development in 2026: Benefits for Business Growth")
        self.assertContains(
            response,
            f'https://ecogcoretechnologies.com/blog/{SOFTWARE_GUIDE_SLUG}/',
        )

    @override_settings(SITE_URL="https://www.ecogcoretechnologies.com")
    def test_default_canonical_tracks_a_future_www_domain_change(self):
        response = self.client.get(f"/blog/{SOFTWARE_GUIDE_SLUG}/")
        self.assertContains(
            response,
            f'https://www.ecogcoretechnologies.com/blog/{SOFTWARE_GUIDE_SLUG}/',
        )
        self.assertNotContains(
            response,
            f'href="https://ecogcoretechnologies.com/blog/{SOFTWARE_GUIDE_SLUG}/"',
        )


class ZohoConsultingGuideTests(TestCase):
    def test_migration_creates_complete_published_zoho_guide(self):
        blog = Blog.objects.get(slug=ZOHO_GUIDE_SLUG)
        self.assertEqual(blog.status, "published")
        self.assertEqual(blog.primary_keyword, "Zoho Consulting Services")
        self.assertEqual(
            blog.meta_title,
            "Expert Zoho Consulting Services to Accelerate Growth",
        )
        self.assertGreater(len(blog.article_content.split()), 3000)
        self.assertIn("How to Measure the ROI of Zoho Consulting", blog.article_content)
        self.assertIn("Frequently Asked Questions", blog.article_content)
        self.assertEqual(blog.tags.count(), 5)

    def test_zoho_guide_has_visual_hero_and_five_contextual_infographics(self):
        blog = Blog.objects.get(slug=ZOHO_GUIDE_SLUG)
        self.assertEqual(
            str(blog.hero_image),
            "blog/zoho-consulting-services-business-2026/zoho-consulting-services-2026-hero-v2.webp",
        )
        self.assertEqual(str(blog.open_graph_image), str(blog.hero_image))
        self.assertTrue(blog.hero_image_alt)
        self.assertEqual(blog.author_profile_url, "https://www.ragupathinamachivayam.com/")
        self.assertEqual(blog.article_content.count("<figure>"), 5)
        self.assertEqual(blog.article_content.count('loading="lazy"'), 5)
        self.assertEqual(blog.article_content.count('width="1600" height="900"'), 5)

    def test_zoho_guide_renders_metadata_toc_and_faq_schema(self):
        response = self.client.get(f"/blog/{ZOHO_GUIDE_SLUG}/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "What Is Zoho Consulting?")
        self.assertContains(response, "What are Zoho Consulting Services?")
        self.assertContains(response, '"@type": "FAQPage"', html=False)
        self.assertContains(response, "Expert Zoho Consulting Services to Accelerate Growth")
        self.assertContains(response, 'href="https://www.ragupathinamachivayam.com/"')
        self.assertContains(response, "Founder &amp; Managing Director, ECOG Groups")
        self.assertContains(response, "Updated 29 September 2026")


class PublishedGuideLinkPolicyTests(TestCase):
    def test_required_guides_have_five_internal_and_one_safe_external_link(self):
        for slug in (TARGET_SLUG, SOFTWARE_GUIDE_SLUG, ZOHO_GUIDE_SLUG):
            with self.subTest(slug=slug):
                links = article_links(Blog.objects.get(slug=slug))
                internal = [link for link in links if link.get("href", "").startswith("/")]
                external = [
                    link
                    for link in links
                    if urlparse(link.get("href", "")).scheme in {"http", "https"}
                ]
                self.assertGreaterEqual(len(internal), 5)
                self.assertEqual(len(external), 1)
                self.assertEqual(external[0].get("target"), "_blank")
                rel = set(external[0].get("rel", "").split())
                self.assertTrue({"nofollow", "noopener", "noreferrer"}.issubset(rel))


class InternalLinkPreservationTests(TestCase):
    @override_settings(SITE_URL="https://ecogcoretechnologies.com")
    def test_supported_link_formats_survive_normalization(self):
        cases = {
            "/website/": "/website/",
            "blog/what-is-seo/": "/blog/what-is-seo/",
            "127.0.0.1:8000/website/": "/website/",
            "https://ecogcoretechnologies.com/website/": "/website/",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(normalize_article_url(raw), expected)

    @override_settings(SITE_URL="https://ecogcoretechnologies.com")
    def test_external_links_are_preserved(self):
        self.assertEqual(
            normalize_article_url("https://example.com/resource/"),
            "https://example.com/resource/",
        )

    def test_href_survives_a_full_save_round_trip(self):
        category = BlogCategory.objects.create(name="Link Test")
        blog = Blog.objects.create(
            title="Link preservation check",
            category=category,
            article_content=(
                '<p>See <a href="/website/">our website service</a> and '
                '<a href="blog/what-is-seo/">this guide</a> and '
                '<a href="https://example.com" target="_blank">an external source</a>.</p>'
            ),
        )
        self.assertIn('href="/website/"', blog.article_content)
        self.assertIn('href="/blog/what-is-seo/"', blog.article_content)
        self.assertIn('href="https://example.com"', blog.article_content)
