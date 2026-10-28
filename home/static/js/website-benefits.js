(() => {
  "use strict";

  const section = document.querySelector("[data-website-benefits]");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll("[data-benefit-card]"));
  const rail = section.querySelector(".website-benefits__orbit");
  const desktop = window.matchMedia("(min-width: 1025px) and (prefers-reduced-motion: no-preference)");
  const loopDuration = 30108.121;
  let progress = 0;
  let frame = 0;
  let lastTime = 0;
  let visible = !("IntersectionObserver" in window);
  let hoverPaused = false;
  let focusPaused = false;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function circularDistance(index, position) {
    let distance = index - position;
    const halfway = cards.length / 2;
    while (distance > halfway) distance -= cards.length;
    while (distance < -halfway) distance += cards.length;
    return distance;
  }

  // The Figma wheel places cards on a circle and turns each one by its own angle,
  // 25.7deg apart; cards pivot around the wheel centre (set in CSS as transform-origin).
  const stepAngle = 25.7;

  function render(position) {
    cards.forEach((card, index) => {
      const distance = circularDistance(index, position);
      const angle = -distance * stepAngle;
      const absolute = Math.abs(angle);
      const opacity = clamp((84 - absolute) / 12, 0, 1);

      card.style.transform = `translateX(-50%) rotate(${angle.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(Math.round(20 - absolute / 6));
      card.style.pointerEvents = opacity > 0.05 ? "auto" : "none";
      const tabIndex = opacity > 0.15 ? 0 : -1;
      if (card.tabIndex !== tabIndex) card.tabIndex = tabIndex;
    });
  }

  function canAnimate() {
    return desktop.matches && visible && !document.hidden && !hoverPaused && !focusPaused;
  }

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function tick(time) {
    if (!canAnimate()) {
      stop();
      return;
    }
    if (lastTime) {
      const elapsed = Math.min(time - lastTime, 100);
      progress = (progress + elapsed * cards.length / loopDuration) % cards.length;
    }
    lastTime = time;
    render(progress);
    frame = window.requestAnimationFrame(tick);
  }

  function start() {
    if (canAnimate() && !frame) frame = window.requestAnimationFrame(tick);
  }

  function resetCards() {
    cards.forEach((card) => {
      card.style.transform = "";
      card.style.opacity = "";
      card.style.zIndex = "";
      card.style.pointerEvents = "";
      card.tabIndex = 0;
    });
  }

  function updateMode() {
    stop();
    if (!desktop.matches) {
      resetCards();
      return;
    }
    render(progress);
    start();
  }

  cards.forEach((card) => {
    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" || !desktop.matches) return;
      hoverPaused = true;
      stop();
    });
    card.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      hoverPaused = false;
      start();
    });
    card.addEventListener("focus", () => {
      focusPaused = true;
      stop();
    });
    card.addEventListener("blur", () => {
      focusPaused = false;
      start();
    });
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: 0.05 }).observe(section);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("resize", updateMode);
  desktop.addEventListener("change", updateMode);

  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  rail.addEventListener("pointerdown", (event) => {
    if (desktop.matches || event.pointerType !== "mouse") return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartScroll = rail.scrollLeft;
    rail.style.scrollSnapType = "none";
    rail.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  rail.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    rail.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });
  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    rail.style.scrollSnapType = "";
  };
  rail.addEventListener("pointerup", stopDragging);
  rail.addEventListener("pointercancel", stopDragging);
  updateMode();
})();
