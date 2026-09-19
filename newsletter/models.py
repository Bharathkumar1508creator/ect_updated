from blog.models import NewsletterSubscriber


class Subscriber(NewsletterSubscriber):
    class Meta:
        proxy = True
        app_label = "newsletter"
        verbose_name = "Newsletter subscriber"
        verbose_name_plural = "Newsletter subscribers"
