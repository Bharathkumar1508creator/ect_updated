(function () {
  "use strict";

  function showFallback(media) {
    const frame = media.closest("[data-media-frame]");
    if (!frame) return;
    media.hidden = true;
    const fallback = frame.querySelector("[data-media-fallback]");
    if (fallback) fallback.hidden = false;
  }

  function updateVideoButton(video, button) {
    const isPlaying = !video.paused && !video.ended;
    button.classList.toggle("is-playing", isPlaying);
    button.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
  }

  function initCarousel() {
    const cards = Array.from(document.querySelectorAll(".hero-carousel-card"));
    if (!cards.length) return;

    let activeIndex = Math.min(2, cards.length - 1);
    let timer = null;

    function updateCards() {
      const total = cards.length;
      cards.forEach(function (card, index) {
        let offset = index - activeIndex;
        if (offset > Math.floor(total / 2)) offset -= total;
        if (offset < -Math.floor(total / 2)) offset += total;
        card.setAttribute("data-offset", String(offset));
      });
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (cards.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = window.setInterval(function () {
        if (document.hidden) return;
        activeIndex = (activeIndex + 1) % cards.length;
        updateCards();
      }, 5000);
    }

    cards.forEach(function (card, index) {
      card.addEventListener("click", function () {
        activeIndex = index;
        updateCards();
      });
    });

    const carousel = document.querySelector(".hero-carousel");
    if (carousel) {
      carousel.addEventListener("mouseenter", stop);
      carousel.addEventListener("mouseleave", start);
      carousel.addEventListener("focusin", stop);
      carousel.addEventListener("focusout", start);
    }

    updateCards();
    start();
  }

  function init() {
    initCarousel();
    document.querySelectorAll("[data-media-image], [data-media-video]").forEach(function (media) {
      media.addEventListener("error", function () { showFallback(media); }, { once: true });
      if (media.tagName === "IMG" && media.complete && media.naturalWidth === 0) {
        showFallback(media);
      }
    });

    document.querySelectorAll("[data-card-video-button]").forEach(function (button) {
      const frame = button.closest("[data-media-frame]");
      const video = frame && frame.querySelector("video");
      if (!video) {
        button.hidden = true;
        return;
      }

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (video.paused || video.ended) {
          video.play().catch(function () { showFallback(video); });
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () { updateVideoButton(video, button); });
      video.addEventListener("pause", function () { updateVideoButton(video, button); });
      video.addEventListener("ended", function () { updateVideoButton(video, button); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
