"""Shared SEO metadata and JSON-LD for public pages."""
import json
from urllib.parse import urlsplit
from django.conf import settings
from django.urls import reverse

BRAND = "ECOG Core Technologies"
IMAGE = "/static/img/ecog-logo.png"
# 1200x630 share images for the service pages; every other page uses the logo above.
OG_IMAGES = {
    "website": "/static/img/og/website.jpg",
    "software": "/static/img/og/software.jpg",
    "zoho": "/static/img/og/zoho.jpg",
    "hr": "/static/img/og/hr.jpg",
    "digital": "/static/img/og/digital.jpg",
    "it_infrastructure": "/static/img/og/it.jpg",
}
PAGES = {
"index":("IT & Digital Transformation Company in Coimbatore | ECOG","ECOG helps businesses in Coimbatore grow with website development, custom software, Zoho, digital marketing, HR consulting and IT infrastructure.","Home","WebPage",""),
"about":("About ECOG | Technology Partner in Coimbatore","Meet ECOG Core Technologies, a Coimbatore technology partner delivering practical digital transformation, automation and business growth solutions.","About","AboutPage",""),
"career":("Technology Careers in Coimbatore | ECOG Core Technologies","Explore software, automation and digital technology careers with ECOG Core Technologies in Coimbatore and apply through our official Zoho Recruit page.","Careers","CollectionPage",""),
"contact":("Contact ECOG Core Technologies in Coimbatore","Contact ECOG Core Technologies for website, software, Zoho, digital marketing, HR and IT infrastructure services in Coimbatore, Tamil Nadu.","Contact","ContactPage",""),
"project_list":("Technology Projects & Case Studies | ECOG Core Technologies","Explore ECOG website, software, Zoho and digital marketing projects created to improve operations, customer experience and business growth.","Projects","CollectionPage",""),
"website":("Website Development Services That Drive Growth | ECOG","Create a website that works for your business. Explore custom, responsive and SEO-friendly website development services from ECOG Core Technologies.","Website Development","WebPage","Website development"),
"software":("Custom Software Development for Smarter Businesses | ECOG","Transform the way your business works with ECOG's custom software development. Discover tailored applications, seamless integrations and smart automation.","Custom Software Development","WebPage","Custom software development"),
"zoho":("Zoho Consulting Services for Smarter Business Operations","Streamline your business with professional Zoho consulting services. Explore CRM implementation, workflow automation, customization and seamless integrations.","Zoho Consulting","WebPage","Zoho consulting and implementation"),
"hr":("HR Consulting Services for Stronger Workplaces | ECOG","Build stronger teams with professional HR consulting services. Explore recruitment, HR policies, employee performance management and workforce solutions.","HR Consulting","WebPage","HR consulting and recruitment"),
"digital":("Digital Marketing Agency for Business Growth | ECOG","Grow beyond visibility with ECOG, a digital marketing agency in Coimbatore offering SEO, social media, paid ads and lead generation to help your business thrive.","Digital Marketing","WebPage","Digital marketing"),
"it_infrastructure":("IT Infrastructure Services for Smarter Business | ECOG","Build a reliable digital foundation with professional IT infrastructure services. Explore cloud solutions, server management, networking and IT support.","IT Infrastructure","WebPage","IT infrastructure services"),
"under":("Page Under Construction | ECOG Core Technologies","This ECOG Core Technologies page is currently under construction.","Under Construction","WebPage",""),
}

def absolute_url(value):
    if urlsplit(value).scheme:
        return value
    return f"{settings.SITE_URL.rstrip('/')}/{value.lstrip('/')}"

