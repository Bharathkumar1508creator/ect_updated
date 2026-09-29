from urllib.parse import urlsplit

from django.conf import settings
from django.http import HttpResponsePermanentRedirect


class CanonicalHostMiddleware:
    """Redirect the alternate www/non-www hostname to the configured origin."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        canonical = urlsplit(settings.SITE_URL)
        request_host = request.get_host().split(":", 1)[0].lower()
        canonical_host = canonical.hostname.lower() if canonical.hostname else ""
        alternate_host = (
            canonical_host[4:] if canonical_host.startswith("www.") else f"www.{canonical_host}"
        )
        if canonical_host and request_host == alternate_host:
            target = f"{canonical.scheme or 'https'}://{canonical.netloc}{request.get_full_path()}"
            return HttpResponsePermanentRedirect(target)
        return self.get_response(request)


class SecurityHeadersMiddleware:
    """Add browser capability restrictions that complement Django's security middleware."""

    POLICY = (
        "accelerometer=(), autoplay=(self), camera=(), display-capture=(), "
        "geolocation=(), gyroscope=(), magnetometer=(), microphone=(), "
        "payment=(), usb=()"
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.headers.setdefault("Permissions-Policy", self.POLICY)
        return response
