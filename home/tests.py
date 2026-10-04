import io
import re
import tempfile
from pathlib import Path

from PIL import Image
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.storage import staticfiles_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase, override_settings
from django.urls import reverse

from .image_utils import optimize_uploaded_image
from .models import Career, ContactMessage, JobApplication, Project, ProjectCategory, Testimonial
from .templatetags.content_security import sanitized_rich_html
from .templatetags.project_media import extract_youtube_id, project_preview_url, youtube_embed_url
from our_work.models import WebsiteProject


class HomeTestimonialsVisibilityTests(TestCase):
    def test_demo_testimonials_section_is_not_rendered(self):
        Testimonial.objects.create(
            name="Demo Client",
            company="Demo Company",
            message="Demo testimonial that must remain hidden.",
            is_active=True,
        )

        response = self.client.get(reverse("index"))

        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "ECT Clients")
        self.assertNotContains(response, "Partnerships That Drive Growth")
        self.assertNotContains(response, "Demo testimonial that must remain hidden.")
        self.assertNotContains(response, 'id="clients-data"')


class HomeInsightsTests(TestCase):
    def test_homepage_keeps_insights_compact_and_cards_clickable(self):
        response = self.client.get(reverse("index"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context["latest_blogs"]), 3)
        self.assertContains(response, 'class="insight-card"', count=3)
        self.assertContains(response, 'data-insight-index=', count=3)
        self.assertContains(response, "View All Articles")
        self.assertContains(response, reverse("blog:blog_list"))
        self.assertContains(response, "home-insights.min.")
        self.assertContains(response, "insights-carousel.min.")


