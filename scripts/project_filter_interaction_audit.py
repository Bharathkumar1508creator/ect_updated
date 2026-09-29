"""Verify Projects filtering stays in-page and card shadows remain disabled."""
import argparse
import json

from playwright.sync_api import sync_playwright

BROWSERS = {
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "edge": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", choices=BROWSERS, required=True)
    args = parser.parse_args()
    page_errors = []
    failed_local_requests = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=BROWSERS[args.browser])
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on(
            "requestfailed",
            lambda request: failed_local_requests.append(request.url)
            if request.url.startswith("http://127.0.0.1:8000/") else None,
        )
        page.goto("http://127.0.0.1:8000/projects/", wait_until="networkidle")

        page.evaluate("window.__projectFilterPageMarker = 'preserved'")
        filter_link = page.locator(".btn-filter").filter(has_text="Website Development").first
        if filter_link.count() == 0:
            filter_link = page.locator(".btn-filter").nth(1)
        expected_label = filter_link.inner_text().strip()
        filter_link.click()
        page.wait_for_function(
            "label => document.querySelector('.btn-filter.active')?.textContent.trim() === label",
            arg=expected_label,
        )

        filtered = page.evaluate("""() => ({
          marker: window.__projectFilterPageMarker,
          category: document.querySelector('.btn-filter.active')?.textContent.trim(),
          focusRetained: document.activeElement?.classList.contains('btn-filter'),
          url: location.href,
          busy: document.querySelector('[data-project-listing]')?.hasAttribute('aria-busy'),
          projectShadows: [...document.querySelectorAll('.project-card')].map(el => getComputedStyle(el).boxShadow),
          buttonShadows: [...document.querySelectorAll('.btn-notch')].map(el => getComputedStyle(el).boxShadow),
          edgeMasks: [...document.querySelectorAll('.project-card')].map(el => {
            const style = getComputedStyle(el, '::after');
            return {content: style.content, height: style.height, background: style.backgroundColor};
          }),
          overflow: document.documentElement.scrollWidth > innerWidth + 1
        })""")

        page.go_back(wait_until="commit")
        page.wait_for_function("document.querySelector('.btn-filter.active')?.textContent.trim() === 'All Projects'")
        history_marker = page.evaluate("window.__projectFilterPageMarker")
        page.set_viewport_size({"width": 360, "height": 800})
        mobile_overflow = page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        browser.close()

    failures = []
    if filtered["marker"] != "preserved":
        failures.append("filter caused a full document reload")
    if filtered["category"] != expected_label:
        failures.append("selected filter did not become active")
    if not filtered["focusRetained"]:
        failures.append("keyboard focus was not retained after filtering")
    if filtered["busy"]:
        failures.append("loading state did not clear")
    if any(value != "none" for value in filtered["projectShadows"] + filtered["buttonShadows"]):
        failures.append("a project card or View Project button still has a visible shadow")
    if any(
        mask["content"] == "none" or mask["height"] != "2px" or mask["background"] != "rgb(255, 255, 255)"
        for mask in filtered["edgeMasks"]
    ):
        failures.append("a project card is missing the bottom-edge mask")
    if filtered["overflow"]:
        failures.append("filter result introduced horizontal overflow")
    if history_marker != "preserved":
        failures.append("Back navigation caused a full document reload")
    if mobile_overflow:
        failures.append("the Projects page overflows at 360px")
    if page_errors:
        failures.append("page errors: " + " | ".join(page_errors))
    if failed_local_requests:
        failures.append("failed local requests: " + " | ".join(failed_local_requests))

    print(json.dumps({
        "browser": args.browser,
        "filter": expected_label,
        "filtered": filtered,
        "historyMarker": history_marker,
        "mobileOverflow": mobile_overflow,
        "pageErrors": page_errors,
        "failedLocalRequests": failed_local_requests,
        "failures": failures,
    }, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
