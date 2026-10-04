"use strict";

/* ==========================================================================
   HERO HEADING
   ========================================================================== */

(function () {
  const lineBreak = document.querySelector(".hero__break");
  const mobileQuery = window.matchMedia("(max-width: 480px)");

  function syncHeroBreak() {
    if (lineBreak) {
      lineBreak.style.display = mobileQuery.matches ? "none" : "";
    }
  }

  syncHeroBreak();

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncHeroBreak);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(syncHeroBreak);
  }
})();

/* Responsive HR/Zoho service topics: add each related image after the
   description and support left/right touch swipes without changing desktop. */
(function () {
  "use strict";

  function initResponsiveServiceTopics() {
    var section = document.querySelector(".software-section");
    var wrapper = section && section.querySelector(".tabs-wrapper");
    var panels = section ? Array.prototype.slice.call(
      section.querySelectorAll(".content-panel .panel")
    ) : [];
    var previousButton = section && section.querySelector("#prevBtn");
    var nextButton = section && section.querySelector("#nextBtn");
    var mediaQuery = window.matchMedia("(max-width: 1199px)");
    var touchStartX = 0;
    var touchStartY = 0;

    if (!section || !wrapper || !panels.length) return;

    panels.forEach(function (panel) {
      if (panel.querySelector(".service-mobile-media") || !panel.dataset.image) return;

      var media = document.createElement("div");
      var image = document.createElement("img");
      var title = panel.querySelector("h3");
      var description = panel.querySelector("p");

      media.className = "service-mobile-media";
      image.src = panel.dataset.image;
      image.alt = title ? title.textContent.trim() : "Service preview";
      image.loading = "lazy";
      image.decoding = "async";
      media.appendChild(image);

      if (description) {
        description.insertAdjacentElement("afterend", media);
      } else if (title) {
        title.insertAdjacentElement("afterend", media);
      } else {
        panel.insertBefore(media, panel.firstChild);
      }
    });

    wrapper.addEventListener("touchstart", function (event) {
      if (!mediaQuery.matches || !event.touches.length) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    wrapper.addEventListener("touchend", function (event) {
      if (!mediaQuery.matches || !event.changedTouches.length) return;
      var deltaX = event.changedTouches[0].clientX - touchStartX;
      var deltaY = event.changedTouches[0].clientY - touchStartY;

      if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      if (deltaX < 0 && nextButton) nextButton.click();
      if (deltaX > 0 && previousButton) previousButton.click();
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResponsiveServiceTopics, { once: true });
  } else {
    initResponsiveServiceTopics();
  }
})();


/* ==========================================================================
   HR SERVICES — EXACT ZOHO CAROUSEL
   ========================================================================== */

(function () {
  "use strict";

  var section = document.querySelector(
    ".hr-page .software-section"
  );

  if (!section) {
    return;
  }

  var wrapper = section.querySelector("#tabsWrapper");
  var track = section.querySelector("#tabsTrack");

  var panels = section.querySelectorAll(
    "#contentPanel .panel"
  );

  var previousButton =
    section.querySelector("#prevBtn");

  var nextButton =
    section.querySelector("#nextBtn");

  if (
    !wrapper ||
    !track ||
    !panels.length
  ) {
    return;
  }

  /*
   * Same continuous movement speed used
   * by the Zoho services carousel.
   */
  var SPEED = 0.5;
  var AUTO_PLAY_DELAY = 2000;
  var responsiveQuery = window.matchMedia("(max-width: 1199px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var autoplayTimer = null;
  var isInViewport = true;

  /*
   * Remove existing cloned tabs first.
   * This prevents duplicate clones if the
   * JavaScript is accidentally initialized twice.
   */
  Array.prototype.slice
    .call(track.querySelectorAll(".is-clone"))
    .forEach(function (clone) {
      clone.remove();
    });

  var originalTabs = Array.prototype.slice.call(
    track.children
  );

  var total = originalTabs.length;

  if (!total) {
    return;
  }

  originalTabs.forEach(function (tab, index) {
    tab.dataset.index = String(index);

    var clone = tab.cloneNode(true);

    clone.classList.add("is-clone");
    clone.dataset.index = String(index);
    clone.setAttribute("aria-hidden", "true");

    track.appendChild(clone);
  });

  var allTabs = Array.prototype.slice.call(
    track.children
  );

  var current = 0;
  var paused = false;
  var offsetX = 0;
  var loopWidth = 0;
  var positions = [];
  var resizeTimer = null;

  function measure() {
    var trackStyle =
      window.getComputedStyle(track);

    var gap =
      parseFloat(trackStyle.gap) || 0;

    positions = [];

    var accumulatedWidth = 0;

    originalTabs.forEach(function (tab) {
      positions.push(accumulatedWidth);

      accumulatedWidth +=
        tab.offsetWidth + gap;
    });

    loopWidth = accumulatedWidth;

    if (loopWidth > 0) {
      offsetX =
        ((offsetX % loopWidth) + loopWidth) %
        loopWidth;

      track.style.transform =
        "translate3d(-" + offsetX + "px, 0, 0)";
    }
  }

  function getIndexAtOffset(value) {
    if (!loopWidth) {
      return 0;
    }

    var normalized =
      ((value % loopWidth) + loopWidth) %
      loopWidth;

    var index = 0;

    for (
      var positionIndex = 0;
      positionIndex < positions.length;
      positionIndex += 1
    ) {
      if (
        positions[positionIndex] <= normalized
      ) {
        index = positionIndex;
      }
    }

    return index;
  }

  function clearResponsiveAutoplay() {
    if (autoplayTimer !== null) {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleResponsiveAutoplay() {
    clearResponsiveAutoplay();
    if (document.hidden || !isInViewport) {
      return;
    }

    autoplayTimer = window.setTimeout(function () {
      jumpTo(current + 1);
    }, AUTO_PLAY_DELAY);
  }

  function updateImage(activePanel) {
    if (!activePanel.dataset.image) {
      return;
    }

    var imageElement = section.querySelector(
      "#contentImage img"
    );

    if (!imageElement) {
      return;
    }

    imageElement.removeAttribute("srcset");
    imageElement.removeAttribute("sizes");
    imageElement.src =
      activePanel.dataset.image;

    var heading =
      activePanel.querySelector("h3");

    if (heading) {
      imageElement.alt =
        heading.textContent.trim();
    }
  }

  function activate(index) {
    current =
      ((index % total) + total) % total;

    allTabs.forEach(function (tab) {
      var selected =
        Number(tab.dataset.index) === current;

      tab.classList.toggle(
        "active",
        selected
      );

      if (!tab.classList.contains("is-clone")) {
        tab.setAttribute(
          "aria-selected",
          String(selected)
        );
      }
    });

    panels.forEach(function (panel) {
      var selected =
        Number(panel.dataset.index) === current;

      panel.classList.toggle(
        "active",
        selected
      );

      panel.hidden = !selected;

      if (selected) {
        updateImage(panel);
      }
    });
  }

  function jumpTo(index) {
    var normalizedIndex =
      ((index % total) + total) % total;

    if (
      positions[normalizedIndex] !== undefined
    ) {
      offsetX =
        positions[normalizedIndex];

      if (responsiveQuery.matches) {
        offsetX -=
          (wrapper.clientWidth - originalTabs[normalizedIndex].offsetWidth) / 2;

        if (loopWidth > 0) {
          offsetX =
            ((offsetX % loopWidth) + loopWidth) % loopWidth;
        }
      }
    }

    track.style.transform =
      "translate3d(-" + offsetX + "px, 0, 0)";

    activate(normalizedIndex);
    scheduleResponsiveAutoplay();
  }

  function animateTrack() {
    if (!responsiveQuery.matches && !paused && loopWidth) {
      offsetX += SPEED;

      if (offsetX >= loopWidth) {
        offsetX -= loopWidth;
      }

      track.style.transform =
        "translate3d(-" +
        offsetX +
        "px, 0, 0)";

      var activeIndex =
        getIndexAtOffset(offsetX);

      if (activeIndex !== current) {
        activate(activeIndex);
      }
    }

    window.requestAnimationFrame(
      animateTrack
    );
  }

  allTabs.forEach(function (tab) {
    tab.addEventListener(
      "click",
      function () {
        jumpTo(
          Number(tab.dataset.index)
        );
      }
    );
  });

  if (nextButton) {
    nextButton.addEventListener(
      "click",
      function () {
        jumpTo(current + 1);
      }
    );
  }

  if (previousButton) {
    previousButton.addEventListener(
      "click",
      function () {
        jumpTo(current - 1);
      }
    );
  }

  [
    wrapper,
    section.querySelector(".content-area")
  ].forEach(function (element) {
    if (!element) {
      return;
    }

    element.addEventListener(
      "mouseenter",
      function () {
        paused = true;
      }
    );

    element.addEventListener(
      "mouseleave",
      function () {
        paused = false;
      }
    );

    element.addEventListener(
      "focusin",
      function () {
        paused = true;
      }
    );

    element.addEventListener(
      "focusout",
      function () {
        paused = false;
      }
    );
  });

  wrapper.setAttribute(
    "role",
    "tablist"
  );

  measure();

  window.addEventListener(
    "resize",
    function () {
      window.clearTimeout(resizeTimer);

      resizeTimer =
        window.setTimeout(
          function () {
            measure();
            jumpTo(current);
          },
          120
        );
    }
  );

  activate(0);

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== wrapper) return;
          isInViewport = entry.isIntersecting;
          if (isInViewport) scheduleResponsiveAutoplay();
          else clearResponsiveAutoplay();
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(wrapper);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) clearResponsiveAutoplay();
    else scheduleResponsiveAutoplay();
  });

  function syncResponsiveMode() {
    clearResponsiveAutoplay();
    measure();
    jumpTo(current);
  }

  if (typeof responsiveQuery.addEventListener === "function") {
    responsiveQuery.addEventListener("change", syncResponsiveMode);
  } else if (typeof responsiveQuery.addListener === "function") {
    responsiveQuery.addListener(syncResponsiveMode);
  }

  scheduleResponsiveAutoplay();
})();

/* ==========================================================================
   APPROACH REVEAL — MATCHED TO ZOHO
   ========================================================================== */

(function () {
  "use strict";

  const section =
    document.getElementById(
      "zoho-implementation"
    );

  if (!section) {
    return;
  }

  const cells =
    section.querySelectorAll(
      ".zoho-implementation__cell"
    );

  if (!cells.length) {
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-animated"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.15
        }
      );

    cells.forEach((cell) => {
      observer.observe(cell);
    });
  } else {
    cells.forEach((cell) => {
      cell.classList.add(
        "is-animated"
      );
    });
  }
})();

