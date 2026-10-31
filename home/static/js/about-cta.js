/* About page CTA: builds the two seamless, endlessly scrolling client-logo rows. */
(function () {
  "use strict";

  var section = document.getElementById("ectCta");
  if (!section) return;

  var rows = section.querySelectorAll(".ect-cta__row");
  var tracks = section.querySelectorAll(".ect-cta__track");
  var SPEED = 50; // pixels per second

  function buildRow(row) {
    var track = row.querySelector(".ect-cta__track");
    var group = track.querySelector(".ect-cta__group");

    track.querySelectorAll('.ect-cta__group[aria-hidden="true"]').forEach(function (g) { g.remove(); });
    group.querySelectorAll("[data-clone]").forEach(function (li) { li.remove(); });

    var originals = Array.prototype.slice.call(group.children);
    var rowWidth = row.offsetWidth;

    // Repeat the logos until one group is at least as wide as the row.
    var safety = 0;
    while (group.scrollWidth < rowWidth && safety < 10) {
      originals.forEach(function (li) {
        var copy = li.cloneNode(true);
        copy.setAttribute("data-clone", "");
        copy.setAttribute("aria-hidden", "true");
        copy.querySelector("img").alt = "";
        group.appendChild(copy);
      });
      safety++;
    }

    // A second identical group lets the track loop with no jump.
    var clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach(function (img) { img.alt = ""; });
    track.appendChild(clone);

    track.style.setProperty("--duration", (group.offsetWidth / SPEED).toFixed(2) + "s");
  }

  function buildAll() {
    rows.forEach(buildRow);
  }

  // Hovering either row pauses both, and they resume from the same place.
  tracks.forEach(function (track) {
    track.addEventListener("mouseenter", function () { section.classList.add("is-paused"); });
    track.addEventListener("mouseleave", function () { section.classList.remove("is-paused"); });
  });

  var lastWidth = window.innerWidth;
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        buildAll();
      }
    }, 200);
  });

  buildAll();
  // Widths depend on the card size, so rebuild once everything has loaded.
  window.addEventListener("load", buildAll);
})();
