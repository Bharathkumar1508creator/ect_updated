import re
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from django.conf import settings
from django.utils.html import strip_tags
from django.utils.text import slugify


ALLOWED_TAGS = {
    "p", "br", "strong", "b", "em", "i", "u", "s", "mark", "blockquote",
    "ul", "ol", "li", "h2", "h3", "h4", "h5", "h6", "a", "img", "figure",
    "figcaption", "table", "thead", "tbody", "tr", "th", "td", "hr", "code", "pre",
}
GLOBAL_ATTRS = {"class", "id", "title"}
TAG_ATTRS = {
    "a": {"href", "target", "rel"},
    "img": {"src", "alt", "width", "height", "loading", "decoding"},
    "th": {"scope", "colspan", "rowspan"},
    "td": {"colspan", "rowspan"},
}
VOID_TAGS = {"br", "img", "hr"}


def normalize_article_url(value, *, image=False):
    """Return a safe URL and normalize common editor input mistakes.

    Editors can paste ``blog/example/``, ``127.0.0.1:8000/example/`` or a
    production absolute URL. Internal URLs are stored as stable root-relative
    paths so they keep working when the site moves between local and live hosts.
    """
    value = (value or "").strip()
    if value.startswith(("/", "#")) and not value.startswith("//"):
        return value

    if re.match(r"^(?:localhost|127\.0\.0\.1)(?::\d+)?(?:/|$)", value, re.I):
        parsed = urlparse("//" + value)
        return urlunparse(("", "", parsed.path or "/", "", parsed.query, parsed.fragment))

    if not re.match(r"^[a-z][a-z0-9+.-]*:", value, re.I):
        # Values such as blog/article/ and website/ are intended to be local.
        if re.match(r"^[\w.-]+(?:/[\w.~!$&'()*+,;=:@%-]*)*/?(?:[?#].*)?$", value):
            return "/" + value.lstrip("/")
        return ""

    parsed = urlparse(value)
    allowed = {"http", "https"}
    if image:
        allowed.add("data")
    if parsed.scheme.lower() not in allowed:
        return ""

    site_host = urlparse(getattr(settings, "SITE_URL", "")).netloc.lower()
    if not image and site_host and parsed.netloc.lower() == site_host:
        return urlunparse(("", "", parsed.path or "/", "", parsed.query, parsed.fragment))
    return value


def _safe_url(value, *, image=False):
    return normalize_article_url(value, image=image)


class ArticleSanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output = []
        self.suppressed = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in {"script", "style", "iframe", "object", "embed"}:
            self.suppressed += 1
            return
        if self.suppressed or tag not in ALLOWED_TAGS:
            return
        permitted = GLOBAL_ATTRS | TAG_ATTRS.get(tag, set())
        cleaned = []
        for name, value in attrs:
            name = name.lower()
            if name not in permitted or name.startswith("on"):
                continue
            if name in {"href", "src"}:
                value = _safe_url(value, image=(name == "src"))
                if not value:
                    continue
            if name == "target" and value != "_blank":
                continue
            cleaned.append((name, value or ""))
        if tag == "img":
            attrs_dict = dict(cleaned)
            attrs_dict.setdefault("loading", "lazy")
            attrs_dict.setdefault("decoding", "async")
            cleaned = list(attrs_dict.items())
        if tag == "a" and dict(cleaned).get("target") == "_blank":
            attrs_dict = dict(cleaned)
            rel = set(attrs_dict.get("rel", "").split())
            rel.update({"noopener", "noreferrer"})
            attrs_dict["rel"] = " ".join(sorted(rel))
            cleaned = list(attrs_dict.items())
        attr_html = "".join(f' {name}="{escape(value, quote=True)}"' for name, value in cleaned)
        self.output.append(f"<{tag}{attr_html}>")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in {"script", "style", "iframe", "object", "embed"}:
            if self.suppressed:
                self.suppressed -= 1
            return
        if not self.suppressed and tag in ALLOWED_TAGS and tag not in VOID_TAGS:
            self.output.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.suppressed:
            self.output.append(escape(data))


