import tempfile
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase

from scripts.production_backup import BackupConfig, create_backup, mysql_dump_command, validate_config


class ProductionBackupTests(SimpleTestCase):
    @staticmethod
    def _config(root, backup_root=None):
        app = root / "app"
        current = app / "current"
        media = root / "media"
        for directory in (current, media):
            directory.mkdir(parents=True)
        (current / "manage.py").write_text("# release", encoding="utf-8")
        (media / "upload.txt").write_text("media", encoding="utf-8")
        files = [root / name for name in (".env", "nginx", "service", "mysql.cnf")]
        for path in files:
            path.write_text("placeholder", encoding="utf-8")
        return BackupConfig(
            app_root=app,
            backup_root=backup_root or root / "backups",
            env_file=files[0],
            media_dir=media,
            nginx_config=files[1],
            systemd_service=files[2],
            mysql_defaults_file=files[3],
            db_name="ect",
            db_user="backup",
        )

    def test_validation_rejects_backup_inside_media(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            config = self._config(root)
            config = BackupConfig(**{**config.__dict__, "backup_root": config.media_dir / "backups"})

            with self.assertRaisesRegex(ValueError, "BACKUP_ROOT cannot be inside MEDIA_DIR"):
                validate_config(config, require_tools=False)

    def test_mysql_command_uses_protected_defaults_file_without_password(self):
        config = BackupConfig(
            app_root=Path("/srv/ecog"),
            backup_root=Path("/backups/ecog"),
            env_file=Path("/srv/ecog/.env"),
            media_dir=Path("/srv/ecog/media"),
            nginx_config=Path("/etc/nginx/ecog"),
            systemd_service=Path("/etc/systemd/ecog.service"),
            mysql_defaults_file=Path("/root/.ecog-mysql.cnf"),
            db_name="ect",
            db_user="backup",
        )

        command = mysql_dump_command(config)

        self.assertEqual(command[1], f"--defaults-extra-file={config.mysql_defaults_file}")
        self.assertNotIn("password", " ".join(command).lower())

    def test_backup_is_published_only_after_archives_and_checksums_pass(self):
        with tempfile.TemporaryDirectory() as root:
            config = self._config(Path(root))

            def fake_dump(_command, stdout, **_kwargs):
                stdout.write(b"CREATE TABLE verified_backup (id INT);\n")

            with patch("scripts.production_backup.shutil.which", return_value="/usr/bin/mysqldump"):
                with patch("scripts.production_backup.subprocess.run", side_effect=fake_dump):
                    destination = create_backup(config)

            self.assertTrue((destination / "database.sql.gz").is_file())
            self.assertTrue((destination / "current-release.tar.gz").is_file())
            self.assertTrue((destination / "media.tar.gz").is_file())
            self.assertTrue((destination / "SHA256SUMS").is_file())
            self.assertFalse(any(config.backup_root.glob("*.incomplete")))
