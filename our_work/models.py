from django.db import models

from home.models import Project, ProjectCategory


class WebsiteProjectCategory(ProjectCategory):
    class Meta:
        proxy = True
        verbose_name = 'Website Project Category'
        verbose_name_plural = 'Website Project Categories'


class WebsiteProject(Project):
    class Meta:
        proxy = True
        verbose_name = 'Website Project'
        verbose_name_plural = 'Website Projects'
