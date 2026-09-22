import json
from urllib.parse import urlencode

from django.conf import settings
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.syndication.views import Feed
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import F, Q
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

from ect.security import rate_limit_response
from django.utils.decorators import method_decorator
from django.views.generic import DetailView, ListView

from .models import Blog, BlogCategory, BlogComment, BlogSlugRedirect, BlogTag, NewsletterSubscriber


def absolute_url(request, value):
    if not value:
        return ""
    if value.startswith(("http://", "https://")):
        return value
    site_url = settings.SITE_URL or request.build_absolute_uri("/").rstrip("/")
    return f"{site_url}{value if value.startswith('/') else '/' + value}"


def robots_txt(request):
    sitemap_url = absolute_url(request, reverse("django.contrib.sitemaps.views.sitemap"))
    return HttpResponse(
        f"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /blog/preview/\nSitemap: {sitemap_url}\n",
        content_type="text/plain",
    )


class BlogListView(ListView):
    model = Blog
    template_name = "blog/blog_list.html"
    context_object_name = "blogs"
    paginate_by = 9

    def get_template_names(self):
        if self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return ["blog/_blog_list_content.html"]
        return [self.template_name]

    def get_queryset(self):
        queryset = Blog.objects.publicly_visible().select_related("category").prefetch_related("tags")
        query = self.request.GET.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(hero_description__icontains=query)
                | Q(category__name__icontains=query)
                | Q(article_content__icontains=query)
                | Q(primary_keyword__icontains=query)
                | Q(tags__name__icontains=query)
            ).distinct()
        category_slug = self.kwargs.get("category_slug")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        tag_slug = self.kwargs.get("tag_slug")
        if tag_slug:
            queryset = queryset.filter(tags__slug=tag_slug)
        return queryset.order_by("-publish_date")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        visible = Blog.objects.publicly_visible()
        context["categories"] = BlogCategory.objects.filter(blogs__in=visible).distinct()
        context["popular_tags"] = BlogTag.objects.filter(blogs__in=visible).distinct()[:10]
        context["search_query"] = self.request.GET.get("q", "")
        category_slug = self.kwargs.get("category_slug", "")
        tag_slug = self.kwargs.get("tag_slug", "")
        context["current_category"] = category_slug
        query = self.request.GET.get("q", "").strip()
        page = self.request.GET.get("page", "").strip()
        canonical_query = urlencode({"page": page}) if page and page != "1" and not query else ""
        canonical_path = self.request.path + (f"?{canonical_query}" if canonical_query else "")
        context["canonical_url"] = absolute_url(self.request, canonical_path)
        context["search_results_page"] = bool(query)
        listing_title = "Technology Insights & Business Growth Blog | ECOG"
        listing_description = (
            "Practical insights on website development, custom software, Zoho, "
            "IT infrastructure and digital transformation."
        )
        if category_slug:
            category = BlogCategory.objects.filter(slug=category_slug).first()
            if category:
                listing_title = f"{category.name} Articles | ECOG Core Technologies"
                listing_description = category.meta_description or f"Read ECOG insights and practical guidance about {category.name}."
        elif tag_slug:
            tag = BlogTag.objects.filter(slug=tag_slug).first()
            if tag:
                listing_title = f"{tag.name} Insights | ECOG Core Technologies"
                listing_description = f"Read ECOG articles, guidance and business technology insights about {tag.name}."
        breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": absolute_url(self.request, "/")},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": context["canonical_url"]},
            ],
        }
        collection = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": listing_title,
            "description": listing_description,
            "url": context["canonical_url"],
            "isPartOf": {"@type": "WebSite", "name": settings.BLOG_PUBLISHER_NAME, "url": absolute_url(self.request, "/")},
        }
        context.update({
            "listing_title": listing_title,
            "listing_description": listing_description,
            "listing_image_url": absolute_url(self.request, settings.BLOG_FALLBACK_IMAGE),
            "listing_schema_json": json.dumps(collection, ensure_ascii=False).replace("</", "<\\/"),
            "listing_breadcrumb_json": json.dumps(breadcrumb, ensure_ascii=False).replace("</", "<\\/"),
        })
        # Always show the most recently updated article in the hero, on every
        # device and regardless of search/category/pagination state.
        context["featured_blog"] = Blog.objects.publicly_visible().order_by("-updated_at").first()
        context["fallback_image_url"] = settings.BLOG_FALLBACK_IMAGE
        return context


