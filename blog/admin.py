import io
import re
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, ImageOps
from django.conf import settings
from django import forms
from django.contrib import admin, messages
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.template.response import TemplateResponse
from django.urls import Resolver404, path, resolve, reverse
from django.utils.html import format_html
from django.utils.dateparse import parse_datetime
from django.utils.safestring import mark_safe

from .models import (
    Blog,
    BlogCategory,
    BlogComment,
    BlogImageAsset,
    BlogRevision,
    BlogSlugRedirect,
    BlogTag,
)
from .utils import normalize_article_url, prepare_article_html


def optimize_uploaded_image(uploaded, *, max_size=(1920, 1920), quality=84):
    """Convert a newly uploaded image to an efficient, orientation-safe WebP."""
    if not uploaded or not getattr(uploaded, "content_type", "").startswith("image/"):
        return uploaded
    try:
        image = ImageOps.exif_transpose(Image.open(uploaded))
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=quality, method=6)
    except Exception as exc:
        raise forms.ValidationError("Upload a valid JPG, PNG or WebP image.") from exc
    name = f"{Path(uploaded.name).stem[:80] or 'image'}.webp"
    return ContentFile(output.getvalue(), name=name)


class BlogAdminForm(forms.ModelForm):
    class Meta:
        model = Blog
        fields = "__all__"
        widgets = {
            "article_content": forms.Textarea(attrs={"class": "seo-article-editor"}),
            "meta_description": forms.Textarea(attrs={"rows": 3}),
            "open_graph_description": forms.Textarea(attrs={"rows": 3}),
            "twitter_description": forms.Textarea(attrs={"rows": 3}),
            "author_bio": forms.Textarea(attrs={"rows": 3}),
            "editorial_notes": forms.Textarea(attrs={"rows": 4}),
        }

    def clean_article_content(self):
        content = self.cleaned_data.get("article_content", "")
        if re.search(r"<h1\b", content, re.I):
            raise forms.ValidationError(
                "The blog title is already the page H1. Use H2–H6 inside the article."
            )
        return prepare_article_html(content)

    def clean_hero_image(self):
        return optimize_uploaded_image(self.cleaned_data.get("hero_image"))

    def clean_open_graph_image(self):
        return optimize_uploaded_image(self.cleaned_data.get("open_graph_image"), max_size=(1600, 900))

    def clean(self):
        cleaned = super().clean()
        status = cleaned.get("status")
        content = cleaned.get("article_content", "")
        public_statuses = {Blog.Status.PUBLISHED, Blog.Status.SCHEDULED}
        if status in public_statuses and not content.strip():
            self.add_error("article_content", "Add article content before publishing.")
        if status in public_statuses and content and "<h2" not in content.lower():
            self.add_error("article_content", "Add at least one H2 section before publishing.")
        if status in public_statuses and re.search(
            r"<img\b(?![^>]*\balt\s*=\s*[\"'][^\"']+)[^>]*>", content, re.I
        ):
            self.add_error("article_content", "Every article image needs descriptive alt text.")
        return cleaned


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "article_count")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    fields = ("name", "slug", "meta_description")

    @admin.display(description="Articles")
    def article_count(self, obj):
        return obj.blogs.count()


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "article_count")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Articles")
    def article_count(self, obj):
        return obj.blogs.count()


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    form = BlogAdminForm
    change_form_template = "admin/blog/blog/change_form.html"
    list_display = (
        "title",
        "category",
        "status",
        "publish_date",
        "featured",
        "seo_score_badge",
    )
    list_filter = ("status", "category", "featured", "robots_index", "publish_date")
    search_fields = (
        "title",
        "hero_description",
        "article_content",
        "primary_keyword",
        "tags__name",
    )
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("tags", "related_blogs")
    date_hierarchy = "publish_date"
    save_on_top = True
    readonly_fields = (
        "views",
        "updated_at",
        "last_edited_by",
        "seo_overview",
        "content_quality_overview",
        "search_preview",
    )
    actions = ("send_to_seo_review", "send_to_content_review", "approve", "publish", "unpublish")

    fieldsets = (
        ("Article Information", {
            "fields": (
                "title", "slug", "category", "tags", "related_blogs", "hero_description",
            )
        }),
        ("Article Editor", {
            "description": "Use the white editor and its right-side block controls. The page title is automatically the only H1.",
            "fields": ("article_content",),
        }),
        ("Hero & Featured Media", {
            "fields": (
                "hero_media_type", "hero_image", "hero_image_alt", "hero_video",
                "small_headline", "main_headline",
            )
        }),
        ("Author & Trust", {
            "fields": (
                "author", "author_designation", "author_photo", "author_profile_url", "author_bio", "reviewed_by",
                "last_reviewed_at",
            )
        }),
        ("SEO Setup", {
            "fields": (
                "primary_keyword", "secondary_keywords", "search_intent", "meta_title",
                "meta_description", "canonical_url", "search_preview", "seo_overview",
                "content_quality_overview",
            )
        }),
        ("Social Sharing", {
            "classes": ("collapse",),
            "fields": (
                "open_graph_title", "open_graph_description", "open_graph_image",
                "twitter_title", "twitter_description",
            )
        }),
        ("Indexing & Sitemap", {
            "classes": ("collapse",),
            "fields": (
                "robots_index", "robots_follow", "include_in_sitemap", "sitemap_priority",
            )
        }),
        ("Publishing Workflow", {
            "fields": (
                "status", "publish_date", "featured", "allow_comments", "editorial_notes",
                "auto_reading_time", "reading_time", "views", "updated_at", "last_edited_by",
            )
        }),
    )

    class Media:
        css = {"all": ("blog/css/admin_blog_editor.css",)}
        js = (
            "vendor/tinymce/tinymce.min.js",
            "blog/js/admin_blog_editor.js",
            "blog/js/admin_media_toggle.js",
        )

    def get_urls(self):
        custom = [
            path(
                "upload-image/",
                self.admin_site.admin_view(self.upload_image),
                name="blog_blog_upload_image",
            ),
            path(
                "internal-links/",
                self.admin_site.admin_view(self.internal_links),
                name="blog_blog_internal_links",
            ),
            path(
                "image-list/",
                self.admin_site.admin_view(self.image_list),
                name="blog_blog_image_list",
            ),
            path(
                "validate-links/",
                self.admin_site.admin_view(self.validate_links),
                name="blog_blog_validate_links",
            ),
            path(
                "editor-guide/",
                self.admin_site.admin_view(self.editor_guide),
                name="blog_blog_editor_guide",
            ),
        ]
        return custom + super().get_urls()

    def render_change_form(self, request, context, *args, **kwargs):
        context["blog_editor_config"] = {
            "uploadUrl": reverse("admin:blog_blog_upload_image"),
            "linksUrl": reverse("admin:blog_blog_internal_links"),
            "imagesUrl": reverse("admin:blog_blog_image_list"),
            "validateLinksUrl": reverse("admin:blog_blog_validate_links"),
            "guideUrl": reverse("admin:blog_blog_editor_guide"),
            "previewUrl": reverse("blog:blog_preview", kwargs={"pk": context["original"].pk}) if context.get("original") else "",
            "autosaveKey": f"ect-blog-editor-{context['original'].pk if context.get('original') else 'new'}",
        }
        return super().render_change_form(request, context, *args, **kwargs)

    def upload_image(self, request):
        if request.method != "POST" or "file" not in request.FILES:
            return JsonResponse({"error": "Select an image to upload."}, status=400)
        uploaded = request.FILES["file"]
        if uploaded.size > 10 * 1024 * 1024:
            return JsonResponse({"error": "Image must be smaller than 10 MB."}, status=400)
        try:
            optimized = optimize_uploaded_image(uploaded)
        except Exception:
            return JsonResponse({"error": "The uploaded file is not a supported image."}, status=400)
        asset = BlogImageAsset(original_filename=uploaded.name, uploaded_by=request.user)
        asset.image.save(optimized.name, optimized, save=True)
        with Image.open(asset.image.path) as image:
            width, height = image.size
        return JsonResponse({"location": asset.image.url, "width": width, "height": height})

    def internal_links(self, request):
        links = [
            {"title": "Home", "value": reverse("index")},
            {"title": "About", "value": reverse("about")},
            {"title": "Our Work / Projects", "value": reverse("project_list")},
            {"title": "Website Development", "value": reverse("website")},
            {"title": "Software Development", "value": reverse("software")},
            {"title": "Zoho Consulting", "value": reverse("zoho")},
            {"title": "HR Consulting", "value": reverse("hr")},
            {"title": "IT Infrastructure", "value": reverse("it_infrastructure")},
            {"title": "Digital Marketing", "value": reverse("digital")},
            {"title": "Careers", "value": reverse("career")},
            {"title": "Contact", "value": reverse("contact")},
            {"title": "Blog", "value": reverse("blog:blog_list")},
        ]
        links.extend(
            {"title": f"Blog: {blog.title}", "value": blog.get_absolute_url()}
            for blog in Blog.objects.publicly_visible().only("title", "slug")
        )
        return JsonResponse(links, safe=False)

    def image_list(self, request):
        supported = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
        root = Path(settings.MEDIA_ROOT) / "blog"
        images = []
        if root.exists():
            for item in sorted(root.rglob("*")):
                if item.is_file() and item.suffix.lower() in supported:
                    relative = item.relative_to(settings.MEDIA_ROOT).as_posix()
                    images.append({
                        "title": item.stem.replace("-", " ").replace("_", " ").title(),
                        "value": f"{settings.MEDIA_URL.rstrip('/')}/{relative}",
                    })
        return JsonResponse(images, safe=False)

    def validate_links(self, request):
        if request.method != "POST":
            return JsonResponse({"error": "POST required."}, status=405)
        html = request.POST.get("html", "")
        results = []
        for raw in re.findall(r'<a\b[^>]*\bhref=["\']([^"\']*)["\']', html, re.I):
            normalized = normalize_article_url(raw)
            result = {"original": raw, "normalized": normalized, "valid": bool(normalized), "message": ""}
            if not normalized:
                result["message"] = "Unsafe or empty URL"
            elif normalized.startswith("#"):
                target = normalized[1:]
                result["valid"] = bool(target and re.search(rf'\bid=["\']{re.escape(target)}["\']', html, re.I))
                result["message"] = "Heading not found" if not result["valid"] else ""
            elif normalized.startswith("/"):
                clean_path = urlsplit(normalized).path
                try:
                    match = resolve(clean_path)
                    if match.url_name == "blog_detail":
                        result["valid"] = Blog.objects.publicly_visible().filter(slug=match.kwargs.get("slug")).exists()
                        result["message"] = "Linked blog is missing or not published" if not result["valid"] else ""
                except Resolver404:
                    result["valid"] = False
                    result["message"] = "No page matches this internal URL"
            results.append(result)
        invalid = [item for item in results if not item["valid"]]
        return JsonResponse({"count": len(results), "invalid_count": len(invalid), "results": results})

    def editor_guide(self, request):
        context = {
            **self.admin_site.each_context(request),
            "title": "ECT blog admin guide",
            "opts": self.model._meta,
            "blog_add_url": reverse("admin:blog_blog_add"),
            "image_location": "media/blog/editor/YYYY/MM/",
        }
        return TemplateResponse(request, "admin/blog/blog/editor_guide.html", context)

    def save_model(self, request, obj, form, change):
        old = Blog.objects.filter(pk=obj.pk).first() if change else None
        obj.last_edited_by = request.user
        super().save_model(request, obj, form, change)
        if old and old.slug != obj.slug:
            BlogSlugRedirect.objects.update_or_create(
                old_slug=old.slug, defaults={"blog": obj}
            )
        BlogRevision.objects.create(
            blog=obj,
            created_by=request.user,
            snapshot={
                "title": obj.title,
                "slug": obj.slug,
                "hero_description": obj.hero_description or "",
                "article_content": obj.article_content,
                "meta_title": obj.meta_title,
                "meta_description": obj.meta_description,
                "status": obj.status,
                "publish_date": obj.publish_date.isoformat(),
            },
        )

    @admin.display(description="SEO")
    def seo_score_badge(self, obj):
        color = "#218838" if obj.seo_score >= 80 else "#c77800" if obj.seo_score >= 55 else "#b42318"
        return format_html(
            '<span style="color:#fff;background:{};padding:3px 8px;border-radius:12px">{}%</span>',
            color,
            obj.seo_score,
        )

    @admin.display(description="SEO checklist")
    def seo_overview(self, obj):
        if not obj.pk:
            return "Save the draft to generate the complete server-side checklist."
        rows = "".join(
            f'<li class="{("seo-pass" if item["passed"] else "seo-fail")}">'
            f'{"✓" if item["passed"] else "✕"} {item["label"]}</li>'
            for item in obj.seo_checklist()
        )
        return format_html(
            '<div class="seo-server-score"><strong>{}% — {}</strong><ul>{}</ul></div>',
            obj.seo_score,
            obj.seo_grade,
            mark_safe(rows),
        )

    @admin.display(description="Content quality assistance")
    def content_quality_overview(self, obj):
        if not obj.pk:
            return "Save the draft to generate content-quality guidance."
        rows = "".join(
            f'<li class="{("seo-pass" if item["passed"] else "seo-fail")}">'
            f'{"✓" if item["passed"] else "•"} {item["label"]}</li>'
            for item in obj.content_quality_checklist()
        )
        return format_html('<div class="seo-server-score"><ul>{}</ul></div>', mark_safe(rows))

    @admin.display(description="Google search preview")
    def search_preview(self, obj):
        title = obj.effective_title if obj.pk else "Your SEO title preview"
        description = obj.effective_description if obj.pk else "Your meta description will appear here."
        path_value = obj.get_absolute_url() if obj.pk else "/blog/your-article/"
        return format_html(
            '<div class="serp-preview"><div class="serp-url">ECOG Core Technologies › {}</div>'
            '<div class="serp-title">{}</div><div class="serp-description">{}</div></div>',
            path_value,
            title,
            description,
        )

    def _transition(self, request, queryset, status, label):
        count = queryset.update(status=status)
        self.message_user(request, f"{count} article(s) moved to {label}.", messages.SUCCESS)

    @admin.action(description="Send selected articles to SEO review")
    def send_to_seo_review(self, request, queryset):
        self._transition(request, queryset, Blog.Status.SEO_REVIEW, "SEO Review")

    @admin.action(description="Send selected articles to content review")
    def send_to_content_review(self, request, queryset):
        self._transition(request, queryset, Blog.Status.CONTENT_REVIEW, "Content Review")

    @admin.action(description="Approve selected articles")
    def approve(self, request, queryset):
        self._transition(request, queryset, Blog.Status.APPROVED, "Approved")

    @admin.action(description="Publish selected SEO-ready articles")
    def publish(self, request, queryset):
        ready_ids = []
        for blog in queryset:
            required = [item for item in blog.seo_checklist() if item["required"]]
            if all(item["passed"] for item in required):
                ready_ids.append(blog.pk)
        Blog.objects.filter(pk__in=ready_ids).update(status=Blog.Status.PUBLISHED)
        blocked = queryset.count() - len(ready_ids)
        if blocked:
            self.message_user(
                request,
                f"{blocked} article(s) were not published because required SEO items are missing.",
                messages.WARNING,
            )
        if ready_ids:
            self.message_user(request, f"{len(ready_ids)} article(s) published.", messages.SUCCESS)

    @admin.action(description="Move selected articles back to draft")
    def unpublish(self, request, queryset):
        self._transition(request, queryset, Blog.Status.DRAFT, "Draft")


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ("name", "blog", "created_at", "is_approved")
    list_filter = ("is_approved", "created_at")
    search_fields = ("name", "email", "content")
    list_editable = ("is_approved",)
    readonly_fields = ("blog", "name", "email", "content", "created_at")


