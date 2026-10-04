import tempfile
import shutil
from pathlib import Path

from django.conf import settings
from django.test.runner import DiscoverRunner


class IsolatedMediaTestRunner(DiscoverRunner):
    """Run tests with disposable media storage instead of project uploads."""

    def setup_test_environment(self, **kwargs):
        self._media_directory = tempfile.TemporaryDirectory(prefix="ect-test-media-")
        self._original_media_root = settings.MEDIA_ROOT
        isolated_media_root = Path(self._media_directory.name)
        original_media_root = Path(self._original_media_root)
        if original_media_root.is_dir():
            shutil.copytree(original_media_root, isolated_media_root, dirs_exist_ok=True)
        settings.MEDIA_ROOT = isolated_media_root
        try:
            super().setup_test_environment(**kwargs)
        except Exception:
            settings.MEDIA_ROOT = self._original_media_root
            self._media_directory.cleanup()
            raise

    def teardown_test_environment(self, **kwargs):
        try:
            super().teardown_test_environment(**kwargs)
        finally:
            settings.MEDIA_ROOT = self._original_media_root
            self._media_directory.cleanup()