/* ==========================================================================
   TRADITIONAL HR VS STRATEGIC HR
   Original animated background logic preserved.
   ========================================================================== */

(function () {
  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }

  const canvas =
    document.getElementById(
      "netCanvas"
    );

  if (!canvas) {
    return;
  }

  const context =
    canvas.getContext("2d");

  const section =
    canvas.closest(".hr-compare");

  if (!context || !section) {
    return;
  }

  let width = 0;
  let height = 0;
  let nodes = [];

  const pointer = {
    x: -9999,
    y: -9999
  };

  const linkDistance = 130;
  const pointerDistance = 190;

  function resizeCanvas() {
    const rect =
      section.getBoundingClientRect();

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    width = rect.width;
    height = rect.height;

    canvas.width =
      Math.round(width * dpr);

    canvas.height =
      Math.round(height * dpr);

    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;

    context.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    const count = Math.min(
      90,
      Math.floor(width / 16)
    );

    nodes = Array.from(
      {
        length: count
      },
      () => ({
        x: Math.random() * width,
        y: Math.random() * height,

        vx:
          (Math.random() - 0.5) *
          0.35,

        vy:
          (Math.random() - 0.5) *
          0.35,

        radius:
          Math.random() * 1.6 +
          0.8
      })
    );
  }

  section.addEventListener(
    "pointermove",
    (event) => {
      const rect =
        section.getBoundingClientRect();

      pointer.x =
        event.clientX - rect.left;

      pointer.y =
        event.clientY - rect.top;
    }
  );

  section.addEventListener(
    "pointerleave",
    () => {
      pointer.x = -9999;
      pointer.y = -9999;
    }
  );

  function draw() {
    context.clearRect(
      0,
      0,
      width,
      height
    );

    nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < -20) {
        node.x = width + 20;
      }

      if (node.x > width + 20) {
        node.x = -20;
      }

      if (node.y < -20) {
        node.y = height + 20;
      }

      if (node.y > height + 20) {
        node.y = -20;
      }
    });

    for (
      let firstIndex = 0;
      firstIndex < nodes.length;
      firstIndex += 1
    ) {
      const first =
        nodes[firstIndex];

      for (
        let secondIndex =
          firstIndex + 1;

        secondIndex <
        nodes.length;

        secondIndex += 1
      ) {
        const second =
          nodes[secondIndex];

        const dx =
          first.x - second.x;

        const dy =
          first.y - second.y;

        const distance =
          Math.hypot(dx, dy);

        if (
          distance <
          linkDistance
        ) {
          context.strokeStyle =
            `rgba(95, 200, 130, ${
              0.28 *
              (
                1 -
                distance /
                linkDistance
              )
            })`;

          context.lineWidth = 1;

          context.beginPath();

          context.moveTo(
            first.x,
            first.y
          );

          context.lineTo(
            second.x,
            second.y
          );

          context.stroke();
        }
      }

      const pointerGap =
        Math.hypot(
          first.x - pointer.x,
          first.y - pointer.y
        );

      if (
        pointerGap <
        pointerDistance
      ) {
        context.strokeStyle =
          `rgba(150, 240, 175, ${
            0.5 *
            (
              1 -
              pointerGap /
              pointerDistance
            )
          })`;

        context.lineWidth = 1;

        context.beginPath();

        context.moveTo(
          first.x,
          first.y
        );

        context.lineTo(
          pointer.x,
          pointer.y
        );

        context.stroke();
      }
    }

    nodes.forEach((node) => {
      context.fillStyle =
        "rgba(150, 235, 175, 0.75)";

      context.beginPath();

      context.arc(
        node.x,
        node.y,
        node.radius,
        0,
        Math.PI * 2
      );

      context.fill();
    });

    window.requestAnimationFrame(
      draw
    );
  }

  let resizeTimer = null;

  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(
        resizeTimer
      );

      resizeTimer =
        window.setTimeout(
          resizeCanvas,
          120
        );
    }
  );

  resizeCanvas();

  window.requestAnimationFrame(
    draw
  );
})();

