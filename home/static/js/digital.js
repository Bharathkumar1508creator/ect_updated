// On very small screens, hide the forced line break so the headline wraps naturally
const br = document.querySelector('.hero__break');
const mq = window.matchMedia('(max-width: 480px)');

const toggleBreak = () => {
  if (br) {
    br.style.display = mq.matches ? 'none' : '';
  }
};

toggleBreak();
mq.addEventListener('change', toggleBreak);




//our process




(() => {
  const AUTO_PLAY_DELAY = 2000;
  const SLIDE_TRANSITION_DURATION = 240;

  const slides = [
    {
      image: "/static/img/Search-Engine-Optimization.webp",
      alt: "Search engine optimization marketing dashboard mockup displayed on a laptop",
      title: "BRAND VISIBILITY & SEO",
      description:
        "Improve your website's visibility through technical SEO, keyword strategy, on-page optimization, local SEO, and continuous performance improvements that drive long-term organic traffic.",
      perfectFor: "Perfect For:",
      audience: "Local Businesses - SMEs - E-commerce - Corporate Companies - Healthcare - Service Providers",
      cta: "Improve Rankings",
      ctaWidth: 150,
    },
    {
      image: "/static/img/Social Media Management.png",
      alt: "Social media management dashboard mockup displayed on a laptop",
      title: "ENGAGE & CONVERT",
      description:
        "Build a strong social presence across platforms with data-driven social media management, community engagement, and targeted campaigns that turn followers into loyal customers.",
      perfectFor: "Perfect For:",
      audience: "D2C Brands - Retail - Influencers - B2B Companies",
      cta: "Boost Engagement",
      ctaWidth: 160,
    },
    {
      image: "/static/img/Performance-Marketing.webp",
      alt: "Performance marketing analytics dashboard mockup displayed on a laptop",
      title: "MAXIMIZE ROI",
      description:
        "Drive measurable results with targeted paid advertising campaigns across Google, Meta, LinkedIn, and TikTok. We optimize your ad spend to maximize conversions and lower acquisition costs.",
      perfectFor: "Perfect For:",
      audience: "E-commerce - Startups - Enterprises - Local Businesses",
      cta: "Scale Your Ads",
      ctaWidth: 150,
    },
    {
      image: "/static/img/Content Strategy & Creation.png",
      alt: "Content strategy and creation dashboard mockup displayed on a laptop",
      title: "COMPELLING NARRATIVES",
      description:
        "Engage your audience with high-quality, relevant content including blog posts, whitepapers, case studies, and copywriting that builds authority and supports your SEO goals.",
      perfectFor: "Perfect For:",
      audience: "B2B Companies - SaaS - Healthcare - Education",
      cta: "Start Creating",
      ctaWidth: 140,
    },
    {
      image: "/static/img/Creative Design & Video Production.png",
      alt: "Creative design and video production software interface displayed on a laptop",
      title: "VISUAL STORYTELLING",
      description:
        "Capture attention with stunning visuals, engaging video content, and creative assets designed to communicate your brand message effectively across all digital touchpoints.",
      perfectFor: "Perfect For:",
      audience: "Lifestyle Brands - Entertainment - Real Estate - Agencies",
      cta: "View Portfolio",
      ctaWidth: 150,
    },
  ];

  document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".ect-web-solutions");
    if (!section) {
      return;
    }

    const tabs = Array.from(section.querySelectorAll(".ect-web-solutions__tab"));
    const tabList = section.querySelector(".ect-web-solutions__tabs");
    const panel = section.querySelector(".ect-web-solutions__panel");
    const image = section.querySelector(".ect-web-solutions__image");
    const contentTitle = section.querySelector(".ect-web-solutions__content-title");
    const description = section.querySelector(".ect-web-solutions__description");
    const perfectLabel = section.querySelector(".ect-web-solutions__perfect-label");
    const audience = section.querySelector(".ect-web-solutions__audience");
    const cta = section.querySelector(".ect-web-solutions__cta");
    const prevButton = section.querySelector(".ect-web-solutions__arrow--prev");
    const nextButton = section.querySelector(".ect-web-solutions__arrow--next");

    if (
      !tabList ||
      !panel ||
      !image ||
      !contentTitle ||
      !description ||
      !perfectLabel ||
      !audience ||
      !cta ||
      !prevButton ||
      !nextButton ||
      tabs.length === 0
    ) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeIndex = 0;
    let autoplayTimer = null;
    let transitionTimer = null;
    let isInViewport = false;
    let isPageHidden = document.hidden;

    function clearAutoplayTimer() {
      if (autoplayTimer !== null) {
        window.clearTimeout(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function clearTransitionTimer() {
      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
        transitionTimer = null;
      }
    }

    function canAutoplay() {
      return isInViewport && !isPageHidden;
    }

    function scheduleAutoplay() {
      clearAutoplayTimer();

      if (!canAutoplay()) {
        return;
      }

      autoplayTimer = window.setTimeout(() => {
        goToSlide((activeIndex + 1) % slides.length, { fromAutoplay: true });
      }, AUTO_PLAY_DELAY);
    }

    function setActiveTab(index) {
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });

      panel.setAttribute("aria-labelledby", tabs[index].id);

      if (tabList.scrollWidth > tabList.clientWidth) {
        const activeTab = tabs[index];
        const scrollLeft = activeTab.offsetLeft - (tabList.clientWidth / 2) + (activeTab.clientWidth / 2);
        tabList.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }

    function updatePanelContent(slide) {
      image.src = slide.image;
      image.alt = slide.alt;
      image.dataset.currentSlide = String(activeIndex);
      image.onerror = () => {
        const fallback = image.dataset.fallback;
        if (fallback && image.src.indexOf(fallback) === -1) {
          image.src = fallback;
        }
      };

      contentTitle.textContent = slide.title;
      description.textContent = slide.description;
      perfectLabel.textContent = slide.perfectFor;
      audience.textContent = slide.audience;
      cta.textContent = slide.cta;
      cta.setAttribute("href", "javascript:void(0)");
      panel.style.setProperty("--ect-web-solutions-cta-width", `${slide.ctaWidth}px`);
    }

    function finalizeSlide(index) {
      activeIndex = index;
      setActiveTab(index);
      updatePanelContent(slides[index]);
    }

    function goToSlide(index, options = {}) {
      const normalizedIndex = (index + slides.length) % slides.length;

      if (normalizedIndex === activeIndex && !options.force) {
        if (options.focusTab) {
          tabs[normalizedIndex].focus({ preventScroll: true });
        }
        return;
      }

      clearTransitionTimer();
      clearAutoplayTimer();

      const commit = () => {
        finalizeSlide(normalizedIndex);

        if (options.focusTab) {
          tabs[normalizedIndex].focus({ preventScroll: true });
        }

        scheduleAutoplay();
      };

      if (reducedMotionQuery.matches) {
        commit();
        return;
      }

      panel.classList.add("is-transitioning");

      transitionTimer = window.setTimeout(() => {
        commit();
        window.requestAnimationFrame(() => {
          panel.classList.remove("is-transitioning");
        });
      }, SLIDE_TRANSITION_DURATION);
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        goToSlide(index, { force: true });
      });

      tab.addEventListener("keydown", (event) => {
        const key = event.key;
        let nextIndex = null;

        if (key === "ArrowRight" || key === "ArrowDown") {
          nextIndex = (index + 1) % slides.length;
        } else if (key === "ArrowLeft" || key === "ArrowUp") {
          nextIndex = (index - 1 + slides.length) % slides.length;
        } else if (key === "Home") {
          nextIndex = 0;
        } else if (key === "End") {
          nextIndex = slides.length - 1;
        } else if (key === "Enter" || key === " ") {
          event.preventDefault();
          goToSlide(index, { force: true });
          return;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          tabs[nextIndex].focus({ preventScroll: true });
          goToSlide(nextIndex, { force: true, focusTab: true });
        }
      });
    });

    prevButton.addEventListener("click", () => {
      goToSlide(activeIndex - 1, { force: true });
    });

    nextButton.addEventListener("click", () => {
      goToSlide(activeIndex + 1, { force: true });
    });

    document.addEventListener("visibilitychange", () => {
      isPageHidden = document.hidden;
      if (isPageHidden) {
        clearAutoplayTimer();
      } else {
        scheduleAutoplay();
      }
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== section) {
              return;
            }
            isInViewport = entry.isIntersecting;

            if (isInViewport) {
              scheduleAutoplay();
            } else {
              clearAutoplayTimer();
            }
          });
        },
        {
          threshold: [0, 0.2, 0.5],
        }
      );

      observer.observe(section);
    } else {
      isInViewport = true;
      scheduleAutoplay();
    }

    // reducedMotionQuery listeners removed so auto-scroll works regardless of OS settings

    finalizeSlide(0);
    if (!("IntersectionObserver" in window)) {
      scheduleAutoplay();
    }
  });
})();

