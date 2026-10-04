from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase


class DeploymentPreflightTests(TestCase):
    def test_development_preflight_passes_without_production_credentials(self):
        output = StringIO()
        call_command("deployment_preflight", stdout=output)

        report = output.getvalue()
        self.assertIn("PASS  Database", report)
        self.assertIn("PASS  Cache", report)
        self.assertIn("PASS  Static assets", report)
        self.assertIn("Deployment preflight passed in development mode", report)

    def test_production_preflight_rejects_development_configuration(self):
        output = StringIO()
        with self.assertRaises(CommandError):
            call_command("deployment_preflight", "--production", stdout=output)

        report = output.getvalue()
        self.assertIn("FAIL  Environment", report)
        self.assertNotIn("django-insecure-local-development-only", report)
