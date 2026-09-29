from django import forms
from django.contrib import admin

from home.admin import OptimizedImageAdminForm, ProjectSectionInline
from home.models import Project, ProjectCategory
from .models import WebsiteProject, WebsiteProjectCategory


class WebsiteProjectAdminForm(OptimizedImageAdminForm):
    image_fields = (
        'hero_image', 'card_image', 'overview_image', 'showcase_image',
        'approach_image', 'impact_image', 'og_image',
    )
    image_sizes = {
        'card_image': (1600, 1280),
        'hero_image': (2400, 1400),
        'overview_image': (1600, 1400),
        'showcase_image': (2400, 1400),
        'approach_image': (1600, 1400),
        'impact_image': (1600, 1400),
        'og_image': (1600, 900),
    }

    class Meta:
        model = WebsiteProject
        fields = '__all__'

    def clean_related_projects(self):
        projects = self.cleaned_data.get('related_projects')
        if projects and projects.count() > 3:
            raise forms.ValidationError('Select no more than three related projects.')
        if projects and self.instance.pk and projects.filter(pk=self.instance.pk).exists():
            raise forms.ValidationError('A project cannot be related to itself.')
        return projects

    def clean(self):
        cleaned = super().clean()
        if cleaned.get('next_project_override') == self.instance:
            self.add_error('next_project_override', 'A project cannot be its own next project.')
        return cleaned


@admin.register(WebsiteProjectCategory)
class WebsiteProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'status', 'display_order')
    fields = ('name', 'slug', 'short_description', 'status', 'display_order')
    prepopulated_fields = {'slug': ('name',)}

    def get_queryset(self, request):
        return super().get_queryset(request).filter(slug='website-development')

    def has_add_permission(self, request):
        return not ProjectCategory.objects.filter(slug='website-development').exists()


@admin.register(WebsiteProject)
class WebsiteProjectAdmin(admin.ModelAdmin):
    form = WebsiteProjectAdminForm
    list_display = ('title', 'status', 'featured', 'display_order', 'updated_at')
    list_editable = ('status', 'featured', 'display_order')
    list_filter = ('status', 'featured', 'industry', 'project_type')
    search_fields = ('title', 'client_name', 'short_description', 'industry')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('related_projects',)
    inlines = (ProjectSectionInline,)
    fieldsets = (
        ('Project Status and Listing Card', {
            'fields': (
                'category', 'title', 'slug', 'status', 'featured', 'display_order',
                'card_image', 'card_image_alt',
            )
        }),
        ('Case-study Introduction', {
            'fields': (
                'short_description', 'service', 'industry', 'completion_date',
                'project_type', 'client_name',
            )
        }),
        ('Hero — recommended 2400 × 1200 px', {
            'fields': (
                'hero_media_type', 'hero_image', 'hero_video', 'hero_youtube_url',
                'hero_image_alt', 'hero_focal_point',
            )
        }),
        ('Overview', {
            'fields': (
                'overview_title', 'overview_content', 'overview_link_text',
                'overview_link_url', 'overview_image', 'overview_image_alt',
                'overview_focal_point',
            )
        }),
        ('Main Showcase and Live Site', {
            'fields': (
                'showcase_image', 'showcase_image_alt', 'showcase_focal_point',
                'button_text', 'button_url', 'open_button_new_tab',
            )
        }),
        ('Approach', {
            'fields': (
                'approach_title', 'approach_content', 'approach_image',
                'approach_image_alt', 'approach_focal_point',
            )
        }),
        ('Impact', {
            'fields': (
                'impact_title', 'impact_content', 'impact_image',
                'impact_image_alt', 'impact_focal_point',
            )
        }),
        ('Project Navigation', {
            'fields': ('next_project_override', 'related_projects')
        }),
        ('SEO and Social Sharing', {
            'fields': (
                'seo_title', 'seo_description', 'seo_keywords', 'og_image',
                'og_image_alt',
            )
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).filter(category__slug='website-development')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'category':
            kwargs['queryset'] = ProjectCategory.objects.filter(slug='website-development')
        elif db_field.name == 'next_project_override':
            kwargs['queryset'] = Project.objects.filter(
                category__slug='website-development'
            ).exclude(status='archived')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'related_projects':
            kwargs['queryset'] = Project.objects.filter(
                category__slug='website-development', status='published'
            )
        return super().formfield_for_manytomany(db_field, request, **kwargs)
