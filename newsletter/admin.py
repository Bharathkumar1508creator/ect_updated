import csv

from django.contrib import admin
from django.http import HttpResponse

from .models import Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "subscribed_at", "is_active", "source", "consent_given")
    list_filter = ("is_active", "consent_given", "source", "subscribed_at")
    search_fields = ("email",)
    readonly_fields = ("email", "subscribed_at", "source", "consent_given")
    date_hierarchy = "subscribed_at"
    actions = ("activate", "deactivate", "export_csv")

    def has_add_permission(self, request):
        return False

    @admin.action(description="Activate selected subscribers")
    def activate(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected subscribers")
    def deactivate(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description="Export selected subscribers as CSV")
    def export_csv(self, request, queryset):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="newsletter-subscribers.csv"'
        writer = csv.writer(response)
        writer.writerow(["Email", "Subscribed at", "Active", "Source", "Consent"])
        for subscriber in queryset:
            writer.writerow([
                subscriber.email,
                subscriber.subscribed_at.isoformat(),
                subscriber.is_active,
                subscriber.source,
                subscriber.consent_given,
            ])
        return response