/* Mobile/tablet topic rail: keep the active topic centred and activate the
   topic nearest the viewport centre after a manual horizontal swipe. */
(function () {
  "use strict";

  function initResponsiveTopicRail() {
    var section = document.querySelector(".ect-web-solutions");
    var rail = section && section.querySelector(".ect-web-solutions__tabs");
    var tabs = rail ? Array.prototype.slice.call(
      rail.querySelectorAll(".ect-web-solutions__tab")
    ) : [];
    var mediaQuery = window.matchMedia("(max-width: 1199px)");
    var scrollTimer = null;

    if (!rail || !tabs.length) return;

    function activeIndex() {
      return tabs.findIndex(function (tab) {
        return tab.classList.contains("is-active");
      });
    }

    function centreTab(tab, instant) {
      if (!mediaQuery.matches || !tab) return;
      var left = tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2;
      rail.scrollTo({
        left: Math.max(0, left),
        behavior: instant ? "auto" : "smooth"
      });
    }

    function activateNearestTopic() {
      if (!mediaQuery.matches) return;
      var railCentre = rail.getBoundingClientRect().left + rail.clientWidth / 2;
      var nearestIndex = 0;
      var nearestDistance = Infinity;

      tabs.forEach(function (tab, index) {
        var rect = tab.getBoundingClientRect();
        var distance = Math.abs(rect.left + rect.width / 2 - railCentre);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex !== activeIndex()) {
        tabs[nearestIndex].click();
      } else {
        centreTab(tabs[nearestIndex], false);
      }
    }

    rail.addEventListener("scroll", function () {
      if (!mediaQuery.matches) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(activateNearestTopic, 140);
    }, { passive: true });

    tabs.forEach(function (tab) {
      new MutationObserver(function () {
        if (tab.classList.contains("is-active")) centreTab(tab, false);
      }).observe(tab, { attributes: true, attributeFilter: ["class"] });
    });

    window.addEventListener("resize", function () {
      if (mediaQuery.matches) centreTab(tabs[Math.max(0, activeIndex())], true);
    });

    window.requestAnimationFrame(function () {
      centreTab(tabs[Math.max(0, activeIndex())], true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initResponsiveTopicRail, { once: true });
  } else {
    initResponsiveTopicRail();
  }
})();






/**
 * Web Solutions Section
 * Re-triggers the spin animation on every hover entry
 * so it spins fresh each time you mouse in.
 */

(function () {
  const section = document.querySelector('.web-solutions-section');
  if (!section) return;

  const cells = section.querySelectorAll('.cell');

  cells.forEach(function (cell) {
    const iconGraphic = cell.querySelector('.icon svg, .icon img');
    if (!iconGraphic) return;

    cell.addEventListener('mouseenter', function () {
      iconGraphic.style.animation = 'none';
      void iconGraphic.offsetWidth;
      iconGraphic.style.animation = '';
    });
  });
})();



/* ===== TRUSTED BY — Infinite Loop Scroll + Top Animation ===== */

(function () {
  var SPEED = 0.8;

  function initRow(wrapper, dir) {
    if (!wrapper) {
      return;
    }

    var track =
      wrapper.querySelector(".tb-track");

    if (!track) {
      return;
    }

    /*
     * Avoid duplicate initialization.
     */
    if (
      track.dataset.tbInitialized ===
      "true"
    ) {
      return;
    }

    track.dataset.tbInitialized =
      "true";

    /*
     * Duplicate items once for seamless looping.
     */
    track.insertAdjacentHTML(
      "beforeend",
      track.innerHTML
    );

    var offset = 0;
    var paused = false;
    var halfW = 0;

    function measure() {
      halfW =
        track.scrollWidth / 2;

      offset =
        dir === 1
          ? -halfW
          : 0;
    }

    requestAnimationFrame(
      function () {
        measure();

        function animate() {
          if (
            !paused &&
            halfW > 0
          ) {
            offset +=
              SPEED * dir;

            if (
              dir === 1 &&
              offset >= 0
            ) {
              offset -= halfW;
            } else if (
              dir === -1 &&
              offset <= -halfW
            ) {
              offset += halfW;
            }

            track.style.transform =
              "translateX(" +
              offset +
              "px)";
          }

          requestAnimationFrame(
            animate
          );
        }

        animate();
      }
    );

    window.addEventListener(
      "resize",
      measure
    );

    wrapper.addEventListener(
      "mouseenter",
      function () {
        paused = true;
      }
    );

    wrapper.addEventListener(
      "mouseleave",
      function () {
        paused = false;
      }
    );

    wrapper.addEventListener(
      "touchstart",
      function () {
        paused = true;
      },
      {
        passive: true
      }
    );

    wrapper.addEventListener(
      "touchend",
      function () {
        paused = false;
      },
      {
        passive: true
      }
    );
  }

  var section =
    document.querySelector(
      ".tb-section"
    );

  if (section) {
    function showTop() {
      section.classList.add(
        "tb-visible"
      );
    }

    function hideTop() {
      section.classList.remove(
        "tb-visible"
      );
    }

    if (
      "IntersectionObserver" in window
    ) {
      var observer =
        new IntersectionObserver(
          function (entries) {
            entries.forEach(
              function (entry) {
                if (
                  entry.isIntersecting
                ) {
                  showTop();
                } else {
                  hideTop();
                }
              }
            );
          },
          {
            threshold: 0.15
          }
        );

      observer.observe(section);
    } else {
      showTop();
    }
  }

  var row1 =
    document.getElementById(
      "tb-row1"
    );

  var row2 =
    document.getElementById(
      "tb-row2"
    );

  if (row1) {
    initRow(row1, -1);
  }

  if (row2) {
    initRow(row2, 1);
  }
})();

// FAQ SECTION
(function () {
  var items = document.querySelectorAll('.faq-item');
  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      items.forEach(function (i) {
        i.classList.remove('open');
        var b = i.querySelector('.faq-q');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ----- Scroll reveal with stagger -----
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = entry.target.dataset.delay || 0;
          entry.target.style.animationDelay = delay + 'ms';
          entry.target.classList.add('faq-in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(function (item, i) {
      item.dataset.delay = (i % 2 === 0) ? (i * 60) : (i * 60 + 40);
      observer.observe(item);
    });
  } else {
    items.forEach(function (item) {
      item.classList.add('faq-in-view');
    });
  }
})();


/* =========================================================
   DIGITAL MARKETING HERO CTA — SMOOTH SCROLL
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
