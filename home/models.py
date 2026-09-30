from django.db import models

class SiteSettings(models.Model):
    contact_email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return "Site Configuration"

class Service(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon_class = models.CharField(max_length=100, blank=True, null=True, help_text="CSS class for the icon (e.g., 'fa fa-laptop')")
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class TeamMember(models.Model):
    name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255)
    image = models.ImageField(upload_to='team/', blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Testimonial(models.Model):
    name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    image = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"{self.name} - {self.designation}"

class FAQ(models.Model):
    question = models.CharField(max_length=500)
    answer = models.TextField()
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.question

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Blog(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    author = models.CharField(max_length=255, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    image = models.ImageField(upload_to='blogs/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    category = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.name} - {self.subject}"

class Career(models.Model):
    title = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    requirements = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class JobApplication(models.Model):
    career = models.ForeignKey(Career, on_delete=models.CASCADE, related_name='applications')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    resume = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(blank=True, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-applied_at']

    def __str__(self):
        return f"Application from {self.name} for {self.career.title}"


# =====================================================================
# PROJECTS & DIGITAL MARKETING SYSTEM MODELS
# =====================================================================

class ProjectCategory(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    short_description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Project Categories"
        ordering = ['display_order']

    def __str__(self):
        return self.name

class Project(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Uploaded Video'),
        ('youtube', 'YouTube Video'),
    )
    FOCAL_POINT_CHOICES = (
        ('center', 'Center'),
        ('top', 'Top'),
        ('bottom', 'Bottom'),
        ('left', 'Left'),
        ('right', 'Right'),
    )
    
    category = models.ForeignKey(ProjectCategory, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    short_description = models.TextField(blank=True, null=True)
    client_name = models.CharField(max_length=255, blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    
    hero_media_type = models.CharField(max_length=20, choices=MEDIA_TYPES, default='image')
    hero_image = models.ImageField(upload_to='projects/hero/images/', blank=True, null=True)
    hero_video = models.FileField(upload_to='projects/hero/videos/', blank=True, null=True)
    hero_youtube_url = models.URLField(blank=True, null=True)
    card_image = models.ImageField(
        upload_to='projects/cards/', blank=True, null=True,
        help_text='Recommended: 1200 × 950 px or larger, landscape WebP/JPG/PNG.',
    )
    card_image_alt = models.CharField(max_length=255, blank=True)
    hero_image_alt = models.CharField(max_length=255, blank=True)
    hero_focal_point = models.CharField(max_length=10, choices=FOCAL_POINT_CHOICES, default='center')

    service = models.CharField(max_length=120, blank=True)
    industry = models.CharField(max_length=120, blank=True)
    project_type = models.CharField(max_length=120, blank=True)

    overview_title = models.CharField(max_length=120, default='Overview', blank=True)
    overview_content = models.TextField(blank=True)
    overview_link_text = models.CharField(max_length=120, blank=True)
    overview_link_url = models.URLField(blank=True)
    overview_image = models.ImageField(
        upload_to='projects/overview/', blank=True, null=True,
        help_text='Recommended: 1200 × 1000 px or larger.',
    )
    overview_image_alt = models.CharField(max_length=255, blank=True)
    overview_focal_point = models.CharField(max_length=10, choices=FOCAL_POINT_CHOICES, default='center')

    showcase_image = models.ImageField(
        upload_to='projects/showcases/', blank=True, null=True,
        help_text='Recommended: 2400 × 1000 px or larger, wide landscape.',
    )
    showcase_image_alt = models.CharField(max_length=255, blank=True)
    showcase_focal_point = models.CharField(max_length=10, choices=FOCAL_POINT_CHOICES, default='center')

    approach_title = models.CharField(max_length=120, default='Approach', blank=True)
    approach_content = models.TextField(blank=True)
    approach_image = models.ImageField(
        upload_to='projects/approach/', blank=True, null=True,
        help_text='Recommended: 1200 × 1000 px or larger.',
    )
    approach_image_alt = models.CharField(max_length=255, blank=True)
    approach_focal_point = models.CharField(max_length=10, choices=FOCAL_POINT_CHOICES, default='center')

    impact_title = models.CharField(max_length=120, default='Impact', blank=True)
    impact_content = models.TextField(blank=True)
    impact_image = models.ImageField(
        upload_to='projects/impact/', blank=True, null=True,
        help_text='Recommended: 1200 × 1000 px or larger.',
    )
    impact_image_alt = models.CharField(max_length=255, blank=True)
    impact_focal_point = models.CharField(max_length=10, choices=FOCAL_POINT_CHOICES, default='center')
    
    display_order = models.IntegerField(default=0)
    featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    button_text = models.CharField(max_length=100, blank=True, null=True)
    button_url = models.URLField(blank=True, null=True)
    open_button_new_tab = models.BooleanField(default=False)

    next_project_override = models.ForeignKey(
        'self', on_delete=models.SET_NULL, blank=True, null=True,
        related_name='previous_project_overrides',
        help_text='Optional. Leave empty to use the next published project by display order.',
    )
    next_project_image = models.ImageField(
        upload_to='projects/next/', blank=True, null=True,
        help_text='Optional custom image for this page’s next-project panel. Recommended: 2400 × 1000 px or larger.',
    )
    next_project_image_alt = models.CharField(max_length=255, blank=True)
    next_project_focal_point = models.CharField(
        max_length=10, choices=FOCAL_POINT_CHOICES, default='center',
    )
    next_project_button_text = models.CharField(
        max_length=100, default='View Next Project', blank=True,
    )
    related_projects = models.ManyToManyField(
        'self', symmetrical=False, blank=True, related_name='manually_related_from',
        help_text='Optional. Select up to twelve recommendations; otherwise related projects are chosen automatically.',
    )
    
    seo_title = models.CharField(max_length=255, blank=True, null=True)
    seo_description = models.TextField(blank=True, null=True)
    seo_keywords = models.TextField(blank=True, null=True)
    og_image = models.ImageField(upload_to='projects/seo/', blank=True, null=True)
    og_image_alt = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return self.title

    def image_alt(self, field_name, section_name):
        value = getattr(self, field_name, '')
        return value.strip() if value else f'{self.title} {section_name}'.strip()

class ProjectSection(models.Model):
    LAYOUT_CHOICES = (
        ('TEXT_LEFT_MEDIA_RIGHT', 'Text Left | Media Right'),
        ('MEDIA_LEFT_TEXT_RIGHT', 'Media Left | Text Right'),
        ('FULL_WIDTH_MEDIA', 'Full Width Media'),
        ('TEXT_ONLY', 'Text Only'),
        ('MEDIA_ONLY', 'Media Only'),
    )
    MEDIA_TYPES = (
        ('none', 'None'),
        ('image', 'Image'),
        ('video', 'Uploaded Video'),
        ('youtube', 'YouTube Video'),
    )
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sections')
    section_order = models.IntegerField(default=0)
    layout_type = models.CharField(max_length=50, choices=LAYOUT_CHOICES, default='TEXT_LEFT_MEDIA_RIGHT')
    title = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES, default='none')
    image = models.ImageField(upload_to='projects/sections/images/', blank=True, null=True)
    video = models.FileField(upload_to='projects/sections/videos/', blank=True, null=True)
    youtube_url = models.URLField(blank=True, null=True)
    
    button_text = models.CharField(max_length=100, blank=True, null=True)
    button_url = models.URLField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['section_order']

    def __str__(self):
        return f"{self.project.title} - Section {self.section_order}"

class SocialMediaCard(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='social_cards', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='digital_marketing/social_cards/')
    youtube_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    display_order = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return self.title

class DigitalMarketingOverview(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Uploaded Video'),
        ('youtube', 'YouTube Video'),
    )
    
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='dm_overview', null=True, blank=True)
    
    hero_title = models.CharField(max_length=255, blank=True, null=True)
    hero_description = models.TextField(blank=True, null=True)
    hero_media_type = models.CharField(max_length=20, choices=MEDIA_TYPES, default='image')
    hero_image = models.ImageField(upload_to='digital_marketing/hero/images/', blank=True, null=True)
    hero_video = models.FileField(upload_to='digital_marketing/hero/videos/', blank=True, null=True)
    hero_youtube_url = models.URLField(blank=True, null=True)
    
    innovation_title = models.CharField(max_length=255, default="Innovation That Drives Results")
    innovation_description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    def __str__(self):
        return f"{self.project.title} - Overview" if self.project else "Digital Marketing Overview"

    class Meta:
        verbose_name = "Digital Marketing Overview"
        verbose_name_plural = "Digital Marketing Overview"