def json_for_html(value):
    return json.dumps(value,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")

def organization(site=None):
    item={"@type":["Organization","ProfessionalService"],"@id":absolute_url("/#organization"),"name":BRAND,"url":absolute_url("/"),"logo":absolute_url(IMAGE),"description":"Business technology and digital transformation company based in Coimbatore, Tamil Nadu.","areaServed":[{"@type":"City","name":"Coimbatore"},{"@type":"AdministrativeArea","name":"Tamil Nadu"}],"address":{"@type":"PostalAddress","addressLocality":"Coimbatore","addressRegion":"Tamil Nadu","addressCountry":"IN"}}
    if site:
        if site.address:item["address"]["streetAddress"]=site.address
        if site.phone:item["telephone"]=site.phone
        if site.contact_email:item["email"]=site.contact_email
        same=[x for x in (site.facebook_url,site.twitter_url,site.linkedin_url,site.instagram_url) if x]
        if same:item["sameAs"]=same
    return item

def build_page_seo(name,site_settings=None,canonical_path=None,robots=None):
    title,desc,label,page_type,service=PAGES[name]
    canonical=absolute_url(canonical_path or reverse(name))
    page={"@type":page_type,"@id":f"{canonical}#webpage","url":canonical,"name":title,"description":desc,"isPartOf":{"@id":absolute_url("/#website")},"about":{"@id":absolute_url("/#organization")},"inLanguage":"en-IN"}
    graph=[page]
    if name=="index":
        graph += [organization(site_settings),{"@type":"WebSite","@id":absolute_url("/#website"),"url":absolute_url("/"),"name":BRAND,"publisher":{"@id":absolute_url("/#organization")},"inLanguage":"en-IN"}]
    else:
        crumb={"@type":"BreadcrumbList","@id":f"{canonical}#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":absolute_url("/")},{"@type":"ListItem","position":2,"name":label,"item":canonical}]}
        page["breadcrumb"]={"@id":crumb["@id"]}; graph.append(crumb)
    if service:
        graph.append({"@type":"Service","@id":f"{canonical}#service","name":service,"description":desc,"url":canonical,"provider":{"@id":absolute_url("/#organization")},"areaServed":[{"@type":"City","name":"Coimbatore"},{"@type":"AdministrativeArea","name":"Tamil Nadu"}]})
    if name=="under" and not robots:robots="noindex,nofollow"
    return {"seo_title":title,"seo_description":desc,"seo_canonical_url":canonical,"seo_robots":robots or "index,follow,max-image-preview:large","seo_og_type":"website","seo_image_url":absolute_url(OG_IMAGES.get(name,IMAGE)),"seo_schema_json":json_for_html({"@context":"https://schema.org","@graph":graph})}

def build_project_seo(project,canonical_path,image_url=""):
    canonical=absolute_url(canonical_path); image=image_url or absolute_url(IMAGE)
    title=project.seo_title or f"{project.title} Project | {BRAND}"
    desc=(project.seo_description or project.short_description or f"View the {project.title} project by {BRAND}.").strip()
    crumb={"@type":"BreadcrumbList","@id":f"{canonical}#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":absolute_url("/")},{"@type":"ListItem","position":2,"name":"Projects","item":absolute_url(reverse("project_list"))},{"@type":"ListItem","position":3,"name":project.title,"item":canonical}]}
    work={"@type":"CreativeWork","@id":f"{canonical}#project","name":project.title,"description":desc,"url":canonical,"creator":{"@id":absolute_url("/#organization")},"dateCreated":project.created_at.date().isoformat(),"dateModified":project.updated_at.date().isoformat(),"inLanguage":"en-IN","image":image}
    if project.service: work["about"] = project.service
    if project.industry: work["industry"] = project.industry
    if project.project_type: work["genre"] = project.project_type
    if project.completion_date: work["datePublished"] = project.completion_date.isoformat()
    return {"seo_title":title,"seo_description":desc,"seo_canonical_url":canonical,"seo_robots":"index,follow,max-image-preview:large","seo_og_type":"article","seo_image_url":image,"seo_schema_json":json_for_html({"@context":"https://schema.org","@graph":[work,crumb]})}
