# Phase 6 — Technical, On-Page, and Local SEO

Checkpoint date: 2026-09-22  
Production changes: none  
Database schema changes: none  
Production data changes: none  
Phase 4 and Phase 5 code: skipped and not restored

## Completed work

### Canonical URL control

- Set `https://ecogcoretechnologies.com/` as the metadata origin.
- Added an application-level permanent redirect from `www.ecogcoretechnologies.com` to the non-www host while preserving the path and query string.
- Converted all legacy `.html` routes to permanent redirects to their clean Django URLs.
- Converted the duplicate generic Digital Marketing project route to a permanent redirect.
- Added self-referencing canonical tags to every public marketing, project, blog listing, category, tag, and article page.
- Paginated project and blog collections retain page-specific canonicals; filtered/search result URLs use `noindex,follow` and point to the clean collection canonical.

### Search result metadata

- Added one descriptive title, meta description, robots directive, canonical, Open Graph set, and Twitter card set to every public marketing page.
- Added complete dynamic metadata to project detail and Digital Marketing project detail pages.
- Added category/tag-specific titles and descriptions to blog collection pages.
- Kept article-specific editorial metadata and expanded the article Open Graph identity.
- Removed the obsolete project `meta keywords` output; project keyword data remains preserved in the database.

### Structured data

- Added JSON-LD for `Organization`, `ProfessionalService`, `WebSite`, `WebPage`, `AboutPage`, `ContactPage`, `CollectionPage`, `Service`, `BreadcrumbList`, `CreativeWork`, and existing `BlogPosting` pages.
- Added Coimbatore, Tamil Nadu, and India locality data without inventing a street address, phone number, or email.
- Existing Site Settings contact details and social profiles are included when administrators have supplied them.
- Service schema covers Website Development, Custom Software Development, Zoho Consulting, Digital Marketing, HR Consulting, and IT Infrastructure Services.
- FAQ rich-result markup is intentionally not emitted. Google currently limits FAQ rich results to authoritative government and health sites; the visible FAQ content remains crawlable and unchanged.

### Crawl and index controls

- Sitemap output contains clean public marketing, published project, and indexable published blog URLs.
- `robots.txt` advertises the canonical sitemap and protects admin and staff-only blog preview paths from routine crawling.
- The under-construction page emits `noindex,nofollow` and remains outside the sitemap.
- Search and filter result pages remain crawlable for link discovery but are excluded from indexing.

### Content semantics and local relevance

- Corrected duplicate H1 elements on About and IT Infrastructure without changing their visual styling.
- Added accessible main headings to Contact and dynamic project pages where the visual media previously contained no HTML H1.
- Updated page titles and descriptions around the confirmed service areas and Coimbatore/Tamil Nadu location.
- Preserved all visible business content, Montserrat styling, Google Analytics/Tag Manager, Zoho Bigin, Zoho SalesIQ, Zoho Recruit, MapLibre, social links, and Google Business Profile-related content.

## Verification

- `python manage.py check`: passed
- `python manage.py makemigrations --check --dry-run`: no changes
- Full Django suite: 53 tests passed
- New SEO tests cover complete static-page heads, permanent legacy redirects, non-www host normalization, filter-page noindex behavior, canonical sitemap output, robots output, and the under-construction noindex rule.
- Static page audit confirms exactly one title, description, canonical, Open Graph URL, and Twitter card per tested public route.
- `git diff --check`: passed
- No database, uploaded media, third-party submission, or live-server change was made.

## Standards used

Implementation follows current Google Search Central guidance for [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [developer SEO](https://developers.google.com/search/docs/fundamentals/get-started-developers), [title links](https://developers.google.com/search/docs/appearance/title-link), [robots directives](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), and [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

## Deployment follow-up

After a complete release passes Phase 7 and is deployed with explicit approval:

1. Verify the non-www redirects at the reverse proxy and Django layers.
2. Submit `https://ecogcoretechnologies.com/sitemap.xml` in Google Search Console.
3. Inspect representative service, project, and blog URLs.
4. Run Google Rich Results Test and Schema Markup Validator against live URLs.
5. Request re-indexing only after the complete version is live.

No live deployment is authorized by this checkpoint.
