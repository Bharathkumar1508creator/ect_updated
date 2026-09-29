(function () {
  "use strict";

  const selector = "[data-project-listing]";
  let activeRequest = null;

  function getListing() {
    return document.querySelector(selector);
  }

  function announce(listing) {
    const status = listing.querySelector("[data-project-filter-status]");
    if (!status) return;
    const activeFilter = listing.querySelector(".btn-filter.active");
    const count = listing.querySelectorAll(".project-card").length;
    const category = activeFilter ? activeFilter.textContent.trim() : "Projects";
    status.textContent = category + ": " + count + (count === 1 ? " project" : " projects") + " displayed.";
  }

  async function updateProjects(url, addHistory) {
    const listing = getListing();
    if (!listing) {
      window.location.assign(url);
      return;
    }
    const restoreFilterFocus = listing.contains(document.activeElement);

    if (activeRequest) activeRequest.abort();
    const controller = new AbortController();
    activeRequest = controller;
    listing.classList.add("is-loading");
    listing.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(url, {
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Project request failed with status " + response.status);

      const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
      const replacement = parsed.querySelector(selector);
      if (!replacement) throw new Error("Project listing was missing from the response");

      const imported = document.importNode(replacement, true);
      listing.replaceWith(imported);
      if (addHistory) window.history.pushState({ projects: true }, "", url);
      announce(imported);
      if (restoreFilterFocus) {
        const activeFilter = imported.querySelector(".btn-filter.active");
        if (activeFilter) activeFilter.focus({ preventScroll: true });
      }
      document.dispatchEvent(new CustomEvent("projects:updated", { detail: { root: imported } }));
    } catch (error) {
      if (error.name === "AbortError") return;
      window.location.assign(url);
    } finally {
      if (activeRequest === controller) {
        const current = getListing();
        if (current) {
          current.classList.remove("is-loading");
          current.removeAttribute("aria-busy");
        }
        activeRequest = null;
      }
    }
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest(".btn-filter, .pagination a.page-link");
    if (!link || !getListing() || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    updateProjects(url.href, true);
  });

  window.addEventListener("popstate", function () {
    if (getListing()) updateProjects(window.location.href, false);
  });
})();
