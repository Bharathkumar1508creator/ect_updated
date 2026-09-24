"""Repeatable Phase 7 browser regression audit for the local Django site."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"
ROUTES = [
    "/", "/about/", "/career/", "/contact/", "/projects/", "/digital/",
    "/hr/", "/it-infrastructure/", "/software/", "/website/", "/zoho/",
    "/blog/", "/under/",
]
BROWSERS = {
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "edge": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
}


def audit_page(page, route, width, height):
    page_errors = []
    bad_local_responses = []
    failed_local_requests = []

    def on_page_error(error):
        page_errors.append(str(error))

    def on_response(response):
        if response.url.startswith(BASE_URL) and response.status >= 400:
            bad_local_responses.append({"url": response.url, "status": response.status})

    def on_request_failed(request):
        if request.url.startswith(BASE_URL) and request.resource_type != "media":
            failed_local_requests.append({"url": request.url, "error": request.failure})

    page.on("pageerror", on_page_error)
    page.on("response", on_response)
    page.on("requestfailed", on_request_failed)

    response = page.goto(
        f"{BASE_URL}{route}",
        wait_until="domcontentloaded",
        timeout=45000,
    )
    page.wait_for_timeout(250)
    details = page.evaluate(
        r"""() => {
          const root = document.documentElement;
          const width = window.innerWidth;
          const overflow = Math.max(root.scrollWidth, document.body.scrollWidth) - width;
          const offenders = [...document.querySelectorAll('body *')]
            .map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: typeof el.className === 'string' ? el.className : '',
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              };
            })
            .filter((item) => item.right > width + 2 || item.left < -2)
            .sort((a, b) => (b.right - width) - (a.right - width))
            .slice(0, 6);
          const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
          const duplicateIds = [...new Set(ids.filter((id, i) => id && ids.indexOf(id) !== i))];
          return {
            titleCount: document.querySelectorAll('head > title').length,
            descriptionCount: document.querySelectorAll('meta[name="description"]').length,
            canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
            h1Count: document.querySelectorAll('h1').length,
            emptyImageAltCount: [...document.images].filter((img) => !img.hasAttribute('alt')).length,
            unnamedButtonCount: [...document.querySelectorAll('button')].filter((button) =>
              !(button.textContent.trim() || button.getAttribute('aria-label') || button.getAttribute('title'))
            ).length,
            duplicateIds,
            overflow: Math.max(0, Math.round(overflow)),
            overflowOffenders: offenders,
            legacyHtmlLinks: [...document.querySelectorAll('a[href]')]
              .map((a) => a.getAttribute('href'))
              .filter((href) => href && /\.html(?:[?#]|$)/i.test(href)),
          };
        }"""
    )
    result = {
        "route": route,
        "width": width,
        "height": height,
        "status": response.status if response else None,
        "url": page.url,
        "pageErrors": page_errors,
        "badLocalResponses": bad_local_responses,
        "failedLocalRequests": failed_local_requests,
        **details,
    }
    result["hardFailure"] = bool(
        result["status"] is None
        or result["status"] >= 400
        or page_errors
        or bad_local_responses
        or failed_local_requests
        or details["titleCount"] != 1
        or details["descriptionCount"] != 1
        or details["canonicalCount"] != 1
        or details["h1Count"] != 1
        or details["duplicateIds"]
        or details["legacyHtmlLinks"]
    )
    page.remove_listener("pageerror", on_page_error)
    page.remove_listener("response", on_response)
    page.remove_listener("requestfailed", on_request_failed)
    return result


def interaction_checks(browser):
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    page.route(
        "**/*",
        lambda route: route.continue_()
        if (
            urlparse(route.request.url).hostname in {"127.0.0.1", "localhost"}
            and route.request.resource_type != "media"
        )
        else route.abort(),
    )
    findings = {}

    page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
    toggle = page.locator("#ectMobileToggle")
    toggle.click()
    page.wait_for_timeout(100)
    findings["mobileMenuOpens"] = (
        toggle.get_attribute("aria-expanded") == "true"
        and page.locator("#ectMobilePanel").get_attribute("aria-hidden") == "false"
    )
    page.keyboard.press("Escape")
    page.wait_for_timeout(100)
    findings["mobileMenuEscCloses"] = toggle.get_attribute("aria-expanded") == "false"

    toggle.click()
    page.wait_for_timeout(100)
    trigger = page.locator("[data-contact-trigger]:visible").first
    trigger.click()
    page.wait_for_timeout(100)
    popup = page.locator("#ectContactPopup")
    findings["contactPopupOpens"] = popup.get_attribute("aria-hidden") == "false"
    page.keyboard.press("Escape")
    page.wait_for_timeout(100)
    findings["contactPopupEscCloses"] = popup.get_attribute("aria-hidden") == "true"

    page.goto(f"{BASE_URL}/website/", wait_until="domcontentloaded")
    faq = page.locator(".faq-q").first
    faq.click()
    page.wait_for_timeout(100)
    findings["faqExpands"] = faq.get_attribute("aria-expanded") == "true"

    page.goto(f"{BASE_URL}/career/", wait_until="domcontentloaded")
    findings["zohoRecruitLinkPresent"] = page.locator(
        'a[href*="ecogproducts.zohorecruit.in/jobs/Careers"]'
    ).count() > 0

    page.goto(f"{BASE_URL}/contact/", wait_until="domcontentloaded")
    findings["biginFormPresent"] = page.locator(
        "#BiginWebToRecordForm717173000000992187"
    ).count() == 1
    findings["biginFormNotSubmitted"] = True

    context.close()
    findings["hardFailure"] = not all(findings.values())
    return findings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", choices=BROWSERS, required=True)
    parser.add_argument("--widths", default="320,360,390,430,768,1024,1280,1440,1920")
    parser.add_argument("--output", required=True)
    parser.add_argument("--interactions", action="store_true")
    args = parser.parse_args()

    widths = [int(value) for value in args.widths.split(",") if value]
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=BROWSERS[args.browser],
        )
        for width in widths:
            height = 844 if width <= 430 else 900
            context = browser.new_context(viewport={"width": width, "height": height})
            context.route(
                "**/*",
                lambda route: route.continue_()
                if urlparse(route.request.url).hostname in {"127.0.0.1", "localhost"}
                else route.abort(),
            )
            page = context.new_page()
            for route in ROUTES:
                results.append(audit_page(page, route, width, height))
            context.close()
        interactions = interaction_checks(browser) if args.interactions else {}
        browser.close()

    summary = {
        "browser": args.browser,
        "widths": widths,
        "routes": ROUTES,
        "cases": len(results),
        "hardFailures": sum(1 for item in results if item["hardFailure"]),
        "overflowCases": sum(1 for item in results if item["overflow"] > 1),
        "missingAltCases": sum(1 for item in results if item["emptyImageAltCount"] > 0),
        "unnamedButtonCases": sum(1 for item in results if item["unnamedButtonCount"] > 0),
        "interactions": interactions,
        "results": results,
    }
    Path(args.output).write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in summary.items() if key != "results"}, indent=2))
    raise SystemExit(1 if summary["hardFailures"] or interactions.get("hardFailure") else 0)


if __name__ == "__main__":
    main()
