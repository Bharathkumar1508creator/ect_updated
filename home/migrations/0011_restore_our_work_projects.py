import shutil
from pathlib import Path

from django.conf import settings
from django.db import migrations
from django.db.models import FileField


PROJECT_DATA = {'categories': [{'name': 'Website Development',
                 'slug': 'website-development',
                 'short_description': None,
                 'status': 'published',
                 'display_order': 1}],
 'projects': [{'title': 'EcoG Products',
               'slug': 'ecog-products',
               'short_description': 'A responsive B2C and B2B ecommerce experience for sustainable '
                                    'products and bulk enquiries.',
               'client_name': 'EcoG Products',
               'completion_date': None,
               'hero_media_type': 'image',
               'hero_image': 'projects/hero/images/Rectangle_3877.webp',
               'hero_video': '',
               'hero_youtube_url': None,
               'display_order': 1,
               'featured': 1,
               'status': 'published',
               'button_text': 'Visit Live Site',
               'button_url': 'https://ecogproducts.in/',
               'open_button_new_tab': 1,
               'seo_title': 'EcoG Products Ecommerce Website Case Study | ECOG',
               'seo_description': 'See how ECOG created a responsive B2C and B2B ecommerce '
                                  'experience for EcoG Products, supporting sustainable shopping '
                                  'and qualified bulk enquiries.',
               'seo_keywords': '',
               'og_image': 'projects/seo/Rectangle_3877.webp',
               'approach_content': 'We began by understanding EcoG Products customer segments, '
                                   'behavior, and the differences between retail and bulk orders. '
                                   'These insights guided us in creating an ecommerce experience '
                                   'for B2C and B2B customers while protecting wholesale pricing. '
                                   "The interface was designed to reflect the brand's identity and "
                                   'simplify product discovery.\r\n'
                                   '\r\n'
                                   'Products were organized by category, material, occasion, and '
                                   'intended usage. Retail customers can purchase directly, while '
                                   'quantities exceeding the limit are redirected to an enquiry '
                                   'process for pricing. Responsive layouts and product '
                                   'information ensure a clear shopping experience.',
               'approach_focal_point': 'left',
               'approach_image': 'projects/approach/Rectangle_3880.webp',
               'approach_image_alt': 'EcoG Products online shop category and product discovery '
                                     'interface',
               'approach_title': 'Approach',
               'card_image': 'projects/cards/card-1.webp',
               'card_image_alt': 'EcoG Products ecommerce website project',
               'hero_focal_point': 'center',
               'hero_image_alt': 'EcoG Products ecommerce website showcase',
               'impact_content': 'The solution created a clear and efficient shopping journey for '
                                 'both retail and bulk customers. B2C users can explore products, '
                                 'view prices, and purchase directly, while B2B buyers can request '
                                 'customized pricing without exposing wholesale rates publicly.\r\n'
                                 '\r\n'
                                 'Occasion-based and usage-based product discovery helps customers '
                                 'identify suitable eco-friendly alternatives without extensive '
                                 'searching. The responsive experience improves accessibility '
                                 "across desktop and mobile devices, strengthens EcoG Products' "
                                 'digital presence, supports informed purchasing decisions, '
                                 'generates qualified bulk enquiries, and enables the business to '
                                 'serve diverse customer segments through a single platform.',
               'impact_focal_point': 'right',
               'impact_image': 'projects/impact/Rectangle_3881.webp',
               'impact_image_alt': 'EcoG Products ecommerce product detail pages',
               'impact_title': 'Impact',
               'industry': 'Sustainable Products and Ecommerce',
               'og_image_alt': 'EcoG Products website development case study',
               'overview_content': 'EcoG Products is a sustainable products company focused on '
                                   'providing environmentally responsible alternatives to '
                                   'conventional disposable and plastic-based products. Its '
                                   'product portfolio includes areca leaf plates and bowls, '
                                   'sugarcane tableware, paper cups, paper-based essentials, '
                                   'biodegradable carry bags, food packaging materials, wooden '
                                   'products, tissues, rolls, party supplies, and selected organic '
                                   'products. The company aims to make eco-friendly choices '
                                   'practical, accessible, and suitable for everyday '
                                   'requirements.\r\n'
                                   '\r\n'
                                   'EcoG Products serves individual consumers, households, '
                                   'restaurants, hotels, bakeries, catering businesses, event '
                                   'organisers, educational institutions, corporate offices, '
                                   'retailers, distributors, and wholesale buyers. Its products '
                                   'are suitable for daily use, food service, takeaway packaging, '
                                   'celebrations, weddings, religious functions, corporate '
                                   'gatherings, and large-scale events. By offering sustainable '
                                   'solutions for both personal and commercial needs, EcoG '
                                   'Products encourages responsible consumption and supports '
                                   'customers and businesses in reducing their dependence on '
                                   'conventional disposable materials.',
               'overview_focal_point': 'center',
               'overview_image': 'projects/overview/Rectangle_3878.webp',
               'overview_image_alt': 'EcoG Products responsive ecommerce website on multiple '
                                     'devices',
               'overview_link_text': '',
               'overview_link_url': '',
               'overview_title': 'Overview',
               'project_type': 'Ecommerce Website',
               'service': 'Website Development',
               'showcase_focal_point': 'center',
               'showcase_image': 'projects/showcases/Rectangle_3879.webp',
               'showcase_image_alt': 'EcoG Products ecommerce pages and product catalogue',
               'next_project_button_text': 'View Next Project',
               'next_project_focal_point': 'center',
               'next_project_image': 'projects/next/Rectangle_3882.webp',
               'next_project_image_alt': 'excel-packs',
               'category_slug': 'website-development',
               'next_project_slug': None,
               'related_project_slugs': []},
              {'title': 'Excel packs',
               'slug': 'excel-packs',
               'short_description': '',
               'client_name': None,
               'completion_date': None,
               'hero_media_type': 'image',
               'hero_image': 'projects/hero/images/Rectangle_3877_uWH4WkR.webp',
               'hero_video': '',
               'hero_youtube_url': None,
               'display_order': 2,
               'featured': 1,
               'status': 'published',
               'button_text': 'Visit Live Site',
               'button_url': 'https://excelpacks.in/',
               'open_button_new_tab': 1,
               'seo_title': None,
               'seo_description': '',
               'seo_keywords': '',
               'og_image': '',
               'approach_content': 'Our approach focused on helping users identify suitable '
                                   'packaging machines based on their industry and specific '
                                   'requirements. We created an interactive Explore by Industry '
                                   'section with detailed pop-ups that recommend relevant machines '
                                   'and explain their applications. Users can understand suitable '
                                   'solutions for bakery, confectionery, food, and other sectors, '
                                   'including horizontal and vertical packaging systems. Clear '
                                   'machine details, product visuals, FAQs, manufacturing '
                                   'information, and enquiry-focused calls to action support the '
                                   'experience, making product discovery simpler, more '
                                   'informative, and easier for potential customers to navigate.',
               'approach_focal_point': 'center',
               'approach_image': 'projects/approach/Rectangle_3880_M8MEmOp.webp',
               'approach_image_alt': '',
               'approach_title': 'Approach',
               'card_image': 'projects/cards/454816f0343fc314c38384d0b8895b3ab8b8d186.webp',
               'card_image_alt': '',
               'hero_focal_point': 'center',
               'hero_image_alt': '',
               'impact_content': 'The industry-specific experience helps customers discover '
                                 'suitable packaging machines even when they are unsure about the '
                                 'exact model they need. Instead of browsing through multiple '
                                 'products, users can start with their industry or application and '
                                 'quickly explore relevant machinery. Detailed pop-ups provide '
                                 'useful information about machine applications, packaging '
                                 'orientation, and suitable use cases before enquiry. This '
                                 'improves product discoverability, customer understanding, '
                                 'engagement, and enquiry quality, while strengthening Excel '
                                 'Pack’s position as a reliable provider of customized industrial '
                                 'packaging and automation solutions.',
               'impact_focal_point': 'center',
               'impact_image': 'projects/impact/Rectangle_3881_Bi16DTy.webp',
               'impact_image_alt': '',
               'impact_title': 'Impact',
               'industry': 'Machine Manufacturers',
               'og_image_alt': '',
               'overview_content': 'Excel Pack is an established packaging machinery company '
                                   'delivering reliable and advanced industrial packaging '
                                   'solutions for businesses across multiple sectors. With strong '
                                   'engineering expertise and experience in packaging automation, '
                                   'the company provides machines for food packaging, pouch '
                                   'packing, flow wrapping, custom manufacturing, and other '
                                   'production needs. Its solutions are designed to support '
                                   'efficiency, consistency, and different packaging requirements '
                                   'across modern industries.\u2028'
                                   '\u2028'
                                   '\r\n'
                                   '\r\n'
                                   'For this project, we created a modern B2B packaging machinery '
                                   'landing page that presents Excel Pack’s machine portfolio, '
                                   'industry applications, manufacturing capabilities, '
                                   'certifications, company expertise, and support services within '
                                   'one structured digital experience. The website was designed to '
                                   'improve product discovery, clearly communicate technical '
                                   'strengths, and make packaging solutions easier for potential '
                                   'customers to understand. It also supports stronger brand '
                                   'positioning, better customer engagement, and a more direct '
                                   'path from product exploration to enquiry and business '
                                   'communication online channels.',
               'overview_focal_point': 'center',
               'overview_image': 'projects/overview/Rectangle_3878_BoEkYI6.webp',
               'overview_image_alt': '',
               'overview_link_text': '',
               'overview_link_url': '',
               'overview_title': 'Overview',
               'project_type': 'Corporate Wepage',
               'service': 'Webpage Development',
               'showcase_focal_point': 'center',
               'showcase_image': 'projects/showcases/Rectangle_3879_Zk2kLQv.webp',
               'showcase_image_alt': '',
               'next_project_button_text': 'View Next Project',
               'next_project_focal_point': 'center',
               'next_project_image': 'projects/next/2b15f9a3b3c724a336860cd599be053dd4122a19.webp',
               'next_project_image_alt': '',
               'category_slug': 'website-development',
               'next_project_slug': None,
               'related_project_slugs': ['ecog-products', 'ics']},
              {'title': 'ICS',
               'slug': 'ics',
               'short_description': '',
               'client_name': None,
               'completion_date': None,
               'hero_media_type': 'image',
               'hero_image': 'projects/hero/images/2b15f9a3b3c724a336860cd599be053dd4122a19_2BvFMJ9.webp',
               'hero_video': '',
               'hero_youtube_url': None,
               'display_order': 3,
               'featured': 1,
               'status': 'published',
               'button_text': 'Visit Live Site',
               'button_url': 'https://integratedconcretesolutions.in/',
               'open_button_new_tab': 1,
               'seo_title': None,
               'seo_description': '',
               'seo_keywords': '',
               'og_image': '',
               'approach_content': 'The website was planned as a central digital platform that '
                                   'brings all three ICS business divisions under one consistent '
                                   'brand. Dedicated pages were developed for AP Precast Products '
                                   'and Concrete Expertise to clearly present their products, '
                                   'services, applications, technical capabilities, FAQs, and '
                                   'enquiry options. Since Cotton City Concrete already had an '
                                   'established website, it was incorporated into the ICS '
                                   'structure without duplicating its existing digital presence. '
                                   'Clear navigation, structured content, relevant calls to '
                                   'action, mobile-responsive layouts, and SEO-friendly page '
                                   'organization were used to help visitors quickly find the right '
                                   'concrete solution.',
               'approach_focal_point': 'center',
               'approach_image': 'projects/approach/Rectangle_3880_sQwPkQr.webp',
               'approach_image_alt': '',
               'approach_title': 'Approach',
               'card_image': 'projects/cards/8922f428adad1a1736ff883088cccc5267dfe9be_lqLFD7J.webp',
               'card_image_alt': '',
               'hero_focal_point': 'center',
               'hero_image_alt': '',
               'impact_content': 'The completed ICS website establishes a unified online presence '
                                 'for AP Precast Products, Concrete Expertise, and Cotton City '
                                 'Concrete. It improves the online discoverability of RCC precast '
                                 'products, concrete testing, concrete development, training, '
                                 'consultancy, and ready-mix concrete services. Visitors can now '
                                 'understand the relationship between the three divisions, explore '
                                 'relevant products and technical services, and submit enquiries '
                                 'more easily. The organized website structure also strengthens '
                                 'brand credibility, supports search-engine visibility, improves '
                                 'customer navigation, and positions ICS as an integrated partner '
                                 'for concrete products, expertise, and project-specific '
                                 'solutions.',
               'impact_focal_point': 'center',
               'impact_image': 'projects/impact/Rectangle_3881_o0G726E.webp',
               'impact_image_alt': '',
               'impact_title': 'Impact',
               'industry': 'Integrated Concrete Solutions',
               'og_image_alt': '',
               'overview_content': 'Integrated Concrete Solutions (ICS) is a Coimbatore-based '
                                   'provider of concrete products and services. The company '
                                   'operates through three business divisions: AP Precast '
                                   'Products, Concrete Expertise, and Cotton City Concrete. AP '
                                   'Precast Products manufactures RCC precast products, septic '
                                   'tanks, sumps, security cabins, transformer pods, and '
                                   'customised precast elements for construction requirements. '
                                   'Concrete Expertise supports builders and engineers through '
                                   'concrete testing, mix development, practical training, quality '
                                   'evaluation, and consultancy.\u2028'
                                   '\r\n'
                                   '\r\n'
                                   'Cotton City Concrete supplies ready-mix concrete solutions '
                                   'designed to meet structural, performance, and site '
                                   'requirements. By combining manufacturing capabilities, '
                                   'concrete technology, knowledge, and industry experience, ICS '
                                   'provides coordinated support across stages of construction. '
                                   'Clients can access precast solutions, quality-focused concrete '
                                   'services, technical guidance, and customised assistance '
                                   'through one trusted organisation committed to consistency, '
                                   'performance, durability, and customer-focused delivery across '
                                   'residential, commercial, industrial, and infrastructure '
                                   'projects in Coimbatore and surrounding regions.',
               'overview_focal_point': 'center',
               'overview_image': 'projects/overview/Rectangle_3878_Y6ZV2TU.webp',
               'overview_image_alt': '',
               'overview_link_text': '',
               'overview_link_url': '',
               'overview_title': 'Overview',
               'project_type': 'Corporate Website',
               'service': 'Website Development',
               'showcase_focal_point': 'center',
               'showcase_image': 'projects/showcases/Rectangle_3879_1pkS5PQ.webp',
               'showcase_image_alt': '',
               'next_project_button_text': 'View Next Project',
               'next_project_focal_point': 'center',
               'next_project_image': 'projects/next/8d29f037d79af817fd254488fc5fad0619409369_dCiuUHE.webp',
               'next_project_image_alt': '',
               'category_slug': 'website-development',
               'next_project_slug': None,
               'related_project_slugs': ['ecog-products', 'excel-packs']}],
 'sections': [{'section_order': 1,
               'layout_type': 'TEXT_ONLY',
               'title': 'Excel Packs',
               'content': '<p>Landing page</p>',
               'media_type': 'none',
               'image': '',
               'video': '',
               'youtube_url': None,
               'button_text': None,
               'button_url': None,
               'status': 'published',
               'project_slug': 'ecog-products'}]}


