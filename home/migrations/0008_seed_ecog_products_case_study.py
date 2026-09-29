from django.db import migrations


OVERVIEW = """EcoG Products is a sustainable products company focused on providing environmentally responsible alternatives to conventional disposable and plastic-based products. Its product portfolio includes areca leaf plates and bowls, sugarcane tableware, paper cups, paper-based essentials, biodegradable carry bags, food packaging materials, wooden products, tissues, rolls, party supplies, and selected organic products. The company aims to make eco-friendly choices practical, accessible, and suitable for everyday requirements.

EcoG Products serves individual consumers, households, restaurants, hotels, bakeries, catering businesses, event organisers, educational institutions, corporate offices, retailers, distributors, and wholesale buyers. Its products are suitable for daily use, food service, takeaway packaging, celebrations, weddings, religious functions, corporate gatherings, and large-scale events. By offering sustainable solutions for both personal and commercial needs, EcoG Products encourages responsible consumption and supports customers and businesses in reducing their dependence on conventional disposable materials."""

APPROACH = """We began by understanding EcoG Products customer segments, behavior, and the differences between retail and bulk orders. These insights guided us in creating an ecommerce experience for B2C and B2B customers while protecting wholesale pricing. The interface was designed to reflect the brand's identity and simplify product discovery.

Products were organized by category, material, occasion, and intended usage. Retail customers can purchase directly, while quantities exceeding the limit are redirected to an enquiry process for pricing. Responsive layouts and product information ensure a clear shopping experience."""

IMPACT = """The solution created a clear and efficient shopping journey for both retail and bulk customers. B2C users can explore products, view prices, and purchase directly, while B2B buyers can request customized pricing without exposing wholesale rates publicly.

Occasion-based and usage-based product discovery helps customers identify suitable eco-friendly alternatives without extensive searching. The responsive experience improves accessibility across desktop and mobile devices, strengthens EcoG Products' digital presence, supports informed purchasing decisions, generates qualified bulk enquiries, and enables the business to serve diverse customer segments through a single platform."""


def populate_case_study(apps, schema_editor):
    Project = apps.get_model('home', 'Project')
    project = Project.objects.filter(slug='excel-packs', title='Excel Packs').first()
    if not project:
        return
    project.title = 'EcoG Products'
    project.short_description = 'A responsive B2C and B2B ecommerce experience for sustainable products and bulk enquiries.'
    project.client_name = 'EcoG Products'
    project.service = 'Website Development'
    project.industry = 'Sustainable Products and Ecommerce'
    project.project_type = 'Ecommerce Website'
    project.overview_title = 'Overview'
    project.overview_content = OVERVIEW
    project.overview_link_text = 'ECOG PRODUCTS'
    project.overview_link_url = 'https://ecogproducts.in/'
    project.approach_title = 'Approach'
    project.approach_content = APPROACH
    project.impact_title = 'Impact'
    project.impact_content = IMPACT
    project.button_text = 'Visit Live Site'
    project.button_url = 'https://ecogproducts.in/'
    project.open_button_new_tab = True
    project.hero_image_alt = 'EcoG Products ecommerce website showcase'
    project.card_image_alt = 'EcoG Products ecommerce website project'
    project.overview_image_alt = 'EcoG Products responsive ecommerce website on multiple devices'
    project.showcase_image_alt = 'EcoG Products ecommerce pages and product catalogue'
    project.approach_image_alt = 'EcoG Products online shop category and product discovery interface'
    project.impact_image_alt = 'EcoG Products ecommerce product detail pages'
    project.og_image_alt = 'EcoG Products website development case study'
    project.seo_title = 'EcoG Products Ecommerce Website Case Study | ECOG'
    project.seo_description = 'See how ECOG created a responsive B2C and B2B ecommerce experience for EcoG Products, supporting sustainable shopping and qualified bulk enquiries.'
    project.save()


def reverse_case_study(apps, schema_editor):
    Project = apps.get_model('home', 'Project')
    project = Project.objects.filter(slug='excel-packs', title='EcoG Products').first()
    if not project:
        return
    project.title = 'Excel Packs'
    project.short_description = 'Landing page'
    for field in (
        'client_name', 'service', 'industry', 'project_type', 'overview_content',
        'overview_link_text', 'overview_link_url', 'approach_content', 'impact_content',
        'hero_image_alt', 'card_image_alt', 'overview_image_alt', 'showcase_image_alt',
        'approach_image_alt', 'impact_image_alt', 'og_image_alt', 'seo_title',
        'seo_description',
    ):
        setattr(project, field, '')
    project.button_text = None
    project.button_url = None
    project.open_button_new_tab = False
    project.save()


class Migration(migrations.Migration):
    dependencies = [('home', '0007_project_approach_content_and_more')]
    operations = [migrations.RunPython(populate_case_study, reverse_case_study)]