class ExternalFormOnlyTests(TestCase):
    def test_contact_page_keeps_bigin_and_rejects_local_posts(self):
        archived = ContactMessage.objects.create(
            name="Existing customer",
            email="existing@example.com",
            message="Preserve this record",
        )
        before = ContactMessage.objects.count()

        page = self.client.get(reverse("contact"))
        self.assertEqual(page.status_code, 200)
        self.assertContains(page, "BiginWebToRecordForm")

        response = self.client.post(
            reverse("contact"),
            {"name": "New", "email": "new@example.com", "message": "Do not store"},
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.headers["Allow"], "GET")
        self.assertEqual(ContactMessage.objects.count(), before)
        archived.refresh_from_db()
        self.assertEqual(archived.message, "Preserve this record")

    def test_career_page_keeps_recruit_link_and_rejects_resume_posts(self):
        career = Career.objects.create(
            title="Historical opening",
            description="Preserved",
            requirements="Preserved",
        )
        response = self.client.get(reverse("career"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "https://ecogproducts.zohorecruit.in/jobs/Careers")

        response = self.client.post(
            reverse("career"),
            {
                "career_id": career.pk,
                "name": "Applicant",
                "email": "applicant@example.com",
                "phone": "1234567890",
                "resume": SimpleUploadedFile("resume.txt", b"resume"),
            },
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.headers["Allow"], "GET")
        self.assertFalse(JobApplication.objects.exists())
        self.assertTrue(Career.objects.filter(pk=career.pk).exists())


class ArchivedAdminTests(TestCase):
    def setUp(self):
        self.request = RequestFactory().get("/admin/")
        self.request.user = get_user_model().objects.create_superuser(
            username="archive-reviewer",
            email="archive@example.com",
            password="test-password",
        )

    def test_historical_models_are_read_only(self):
        for model in (ContactMessage, Career, JobApplication):
            model_admin = admin.site._registry[model]
            self.assertFalse(model_admin.has_add_permission(self.request))
            self.assertFalse(model_admin.has_change_permission(self.request))
            self.assertFalse(model_admin.has_delete_permission(self.request))


class ImageUploadOptimizationTests(TestCase):
    def test_new_project_upload_is_resized_and_converted_to_webp(self):
        source = io.BytesIO()
        Image.new("RGB", (2400, 1200), "#0c3c01").save(source, format="PNG")
        uploaded = SimpleUploadedFile(
            "project-hero.png", source.getvalue(), content_type="image/png"
        )

        optimized = optimize_uploaded_image(uploaded, max_size=(1200, 1200))

        self.assertTrue(optimized.name.endswith(".webp"))
        with Image.open(optimized) as image:
            self.assertEqual(image.format, "WEBP")
            self.assertEqual(image.size, (1200, 600))

    def test_existing_project_media_uses_cached_variant_without_rewriting_original(self):
        source = io.BytesIO()
        Image.new("RGB", (1600, 1000), "#a2ac82").save(source, format="PNG")
        with tempfile.TemporaryDirectory() as media_root, self.settings(MEDIA_ROOT=media_root):
            category = ProjectCategory.objects.create(
                name="Variant test", slug="variant-test", status="published"
            )
            project = Project.objects.create(
                category=category,
                title="Variant project",
                slug="variant-project",
                status="published",
                hero_media_type="image",
                hero_image=SimpleUploadedFile(
                    "original.png", source.getvalue(), content_type="image/png"
                ),
            )
            original_path = Path(project.hero_image.path)
            original_bytes = original_path.read_bytes()

            preview_url = project_preview_url(project)

            self.assertIn("/media/.optimized/project-cards/", preview_url)
            self.assertEqual(original_path.read_bytes(), original_bytes)
            cached = list(Path(media_root, ".optimized", "project-cards").glob("*.webp"))
            self.assertEqual(len(cached), 1)
            with Image.open(cached[0]) as image:
                self.assertLessEqual(image.width, 960)
                self.assertEqual(image.format, "WEBP")


class SecurityBoundaryTests(TestCase):
    def test_source_files_are_not_static_assets(self):
        self.assertIsNone(finders.find("models.py"))
        self.assertIsNone(finders.find("templates/contact.html"))
        self.assertIsNone(finders.find("migrations/0001_initial.py"))
        self.assertTrue(finders.find("css/base.css"))
        self.assertTrue(finders.find("css/base.min.css"))
        self.assertTrue(finders.find("js/base.js"))
        self.assertTrue(finders.find("js/base.min.js"))
        self.assertTrue(finders.find("js/deferred-media.min.js"))

    def test_security_headers_are_present(self):
        response = self.client.get(reverse("index"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("camera=()", response.headers["Permissions-Policy"])
        csp = response.headers["Content-Security-Policy-Report-Only"]
        self.assertIn("object-src 'none'", csp)
        for salesiq_source in (
            "https://static.zohocdn.com",
            "wss://vts.zohopublic.in",
            "https://cdnjs.cloudflare.com",
            "worker-src 'self' blob:",
        ):
            self.assertIn(salesiq_source, csp)

    def test_analytics_requires_consent_while_salesiq_remains_available(self):
        response = self.client.get(reverse("index"))
        html = response.content.decode()
        self.assertIn('id="ectConsent"', html)
        self.assertIn(staticfiles_storage.url("js/third-party-loader.min.js"), html)
        self.assertNotIn('<script async src="https://www.googletagmanager.com', html)
        self.assertIn("salesIqUrl", html)
        self.assertIn("Zoho live chat remains available", html)
        self.assertIn("id='wf_script' data-src='https://bigin.zoho.in", html)

    def test_project_rich_text_removes_executable_markup(self):
        rendered = str(
            sanitized_rich_html(
                '<p onclick="alert(1)">Safe</p><script>alert(2)</script>'
                '<a href="javascript:alert(3)">Link</a>'
            )
        )
        self.assertIn("<p>Safe</p>", rendered)
        self.assertNotIn("onclick", rendered)
        self.assertNotIn("script", rendered)
        self.assertNotIn("javascript:", rendered)


class ProjectFunctionalityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.general_category = ProjectCategory.objects.create(
            name="Software",
            slug="software-projects",
            status="published",
        )
        cls.digital_category = ProjectCategory.objects.create(
            name="Digital Marketing",
            slug="digital-marketing",
            status="published",
        )

    def test_youtube_parser_supports_common_urls_and_rejects_other_hosts(self):
        video_id = "dQw4w9WgXcQ"
        urls = (
            video_id,
            f"https://www.youtube.com/watch?v={video_id}&feature=share",
            f"https://youtu.be/{video_id}?t=4",
            f"https://www.youtube.com/embed/{video_id}",
            f"https://www.youtube.com/shorts/{video_id}?feature=share",
            f"https://www.youtube-nocookie.com/embed/{video_id}",
        )
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(extract_youtube_id(url), video_id)
        self.assertEqual(extract_youtube_id(f"https://example.com/watch?v={video_id}"), "")
        self.assertEqual(
            youtube_embed_url(urls[1]),
            f"https://www.youtube-nocookie.com/embed/{video_id}",
        )

    def test_project_list_handles_missing_media_and_loads_shared_behavior(self):
        Project.objects.create(
            category=self.general_category,
            title="No image project",
            slug="no-image-project",
            status="published",
            hero_media_type="image",
        )
        response = self.client.get(reverse("project_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Media unavailable")
        self.assertContains(response, staticfiles_storage.url("js/base.js"))
        self.assertContains(response, staticfiles_storage.url("js/project-media.js"))
        self.assertContains(response, staticfiles_storage.url("js/project-list.js"))
        self.assertContains(response, 'data-project-listing')
        self.assertContains(response, 'aria-controls="projectResults"')
        self.assertContains(response, f'{staticfiles_storage.url("css/projects.css")}?v=9')
        self.assertContains(response, 'id="projectFilterLabel"')
        self.assertContains(response, 'class="category-filter-scroll"')
        self.assertContains(response, 'aria-labelledby="projectFilterLabel"')
        self.assertContains(response, 'class="btn-notch ect-micro-btn"')
        self.assertContains(response, 'id="ectContactPopup"')
        self.assertContains(response, "ECOG CORE TECHNOLOGIES")

    def test_project_list_uses_filtered_load_more_batches(self):
        for index in range(12):
            Project.objects.create(
                category=self.general_category,
                title=f"Scalable project {index + 1}",
                slug=f"scalable-project-{index + 1}",
                status="published",
                display_order=index,
            )

        first = self.client.get(
            reverse("project_list"),
            {"category": self.general_category.slug},
        )
        self.assertEqual(first.status_code, 200)
        self.assertContains(first, 'class="project-card"', count=9)
        self.assertContains(first, "Load More")
        self.assertContains(first, "Showing <strong data-project-visible-count>9</strong>")
        self.assertContains(first, "data-project-total>12</strong>")
        self.assertContains(first, "category=software-projects")
        self.assertNotContains(first, 'class="pagination')

        second = self.client.get(
            reverse("project_list"),
            {"category": self.general_category.slug, "page": 2},
        )
        self.assertEqual(second.status_code, 200)
        self.assertContains(second, 'class="project-card"', count=3)
        self.assertNotContains(second, "data-load-more")

    def test_project_filters_show_only_categories_with_published_projects(self):
        empty = ProjectCategory.objects.create(
            name="Future Empty Category",
            slug="future-empty-category",
            status="published",
        )
        Project.objects.create(
            category=self.general_category,
            title="Visible category project",
            slug="visible-category-project",
            status="published",
        )

        response = self.client.get(reverse("project_list"))

        self.assertContains(response, self.general_category.name)
        self.assertNotContains(response, empty.name)

    def test_project_detail_builds_absolute_open_graph_image(self):
        project = Project.objects.create(
            category=self.general_category,
            title="Project with image",
            slug="project-with-image",
            status="published",
            hero_media_type="image",
            hero_image="projects/hero/images/project.jpg",
        )
        response = self.client.get(reverse("project_detail", args=[project.slug]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            'content="http://testserver/media/projects/hero/images/project.jpg"',
            html=False,
        )
        self.assertNotContains(
            response,
            f"http://testserver{reverse('project_detail', args=[project.slug])}/media/",
        )

    def test_website_case_study_renders_semantic_sections_and_admin_content(self):
        project = Project.objects.create(
            category=self.general_category,
            title="Structured case study",
            slug="structured-case-study",
            status="published",
            short_description="A clear case-study summary.",
            service="Website Development",
            industry="Manufacturing",
            project_type="Corporate Website",
            overview_content="Overview copy",
            overview_image="projects/overview/overview.webp",
            overview_image_alt="Overview visual",
            approach_content="Approach copy",
            approach_image="projects/approach/approach.webp",
            approach_image_alt="Approach visual",
            impact_content="Impact copy",
            impact_image="projects/impact/impact.webp",
            impact_image_alt="Impact visual",
            showcase_image="projects/showcases/showcase.webp",
            showcase_image_alt="Responsive project screens",
            button_text="Visit Live Site",
            button_url="https://example.com/",
        )
        response = self.client.get(reverse("project_detail", args=[project.slug]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<h1 id="caseStudyTitle">Structured case study</h1>')
        self.assertContains(response, '<h2 id="overviewTitle">Overview</h2>')
        content = response.content.decode()
        self.assertLess(content.index('class="case-study__intro'), content.index('class="case-study__hero'))
        self.assertContains(response, "Approach copy")
        self.assertContains(response, "Impact copy")
        self.assertContains(response, "case-study__split")
        self.assertContains(response, "case-study__story-row--media-left")
        self.assertContains(response, "case-study__story-row--text-left")
        self.assertLess(content.index('id="overviewTitle"'), content.index("Overview copy"))
        self.assertLess(content.index("Overview copy"), content.index('alt="Overview visual"'))
        self.assertLess(content.index('alt="Approach visual"'), content.index('id="approachTitle"'))
        self.assertLess(content.index('id="approachTitle"'), content.index("Approach copy"))
        self.assertLess(content.index('id="impactTitle"'), content.index('alt="Impact visual"'))
        self.assertLess(content.index("Impact copy"), content.index('alt="Impact visual"'))
        self.assertContains(response, 'alt="Responsive project screens"')
        self.assertContains(response, 'loading="lazy"')
        self.assertContains(response, f'{staticfiles_storage.url("css/projects.css")}?v=15')
        self.assertContains(response, f'{staticfiles_storage.url("js/project-detail.js")}?v=3')
        self.assertContains(response, 'class="case-study__notch-button ect-micro-btn"')

    def test_project_detail_supports_expandable_related_project_rail(self):
        current = Project.objects.create(
            category=self.general_category,
            title="Recommendation source",
            slug="recommendation-source",
            status="published",
        )
        recommendations = [
            Project.objects.create(
                category=self.general_category,
                title=f"Recommended project {index}",
                slug=f"recommended-project-{index}",
                status="published",
                display_order=index,
            )
            for index in range(1, 9)
        ]
        current.related_projects.add(*recommendations)

        response = self.client.get(reverse("project_detail", args=[current.slug]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'data-related-rail')
        self.assertContains(response, 'data-related-previous')
        self.assertContains(response, 'data-related-next')
        self.assertContains(response, 'data-related-more')
        self.assertContains(response, 'case-study__related-item--deferred', count=2)
        for recommendation in recommendations:
            self.assertContains(response, recommendation.title)

    def test_next_project_override_and_manual_related_projects_are_honored(self):
        current = Project.objects.create(category=self.general_category, title="Current", slug="current", status="published", display_order=1)
        automatic = Project.objects.create(category=self.general_category, title="Automatic", slug="automatic", status="published", display_order=2)
        selected = Project.objects.create(category=self.general_category, title="Selected", slug="selected", status="published", display_order=3)
        related = Project.objects.create(category=self.general_category, title="Related", slug="related", status="published", display_order=4)
        current.next_project_override = selected
        current.next_project_image = "projects/next/custom-next.webp"
        current.next_project_image_alt = "Custom next project presentation"
        current.next_project_focal_point = "top"
        current.next_project_button_text = "Explore the next website"
        current.save(update_fields=[
            "next_project_override", "next_project_image",
            "next_project_image_alt", "next_project_focal_point",
            "next_project_button_text",
        ])
        current.related_projects.add(related)
        response = self.client.get(reverse("project_detail", args=[current.slug]))
        self.assertContains(response, reverse("project_detail", args=[selected.slug]))
        self.assertNotContains(response, reverse("project_detail", args=[automatic.slug]))
        self.assertContains(response, "Related")
        self.assertContains(response, "/media/projects/next/custom-next.webp")
        self.assertContains(response, 'alt="Custom next project presentation"')
        self.assertContains(response, "object-position-top")
        self.assertContains(response, "Explore the next website")

    def test_our_work_proxy_contains_only_website_projects(self):
        website_category = ProjectCategory.objects.create(name="Website Development", slug="website-development", status="published")
        website = Project.objects.create(category=website_category, title="Website", slug="website", status="published")
        Project.objects.create(category=self.digital_category, title="Social", slug="social", status="published")
        self.assertEqual(list(WebsiteProject.objects.filter(category__slug="website-development")), [website])

    def test_youtube_project_renders_privacy_enhanced_embed(self):
        project = Project.objects.create(
            category=self.general_category,
            title="Video project",
            slug="video-project",
            status="published",
            hero_media_type="youtube",
            hero_youtube_url="https://youtu.be/dQw4w9WgXcQ?t=4",
        )
        response = self.client.get(reverse("project_detail", args=[project.slug]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        )
        self.assertContains(response, 'title="Video project"')

    def test_digital_next_project_uses_digital_detail_route(self):
        first = Project.objects.create(
            category=self.digital_category,
            title="Digital one",
            slug="digital-one",
            status="published",
            display_order=1,
        )
        second = Project.objects.create(
            category=self.digital_category,
            title="Digital two",
            slug="digital-two",
            status="published",
            display_order=2,
        )
        response = self.client.get(reverse("digital_marketing_detail", args=[first.slug]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            reverse("digital_marketing_detail", args=[second.slug]),
        )

    def test_generic_route_redirects_digital_project_to_specialized_page(self):
        project = Project.objects.create(
            category=self.digital_category,
            title="Digital canonical route",
            slug="digital-canonical-route",
            status="published",
        )
        response = self.client.get(reverse("project_detail", args=[project.slug]))
        self.assertRedirects(
            response,
            reverse("digital_marketing_detail", args=[project.slug]),
            fetch_redirect_response=False,
            status_code=301,
        )

    def test_homepage_uses_fallback_and_correct_digital_project_link(self):
        project = Project.objects.create(
            category=self.digital_category,
            title="Homepage digital project",
            slug="homepage-digital-project",
            status="published",
            hero_media_type="image",
        )
        response = self.client.get(reverse("index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Media unavailable")
        self.assertContains(
            response,
            reverse("digital_marketing_detail", args=[project.slug]),
        )
        self.assertContains(response, staticfiles_storage.url("js/project-media.min.js"))
        self.assertContains(response, staticfiles_storage.url("js/deferred-media.min.js"))
        self.assertContains(response, 'data-deferred-video', count=2)
        self.assertContains(response, 'data-autoplay="true"', count=2)
        self.assertNotContains(response, "cdnjs.cloudflare.com/ajax/libs/font-awesome")


class PublicSeoTests(TestCase):
    def test_static_pages_have_one_complete_canonical_head(self):
        for name in (
            "index", "about", "career", "contact", "project_list",
            "digital", "hr", "it_infrastructure", "software", "website", "zoho",
        ):
            with self.subTest(name=name):
                response = self.client.get(reverse(name))
                self.assertEqual(response.status_code, 200)
                html = response.content.decode()
                self.assertEqual(html.count("<title>"), 1)
                self.assertEqual(html.count('name="description"'), 1)
                self.assertEqual(html.count('rel="canonical"'), 1)
                self.assertEqual(html.count('property="og:url"'), 1)
                self.assertEqual(html.count('name="twitter:card"'), 1)
                self.assertIn("application/ld+json", html)
                self.assertIn("https://ecogcoretechnologies.com", html)

    def test_legacy_html_routes_redirect_permanently(self):
        pairs = (
            ("index_html", "index"),
            ("about_html", "about"),
            ("career_html", "career"),
            ("contact_html", "contact"),
            ("digital_html", "digital"),
            ("hr_html", "hr"),
            ("it_infrastructure_html", "it_infrastructure"),
            ("software_html", "software"),
            ("website_html", "website"),
            ("zoho_html", "zoho"),
        )
        for legacy, canonical in pairs:
            with self.subTest(legacy=legacy):
                response = self.client.get(reverse(legacy))
                self.assertEqual(response.status_code, 301)
                self.assertEqual(response.url, reverse(canonical))

    @override_settings(
        SITE_URL="https://ecogcoretechnologies.com",
        ALLOWED_HOSTS=["ecogcoretechnologies.com", "www.ecogcoretechnologies.com"],
    )
    def test_www_host_redirects_to_non_www_and_preserves_query(self):
        response = self.client.get(
            "/projects/?page=2",
            HTTP_HOST="www.ecogcoretechnologies.com",
            secure=True,
        )
        self.assertEqual(response.status_code, 301)
        self.assertEqual(
            response.url,
            "https://ecogcoretechnologies.com/projects/?page=2",
        )

    @override_settings(
        SITE_URL="https://www.ecogcoretechnologies.com",
        ALLOWED_HOSTS=["ecogcoretechnologies.com", "www.ecogcoretechnologies.com"],
    )
    def test_non_www_host_redirects_when_www_becomes_canonical(self):
        response = self.client.get(
            "/blog/?page=2",
            HTTP_HOST="ecogcoretechnologies.com",
            secure=True,
        )
        self.assertEqual(response.status_code, 301)
        self.assertEqual(
            response.url,
            "https://www.ecogcoretechnologies.com/blog/?page=2",
        )

    def test_project_filters_are_noindex_and_canonicalize_to_collection(self):
        response = self.client.get(reverse("project_list"), {"search": "software"})
        self.assertContains(response, 'content="noindex,follow"')
        self.assertContains(
            response,
            'href="https://ecogcoretechnologies.com/projects/"',
        )

    @override_settings(
        ALLOWED_HOSTS=["ecogcoretechnologies.com"],
    )
    def test_sitemap_and_robots_advertise_canonical_non_www_urls(self):
        sitemap = self.client.get(
            reverse("django.contrib.sitemaps.views.sitemap"),
            HTTP_HOST="ecogcoretechnologies.com",
            secure=True,
        )
        self.assertContains(sitemap, "<loc>https://ecogcoretechnologies.com/")
        self.assertNotContains(sitemap, "www.ecogcoretechnologies.com")
        robots = self.client.get(
            reverse("robots_txt"),
            HTTP_HOST="ecogcoretechnologies.com",
            secure=True,
        )
        self.assertContains(
            robots,
            "Sitemap: https://ecogcoretechnologies.com/sitemap.xml",
        )
        self.assertContains(robots, "Disallow: /blog/preview/")

    def test_contact_has_a_single_main_heading(self):
        response = self.client.get(reverse("contact"))
        self.assertContains(
            response,
            '<h1 class="ect-map-title">Empowering Businesses Through Technology &amp; Innovation</h1>',
            html=False,
        )

    def test_under_construction_page_is_noindex(self):
        response = self.client.get(reverse("under"))
        self.assertContains(response, 'content="noindex,nofollow"')


class ResponsiveImageMarkupTests(TestCase):
    srcset_attribute = re.compile(r"""srcset=["']([^"']+)["']""", re.IGNORECASE | re.DOTALL)
    static_path = re.compile(r"""{%\s*static\s+["']([^"']+)["']\s*%}""")

    def test_srcset_static_paths_are_url_safe(self):
        template_root = Path(__file__).resolve().parent / "templates"
        unsafe = []
        for template in template_root.rglob("*.html"):
            source = template.read_text(encoding="utf-8")
            for attribute in self.srcset_attribute.findall(source):
                for static_path in self.static_path.findall(attribute):
                    if any(character.isspace() for character in static_path):
                        unsafe.append(f"{template.relative_to(template_root)}: {static_path}")
        self.assertEqual(unsafe, [], "Whitespace breaks srcset candidates: " + "; ".join(unsafe))
