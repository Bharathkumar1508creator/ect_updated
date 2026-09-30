from django.shortcuts import render, redirect, get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.views.decorators.http import require_GET
from django.urls import reverse
from .models import (
    SiteSettings, Service, TeamMember, Testimonial,
    ProjectCategory, Project, ProjectSection, SocialMediaCard,
    DigitalMarketingOverview
)
from blog.models import Blog
from .seo import build_page_seo, build_project_seo

def get_common_context(request=None, page_name=None, **seo_options):
    # Footer data and consistent SEO metadata shared by public pages.
    site_settings = SiteSettings.objects.first()
    context = {'site_settings': site_settings}
    if request is not None and page_name:
        context.update(build_page_seo(page_name, site_settings=site_settings, **seo_options))
    return context


def get_project_social_image_url(request, project):
    for field in (project.og_image, project.hero_image):
        if not field:
            continue
        try:
            return request.build_absolute_uri(field.url)
        except (ValueError, AttributeError):
            continue
    return ''

def index(request):
    context = get_common_context(request, 'index')
    context['services'] = Service.objects.filter(is_active=True).order_by('order')[:6]
    testimonials = Testimonial.objects.filter(is_active=True)
    context['testimonials'] = testimonials
    context['testimonials_json'] = [
        {
            'name': t.name,
            'company': t.company or '',
            'message': t.message,
            'initial': t.name[:1].upper() if t.name else '',
        }
        for t in testimonials
    ]
    context['latest_blogs'] = Blog.objects.publicly_visible().select_related('category').order_by('-publish_date')[:3]
    context['work_projects'] = Project.objects.filter(status='published').select_related('category').order_by('display_order')[:6]
    return render(request, 'index.html', context)

def about(request):
    context = get_common_context(request, 'about')
    context['team_members'] = TeamMember.objects.filter(is_active=True).order_by('order')
    return render(request, 'about.html', context)

@require_GET
def career(request):
    # Applications are intentionally handled only by the Zoho Recruit links in
    # the template. Historical Career and JobApplication rows remain untouched.
    return render(request, 'career.html', get_common_context(request, 'career'))


@require_GET
def contact(request):
    # Enquiries are submitted directly to Zoho Bigin by the embedded form.
    # This endpoint no longer accepts or stores contact data locally.
    return render(request, 'contact.html', get_common_context(request, 'contact'))


def digital(request):
    return render(request, 'digital.html', get_common_context(request, 'digital'))

def digital_marketing_detail(request, slug):
    context = get_common_context()

    project = get_object_or_404(Project, slug=slug, category__slug='digital-marketing', status='published')

    overview = getattr(project, 'dm_overview', None)
    social_cards = project.social_cards.filter(status='published').order_by('display_order')

    # Next Project (same category, loop back)
    same_category_projects = list(Project.objects.filter(
        category=project.category,
        status='published'
    ).order_by('display_order', 'id'))

    next_project = project.next_project_override
    if next_project and next_project.status != 'published':
        next_project = None
    if next_project is None and len(same_category_projects) > 1:
        current_index = -1
        for i, p in enumerate(same_category_projects):
            if p.id == project.id:
                current_index = i
                break

        if current_index != -1:
            next_index = (current_index + 1) % len(same_category_projects)
            next_project = same_category_projects[next_index]
    else:
        # Fallback to any project
        all_projects = list(Project.objects.filter(status='published').exclude(id=project.id).order_by('display_order', 'id'))
        if all_projects:
            next_project = all_projects[0]

    # Related Projects for Innovation Section (exclude current, limit 3)
    manual_related = project.related_projects.filter(status='published').exclude(id=project.id)[:3]
    if manual_related:
        related_projects = manual_related
    else:
        related_projects = Project.objects.filter(
            category=project.category,
            status='published'
        ).exclude(id=project.id).order_by('display_order', 'id')[:3]

    if not related_projects.exists():
        related_projects = Project.objects.filter(status='published').exclude(id=project.id).order_by('display_order', 'id')[:3]

    sections = project.sections.filter(status='published').order_by('section_order')

    social_image_url = get_project_social_image_url(request, project)
    context.update(build_project_seo(
        project,
        canonical_path=reverse('digital_marketing_detail', args=[project.slug]),
        image_url=social_image_url,
    ))
    context.update({
        'project': project,
        'overview': overview,
        'social_cards': social_cards,
        'sections': sections,
        'next_project': next_project,
        'related_projects': related_projects,
        'social_image_url': social_image_url,
        'seo_image_alt': project.og_image_alt or project.hero_image_alt or project.title,
    })

    return render(request, 'projects/digital_marketing_detail.html', context)

