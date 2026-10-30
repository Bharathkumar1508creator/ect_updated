(() => {
  "use strict";

  const section = document.querySelector("[data-dm-cta]");
  if (!section) return;

  const blobs = Array.from(section.querySelectorAll(".ect-dm-cta__blob"));
  blobs.forEach((blob) => blob.style.setProperty("--d", blob.dataset.depth || "40"));

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Target and current pointer position, -0.5 .. 0.5 across the section (0 = centre).
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let frame = 0;
  let visible = false;

  function render() {
    frame = 0;
    // Ease toward the pointer so the glows trail it softly.
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    section.style.setProperty("--px", cx.toFixed(4));
    section.style.setProperty("--py", cy.toFixed(4));
    section.style.setProperty("--gx", `${((cx + 0.5) * 100).toFixed(2)}%`);
    section.style.setProperty("--gy", `${((cy + 0.5) * 100).toFixed(2)}%`);
    if (visible && (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005)) request();
  }

  function request() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  section.addEventListener("pointermove", (event) => {
    if (reduce.matches || event.pointerType === "touch") return;
    const box = section.getBoundingClientRect();
    tx = (event.clientX - box.left) / box.width - 0.5;
    ty = (event.clientY - box.top) / box.height - 0.5;
    request();
  });

  section.addEventListener("pointerleave", () => {
    tx = 0;
    ty = 0;
    request();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) request();
    }).observe(section);
  } else {
    visible = true;
  }
})();
