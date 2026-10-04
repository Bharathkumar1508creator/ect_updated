from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


class Command(BaseCommand):
    help = "Verify database connectivity and optionally require every migration to be applied."

    def add_arguments(self, parser):
        parser.add_argument(
            "--require-current",
            action="store_true",
            help="Fail if the database has unapplied Django migrations.",
        )

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            if not result or result[0] != 1:
                raise CommandError("The database did not return the expected connectivity result.")

            executor = MigrationExecutor(connection)
            targets = executor.loader.graph.leaf_nodes()
            plan = executor.migration_plan(targets)
        except CommandError:
            raise
        except Exception as exc:
            raise CommandError(f"Database verification failed: {exc}") from exc

        self.stdout.write(
            f"Database connection passed (vendor={connection.vendor}, alias={connection.alias})."
        )
        if plan:
            message = f"Database has {len(plan)} unapplied migration(s)."
            if options["require_current"]:
                raise CommandError(message)
            self.stdout.write(self.style.WARNING(message))
        else:
            self.stdout.write(self.style.SUCCESS("Database schema is current."))
