import tempfile
from pathlib import Path
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse


class HealthEndpointTests(TestCase):
    def test_health_reports_process_availability_without_caching(self):
        response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_health_rejects_non_get_requests(self):
        self.assertEqual(self.client.post(reverse("health")).status_code, 405)

    def test_readiness_checks_database_cache_and_media(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            response = self.client.get(reverse("readiness"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ready")
        self.assertEqual(
            response.json()["checks"],
            {"database": "ok", "cache": "ok", "media": "ok"},
        )
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_readiness_returns_503_when_database_is_unavailable(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            with patch("ect.health.connection.cursor", side_effect=RuntimeError("offline")):
                response = self.client.get(reverse("readiness"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "unavailable")
        self.assertEqual(response.json()["checks"]["database"], "unavailable")

    def test_readiness_returns_503_when_cache_is_unavailable(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            with patch("ect.health.cache.set", side_effect=RuntimeError("offline")):
                response = self.client.get(reverse("readiness"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["checks"]["cache"], "unavailable")

    def test_readiness_returns_503_when_media_directory_is_unavailable(self):
        with tempfile.TemporaryDirectory() as parent:
            missing_media = Path(parent, "missing")
            with override_settings(MEDIA_ROOT=missing_media):
                response = self.client.get(reverse("readiness"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["checks"]["media"], "unavailable")
