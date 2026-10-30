/* Digital Marketing page: services tabs (looping strip, hover pause), same behaviour as the website page. */
(() => {
  const AUTO_PLAY_DELAY = 4500;
  const SLIDE_TRANSITION_DURATION = 240;

  let numSlides = 0;

  document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".ect-web-solutions[data-panels]");
    if (!section) {
      return;
    }

    const tabs = Array.from(section.querySelectorAll(".ect-web-solutions__tab:not(.ect-web-solutions__tab--clone)"));
    numSlides = tabs.length;
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
    let isHovered = false;
    let railJumpTimer = null;
    const desktopQuery = window.matchMedia("(min-width: 1200px)");
    const component = section.querySelector(".ect-web-solutions__component");

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
      return isInViewport && !isPageHidden && !isHovered;
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

      getClones().forEach((clone, cloneIndex) => {
        clone.classList.toggle("is-active", cloneIndex === index);
      });
    }

    // Desktop: copies of the tabs follow the last one, so the strip loops forever.
    function getClones() {
      return Array.from(tabList.querySelectorAll(".ect-web-solutions__tab--clone"));
    }

    function buildClones() {
      if (getClones().length) return;
      tabs.forEach((tab, index) => {
        const clone = tab.cloneNode(true);
        clone.removeAttribute("id");
        clone.removeAttribute("aria-controls");
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("role", "presentation");
        clone.tabIndex = -1;
        clone.classList.add("ect-web-solutions__tab--clone");
        clone.classList.toggle("is-active", index === activeIndex);
        clone.addEventListener("click", () => goToSlide(index, { force: true }));
        tabList.appendChild(clone);
      });
    }

    function removeClones() {
      getClones().forEach((clone) => clone.remove());
    }

    function jumpRail(left) {
      tabList.scrollTo({ left, behavior: "instant" });
    }

    function slideRail(previous, next) {
      if (!desktopQuery.matches) return;
      const clones = getClones();
      const last = tabs.length - 1;
      window.clearTimeout(railJumpTimer);

      if (clones.length && previous === last && next === 0) {
        // Forward past the last tab: glide onto its copy, then snap back to the original.
        tabList.scrollTo({ left: clones[0].offsetLeft, behavior: "smooth" });
        railJumpTimer = window.setTimeout(() => jumpRail(tabs[0].offsetLeft), 700);
      } else if (clones.length && previous === 0 && next === last) {
        // Backward before the first tab: snap onto its copy, then glide back.
        jumpRail(clones[0].offsetLeft);
        tabList.scrollTo({ left: tabs[last].offsetLeft, behavior: "smooth" });
      } else {
        tabList.scrollTo({ left: tabs[next].offsetLeft, behavior: "smooth" });
      }
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
      const previousIndex = activeIndex;
      activeIndex = index;
      setActiveTab(index);
      slideRail(previousIndex, index);
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

    // Pause while the cursor is on the tabs or the card; resume when it leaves.
    if (component) {
      component.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") return;
        isHovered = true;
        clearAutoplayTimer();
      });
      component.addEventListener("pointerleave", (event) => {
        if (event.pointerType !== "mouse") return;
        isHovered = false;
        scheduleAutoplay();
      });
    }

    function syncRailMode() {
      if (desktopQuery.matches) {
        buildClones();
        jumpRail(tabs[activeIndex].offsetLeft);
      } else {
        removeClones();
        jumpRail(0);
      }
    }

    desktopQuery.addEventListener("change", syncRailMode);

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
    syncRailMode();
    if (!("IntersectionObserver" in window)) {
      scheduleAutoplay();
    }
  });
})();
