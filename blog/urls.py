from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    path('', views.BlogListView.as_view(), name='blog_list'),
    path('category/<slug:category_slug>/', views.BlogListView.as_view(), name='blog_list_category'),
    path('tag/<slug:tag_slug>/', views.BlogListView.as_view(), name='blog_list_tag'),
    path('feed.xml', views.LatestBlogFeed(), name='blog_feed'),
    path('newsletter/subscribe/', views.subscribe_newsletter, name='subscribe_newsletter'),
    path('preview/<int:pk>/', views.BlogPreviewView.as_view(), name='blog_preview'),
    path('<slug:slug>/', views.BlogDetailView.as_view(), name='blog_detail'),
]
