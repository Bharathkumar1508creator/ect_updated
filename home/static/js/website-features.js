(() => {
  "use strict";

  const section = document.querySelector("[data-key-features]");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll("[data-feature-card]"));
  const desktop = window.matchMedia("(min-width: 1200px) and (prefers-reduced-motion: no-preference)");
  // How far a covered card drifts up while the next one slides over it.
  const drift = 48;
  let ticking = false;

  function update() {
    ticking = false;

    if (!desktop.matches) {
      cards.forEach((card) => {
        card.style.transform = "";
      });
      return;
    }

    const pinnedTop = parseFloat(window.getComputedStyle(cards[0]).top) || 0;

    cards.forEach((card, index) => {
      const next = cards[index + 1];
      if (!next) return;

      // 0 while the next card is still below this one, 1 once it has covered it.
      const height = card.offsetHeight;
      const covered = (pinnedTop + height - next.getBoundingClientRect().top) / height;
      const progress = Math.min(1, Math.max(0, covered));
      card.style.transform = progress ? `translateY(${(-progress * drift).toFixed(1)}px)` : "";
    });
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  desktop.addEventListener("change", requestUpdate);
  update();
})();
