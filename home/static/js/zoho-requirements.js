(() => {
  "use strict";

  const section = document.querySelector(".ect-zoho-req");
  if (!section) return;

  const track = section.querySelector(".ect-zoho-req__grid");
  const cards = Array.from(section.querySelectorAll(".ect-zoho-req__card"));
  const responsive = window.matchMedia("(max-width: 1199px)");
  const mobile = window.matchMedia("(max-width: 700px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let timer = 0;
  let index = 0;
  let paused = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  const visibleCards = () => (mobile.matches ? 1 : 2);
  const maxIndex = () => Math.max(0, cards.length - visibleCards());
  const step = () => {
    if (cards.length < 2) return track.clientWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  };

  function moveTo(target, behavior = "smooth") {
    index = Math.max(0, Math.min(maxIndex(), target));
    track.scrollTo({ left: index * step(), behavior });
  }

  function stop() {
    window.clearInterval(timer);
    timer = 0;
  }

  function start() {
    stop();
    if (!responsive.matches || reducedMotion.matches) return;
    timer = window.setInterval(() => {
      if (paused || dragging) return;
      moveTo(index >= maxIndex() ? 0 : index + 1);
    }, 3400);
  }

  function hold(card) {
    paused = true;
    card.classList.add("is-held");
  }

  function release(card) {
    paused = false;
    card.classList.remove("is-held");
  }

  cards.forEach((card) => {
    card.addEventListener("pointerdown", (event) => {
      if (!responsive.matches) return;
      hold(card);
      if (event.pointerType === "mouse") {
        event.preventDefault();
        dragging = true;
        dragStartX = event.clientX;
        dragStartScroll = track.scrollLeft;
        track.classList.add("is-dragging");
        card.setPointerCapture(event.pointerId);
      }
    });

    card.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerType !== "mouse") return;
      track.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
      card.addEventListener(type, () => {
        if (!responsive.matches) return;
        if (dragging) {
          dragging = false;
          track.classList.remove("is-dragging");
          moveTo(Math.round(track.scrollLeft / Math.max(1, step())));
        }
        release(card);
      });
    });

    card.addEventListener("focusin", () => {
      if (responsive.matches) hold(card);
    });
    card.addEventListener("focusout", () => release(card));
  });

  let scrollFrame = 0;
  track.addEventListener("scroll", () => {
    if (!responsive.matches) return;
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      index = Math.max(0, Math.min(maxIndex(), Math.round(track.scrollLeft / Math.max(1, step()))));
    });
  }, { passive: true });

  function sync() {
    stop();
    index = 0;
    track.classList.remove("is-dragging");
    cards.forEach((card) => card.classList.remove("is-held"));
    if (responsive.matches) {
      track.scrollTo({ left: 0, behavior: "auto" });
      start();
    } else {
      track.scrollLeft = 0;
    }
  }

  responsive.addEventListener("change", sync);
  mobile.addEventListener("change", sync);
  reducedMotion.addEventListener("change", start);
  window.addEventListener("resize", () => {
    if (responsive.matches) moveTo(index, "auto");
  });

  sync();
})();
