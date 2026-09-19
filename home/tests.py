from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase
from django.urls import reverse

from .models import Career, ContactMessage, JobApplication
from .templatetags.content_security import sanitized_rich_html


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
