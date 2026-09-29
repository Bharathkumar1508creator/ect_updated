"""Focused browser verification for the selected Phase 5 media changes."""
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
    report = {"browser": args.browser, "routes": [], "careerButtonPadding": [], "failures": []}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=BROWSERS[args.browser])
        context = browser.new_context(viewport={"width": 390, "height": 844})
        context.route("**/*", lambda route: route.continue_() if urlparse(route.request.url).hostname in {"127.0.0.1", "localhost"} else route.abort())
        page = context.new_page()
        for route_path in ROUTES:
            bad_responses = []
            handler = lambda response: bad_responses.append({"url": response.url, "status": response.status}) if response.url.startswith(BASE_URL) and response.status >= 400 else None
            page.on("response", handler)
            response = page.goto(f"{BASE_URL}{route_path}", wait_until="domcontentloaded", timeout=45000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1000)
            result = page.evaluate("""async () => {
              const images = [...document.images];
              const localImages = images.filter(img => img.currentSrc.startsWith(location.origin));
              const imageFailures = localImages.filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc);
              const videos = [...document.querySelectorAll('video')];
              const videoData = [];
              for (const video of videos) {
                if (video.hasAttribute('data-deferred-video')) {
                  video.scrollIntoView({block: 'center'});
                  await new Promise(resolve => setTimeout(resolve, 750));
                }
                let playResult = 'not-autoplay';
                const shouldAutoplay = video.autoplay || video.dataset.autoplay === 'true';
                if (shouldAutoplay) {
                  try { await video.play(); playResult = 'played'; }
                  catch (error) { playResult = error.name || String(error); }
                }
                videoData.push({
                  autoplay: shouldAutoplay, deferred: video.hasAttribute('data-deferred-video'),
                  muted: video.muted, loop: video.loop,
                  playsinline: video.playsInline, controls: video.controls, poster: video.poster,
                  source: video.currentSrc || video.querySelector('source')?.src || '',
                  readyState: video.readyState, playResult,
                });
              }
              return {imageCount: images.length, imageFailures, videos: videoData};
            }""")
            page.remove_listener("response", handler)
            result.update({"route": route_path, "status": response.status if response else None, "badResponses": bad_responses})
            report["routes"].append(result)
        page.goto(f"{BASE_URL}/career/", wait_until="domcontentloaded")
        report["careerButtonPadding"] = page.evaluate("""() => [...document.querySelectorAll('button, a')]
          .filter(el => /apply|view|career|job/i.test((el.textContent || '').trim()))
          .map(el => ({text: (el.textContent || '').trim(), padding: getComputedStyle(el).padding}))""")
        context.close()
        browser.close()
    decorative = [video for route in report["routes"] for video in route["videos"] if route["route"] != "/projects/"]
    for route in report["routes"]:
        if route["status"] != 200 or route["badResponses"] or route["imageFailures"]:
            report["failures"].append({"route": route["route"], "kind": "resource", "details": route})
    for video in decorative:
        expected = (video["autoplay"] and video["muted"] and video["loop"] and video["playsinline"]
                    and not video["controls"] and bool(video["poster"])
                    and video["source"].endswith("-optimized.mp4")
                    and video["playResult"] == "played" and video["readyState"] >= 2)
        if not expected:
            report["failures"].append({"kind": "decorative-video", "details": video})
    report["summary"] = {
        "routeCount": len(report["routes"]),
        "imageCount": sum(route["imageCount"] for route in report["routes"]),
        "videoCount": sum(len(route["videos"]) for route in report["routes"]),
        "decorativeVideoCount": len(decorative),
        "failureCount": len(report["failures"]),
    }
    Path(args.output).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    raise SystemExit(1 if report["failures"] else 0)

if __name__ == "__main__":
    main()

