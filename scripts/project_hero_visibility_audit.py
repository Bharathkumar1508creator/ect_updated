"""Verify the Projects hero starts below the fixed navbar."""
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
    widths = (320, 360, 390, 430, 768, 1024, 1280, 1440, 1920)
    results = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=BROWSERS[args.browser])
        for width in widths:
            page = browser.new_page(viewport={"width": width, "height": 900})
            page.goto("http://127.0.0.1:8000/projects/", wait_until="domcontentloaded")
            result = page.evaluate("""() => {
              const nav = document.querySelector('.ect-navbar');
              const overline = document.querySelector('.project-hero .hero-overline');
              const title = document.querySelector('.project-hero .hero-title');
              const navRect = nav.getBoundingClientRect();
              const overlineRect = overline.getBoundingClientRect();
              const titleRect = title.getBoundingClientRect();
              return {
                navBottom: navRect.bottom,
                overlineTop: overlineRect.top,
                titleTop: titleRect.top,
                overlineVisible: overlineRect.top >= navRect.bottom && overlineRect.bottom <= innerHeight,
                titleVisible: titleRect.top >= navRect.bottom,
                overflow: document.documentElement.scrollWidth > innerWidth + 1
              };
            }""")
            result["width"] = width
            results.append(result)
            page.close()
        browser.close()

    failures = [item for item in results if not item["overlineVisible"] or not item["titleVisible"] or item["overflow"]]
    print(json.dumps({"browser": args.browser, "cases": len(results), "failures": failures, "results": results}, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