@admin.register(BlogRevision)
class BlogRevisionAdmin(admin.ModelAdmin):
    list_display = ("blog", "created_at", "created_by")
    list_filter = ("created_at",)
    search_fields = ("blog__title", "created_by__username")
    readonly_fields = ("blog", "snapshot", "created_by", "created_at")
    actions = ("restore_revision",)

    def has_add_permission(self, request):
        return False

    @admin.action(description="Restore the selected revision")
    def restore_revision(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, "Select exactly one revision to restore.", messages.WARNING)
            return
        revision = queryset.first()
        blog = revision.blog
        BlogRevision.objects.create(
            blog=blog,
            created_by=request.user,
            snapshot={
                "title": blog.title,
                "slug": blog.slug,
                "hero_description": blog.hero_description or "",
                "article_content": blog.article_content,
                "meta_title": blog.meta_title,
                "meta_description": blog.meta_description,
                "status": blog.status,
                "publish_date": blog.publish_date.isoformat(),
            },
        )
        snapshot = revision.snapshot
        for field in ("title", "slug", "hero_description", "article_content", "meta_title", "meta_description", "status"):
            if field in snapshot:
                setattr(blog, field, snapshot[field])
        if snapshot.get("publish_date"):
            blog.publish_date = parse_datetime(snapshot["publish_date"]) or blog.publish_date
        blog.last_edited_by = request.user
        blog.save()
        self.message_user(request, "The selected revision was restored. A backup of the previous state was kept.", messages.SUCCESS)


@admin.register(BlogSlugRedirect)
class BlogSlugRedirectAdmin(admin.ModelAdmin):
    list_display = ("old_slug", "blog", "created_at")
    search_fields = ("old_slug", "blog__title")
    readonly_fields = ("old_slug", "blog", "created_at")

    def has_add_permission(self, request):
        return False


@admin.register(BlogImageAsset)
class BlogImageAssetAdmin(admin.ModelAdmin):
    list_display = ("original_filename", "created_at", "uploaded_by")
    search_fields = ("original_filename",)
    readonly_fields = ("image", "original_filename", "created_at", "uploaded_by")

    def has_add_permission(self, request):
        return False
