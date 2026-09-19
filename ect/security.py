import hashlib

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse


def _client_address(request):
    if getattr(settings, "TRUST_X_FORWARDED_FOR", False):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded:
            return forwarded.split(",", 1)[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def rate_limit_response(request, scope):
    """Return a 429 response when a public write exceeds the configured limit."""
    limit = max(0, int(getattr(settings, "PUBLIC_FORM_RATE_LIMIT", 8)))
    window = max(1, int(getattr(settings, "PUBLIC_FORM_RATE_WINDOW", 900)))
    if not limit:
        return None

    identity = _client_address(request)
    digest = hashlib.sha256(f"{settings.SECRET_KEY}:{identity}".encode()).hexdigest()
    key = f"ect:rate:{scope}:{digest}"
    try:
        if cache.add(key, 1, timeout=window):
            return None
        attempts = cache.incr(key)
    except (ValueError, TypeError):
        # A cache outage must not take the public site down. Production should use
        # a shared cache backend so limits apply consistently across workers.
        return None

    if attempts <= limit:
        return None

    message = "Too many submissions. Please wait before trying again."
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        response = JsonResponse({"ok": False, "message": message}, status=429)
    else:
        from django.http import HttpResponse
        response = HttpResponse(message, status=429, content_type="text/plain")
    response.headers["Retry-After"] = str(window)
    return response
