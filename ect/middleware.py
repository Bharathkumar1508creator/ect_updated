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
