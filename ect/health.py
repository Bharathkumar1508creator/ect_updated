import os
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


def _json_status(payload, status=200):
    response = JsonResponse(payload, status=status)
    response.headers["Cache-Control"] = "no-store"
    return response


@require_GET
def health(request):
    """Confirm that the Django process can serve requests."""
    return _json_status({"status": "ok"})


@require_GET
def readiness(request):
    """Confirm that dependencies required to serve the application are available."""
    checks = {
        "database": False,
        "cache": False,
        "media": False,
    }

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            checks["database"] = cursor.fetchone()[0] == 1
    except Exception:
        pass

    cache_key = f"readiness:{uuid4().hex}"
    cache_value = uuid4().hex
    try:
        cache.set(cache_key, cache_value, timeout=30)
        checks["cache"] = cache.get(cache_key) == cache_value
    except Exception:
        pass
    finally:
        try:
            cache.delete(cache_key)
        except Exception:
            pass

    media_root = Path(settings.MEDIA_ROOT)
    checks["media"] = (
        media_root.is_dir()
        and os.access(media_root, os.R_OK)
        and os.access(media_root, os.W_OK)
    )

    ready = all(checks.values())
    public_checks = {
        name: "ok" if passed else "unavailable"
        for name, passed in checks.items()
    }
    return _json_status(
        {"status": "ready" if ready else "unavailable", "checks": public_checks},
        status=200 if ready else 503,
    )
