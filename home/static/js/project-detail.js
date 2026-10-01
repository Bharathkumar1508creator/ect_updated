(function () {
  "use strict";

  function initializeRelatedProjects(section) {
    const rail = section.querySelector("[data-related-rail]");
    const previous = section.querySelector("[data-related-previous]");
    const next = section.querySelector("[data-related-next]");
    const more = section.querySelector("[data-related-more]");
    const deferred = Array.from(section.querySelectorAll(".case-study__related-item--deferred"));
    if (!rail) return;

    section.classList.add("is-enhanced");
    deferred.forEach(function (item) { item.hidden = true; });

    function scrollByCard(direction) {
      const card = rail.querySelector(".case-study__related-item:not([hidden])");
      if (!card) return;
      const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
      rail.scrollBy({
        left: direction * (card.getBoundingClientRect().width + gap),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }

    if (previous) previous.addEventListener("click", function () { scrollByCard(-1); });
    if (next) next.addEventListener("click", function () { scrollByCard(1); });

    if (more) {
      more.addEventListener("click", function () {
        deferred.splice(0, 6).forEach(function (item) { item.hidden = false; });
        if (!deferred.length) more.closest(".case-study__related-more-wrap").remove();
        rail.dispatchEvent(new CustomEvent("related-projects:expanded", { bubbles: true }));
      });
    }
  }

  function init() {
    document.querySelectorAll("[data-related-projects]").forEach(initializeRelatedProjects);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
