from django.db import connections
from django.db.migrations.recorder import MigrationRecorder
from django.db.models.signals import pre_migrate


DANGEROUS_MIGRATION = ("blog", "0007_single_live_blog_and_author_defaults")
BLOG_TABLE = "blog_blog"


def block_unreviewed_destructive_blog_migration(sender, app_config, using, **kwargs):
    """Stop migration 0007 from deleting articles on a partially migrated database."""
    if app_config.label != "blog":
        return

    connection = connections[using]
    applied = MigrationRecorder(connection).applied_migrations()
    if DANGEROUS_MIGRATION in applied:
        return
    if BLOG_TABLE not in connection.introspection.table_names():
        return

    quoted_table = connection.ops.quote_name(BLOG_TABLE)
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) FROM {quoted_table}")
        article_count = cursor.fetchone()[0]
    if article_count > 1:
        raise RuntimeError(
            "Migration blog.0007 contains a historical delete operation and this "
            f"database currently has {article_count} blog articles. Stop, back up the "
            "database and media, and review a non-destructive migration plan before continuing."
        )


def connect_migration_guards():
    pre_migrate.connect(
        block_unreviewed_destructive_blog_migration,
        dispatch_uid="blog.block_unreviewed_destructive_migration_0007",
    )
