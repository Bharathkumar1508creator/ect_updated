from django.shortcuts import render, redirect, get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from django.views.decorators.http import require_GET
from .models import (
    SiteSettings, Service, TeamMember, Testimonial,
    ProjectCategory, Project, ProjectSection, SocialMediaCard,
    DigitalMarketingOverview
)
from blog.models import Blog

def get_common_context():
    # Helper to get context needed across many pages (like footer info)
    settings = SiteSettings.objects.first()
    return {
        'site_settings': settings,
    }

def index(request):
    context = get_common_context()
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
    context['work_projects'] = Project.objects.filter(status='published').order_by('display_order')[:6]
    return render(request, 'index.html', context)

def about(request):
    context = get_common_context()
    context['team_members'] = TeamMember.objects.filter(is_active=True).order_by('order')
    return render(request, 'about.html', context)

@require_GET
def career(request):
    # Applications are intentionally handled only by the Zoho Recruit links in
    # the template. Historical Career and JobApplication rows remain untouched.
    return render(request, 'career.html', get_common_context())


@require_GET
def contact(request):
    # Enquiries are submitted directly to Zoho Bigin by the embedded form.
    # This endpoint no longer accepts or stores contact data locally.
    return render(request, 'contact.html', get_common_context())


def digital(request):
    return render(request, 'digital.html', get_common_context())

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

    next_project = None
    if len(same_category_projects) > 1:
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
    related_projects = Project.objects.filter(
        category=project.category,
        status='published'
    ).exclude(id=project.id).order_by('display_order', 'id')[:3]

    if not related_projects.exists():
        related_projects = Project.objects.filter(status='published').exclude(id=project.id).order_by('display_order', 'id')[:3]

    sections = project.sections.filter(status='published').order_by('section_order')

    context.update({
        'project': project,
        'overview': overview,
        'social_cards': social_cards,
        'sections': sections,
        'next_project': next_project,
        'related_projects': related_projects,
    })

    return render(request, 'projects/digital_marketing_detail.html', context)

def project_list(request):
    context = get_common_context()

    projects = Project.objects.filter(status='published').select_related('category').order_by('display_order')
    categories = ProjectCategory.objects.filter(status='published').order_by('display_order')

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

    # Pagination (9 per page)
    paginator = Paginator(projects, 9)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

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

    project = get_object_or_404(Project, slug=slug, status='published')
    sections = project.sections.filter(status='published').order_by('section_order')

    # Next Project (same category, loop back)
    same_category_projects = list(Project.objects.filter(
        category=project.category,
        status='published'
    ).order_by('display_order', 'id'))

    next_project = None
    if len(same_category_projects) > 1:
        current_index = -1
        for i, p in enumerate(same_category_projects):
            if p.id == project.id:
                current_index = i
                break

        if current_index != -1:
            next_index = (current_index + 1) % len(same_category_projects)
            next_project = same_category_projects[next_index]

    # Related Projects (same category, exclude current, limit 3)
    related_projects = Project.objects.filter(
        category=project.category,
        status='published'
    ).exclude(id=project.id).order_by('display_order', 'id')[:3]

    context.update({
        'project': project,
        'sections': sections,
        'next_project': next_project,
        'related_projects': related_projects,
    })

    return render(request, 'projects/project_detail.html', context)

def hr(request):
    return render(request, 'hr.html', get_common_context())

def it_infrastructure(request):
    return render(request, 'it_Infrastructure.html', get_common_context())

def software(request):
    return render(request, 'software.html', get_common_context())

def website(request):
    return render(request, 'website.html', get_common_context())

def zoho(request):
    return render(request, 'zoho.html', get_common_context())

def under(request):
    return render(request, 'under.html', get_common_context())
