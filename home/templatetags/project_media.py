import re
from urllib.parse import parse_qs, urlparse

from django import template

from home.image_utils import optimized_media_image_url


register = template.Library()

YOUTUBE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")
YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}


def extract_youtube_id(value):
    """Return a validated YouTube video ID from common URL formats."""
    if not value:
        return ""

    candidate = str(value).strip()
    if YOUTUBE_ID_PATTERN.fullmatch(candidate):
        return candidate

    parsed = urlparse(candidate)
    host = (parsed.hostname or "").lower()
    if host not in YOUTUBE_HOSTS:
        return ""

    if host.endswith("youtu.be"):
        candidate = parsed.path.strip("/").split("/", 1)[0]
    elif parsed.path.rstrip("/") == "/watch":
        candidate = parse_qs(parsed.query).get("v", [""])[0]
    else:
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 2 and parts[0] in {"embed", "shorts", "live"}:
            candidate = parts[1]
        else:
            candidate = ""

    return candidate if YOUTUBE_ID_PATTERN.fullmatch(candidate) else ""


@register.filter
def youtube_id(value):
    return extract_youtube_id(value)


@register.filter
def youtube_embed_url(value):
    video_id = extract_youtube_id(value)
    return f"https://www.youtube-nocookie.com/embed/{video_id}" if video_id else ""


@register.filter
def youtube_thumbnail_url(value):
    video_id = extract_youtube_id(value)
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg" if video_id else ""


def _file_url(field):
    if not field:
        return ""
    try:
        return field.url
    except (ValueError, AttributeError):
        return ""


@register.simple_tag
def project_preview_url(project):
    card_image = getattr(project, "card_image", None)
    card_url = optimized_media_image_url(card_image)
    if card_url:
        return card_url
    hero_image = getattr(project, "hero_image", None)
    image_url = optimized_media_image_url(hero_image)
    media_type = getattr(project, "hero_media_type", "")
    if media_type in {"image", "video"} and image_url:
        return image_url
    if media_type == "youtube":
        return youtube_thumbnail_url(getattr(project, "hero_youtube_url", ""))
    return image_url
