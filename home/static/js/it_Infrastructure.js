// On very small screens, hide the forced line break so the headline wraps naturally
const br = document.querySelector('.infra-figma-hero__break');
const mq = window.matchMedia('(max-width: 480px)');

const toggleBreak = () => {
  if (br) {
    br.style.display = mq.matches ? 'none' : '';
  }
};

toggleBreak();
mq.addEventListener('change', toggleBreak);



(() => {
  const AUTO_PLAY_DELAY = 2000;
  const SLIDE_TRANSITION_DURATION = 240;

  document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".ect-web-solutions:not([data-panels])");
    sections.forEach((section) => {
      const tabs = Array.from(section.querySelectorAll(".ect-web-solutions__tab"));
      const numSlides = tabs.length;
    const panels = Array.from(section.querySelectorAll(".ect-web-solutions__panel"));
    const tabList = section.querySelector(".ect-web-solutions__tabs");
    const prevButton = section.querySelector(".ect-web-solutions__arrow--prev");
    const nextButton = section.querySelector(".ect-web-solutions__arrow--next");

    if (
      !tabList ||
      panels.length === 0 ||
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
        goToSlide((activeIndex + 1) % numSlides, { fromAutoplay: true });
      }, AUTO_PLAY_DELAY);
    }

    function setActiveTab(index) {
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });
    }

    function updatePanelContent(index) {
      panels.forEach((p, i) => {
        if (i === index) {
          p.classList.add("is-active");
        } else {
          p.classList.remove("is-active");
        }
      });
    }

    function finalizeSlide(index) {
      activeIndex = index;
      setActiveTab(index);
      updatePanelContent(index);
    }

    function goToSlide(index, options = {}) {
      const normalizedIndex = (index + numSlides) % numSlides;

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

      panels.forEach(p => p.classList.add("is-transitioning"));

      transitionTimer = window.setTimeout(() => {
        commit();
        window.requestAnimationFrame(() => {
          panels.forEach(p => p.classList.remove("is-transitioning"));
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
          nextIndex = (index + 1) % numSlides;
        } else if (key === "ArrowLeft" || key === "ArrowUp") {
          nextIndex = (index - 1 + numSlides) % numSlides;
        } else if (key === "Home") {
          nextIndex = 0;
        } else if (key === "End") {
          nextIndex = numSlides - 1;
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

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", () => {
        clearAutoplayTimer();
        if (!reducedMotionQuery.matches) {
          scheduleAutoplay();
        }
      });
    } else if (typeof reducedMotionQuery.addListener === "function") {
      reducedMotionQuery.addListener(() => {
        clearAutoplayTimer();
        if (!reducedMotionQuery.matches) {
          scheduleAutoplay();
        }
      });
    }

    finalizeSlide(0);
    if (!("IntersectionObserver" in window)) {
      scheduleAutoplay();
    }
    });
  });
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
    const animatedIcon = cell.querySelector('.icon svg') || cell.querySelector('.icon img');
    if (!animatedIcon) return;

    cell.addEventListener('mouseenter', function () {
      // Remove then re-add to restart the animation
      animatedIcon.style.animation = 'none';
      // Force reflow so the browser registers the removal
      void animatedIcon.offsetWidth;
      animatedIcon.style.animation = '';
    });
  });
})();





/* ===== TRUSTED BY — Infinite Loop Scroll + Top Animation ===== */