/* ==========================================================================
   FAQ — EXACT ZOHO PAGE BEHAVIOUR
   ========================================================================== */

(function () {
  "use strict";

  var faqSection =
    document.querySelector(
      ".hr-page .faq-section"
    );

  if (!faqSection) {
    return;
  }

  var items =
    faqSection.querySelectorAll(
      ".faq-item"
    );

  if (!items.length) {
    return;
  }

  function closeItem(item) {
    var button =
      item.querySelector(".faq-q");

    item.classList.remove(
      "open"
    );

    if (button) {
      button.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }

  function openItem(item) {
    var button =
      item.querySelector(".faq-q");

    item.classList.add(
      "open"
    );

    if (button) {
      button.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  }

  items.forEach(function (item) {
    closeItem(item);

    var button =
      item.querySelector(".faq-q");

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      function () {
        var shouldOpen =
          !item.classList.contains(
            "open"
          );

        items.forEach(
          function (otherItem) {
            closeItem(otherItem);
          }
        );

        if (shouldOpen) {
          openItem(item);
        }
      }
    );
  });

  var reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (reduceMotion) {
    items.forEach(function (item) {
      item.classList.add(
        "faq-in-view"
      );
    });

    return;
  }

  if ("IntersectionObserver" in window) {
    var observer =
      new IntersectionObserver(
        function (entries) {
          entries.forEach(
            function (entry) {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              var delay =
                Number(
                  entry.target.dataset
                    .delay
                ) || 0;

              entry.target.style
                .animationDelay =
                delay + "ms";

              entry.target
                .classList.add(
                  "faq-in-view"
                );

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.15
        }
      );

    items.forEach(
      function (item, index) {
        item.dataset.delay =
          index % 2 === 0
            ? index * 60
            : index * 60 + 40;

        observer.observe(item);
      }
    );
  } else {
    items.forEach(function (item) {
      item.classList.add(
        "faq-in-view"
      );
    });
  }
})();

/* ==========================================================================
   NEWSLETTER
   Supports the footer structure used by the Zoho page.
   ========================================================================== */

(function () {
  "use strict";

  const form =
    document.querySelector(
      ".footer .f-subscribe"
    );

  if (!form) {
    return;
  }

  const emailInput =
    form.querySelector(
      'input[type="email"]'
    );

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );

  if (
    !emailInput ||
    !submitButton
  ) {
    return;
  }

  /*
   * Create a small status message automatically.
   * No extra HTML is required.
   */
  let message =
    form.parentElement
      ?.querySelector(
        ".newsletter-message"
      );

  if (!message) {
    message =
      document.createElement("p");

    message.className =
      "newsletter-message";

    message.setAttribute(
      "aria-live",
      "polite"
    );

    message.style.marginTop =
      "10px";

    message.style.fontSize =
      "13px";

    message.style.lineHeight =
      "1.4";

    form.insertAdjacentElement(
      "afterend",
      message
    );
  }

  let messageTimer = null;

  function showMessage(
    text,
    isError
  ) {
    message.textContent = text;

    message.style.color =
      isError
        ? "#ffd3d3"
        : "#d8f5d0";

    window.clearTimeout(
      messageTimer
    );

    messageTimer =
      window.setTimeout(
        function () {
          message.textContent = "";
        },
        3500
      );
  }

  form.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();

      const email =
        emailInput.value.trim();

      const validEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        );

      if (!email) {
        showMessage(
          "Please enter your email address.",
          true
        );

        emailInput.focus();

        return;
      }

      if (!validEmail) {
        showMessage(
          "Please enter a valid email address.",
          true
        );

        emailInput.focus();

        return;
      }

      showMessage(
        "Subscribed successfully! Thank you.",
        false
      );

      emailInput.value = "";
    }
  );
})();


