from django.core.management.base import BaseCommand

from home.image_utils import optimized_media_image_url
from home.models import DigitalMarketingOverview, Project, ProjectSection, SocialMediaCard


class Command(BaseCommand):
    help = "Create non-destructive WebP card variants for existing project media."

    def handle(self, *args, **options):
        fields = []
        fields.extend(project.hero_image for project in Project.objects.exclude(hero_image=""))
        fields.extend(section.image for section in ProjectSection.objects.exclude(image=""))
        fields.extend(card.image for card in SocialMediaCard.objects.exclude(image=""))
        fields.extend(item.hero_image for item in DigitalMarketingOverview.objects.exclude(hero_image=""))
        created = 0
        for field in fields:
            original_url = field.url
            if optimized_media_image_url(field) != original_url:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Verified {created} optimized media variants."))
