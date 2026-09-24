"""Cross-browser regression audit for malformed responsive-image candidates."""
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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", choices=BROWSERS, required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=BROWSERS[args.browser])
        for width in (320, 1440):
            context = browser.new_context(viewport={"width": width, "height": 900})
            context.route(
                "**/*",
                lambda route: route.continue_()
                if urlparse(route.request.url).hostname in {"127.0.0.1", "localhost"}
                else route.abort(),
            )
            page = context.new_page()
            for route_path in ROUTES:
                messages = []
                bad_responses = []
                console_handler = lambda message: messages.append(message.text) if (
                    "srcset" in message.text.lower() or "descriptor" in message.text.lower()
                ) else None
                response_handler = lambda response: bad_responses.append({
                    "url": response.url, "status": response.status
                }) if response.url.startswith(BASE_URL) and response.status >= 400 else None
                page.on("console", console_handler)
                page.on("response", response_handler)
                response = page.goto(f"{BASE_URL}{route_path}", wait_until="domcontentloaded", timeout=45000)
                page.evaluate("""async () => {
                    const height = document.documentElement.scrollHeight;
                    for (let y = 0; y <= height; y += 600) {
                        window.scrollTo(0, y);
                        await new Promise(resolve => setTimeout(resolve, 30));
                    }
                }""")
                page.wait_for_timeout(300)
                details = page.evaluate("""() => {
                    const images = [...document.querySelectorAll('img[srcset]')];
                    const malformed = [];
                    for (const image of images) {
                        for (const candidate of image.getAttribute('srcset').split(',')) {
                            const tokens = candidate.trim().split(/\\s+/);
                            if (tokens.length !== 2 || !/^\\d+(?:w|x)$/.test(tokens[1])) {
                                malformed.push(candidate.trim());
                            }
                        }
                    }
                    return {
                        srcsetCount: images.length,
                        malformed,
                        failedImages: [...document.images]
                            .filter(image => {
                                const source = image.currentSrc || image.src;
                                return source.startsWith(location.origin)
                                    && image.complete && image.naturalWidth === 0;
                            })
                            .map(image => image.currentSrc || image.src),
                    };
                }""")
                page.remove_listener("console", console_handler)
                page.remove_listener("response", response_handler)
                results.append({
                    "route": route_path,
                    "width": width,
                    "status": response.status if response else None,
                    "consoleMessages": messages,
                    "badResponses": bad_responses,
                    **details,
                })
            context.close()
        browser.close()
    failures = [item for item in results if (
        item["status"] != 200 or item["consoleMessages"] or item["badResponses"]
        or item["malformed"] or item["failedImages"]
    )]
    summary = {
        "browser": args.browser,
        "cases": len(results),
        "srcsetElements": sum(item["srcsetCount"] for item in results),
        "failureCount": len(failures),
        "failures": failures,
    }
    Path(args.output).write_text(json.dumps({"summary": summary, "results": results}, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    raise SystemExit(1 if failures else 0)

if __name__ == "__main__":
    main()
