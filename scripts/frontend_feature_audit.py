"""Verify blog navigation and animated consulting-service panels."""
import json
import os

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("ECT_TEST_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
    page = browser.new_page(viewport={"width": 1366, "height": 900})

    page.goto(f"{BASE_URL}/blog/", wait_until="domcontentloaded")
    page.evaluate("window.__blogPageMarker = 'preserved'")
    category = page.locator(".category-filters .category-btn").nth(1)
    category.click()
    page.locator(".category-btn.active").wait_for()
    blog_filter_in_place = page.evaluate("window.__blogPageMarker") == "preserved"
    card = page.locator("[data-blog-grid] .card").first
    card_href = card.get_attribute("href")
    card.click()
    page.wait_for_url(f"**{card_href}")
    blog_card_navigation = page.url.endswith(card_href)

    service_results = {}
    for route in ("/zoho/", "/hr/"):
        page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded")
        first_src = page.locator("#contentImage img").get_attribute("src")
        second_tab = page.locator("#tabsTrack .tab").nth(1)
        second_label = second_tab.inner_text().strip()
        second_tab.click()
        page.locator("#tabsTrack .tab.active").filter(has_text=second_label).first.wait_for()
        page.wait_for_timeout(700)
        next_src = page.locator("#contentImage img").get_attribute("src")
        service_results[route] = {
            "secondTabActive": second_tab.evaluate("el => el.classList.contains('active')"),
            "imageChanged": bool(first_src and next_src and first_src != next_src),
        }

    browser.close()

result = {
    "blogFilterInPlace": blog_filter_in_place,
    "blogCardNavigation": blog_card_navigation,
    "servicePanels": service_results,
}
print(json.dumps(result, indent=2))
assert blog_filter_in_place and blog_card_navigation, result
assert all(item["secondTabActive"] and item["imageChanged"] for item in service_results.values()), result