(function () {

  var SPEED = 0.8; // px per frame

  /* ── Infinite loop row animation ── */
  function initRow(wrapper, dir) {
    var track = wrapper.querySelector('.tb-track');

    // Duplicate the items once so the track can scroll seamlessly
    track.insertAdjacentHTML('beforeend', track.innerHTML);

    var offset = 0;
    var paused = false;
    var halfW = 0;

    function measure() {
      halfW = track.scrollWidth / 2;
      offset = dir === 1 ? -halfW : 0;
    }

    requestAnimationFrame(function () {
      measure();

      function animate() {
        if (!paused && halfW > 0) {
          offset += SPEED * dir;
          if (dir === 1 && offset >= 0) { offset -= halfW; }
          else if (dir === -1 && offset <= -halfW) { offset += halfW; }
          track.style.transform = 'translateX(' + offset + 'px)';
        }
        requestAnimationFrame(animate);
      }
      animate();
    });

    window.addEventListener('resize', measure);

    wrapper.addEventListener('mouseenter', function () { paused = true; });
    wrapper.addEventListener('mouseleave', function () { paused = false; });
    wrapper.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    wrapper.addEventListener('touchend', function () { paused = false; }, { passive: true });
  }

  /* ── Top content: slide in every time section enters view ── */
  var section = document.querySelector('.tb-section');

  if (section) {
    function showTop() { section.classList.add('tb-visible'); }
    function hideTop() { section.classList.remove('tb-visible'); }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { showTop(); }
          else { hideTop(); }
        });
      }, { threshold: 0.15 });
      observer.observe(section);
    } else {
      showTop();
    }
  }

  /* ── Init rows (tablet/mobile only — desktop keeps its static grid) ── */
  var row1 = document.getElementById('tb-row1');
  var row2 = document.getElementById('tb-row2');
  var tbAutoScrollQuery = window.matchMedia('(max-width: 1199px)');
  if (tbAutoScrollQuery.matches) {
    if (row1) initRow(row1, -1);  // scrolls left, infinitely
    if (row2) initRow(row2, 1);  // scrolls right, infinitely
  }

})();





// FAQ SECTION

document.addEventListener('DOMContentLoaded', function () {

  // ----- Accordion -----
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q');

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all others (accordion mode)
      items.forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked item
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ----- Scroll reveal with stagger -----
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

});






/* ECT Work — Portfolio section
   Navigation & interaction logic */

document.addEventListener('DOMContentLoaded', function () {

  var prevBtn = document.querySelector('.nav-btn[aria-label="Previous project"]');
  var nextBtn = document.querySelector('.nav-btn[aria-label="Next project"]');
  var grid = document.querySelector('.work__grid');

  /* ---- Horizontal scroll on 2-col / 1-col layouts ---- */
  function canScroll() {
    return grid.scrollWidth > grid.clientWidth + 1;
  }

  function scrollGrid(direction) {
    if (!canScroll()) return;
    var card = grid.querySelector('.card');
    if (!card) return;
    var step = card.offsetWidth + parseFloat(getComputedStyle(grid).gap) || card.offsetWidth;
    grid.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { scrollGrid(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { scrollGrid(1); });

  /* ---- Auto-scroll functionality ---- */
  var autoScrollTimer = null;
  function startAutoScroll() {
    if (!grid || !canScroll()) return;
    autoScrollTimer = setInterval(function () {
      var card = grid.querySelector('.card');
      if (!card) return;
      var step = card.offsetWidth + parseFloat(getComputedStyle(grid).gap) || card.offsetWidth;

      if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 10) {
        grid.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        grid.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 3000);
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  if (grid) {
    startAutoScroll();
    grid.addEventListener('mouseenter', stopAutoScroll);
    grid.addEventListener('mouseleave', startAutoScroll);
    grid.addEventListener('touchstart', stopAutoScroll, { passive: true });
    grid.addEventListener('touchend', startAutoScroll);
  }
  /* Project links navigate through their href attributes. */

});


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


/* =========================================================
   IT INFRASTRUCTURE HERO CTA — SMOOTH SCROLL
   ========================================================= */
(function () {
  "use strict";

  if (window.__infraHeroSmoothScrollInitialized) return;
  window.__infraHeroSmoothScrollInitialized = true;

  const button = document.querySelector(
    '.infra-figma-hero__cta[data-smooth-scroll]'
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
      }
    }

    window.requestAnimationFrame(animateScroll);
  });
})();
