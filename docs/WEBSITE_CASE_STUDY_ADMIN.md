# Website project case studies

Website Development projects now use a reusable case-study page based on the approved EcoG Products design. The public page keeps the shared site navbar and footer and renders a project introduction, metadata, Overview, showcase, Approach, Impact, next-project feature, and related projects.

## Admin workflow

Open **Our Work → Website Projects** in Django Admin. Each project provides these groups:

1. **Project Status and Listing Card** — title, stable URL slug, category, publication status, ordering, card copy, and card image.
2. **Case-study Introduction** — visible summary plus service, industry, project type, client, and completion date.
3. **Hero** — hero media, descriptive alternative text, and crop focal point.
4. **Overview** — heading, text, optional link, side image, alternative text, and crop focal point.
5. **Main Showcase and Live Site** — full-width image, alternative text, crop focal point, live-site label, URL, and new-tab setting.
6. **Approach** — heading, text, image, alternative text, and crop focal point.
7. **Impact** — heading, text, image, alternative text, and crop focal point.
8. **Project Navigation** — optional next-project override, an independent next-project image, image alt text, responsive crop position, editable button label, and up to three manually selected related projects.
9. **SEO and Social Sharing** — unique SEO title and description, keywords, social image, and social image alt text. The canonical URL is generated automatically from the project's stable public URL.

If no next-project override is selected, the next published Website Development project is chosen by display order and wraps to the first project. If no related projects are selected, the page automatically chooses up to three published projects from the same category.

## Image behavior

New uploads are stored under organized `media/projects/` folders and pass through the existing safe image optimization pipeline. The original upload fields remain managed by Django media storage. Below-the-fold images use lazy loading and stable aspect-ratio containers. The hero loads eagerly because it is above the fold.

Each image has an optional alternative-text field. When that field is empty, the project title is used as a safe fallback. Decorative wording should not be entered as alt text; describe the useful content visible in the image. Crop focal-point choices let editors preserve the most important part of an image at responsive sizes.

The dashboard and app menu links use progressive in-page Admin navigation, so moving between Blog, Our Work, and their model lists does not reload the whole document. Browser history remains functional. Failed or unsupported partial requests fall back to normal navigation, and add/edit forms retain Django's standard submission behavior.

## EcoG Products seed data

The historical `excel-packs` record is renamed to **EcoG Products** and supplied with the approved Overview, Approach, Impact, metadata, live-site URL, and SEO copy. Its existing slug is retained to avoid breaking the current public URL. Admin-uploaded section images remain intentionally empty until the final approved assets are supplied.

This system currently applies only to Website Development projects. Existing Digital Marketing and other service project behavior remains available for their future service-specific designs.
