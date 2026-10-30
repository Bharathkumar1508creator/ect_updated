(() => {
  "use strict";

  const section = document.querySelector("#zoho-solutions");
  if (!section) return;

  const rail = section.querySelector(".ect-web-solutions__tabs");
  const tabs = Array.from(
    section.querySelectorAll(".ect-web-solutions__tab:not(.ect-web-solutions__tab--clone)")
  );
  const responsive = window.matchMedia("(max-width: 1199px)");
  let scrollTimer = 0;
  let programmaticScroll = false;

  if (!rail || !tabs.length) return;

  function activeIndex() {
    return Math.max(0, tabs.findIndex((tab) => tab.classList.contains("is-active")));
  }

  function centerTab(tab, instant = false) {
    if (!responsive.matches || !tab) return;

    const left = tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2;
    programmaticScroll = true;
    rail.scrollTo({
      left: Math.max(0, left),
      behavior: instant ? "auto" : "smooth",
    });
    window.setTimeout(() => {
      programmaticScroll = false;
    }, instant ? 0 : 450);
  }

  function activateNearestTab() {
    if (!responsive.matches || programmaticScroll) return;

    const railRect = rail.getBoundingClientRect();
    const center = railRect.left + railRect.width / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;

    tabs.forEach((tab, index) => {
      const rect = tab.getBoundingClientRect();
      const current = Math.abs(rect.left + rect.width / 2 - center);
      if (current < distance) {
        nearest = index;
        distance = current;
      }
    });

    if (nearest !== activeIndex()) {
      tabs[nearest].click();
    } else {
      centerTab(tabs[nearest]);
    }
  }

  rail.addEventListener(
    "scroll",
    () => {
      if (!responsive.matches || programmaticScroll) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(activateNearestTab, 140);
    },
    { passive: true }
  );

  tabs.forEach((tab) => {
    new MutationObserver(() => {
      if (tab.classList.contains("is-active")) centerTab(tab);
    }).observe(tab, { attributes: true, attributeFilter: ["class"] });
  });

  function sync(instant = true) {
    if (responsive.matches) centerTab(tabs[activeIndex()], instant);
  }

  responsive.addEventListener("change", () => sync(true));
  window.addEventListener("resize", () => sync(true));
  window.requestAnimationFrame(() => sync(true));
})();
