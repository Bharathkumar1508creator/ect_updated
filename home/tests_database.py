from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase


class DatabaseCheckCommandTests(TestCase):
    def test_check_database_confirms_connection_and_schema(self):
        output = StringIO()

        call_command("check_database", "--require-current", stdout=output)

        self.assertIn("Database connection passed", output.getvalue())
        self.assertIn("Database schema is current", output.getvalue())

    def test_check_database_reports_connection_failure_without_secrets(self):
        with patch("home.management.commands.check_database.connection.cursor", side_effect=RuntimeError("offline")):
            with self.assertRaisesMessage(CommandError, "Database verification failed: offline"):
                call_command("check_database")
