from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase, override_settings
from django.urls import reverse

from .models import Career, ContactMessage, JobApplication, Project, ProjectCategory
from .templatetags.content_security import sanitized_rich_html
from .templatetags.project_media import extract_youtube_id, youtube_embed_url


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


class SecurityBoundaryTests(TestCase):
    def test_source_files_are_not_static_assets(self):
        self.assertIsNone(finders.find("models.py"))
        self.assertIsNone(finders.find("templates/contact.html"))
        self.assertIsNone(finders.find("migrations/0001_initial.py"))
        self.assertTrue(finders.find("css/base.css"))
        self.assertTrue(finders.find("js/base.js"))

    def test_security_headers_are_present(self):
        response = self.client.get(reverse("index"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("camera=()", response.headers["Permissions-Policy"])
        self.assertIn("object-src 'none'", response.headers["Content-Security-Policy-Report-Only"])

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
        self.assertContains(response, "/static/js/base.js")
        self.assertContains(response, "/static/js/project-media.js")
        self.assertContains(response, 'id="ectContactPopup"')
        self.assertContains(response, "ECOGCORETECHNOLOGIES")

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
        self.assertContains(response, "/static/js/project-media.js")


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

    def test_under_construction_page_is_noindex(self):
        response = self.client.get(reverse("under"))
        self.assertContains(response, 'content="noindex,nofollow"')
