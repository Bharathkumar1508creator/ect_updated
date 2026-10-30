(() => {
  "use strict";

  // Arrow buttons scroll the card row by one card; a mouse can also drag it
  // (touch and trackpads already scroll it).
  const track = document.querySelector("[data-infra-srv-track]");
  if (!track) return;
  const prev = document.querySelector("[data-infra-srv-prev]");
  const next = document.querySelector("[data-infra-srv-next]");

  const step = () => {
    const card = track.querySelector(".ect-zoho-req__card");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };

  if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  let startX = 0;
  let startLeft = 0;
  let dragging = false;
  let moved = false;

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startLeft = track.scrollLeft;
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) {
      moved = true;
      track.classList.add("is-dragging");
    }
    track.scrollLeft = startLeft - delta;
  });

  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
  });

  track.addEventListener("click", (event) => {
    if (moved) {
      event.preventDefault();
      moved = false;
    }
  }, true);
})();
