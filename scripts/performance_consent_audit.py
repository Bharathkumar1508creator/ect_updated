"""Verify optional services and Bigin are gated without removing integrations."""
import json
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def is_optional(url):
    return any(host in url for host in ("googletagmanager.com", "salesiq.zohopublic.in"))


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    requests = []
    page.on("request", lambda request: requests.append(request.url))
    context.route("**/*", lambda route: route.continue_() if urlparse(route.request.url).hostname in {"127.0.0.1", "localhost"} else route.abort())

    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(750)
    before = [url for url in requests if is_optional(url)]
    assert not before, before
    assert page.locator("#ectConsent").is_visible()

    page.locator("[data-consent-accept]").click()
    page.wait_for_timeout(500)
    after = [url for url in requests if is_optional(url)]
    assert any("googletagmanager.com" in url for url in after), after
    assert any("salesiq.zohopublic.in" in url for url in after), after
    assert page.evaluate("localStorage.getItem('ect_optional_cookie_consent')") == "granted"

    second = browser.new_context(viewport={"width": 390, "height": 844})
    contact = second.new_page()
    contact_requests = []
    contact.on("request", lambda request: contact_requests.append(request.url))
    second.route("**/*", lambda route: route.continue_() if urlparse(route.request.url).hostname in {"127.0.0.1", "localhost"} else route.abort())
    contact.goto(f"{BASE_URL}/contact/", wait_until="domcontentloaded")
    assert not any("WebformScriptServlet" in url for url in contact_requests)
    contact.locator("#bigin-full-name").focus()
    contact.wait_for_timeout(300)
    assert any("WebformScriptServlet" in url for url in contact_requests)

    print(json.dumps({"initialOptionalRequests": len(before), "acceptedOptionalRequests": len(after), "biginLoadsOnInteraction": True}, indent=2))
    second.close()
    context.close()
    browser.close()
