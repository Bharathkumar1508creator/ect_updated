from django import template
from django.utils.safestring import mark_safe

from blog.utils import sanitize_article_html


register = template.Library()


@register.filter
def sanitized_rich_html(value):
    """Allow the project's documented rich-text subset and remove executable HTML."""
    return mark_safe(sanitize_article_html(value or ""))
