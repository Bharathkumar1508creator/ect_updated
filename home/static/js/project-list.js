(function () {
  "use strict";

  const selector = "[data-project-listing]";
  let activeRequest = null;

  function getListing() {
    return document.querySelector(selector);
  }

  function announce(listing) {
    const status = listing.querySelector("[data-project-filter-status]");
    const activeFilter = listing.querySelector(".btn-filter.active");
    const count = listing.querySelectorAll(".project-card").length;
    const grid = listing.querySelector("#projectResults");
    const total = grid ? Number(grid.dataset.totalResults || count) : count;
    const category = activeFilter ? activeFilter.textContent.trim() : "Projects";
    const visibleCount = listing.querySelector("[data-project-visible-count]");
    const totalCount = listing.querySelector("[data-project-total]");
    if (visibleCount) visibleCount.textContent = count;
    if (totalCount) totalCount.textContent = total;
    if (status) {
      status.textContent = category + ": " + count + " of " + total +
        (total === 1 ? " project" : " projects") + " displayed.";
    }
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

  async function loadMore(link) {
    const listing = getListing();
    const grid = listing && listing.querySelector("#projectResults");
    if (!listing || !grid) {
      window.location.assign(link.href);
      return;
    }

    if (activeRequest) activeRequest.abort();
    const controller = new AbortController();
    activeRequest = controller;
    link.classList.add("is-loading");
    link.setAttribute("aria-disabled", "true");
    const label = link.querySelector("[data-load-more-label]");
    if (label) label.textContent = "Loading…";

    try {
      const response = await fetch(link.href, {
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Project request failed with status " + response.status);

      const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
      const nextListing = parsed.querySelector(selector);
      const nextGrid = nextListing && nextListing.querySelector("#projectResults");
      if (!nextGrid) throw new Error("Project results were missing from the response");

      const cards = Array.prototype.slice.call(nextGrid.querySelectorAll(".project-card"));
      cards.forEach(function (card) {
        grid.appendChild(document.importNode(card, true));
      });

      const currentWrap = listing.querySelector("[data-load-more-wrap]");
      const nextWrap = nextListing.querySelector("[data-load-more-wrap]");
      if (currentWrap) {
        if (nextWrap) currentWrap.replaceWith(document.importNode(nextWrap, true));
        else currentWrap.remove();
      }

      announce(listing);
      document.dispatchEvent(new CustomEvent("projects:updated", {
        detail: { root: grid, appended: true }
      }));
      if (cards.length) cards[0].querySelector(".card-link")?.focus({ preventScroll: true });
    } catch (error) {
      if (error.name === "AbortError") return;
      window.location.assign(link.href);
    } finally {
      if (activeRequest === controller) activeRequest = null;
    }
  }

  document.addEventListener("click", function (event) {
    const loadMoreLink = event.target.closest("[data-load-more]");
    if (loadMoreLink && getListing() && !event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      const loadUrl = new URL(loadMoreLink.href, window.location.href);
      if (loadUrl.origin === window.location.origin) {
        event.preventDefault();
        loadMore(loadMoreLink);
      }
      return;
    }

    const link = event.target.closest(".btn-filter");
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
