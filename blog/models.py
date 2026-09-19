import re
from decimal import Decimal
from html import unescape

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.html import strip_tags
from django.utils.text import slugify


def unique_slug(instance, value, *, field_name="slug"):
    """Create a readable unique slug without silently replacing a live URL."""
    base = slugify(value)[:180] or "article"
    candidate = base
    counter = 2
    queryset = type(instance).objects.all()
    if instance.pk:
        queryset = queryset.exclude(pk=instance.pk)
    while queryset.filter(**{field_name: candidate}).exists():
        suffix = f"-{counter}"
        candidate = f"{base[:200 - len(suffix)]}{suffix}"
        counter += 1
    return candidate


class BlogCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    def clean(self):
        duplicate = type(self).objects.filter(name__iexact=self.name.strip())
        if self.pk:
            duplicate = duplicate.exclude(pk=self.pk)
        if duplicate.exists():
            raise ValidationError({"name": "A category with this name already exists."})

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        if not self.slug:
            self.slug = unique_slug(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Blog Categories"
        ordering = ("name",)


class BlogTag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    def clean(self):
        duplicate = type(self).objects.filter(name__iexact=self.name.strip())
        if self.pk:
            duplicate = duplicate.exclude(pk=self.pk)
        if duplicate.exists():
            raise ValidationError({"name": "A tag with this name already exists."})

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        if not self.slug:
            self.slug = unique_slug(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ("name",)


class BlogQuerySet(models.QuerySet):
    def publicly_visible(self):
        now = timezone.now()
        return self.filter(
            models.Q(status=Blog.Status.PUBLISHED)
            | models.Q(status=Blog.Status.SCHEDULED, publish_date__lte=now)
        )

    def indexable(self):
        return self.publicly_visible().filter(robots_index=True, include_in_sitemap=True)


class Blog(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SEO_REVIEW = "seo_review", "SEO Review"
        CONTENT_REVIEW = "content_review", "Content Review"
        APPROVED = "approved", "Approved"
        SCHEDULED = "scheduled", "Scheduled"
        PUBLISHED = "published", "Published"

    class SearchIntent(models.TextChoices):
        INFORMATIONAL = "informational", "Informational"
        COMMERCIAL = "commercial", "Commercial"
        TRANSACTIONAL = "transactional", "Transactional"
        NAVIGATIONAL = "navigational", "Navigational"

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, max_length=200)
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL, null=True, related_name="blogs"
    )
    tags = models.ManyToManyField(BlogTag, blank=True, related_name="blogs")
    related_blogs = models.ManyToManyField(
        "self", blank=True, symmetrical=False, related_name="recommended_by"
    )

    # Authorship and trust
    author = models.CharField(max_length=100, default="Ragupathi Namachivayam")
    author_designation = models.CharField(max_length=120, blank=True)
    author_bio = models.TextField(blank=True, max_length=600)
    author_photo = models.ImageField(upload_to="blog/authors/", blank=True, null=True)
    author_profile_url = models.URLField(blank=True)
    reviewed_by = models.CharField(max_length=120, blank=True)

    # Hero
    HERO_MEDIA_CHOICES = (("image", "Image"), ("video", "Video"))
    hero_media_type = models.CharField(
        max_length=10, choices=HERO_MEDIA_CHOICES, default="image"
    )
    hero_image = models.ImageField(upload_to="blog/hero/", blank=True, null=True)
    hero_image_alt = models.CharField(max_length=200, blank=True)
    hero_video = models.FileField(upload_to="blog/hero_videos/", blank=True, null=True)
    small_headline = models.CharField(max_length=100, blank=True, null=True)
    main_headline = models.CharField(max_length=200, blank=True, null=True)
    hero_description = models.TextField(max_length=500, blank=True, null=True)

    # New single flexible editor. Legacy fields remain so current records survive.
    article_content = models.TextField(blank=True, help_text="Main rich-text article body")
    paragraph_1 = models.TextField(blank=True, null=True)
    paragraph_2 = models.TextField(blank=True, null=True)
    CONTENT_MEDIA_CHOICES = (("image", "Image"), ("video", "Video"))
    content_media_type = models.CharField(
        max_length=10, choices=CONTENT_MEDIA_CHOICES, default="image"
    )
    content_image = models.ImageField(upload_to="blog/content/", blank=True, null=True)
    content_video = models.FileField(upload_to="blog/content_videos/", blank=True, null=True)
    image_alt = models.CharField(max_length=200, blank=True, null=True)
    image_caption = models.CharField(max_length=200, blank=True, null=True)
    video_caption = models.CharField(max_length=200, blank=True, null=True)
    paragraph_3 = models.TextField(blank=True, null=True)
    paragraph_4 = models.TextField(blank=True, null=True)
    paragraph_5 = models.TextField(blank=True, null=True)

    reading_time = models.PositiveIntegerField(default=1, help_text="Calculated automatically")
    auto_reading_time = models.BooleanField(
        default=True,
        help_text="Turn this off to enter and keep a custom reading time.",
    )
    views = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    featured = models.BooleanField(default=False)
    allow_comments = models.BooleanField(default=True)
    publish_date = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_reviewed_at = models.DateTimeField(blank=True, null=True)
    last_edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="edited_blog_posts",
    )
    editorial_notes = models.TextField(blank=True)

    # Search metadata
    meta_title = models.CharField(max_length=150, blank=True)
    meta_description = models.TextField(max_length=300, blank=True)
    primary_keyword = models.CharField(max_length=120, blank=True)
    secondary_keywords = models.CharField(
        max_length=300, blank=True, help_text="Comma-separated supporting keywords"
    )
    meta_keywords = models.CharField(
        max_length=200,
        blank=True,
        help_text="Legacy field; retained for existing data. Google does not use it for ranking.",
    )
    search_intent = models.CharField(
        max_length=20, choices=SearchIntent.choices, default=SearchIntent.INFORMATIONAL
    )
    canonical_url = models.URLField(blank=True)
    robots_index = models.BooleanField(default=True)
    robots_follow = models.BooleanField(default=True)
    include_in_sitemap = models.BooleanField(default=True)
    sitemap_priority = models.DecimalField(max_digits=2, decimal_places=1, default=Decimal("0.7"))

    # Social previews
    open_graph_title = models.CharField(max_length=150, blank=True)
    open_graph_description = models.CharField(max_length=300, blank=True)
    open_graph_image = models.ImageField(upload_to="blog/seo/", blank=True, null=True)
    twitter_title = models.CharField(max_length=150, blank=True)
    twitter_description = models.CharField(max_length=300, blank=True)

    objects = BlogQuerySet.as_manager()

    class Meta:
        ordering = ("-publish_date",)

    def clean(self):
        super().clean()
        duplicate = type(self).objects.filter(title__iexact=self.title.strip())
        if self.pk:
            duplicate = duplicate.exclude(pk=self.pk)
        if duplicate.exists():
            raise ValidationError({"title": "A blog with this title already exists."})
        if self.status == self.Status.SCHEDULED and self.publish_date <= timezone.now():
            raise ValidationError({"publish_date": "A scheduled article needs a future date."})
        if self.sitemap_priority is not None and not 0 <= self.sitemap_priority <= 1:
            raise ValidationError({"sitemap_priority": "Sitemap priority must be between 0.0 and 1.0."})

    def save(self, *args, **kwargs):
        from .utils import prepare_article_html

        previous = type(self).objects.filter(pk=self.pk).only("slug", "canonical_url").first() if self.pk else None
        if not self.slug:
            self.slug = unique_slug(self, self.title)
        self.title = self.title.strip()
        if not self.meta_title:
            self.meta_title = self.title
        if not self.meta_description:
            source = self.hero_description or strip_tags(self.article_content or self.legacy_content)
            self.meta_description = re.sub(r"\s+", " ", source).strip()[:160]
        if not self.open_graph_title:
            self.open_graph_title = self.meta_title
        if not self.open_graph_description:
            self.open_graph_description = self.meta_description
        if not self.twitter_title:
            self.twitter_title = self.open_graph_title
        if not self.twitter_description:
            self.twitter_description = self.open_graph_description
        site_url = getattr(settings, "SITE_URL", "").rstrip("/")
        old_default = f"{site_url}/blog/{previous.slug}/" if previous and site_url else ""
        if site_url and (not self.canonical_url or self.canonical_url == old_default):
            self.canonical_url = f"{site_url}/blog/{self.slug}/"
        if not self.author:
            self.author = getattr(settings, "BLOG_DEFAULT_AUTHOR_NAME", "Ragupathi Namachivayam")
        if self.author == getattr(settings, "BLOG_DEFAULT_AUTHOR_NAME", "Ragupathi Namachivayam"):
            if not self.author_designation:
                self.author_designation = getattr(settings, "BLOG_DEFAULT_AUTHOR_DESIGNATION", "")
            if not self.author_bio:
                self.author_bio = getattr(settings, "BLOG_DEFAULT_AUTHOR_BIO", "")
            if not self.author_profile_url:
                self.author_profile_url = getattr(settings, "BLOG_DEFAULT_AUTHOR_PROFILE_URL", "")
            if not self.author_photo:
                self.author_photo = getattr(settings, "BLOG_DEFAULT_AUTHOR_PHOTO", "")
        if self.article_content:
            self.article_content = prepare_article_html(self.article_content)
            if self.auto_reading_time:
                words = len(strip_tags(self.article_content).split())
                self.reading_time = max(1, round(words / 220))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("blog:blog_detail", kwargs={"slug": self.slug})

    @property
    def effective_title(self):
        return self.meta_title or self.title

    @property
    def effective_description(self):
        if self.meta_description:
            return self.meta_description
        return (self.hero_description or strip_tags(self.article_content))[:160]

    @property
    def effective_og_title(self):
        return self.open_graph_title or self.effective_title

    @property
    def effective_og_description(self):
        return self.open_graph_description or self.effective_description

    @property
    def effective_twitter_title(self):
        return self.twitter_title or self.effective_og_title

    @property
    def effective_twitter_description(self):
        return self.twitter_description or self.effective_og_description

    @property
    def toc_items(self):
        from .utils import extract_toc

        return extract_toc(self.article_content)

    @property
    def legacy_content(self):
        return "\n".join(
            value for value in (
                self.paragraph_1,
                self.paragraph_2,
                self.paragraph_3,
                self.paragraph_4,
                self.paragraph_5,
            ) if value
        )

    @property
    def display_content(self):
        return self.article_content or self.legacy_content

    def seo_checklist(self):
        html = self.display_content or ""
        text = unescape(strip_tags(html)).lower()
        keyword = self.primary_keyword.strip().lower()
        internal_link = bool(re.search(r'<a\s+[^>]*href=["\']/(?!/)', html, re.I))
        missing_alt = bool(
            re.search(r"<img\b(?![^>]*\balt\s*=\s*[\"'][^\"']+)[^>]*>", html, re.I)
        )
        checks = [
            ("SEO title", bool(self.effective_title), True),
            ("Meta description", bool(self.effective_description), True),
            ("Clean URL slug", bool(self.slug), True),
            ("Article content", bool(text.strip()), True),
            ("At least one H2", "<h2" in html.lower(), True),
            ("Featured image", bool(self.hero_image), False),
            ("Hero image alt text", not self.hero_image or bool(self.hero_image_alt), False),
            ("Internal link", internal_link, False),
            ("All content images have alt text", not missing_alt, False),
            ("Author", bool(self.author), False),
            ("Primary keyword", bool(keyword), False),
            ("Keyword in title", not keyword or keyword in self.effective_title.lower(), False),
            ("Keyword in description", not keyword or keyword in self.effective_description.lower(), False),
        ]
        return [
            {"label": label, "passed": passed, "required": required}
            for label, passed, required in checks
        ]

    def content_quality_checklist(self):
        html = self.display_content or ""
        paragraphs = [strip_tags(item).strip() for item in re.findall(r"<p\b[^>]*>(.*?)</p>", html, re.I | re.S)]
        long_paragraphs = sum(1 for paragraph in paragraphs if len(paragraph.split()) > 180)
        plain = strip_tags(html).lower()
        checks = [
            {"label": "Introduction paragraph", "passed": bool(paragraphs and paragraphs[0])},
            {"label": "No paragraph above 180 words", "passed": long_paragraphs == 0},
            {"label": "Conclusion section", "passed": "conclusion" in plain or "final thoughts" in plain},
            {"label": "Practical example", "passed": "example" in plain or "for instance" in plain},
            {"label": "Reviewed within the last year", "passed": bool(self.last_reviewed_at and (timezone.now() - self.last_reviewed_at).days <= 365)},
        ]
        return checks

    @property
    def seo_score(self):
        checks = self.seo_checklist()
        return round(sum(item["passed"] for item in checks) / len(checks) * 100)

    @property
    def seo_grade(self):
        if self.seo_score >= 80:
            return "Ready"
        if self.seo_score >= 55:
            return "Needs improvement"
        return "Important items missing"


class BlogSlugRedirect(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name="old_slugs")
    old_slug = models.SlugField(unique=True, max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.old_slug} → {self.blog.slug}"


class BlogRevision(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name="revisions")
    snapshot = models.JSONField(default=dict)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Revision of {self.blog.title} at {self.created_at:%Y-%m-%d %H:%M}"


class BlogImageAsset(models.Model):
    image = models.ImageField(upload_to="blog/editor/%Y/%m/")
    original_filename = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.original_filename or self.image.name


class BlogComment(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name="comments")
    name = models.CharField(max_length=100)
    email = models.EmailField()
    content = models.TextField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.name} on {self.blog.title}"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    source = models.CharField(max_length=120, default="Website footer", blank=True)
    consent_given = models.BooleanField(default=True)

    class Meta:
        ordering = ("-subscribed_at",)

    def __str__(self):
        return self.email
