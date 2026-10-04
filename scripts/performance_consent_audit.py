"""Verify analytics consent while SalesIQ support remains continuously available."""
import json
import os
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("ECT_TEST_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def matching(requests, host):
    return [url for url in requests if host in url]


def local_only(route):
    host = urlparse(route.request.url).hostname
    route.continue_() if host in {"127.0.0.1", "localhost"} else route.abort()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
    accepted = browser.new_context(viewport={"width": 390, "height": 844})
    accepted.route("**/*", local_only)
    accepted_page = accepted.new_page()
    accepted_requests = []
    accepted_page.on("request", lambda request: accepted_requests.append(request.url))

    accepted_page.goto(BASE_URL, wait_until="domcontentloaded")
    accepted_page.wait_for_timeout(750)
    salesiq_before_accept = matching(accepted_requests, "salesiq.zohopublic.in")
    assert len(salesiq_before_accept) == 1, salesiq_before_accept
    assert not matching(accepted_requests, "googletagmanager.com"), accepted_requests
    assert accepted_page.locator("#zsiqscript").count() == 1
    assert accepted_page.locator("#ectConsent").is_visible()

    accepted_page.locator("[data-consent-accept]").click()
    accepted_page.wait_for_timeout(500)
    assert matching(accepted_requests, "googletagmanager.com"), accepted_requests
    assert len(matching(accepted_requests, "salesiq.zohopublic.in")) == 1
    assert accepted_page.locator("#zsiqscript").count() == 1
    assert accepted_page.evaluate("localStorage.getItem('ect_optional_cookie_consent')") == "granted"

    denied = browser.new_context(viewport={"width": 390, "height": 844})
    denied.route("**/*", local_only)
    denied_page = denied.new_page()
    denied_requests = []
    denied_page.on("request", lambda request: denied_requests.append(request.url))

    denied_page.goto(BASE_URL, wait_until="domcontentloaded")
    denied_page.wait_for_timeout(750)
    assert len(matching(denied_requests, "salesiq.zohopublic.in")) == 1
    assert not matching(denied_requests, "googletagmanager.com"), denied_requests
    assert denied_page.locator("#zsiqscript").count() == 1

    denied_page.locator("[data-consent-essential]").click()
    denied_page.wait_for_timeout(300)
    assert denied_page.evaluate("localStorage.getItem('ect_optional_cookie_consent')") == "denied"
    assert len(matching(denied_requests, "salesiq.zohopublic.in")) == 1
    assert not matching(denied_requests, "googletagmanager.com"), denied_requests
    assert denied_page.locator("#zsiqscript").count() == 1

    second = browser.new_context(viewport={"width": 390, "height": 844})
    contact = second.new_page()
    contact_requests = []
    contact.on("request", lambda request: contact_requests.append(request.url))
    second.route("**/*", local_only)
    contact.goto(f"{BASE_URL}/contact/", wait_until="domcontentloaded")
    assert not any("WebformScriptServlet" in url for url in contact_requests)
    contact.locator("#bigin-full-name").focus()
    contact.wait_for_timeout(300)
    assert any("WebformScriptServlet" in url for url in contact_requests)

    print(json.dumps({
        "salesIqBeforeConsent": True,
        "salesIqAfterAccept": True,
        "salesIqAfterEssentialOnly": True,
        "salesIqDuplicateScripts": False,
        "analyticsRequiresConsent": True,
        "biginLoadsOnInteraction": True,
    }, indent=2))
    second.close()
    denied.close()
    accepted.close()
    browser.close()
