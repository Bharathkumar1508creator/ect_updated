import hashlib
import io
from pathlib import Path

from PIL import Image, ImageOps
from django import forms
from django.core.files.base import ContentFile


def optimize_uploaded_image(uploaded, *, max_size=(1920, 1920), quality=84):
    """Convert a newly uploaded raster image to an orientation-safe WebP.

    Existing FieldFile values have no upload content type and pass through
    unchanged, so editing text or metadata never rewrites production media.
    """
    if not uploaded or not getattr(uploaded, "content_type", "").startswith("image/"):
        return uploaded
    try:
        image = ImageOps.exif_transpose(Image.open(uploaded))
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=quality, alpha_quality=100, method=6)
    except Exception as exc:
        raise forms.ValidationError("Upload a valid JPG, PNG or WebP image.") from exc
    name = f"{Path(uploaded.name).stem[:80] or 'image'}.webp"
    return ContentFile(output.getvalue(), name=name)


def optimized_media_image_url(field_file, *, max_size=(960, 960), quality=84):
    """Return a cached WebP derivative URL without changing the stored field.

    If storage is unavailable or read-only, the original URL remains the safe
    fallback. The deterministic cache path lets deployment pre-warm variants.
    """
    if not field_file:
        return ""
    try:
        original_url = field_file.url
        original_name = field_file.name
        storage = field_file.storage
    except (AttributeError, ValueError):
        return ""
    if not original_name:
        return original_url

    digest = hashlib.sha256(original_name.encode("utf-8")).hexdigest()[:16]
    stem = Path(original_name).stem[:64] or "image"
    cache_name = f".optimized/project-cards/{digest}-{stem}-{max_size[0]}.webp"
    try:
        if storage.exists(cache_name):
            return storage.url(cache_name)
        with storage.open(original_name, "rb") as source:
            image = ImageOps.exif_transpose(Image.open(source))
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            output = io.BytesIO()
            image.save(output, format="WEBP", quality=quality, alpha_quality=100, method=6)
        saved_name = storage.save(cache_name, ContentFile(output.getvalue()))
        return storage.url(saved_name)
    except Exception:
        return original_url