/* =========================================================
   HR HERO CTA — SMOOTH SCROLL
   ========================================================= */

(function () {
  "use strict";

  const button = document.querySelector(
    '.hero__cta[data-smooth-scroll]'
  );

  if (!button) return;

  button.addEventListener("click", function (event) {
    const targetSelector = button.getAttribute("href");
    const target = document.querySelector(targetSelector);

    if (!target) return;

    event.preventDefault();

    const navbar = document.querySelector(
      "header, nav, .navbar, .site-navbar"
    );

    const navbarHeight = navbar
      ? navbar.getBoundingClientRect().height
      : 72;

    const startPosition = window.scrollY;

    const targetPosition =
      target.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight -
      24;

    const distance = targetPosition - startPosition;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      window.scrollTo(0, targetPosition);
      window.history.replaceState(null, "", targetSelector);
      return;
    }

    const duration = Math.min(
      1400,
      Math.max(900, Math.abs(distance) * 0.7)
    );

    let startTime = null;

    const htmlEl = document.documentElement;
    const previousScrollBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";

    function easeInOutCubic(progress) {
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    function animateScroll(currentTime) {
      if (!startTime) {
        startTime = currentTime;
      }

      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      window.scrollTo(
        0,
        startPosition + distance * easedProgress
      );

      if (progress < 1) {
        window.requestAnimationFrame(animateScroll);
      } else {
        window.history.replaceState(null, "", targetSelector);
        htmlEl.style.scrollBehavior = previousScrollBehavior;
      }
    }

    window.requestAnimationFrame(animateScroll);
  });
})();