class BlogDetailView(DetailView):
    model = Blog
    template_name = "blog/blog_detail.html"
    context_object_name = "blog"
    is_preview = False

    def get_queryset(self):
        return Blog.objects.publicly_visible().select_related("category", "last_edited_by").prefetch_related("tags")

    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except Http404:
            old = BlogSlugRedirect.objects.select_related("blog").filter(old_slug=kwargs.get("slug")).first()
            if old and Blog.objects.publicly_visible().filter(pk=old.blog_id).exists():
                return redirect(old.blog.get_absolute_url(), permanent=True)
            raise

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        blog = self.object
        if not self.is_preview:
            Blog.objects.filter(pk=blog.pk).update(views=F("views") + 1)

        manually_related = list(blog.related_blogs.publicly_visible().exclude(pk=blog.pk)[:3])
        related_ids = [item.pk for item in manually_related]
        if len(manually_related) < 3:
            same_category = Blog.objects.publicly_visible().filter(category=blog.category).exclude(
                pk__in=[blog.pk, *related_ids]
            )[: 3 - len(manually_related)]
            manually_related.extend(same_category)
            related_ids = [item.pk for item in manually_related]
        if len(manually_related) < 3:
            others = Blog.objects.publicly_visible().exclude(
                pk__in=[blog.pk, *related_ids]
            )[: 3 - len(manually_related)]
            manually_related.extend(others)
        context["related_blogs"] = manually_related
        context["prev_blog"] = Blog.objects.publicly_visible().filter(
            publish_date__lt=blog.publish_date
        ).order_by("-publish_date").first()
        context["next_blog"] = Blog.objects.publicly_visible().filter(
            publish_date__gt=blog.publish_date
        ).order_by("publish_date").first()
        context["comments"] = blog.comments.filter(is_approved=True).order_by("-created_at")

        canonical = blog.canonical_url or absolute_url(self.request, blog.get_absolute_url())
        image = blog.open_graph_image or blog.hero_image
        image_url = absolute_url(self.request, image.url) if image else ""
        publisher_logo = absolute_url(self.request, settings.BLOG_PUBLISHER_LOGO)
        schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "description": blog.effective_description,
            "datePublished": blog.publish_date.isoformat(),
            "dateModified": blog.updated_at.isoformat(),
            "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
            "author": {"@type": "Person", "name": blog.author},
            "publisher": {
                "@type": "Organization",
                "name": settings.BLOG_PUBLISHER_NAME,
                "logo": {"@type": "ImageObject", "url": publisher_logo},
            },
        }
        if image_url:
            schema["image"] = [image_url]
        if blog.author_profile_url:
            schema["author"]["url"] = blog.author_profile_url
        if blog.author_designation:
            schema["author"]["jobTitle"] = blog.author_designation
        if blog.author_photo:
            schema["author"]["image"] = absolute_url(self.request, blog.author_photo.url)
        if blog.category:
            schema["articleSection"] = blog.category.name
        tag_names = list(blog.tags.values_list("name", flat=True))
        if tag_names:
            schema["keywords"] = tag_names
        breadcrumb_schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": absolute_url(self.request, "/")},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": absolute_url(self.request, reverse("blog:blog_list"))},
                {"@type": "ListItem", "position": 3, "name": blog.title, "item": canonical},
            ],
        }
        context.update({
            "canonical_url": canonical,
            "social_image_url": image_url,
            "blog_schema_json": json.dumps(schema, ensure_ascii=False).replace("</", "<\\/"),
            "breadcrumb_schema_json": json.dumps(breadcrumb_schema, ensure_ascii=False).replace("</", "<\\/"),
            "fallback_image_url": settings.BLOG_FALLBACK_IMAGE,
            "is_preview": self.is_preview,
        })
        return context

    def post(self, request, *args, **kwargs):
        limited = rate_limit_response(request, "blog-comment")
        if limited:
            return limited
        self.object = self.get_object()
        if not self.object.allow_comments:
            messages.error(request, "Comments are disabled for this post.")
            return redirect(self.object.get_absolute_url())
        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip()
        content = request.POST.get("content", "").strip()
        if request.POST.get("website"):
            return redirect(self.object.get_absolute_url())
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "Please enter a valid email address.")
            return redirect(self.object.get_absolute_url())
        if name and content:
            BlogComment.objects.create(blog=self.object, name=name[:100], email=email, content=content[:5000])
            messages.success(request, "Your comment has been submitted and is awaiting approval.")
        else:
            messages.error(request, "Please fill out all fields.")
        return redirect(self.object.get_absolute_url())


@method_decorator(staff_member_required, name="dispatch")
class BlogPreviewView(BlogDetailView):
    """Staff-only preview for articles in any workflow state."""

    is_preview = True
    pk_url_kwarg = "pk"
    slug_url_kwarg = None

    def get_queryset(self):
        return Blog.objects.all().select_related("category", "last_edited_by").prefetch_related("tags")

class LatestBlogFeed(Feed):
    title = "ECOG Core Technologies Blog"
    link = "/blog/"
    description = "Website, software, Zoho, infrastructure and digital-growth insights."

    def items(self):
        return Blog.objects.publicly_visible()[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.effective_description

    def item_pubdate(self, item):
        return item.publish_date

    def item_updateddate(self, item):
        return item.updated_at


@require_POST
def subscribe_newsletter(request):
    limited = rate_limit_response(request, "newsletter")
    if limited:
        return limited
    email = request.POST.get("email", "").strip().lower()
    is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"
    if request.POST.get("website"):
        return JsonResponse({"ok": True, "message": "Subscription received."}) if is_ajax else redirect("index")
    try:
        validate_email(email)
    except ValidationError:
        message = "Please enter a valid email address."
        if is_ajax:
            return JsonResponse({"ok": False, "message": message}, status=400)
        messages.error(request, message)
    else:
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={"source": request.POST.get("source", "Website footer")[:120], "consent_given": True},
        )
        if not created and not subscriber.is_active:
            subscriber.is_active = True
            subscriber.consent_given = True
            subscriber.save(update_fields=["is_active", "consent_given"])
        message = "Thank you! You have been subscribed successfully." if created else "This email is already subscribed."
        if is_ajax:
            return JsonResponse({"ok": True, "message": message})
        messages.success(request, message)

    referer = request.META.get("HTTP_REFERER", "")
    if referer and url_has_allowed_host_and_scheme(
        referer, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    ):
        return redirect(referer)
    return redirect("blog:blog_list")
