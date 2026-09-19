from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from .models import (
    SiteSettings, Service, TeamMember, Testimonial, FAQ,
    ContactMessage, Career, JobApplication,
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

def career(request):
    context = get_common_context()
    context['careers'] = Career.objects.filter(is_active=True).order_by('-created_at')
    
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        career_id = request.POST.get('career_id')
        resume = request.FILES.get('resume')
        cover_letter = request.POST.get('cover_letter', '')
        
        if name and email and phone and career_id and resume:
            try:
                career_obj = Career.objects.get(id=career_id)
                JobApplication.objects.create(
                    career=career_obj,
                    name=name,
                    email=email,
                    phone=phone,
                    resume=resume,
                    cover_letter=cover_letter
                )
                messages.success(request, 'Your application has been submitted successfully!')
            except Career.DoesNotExist:
                messages.error(request, 'Selected position does not exist.')
        else:
            messages.error(request, 'Please fill in all required fields.')
            
        return redirect('career')
        
    return render(request, 'career.html', context)

def contact(request):
    context = get_common_context()
    
    if request.method == 'POST':
        name = request.POST.get('name')
        company = request.POST.get('company', '')
        email = request.POST.get('email')
        phone = request.POST.get('phone', '')
        category = request.POST.get('category', '')
        subject = request.POST.get('subject', '')
        message = request.POST.get('message')
        
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('Accept') == 'application/json'

        if name and email and message:
            ContactMessage.objects.create(
                name=name,
                company=company,
                email=email,
                phone=phone,
                category=category,
                subject=subject,
                message=message
            )
            
            if is_ajax:
                from django.http import JsonResponse
                return JsonResponse({'status': 'success', 'message': 'Your message has been sent successfully!'})
                
            messages.success(request, 'Your message has been sent successfully!')
            return redirect('contact')
        else:
            if is_ajax:
                from django.http import JsonResponse
                return JsonResponse({'status': 'error', 'message': 'Please fill in all required fields.'}, status=400)
                
            messages.error(request, 'Please fill in all required fields.')
            
    return render(request, 'contact.html', context)

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