def project_list(request):
    context = get_common_context()

    projects = Project.objects.filter(status='published').select_related('category').order_by('display_order')
    categories = (
        ProjectCategory.objects.filter(status='published')
        .annotate(
            published_project_count=Count(
                'projects',
                filter=Q(projects__status='published'),
            )
        )
        .filter(published_project_count__gt=0)
        .order_by('display_order', 'name')
    )

    # Search
    search_query = request.GET.get('search', '')
    if search_query:
        projects = projects.filter(
            Q(title__icontains=search_query) |
            Q(short_description__icontains=search_query)
        )

    # Filter by category
    category_slug = request.GET.get('category', '')
    if category_slug:
        projects = projects.filter(category__slug=category_slug)

    # Keep the first response small; subsequent pages are appended by the
    # accessible Load More control without downloading every project at once.
    paginator = Paginator(projects, 9)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    canonical_path = reverse('project_list')
    robots = None
    if search_query or category_slug:
        robots = 'noindex,follow'
    elif page_obj.number > 1:
        canonical_path = f"{canonical_path}?page={page_obj.number}"
    context.update(build_page_seo(
        'project_list',
        site_settings=context['site_settings'],
        canonical_path=canonical_path,
        robots=robots,
    ))

    context.update({
        'projects': page_obj,
        'categories': categories,
        'current_category': category_slug,
        'search_query': search_query,
        'latest_projects': Project.objects.filter(status='published').order_by('-created_at')[:5],
    })

    return render(request, 'projects/project_list.html', context)

def project_detail(request, slug):
    context = get_common_context()

    project = get_object_or_404(
        Project.objects.select_related('category'),
        slug=slug,
        status='published',
    )
    if project.category.slug == 'digital-marketing':
        return redirect('digital_marketing_detail', slug=project.slug, permanent=True)

    sections = project.sections.filter(status='published').order_by('section_order')

    # Next Project (same category, loop back)
    same_category_projects = list(Project.objects.filter(
        category=project.category,
        status='published'
    ).order_by('display_order', 'id'))

    next_project = project.next_project_override
    if next_project and next_project.status != 'published':
        next_project = None
    if next_project is None and len(same_category_projects) > 1:
        current_index = -1
        for i, p in enumerate(same_category_projects):
            if p.id == project.id:
                current_index = i
                break

        if current_index != -1:
            next_index = (current_index + 1) % len(same_category_projects)
            next_project = same_category_projects[next_index]

    # Related Projects (same category, exclude current, limit 3)
    manual_related = list(
        project.related_projects.filter(status='published').exclude(id=project.id)[:12]
    )
    if manual_related:
        related_projects = manual_related
    else:
        related_projects = list(Project.objects.filter(
            category=project.category,
            status='published'
        ).exclude(id=project.id).order_by('display_order', 'id')[:12])

    if not related_projects:
        related_projects = list(
            Project.objects.filter(status='published')
            .exclude(id=project.id)
            .order_by('display_order', 'id')[:12]
        )

    social_image_url = get_project_social_image_url(request, project)
    context.update(build_project_seo(
        project,
        canonical_path=reverse('project_detail', args=[project.slug]),
        image_url=social_image_url,
    ))
    context.update({
        'project': project,
        'sections': sections,
        'next_project': next_project,
        'related_projects': related_projects,
        'social_image_url': social_image_url,
        'seo_image_alt': project.og_image_alt or project.hero_image_alt or project.title,
    })

    return render(request, 'projects/project_detail.html', context)

def hr(request):
    return render(request, 'hr.html', get_common_context(request, 'hr'))

def it_infrastructure(request):
    return render(request, 'it_Infrastructure.html', get_common_context(request, 'it_infrastructure'))

def software(request):
    return render(request, 'software.html', get_common_context(request, 'software'))

def website(request):
    return render(request, 'website.html', get_common_context(request, 'website'))

def zoho(request):
    return render(request, 'zoho.html', get_common_context(request, 'zoho'))

def under(request):
    return render(request, 'under.html', get_common_context(request, 'under'))
