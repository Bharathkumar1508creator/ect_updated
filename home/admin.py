from django.contrib import admin
from .models import (
    SiteSettings, Service, TeamMember, Testimonial, FAQ, 
    ContactMessage, Career, JobApplication,
    ProjectCategory, Project, ProjectSection, SocialMediaCard,
    DigitalMarketingOverview
)

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'contact_email', 'phone')
    
    def has_add_permission(self, request):
        # Prevent adding more than one site settings instance
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'description')
    ordering = ('order',)

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'designation', 'order', 'is_active')
    list_filter = ('is_active', 'designation')
    search_fields = ('name', 'designation')
    ordering = ('order',)

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'designation', 'company', 'is_active', 'display_order')
    list_editable = ('is_active', 'display_order')
    list_filter = ('is_active',)
    search_fields = ('name', 'company', 'message')

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('question', 'answer')
    ordering = ('order',)

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'email', 'category', 'subject', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at', 'category')
    search_fields = ('name', 'company', 'email', 'subject', 'message')
    date_hierarchy = 'created_at'
    readonly_fields = ('name', 'email', 'phone', 'subject', 'message', 'created_at')

@admin.register(Career)
class CareerAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'location', 'created_at', 'is_active')
    list_filter = ('is_active', 'department', 'location')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'career', 'email', 'phone', 'applied_at')
    list_filter = ('career', 'applied_at')
    search_fields = ('name', 'email', 'phone')
    date_hierarchy = 'applied_at'
    readonly_fields = ('career', 'name', 'email', 'phone', 'resume', 'cover_letter', 'applied_at')


# =====================================================================
# PROJECTS & DIGITAL MARKETING SYSTEM ADMIN
# =====================================================================

@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'status', 'display_order')
    list_editable = ('status', 'display_order')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    list_filter = ('status',)

class ProjectSectionInline(admin.StackedInline):
    model = ProjectSection
    extra = 0
    ordering = ('section_order',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status', 'featured', 'display_order')
    list_editable = ('status', 'featured', 'display_order')
    list_filter = ('status', 'category', 'featured')
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title', 'client_name', 'short_description')
    inlines = [ProjectSectionInline]
    fieldsets = (
        ('Project Information', {
            'fields': ('category', 'title', 'slug', 'short_description', 'client_name', 'completion_date', 'display_order', 'featured', 'status')
        }),
        ('Hero Section', {
            'fields': ('hero_media_type', 'hero_image', 'hero_video', 'hero_youtube_url')
        }),
        ('Call To Action', {
            'fields': ('button_text', 'button_url', 'open_button_new_tab')
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description', 'seo_keywords', 'og_image')
        }),
    )

@admin.register(SocialMediaCard)
class SocialMediaCardAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'display_order')
    list_editable = ('status', 'display_order')
    list_filter = ('status', 'project')
    search_fields = ('title', 'description')

@admin.register(DigitalMarketingOverview)
class DigitalMarketingOverviewAdmin(admin.ModelAdmin):
    list_display = ('project', 'status')
    list_filter = ('status',)
    fieldsets = (
        ('Project Association', {
            'fields': ('project', 'status')
        }),
        ('Hero Section', {
            'fields': ('hero_title', 'hero_description', 'hero_media_type', 'hero_image', 'hero_video', 'hero_youtube_url')
        }),
        ('Innovation Section', {
            'fields': ('innovation_title', 'innovation_description')
        }),
    )

 
