(() => {
  "use strict";

  // Lets a mouse drag the sideways-scrolling row of cards (touch and trackpads already scroll it).
  const track = document.querySelector("[data-hr-flex-track]");
  if (!track) return;

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

  // A drag must not count as a click on a link inside a card.
  track.addEventListener("click", (event) => {
    if (moved) {
      event.preventDefault();
      moved = false;
    }
  }, true);
})();
