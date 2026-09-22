from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('index.html', RedirectView.as_view(pattern_name='index', permanent=True, query_string=True), name='index_html'),
    path('about.html', RedirectView.as_view(pattern_name='about', permanent=True, query_string=True), name='about_html'),
    path('about/', views.about, name='about'),
    path('career.html', RedirectView.as_view(pattern_name='career', permanent=True, query_string=True), name='career_html'),
    path('career/', views.career, name='career'),
    path('contact.html', RedirectView.as_view(pattern_name='contact', permanent=True, query_string=True), name='contact_html'),
    path('contact/', views.contact, name='contact'),
    path('projects/', views.project_list, name='project_list'),
    path('projects/<slug:slug>/', views.project_detail, name='project_detail'),
    path('digital.html', RedirectView.as_view(pattern_name='digital', permanent=True, query_string=True), name='digital_html'),
    path('digital/', views.digital, name='digital'),
    path('digital-marketing/<slug:slug>/', views.digital_marketing_detail, name='digital_marketing_detail'),
    path('hr.html', RedirectView.as_view(pattern_name='hr', permanent=True, query_string=True), name='hr_html'),
    path('hr/', views.hr, name='hr'),
    path('it_infrastructure.html', RedirectView.as_view(pattern_name='it_infrastructure', permanent=True, query_string=True), name='it_infrastructure_html'),
    path('it-infrastructure/', views.it_infrastructure, name='it_infrastructure'),
    path('software.html', RedirectView.as_view(pattern_name='software', permanent=True, query_string=True), name='software_html'),
    path('software/', views.software, name='software'),
    path('website.html', RedirectView.as_view(pattern_name='website', permanent=True, query_string=True), name='website_html'),
    path('website/', views.website, name='website'),
    path('zoho.html', RedirectView.as_view(pattern_name='zoho', permanent=True, query_string=True), name='zoho_html'),
    path('zoho/', views.zoho, name='zoho'),
    path('under.html', RedirectView.as_view(pattern_name='under', permanent=True, query_string=True), name='under_html'),
    path('under/', views.under, name='under'),
]