def sanitize_article_html(value):
    parser = ArticleSanitizer()
    parser.feed(value or "")
    parser.close()
    return "".join(parser.output)


IMG_RE = re.compile(r"<img\b([^>]*)>", re.I)


def add_local_image_dimensions(value):
    """Add intrinsic dimensions to locally stored article images when known."""
    try:
        from PIL import Image
    except ImportError:  # Pillow is an application dependency, but fail safely.
        return value

    media_url = str(getattr(settings, "MEDIA_URL", "/media/") or "/media/")
    media_root = Path(getattr(settings, "MEDIA_ROOT", ""))

    def replace(match):
        attrs = match.group(1)
        src_match = re.search(r'\bsrc=["\']([^"\']+)["\']', attrs, re.I)
        if not src_match or (re.search(r"\bwidth=", attrs, re.I) and re.search(r"\bheight=", attrs, re.I)):
            return match.group(0)
        src = src_match.group(1)
        parsed = urlparse(src)
        if not parsed.path.startswith(media_url):
            return match.group(0)
        relative = parsed.path[len(media_url):].lstrip("/")
        candidate = (media_root / relative).resolve()
        try:
            candidate.relative_to(media_root.resolve())
            with Image.open(candidate) as image:
                width, height = image.size
        except (OSError, ValueError):
            return match.group(0)
        return f'<img{attrs} width="{width}" height="{height}">'

    return IMG_RE.sub(replace, value or "")


HEADING_RE = re.compile(r"<h([2-6])([^>]*)>(.*?)</h\1>", re.I | re.S)


def add_heading_ids(value):
    used = set()

    def replace(match):
        level, attrs, body = match.groups()
        existing = re.search(r'\bid=["\']([^"\']+)["\']', attrs, re.I)
        base = slugify(strip_tags(body))[:80] or f"section-{len(used) + 1}"
        candidate = slugify(existing.group(1)) if existing else base
        candidate = candidate or base
        if candidate[0].isdigit():
            candidate = f"section-{candidate}"
        original = candidate
        suffix = 2
        while candidate in used:
            candidate = f"{original}-{suffix}"
            suffix += 1
        used.add(candidate)
        attrs = re.sub(r'\s+id=["\'][^"\']*["\']', "", attrs, flags=re.I)
        return f'<h{level}{attrs} id="{candidate}">{body}</h{level}>'

    return HEADING_RE.sub(replace, value or "")


def prepare_article_html(value):
    return add_local_image_dimensions(add_heading_ids(sanitize_article_html(value)))


def extract_toc(value):
    items = []
    for level, attrs, body in HEADING_RE.findall(value or ""):
        if level != "2":
            continue
        match = re.search(r'\bid=["\']([^"\']+)["\']', attrs, re.I)
        if match:
            items.append({"id": match.group(1), "text": strip_tags(body).strip()})
    return items


def extract_faq_items(value):
    """Extract adjacent H3 question and paragraph answer pairs from an FAQ section."""
    marker = re.search(
        r"<h2\b[^>]*>\s*Frequently Asked Questions\s*</h2>",
        value or "",
        re.I,
    )
    if not marker:
        return []
    section = (value or "")[marker.end():]
    next_h2 = re.search(r"<h2\b", section, re.I)
    if next_h2:
        section = section[:next_h2.start()]
    items = []
    pattern = re.compile(
        r"<h3\b[^>]*>(.*?)</h3>\s*<p\b[^>]*>(.*?)</p>",
        re.I | re.S,
    )
    for question, answer in pattern.findall(section):
        question = re.sub(r"^\s*\d+\.\s*", "", unescape(strip_tags(question))).strip()
        answer = unescape(strip_tags(answer)).strip()
        if question and answer:
            items.append({"question": question, "answer": answer})
    return items
