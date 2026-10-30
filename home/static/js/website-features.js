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

/* Phone/tablet feature carousel. Desktop sticky cards are handled above. */
(() => {
  "use strict";

  const section = document.querySelector("[data-key-features]");
  if (!section) return;

  const stack = section.querySelector(".ect-key-features__stack");
  const cards = Array.from(stack.querySelectorAll("[data-feature-card]"));
  if (cards.length < 2) return;

  const smallScreen = window.matchMedia("(max-width: 1199px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const delay = 5000;
  let activeIndex = 0;
  let timer = null;
  let settleTimer = null;
  let wrapTimer = null;
  let clone = null;
  let held = false;
  let inView = false;
  let wrapping = false;

  const cardLeft = (card) => card.getBoundingClientRect().left - stack.getBoundingClientRect().left + stack.scrollLeft;

  function clearTimers() {
    window.clearTimeout(timer);
    window.clearTimeout(settleTimer);
    window.clearTimeout(wrapTimer);
    timer = settleTimer = wrapTimer = null;
  }

  function canPlay() {
    return smallScreen.matches && !reducedMotion.matches && inView && !document.hidden && !held;
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!canPlay()) return;
    timer = window.setTimeout(advance, delay);
  }

  function nearestCard() {
    const left = stack.scrollLeft;
    return cards.reduce((best, card, index) =>
      Math.abs(cardLeft(card) - left) < Math.abs(cardLeft(cards[best]) - left) ? index : best, 0);
  }

  function advance() {
    if (!canPlay()) return;
    if (activeIndex < cards.length - 1) {
      activeIndex += 1;
      stack.scrollTo({ left: cardLeft(cards[activeIndex]), behavior: "smooth" });
      schedule();
      return;
    }

    // Glide to a copy of the first card, then reset the rail without a flash.
    if (!clone) return;
    wrapping = true;
    stack.scrollTo({ left: cardLeft(clone), behavior: "smooth" });
    wrapTimer = window.setTimeout(() => {
      stack.scrollTo({ left: cardLeft(cards[0]), behavior: "instant" });
      activeIndex = 0;
      wrapping = false;
      schedule();
    }, 650);
  }

  function syncMode() {
    clearTimers();
    held = false;
    wrapping = false;
    if (smallScreen.matches) {
      if (!clone) {
        clone = cards[0].cloneNode(true);
        clone.removeAttribute("data-feature-card");
        clone.setAttribute("aria-hidden", "true");
        clone.inert = true;
        clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
        stack.appendChild(clone);
      }
      stack.scrollTo({ left: cardLeft(cards[activeIndex]), behavior: "instant" });
      schedule();
    } else {
      clone?.remove();
      clone = null;
      stack.scrollLeft = 0;
    }
  }

  stack.addEventListener("pointerdown", (event) => {
    if (!smallScreen.matches || !event.target.closest(".ect-key-features__card")) return;
    held = true;
    clearTimers();
    wrapping = false;
    wrapping = false;
    stack.scrollTo({ left: stack.scrollLeft, behavior: "instant" });
  });

  function release() {
    if (!held) return;
    held = false;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      activeIndex = nearestCard();
      stack.scrollTo({ left: cardLeft(cards[activeIndex]), behavior: "smooth" });
      schedule();
    }, 180);
  }

  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);

  stack.addEventListener("scroll", () => {
    if (!smallScreen.matches || wrapping) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (clone && stack.scrollLeft >= cardLeft(clone) - stack.clientWidth * 0.4) {
        stack.scrollTo({ left: cardLeft(cards[0]), behavior: "instant" });
        activeIndex = 0;
      } else {
        activeIndex = nearestCard();
        const target = cardLeft(cards[activeIndex]);
        if (Math.abs(stack.scrollLeft - target) > 2) {
          stack.scrollTo({ left: target, behavior: "smooth" });
          return;
        }
      }
      if (!held) schedule();
    }, 160);
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      schedule();
    }, { threshold: 0.2 }).observe(section);
  } else {
    inView = true;
  }

  document.addEventListener("visibilitychange", schedule);
  smallScreen.addEventListener("change", syncMode);
  reducedMotion.addEventListener("change", schedule);
  syncMode();
})();