def restore_our_work_projects(apps, schema_editor):
    data = PROJECT_DATA
    database = schema_editor.connection.alias
    Category = apps.get_model('home', 'ProjectCategory')
    Project = apps.get_model('home', 'Project')
    Section = apps.get_model('home', 'ProjectSection')

    # The public records reference tracked project images. Production serves
    # media from a shared directory, so place missing assets there as well.
    source_media = Path(settings.BASE_DIR) / 'media'
    target_media = Path(settings.MEDIA_ROOT)
    for model, records in ((Project, data['projects']), (Section, data['sections'])):
        media_fields = [field.name for field in model._meta.fields if isinstance(field, FileField)]
        for record in records:
            for name in media_fields:
                value = record.get(name)
                if not value:
                    continue
                relative = Path(value)
                if relative.is_absolute() or '..' in relative.parts:
                    raise RuntimeError(f'Unsafe project media path: {value}')
                source = source_media / relative
                target = target_media / relative
                if target.is_file():
                    continue
                if not source.is_file():
                    raise RuntimeError(f'Missing bundled project media: {value}')
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)

    categories = {}
    for record in data['categories']:
        fields = record.copy()
        slug = fields.pop('slug')
        category, _ = Category.objects.using(database).get_or_create(slug=slug, defaults=fields)
        categories[slug] = category

    projects = {}
    for record in data['projects']:
        fields = record.copy()
        slug = fields.pop('slug')
        category_slug = fields.pop('category_slug')
        fields.pop('next_project_slug')
        fields.pop('related_project_slugs')
        fields['category_id'] = categories[category_slug].pk

        project = Project.objects.using(database).filter(slug=slug).first()
        if project is None:
            project = Project.objects.using(database).create(slug=slug, **fields)
        elif slug == 'excel-packs' and project.title == 'EcoG Products':
            # Migration 0008 reused this slug and replaced its content with EcoG.
            # Restore the original project when that exact corruption is present.
            Project.objects.using(database).filter(pk=project.pk).update(**fields)
        projects[slug] = project

    for record in data['projects']:
        project = projects[record['slug']]
        next_slug = record['next_project_slug']
        if next_slug and project.next_project_override_id is None:
            Project.objects.using(database).filter(pk=project.pk).update(
                next_project_override_id=projects[next_slug].pk,
            )
        related = [projects[slug] for slug in record['related_project_slugs']]
        if related:
            project.related_projects.add(*related)

    for record in data['sections']:
        fields = record.copy()
        project_slug = fields.pop('project_slug')
        order = fields.pop('section_order')
        Section.objects.using(database).get_or_create(
            project_id=projects[project_slug].pk,
            section_order=order,
            defaults=fields,
        )


class Migration(migrations.Migration):
    dependencies = [('home', '0010_alter_project_related_projects')]
    operations = [migrations.RunPython(restore_our_work_projects, migrations.RunPython.noop)]
