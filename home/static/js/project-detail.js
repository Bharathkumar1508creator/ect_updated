(function () {
  "use strict";

  function initializeRelatedProjects(section) {
    const rail = section.querySelector("[data-related-rail]");
    const more = section.querySelector("[data-related-more]");
    const deferred = Array.from(section.querySelectorAll(".case-study__related-item--deferred"));
    if (!rail) return;

    section.classList.add("is-enhanced");
    deferred.forEach(function (item) { item.hidden = true; });

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
