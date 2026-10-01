/* ---------- Build mobile accordion from desktop menu (no duplicate HTML to maintain) ---------- */
const ectMobileAccordion = document.getElementById('ectMobileAccordion');
if (ectMobileAccordion) {
    document.querySelectorAll('.ect-navbar-menu > .ect-nav-item').forEach(navItem => {
        const aTag = navItem.querySelector('.ect-nav-link');
        if (!aTag) return;
        const label = aTag.querySelector('span').textContent.trim();
        const dropdown = navItem.querySelector('.ect-dropdown');
        const isActive = aTag.classList.contains('is-active');

        if (dropdown) {
            const dropdownInner = dropdown.cloneNode(true);
            const item = document.createElement('div');
            item.className = 'ect-mobile-item';
            item.innerHTML = `
              <button type="button" class="ect-mobile-head${isActive ? ' is-active' : ''}" aria-expanded="false">
                <span>${label}</span>
                <span class="ect-mobile-arrow" aria-hidden="true">▼</span>
              </button>
              <div class="ect-mobile-body"><div class="ect-mobile-body-inner"></div></div>
            `;
            const head = item.querySelector('.ect-mobile-head');
            const body = item.querySelector('.ect-mobile-body');
            const panelId = 'ect-mobile-panel-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            body.id = panelId;
            head.setAttribute('aria-controls', panelId);
            const inner = item.querySelector('.ect-mobile-body-inner');
            // Move cloned items into mobile body
            dropdownInner.querySelectorAll('.ect-dropdown-column > a, .ect-dropdown-column > div').forEach(child => {
                inner.appendChild(child);
            });
            ectMobileAccordion.appendChild(item);
        } else {
            const item = document.createElement('div');
            item.className = 'ect-mobile-item';
            item.innerHTML = `
              <a class="ect-mobile-head${isActive ? ' is-active' : ''}" href="${aTag.href}">
                <span>${label}</span>
              </a>
            `;
            ectMobileAccordion.appendChild(item);
        }
    });

    /* ---------- Mobile Accordion behavior ---------- */
    const mobilePanel = document.getElementById('ectMobilePanel');
    ectMobileAccordion.addEventListener('click', e => {
        const head = e.target.closest('.ect-mobile-head');
        if (!head) return;

        // If it's a link (no dropdown), let the browser redirect naturally
        if (head.tagName.toLowerCase() === 'a') return;

        const item = head.parentElement;
        const body = item.querySelector('.ect-mobile-body');
        const wasActive = item.classList.contains('is-open');

        // close all
        ectMobileAccordion.querySelectorAll('.ect-mobile-item').forEach(i => {
            i.classList.remove('is-open');
            const h = i.querySelector('button.ect-mobile-head');
            const b = i.querySelector('.ect-mobile-body');
            if (h) h.setAttribute('aria-expanded', 'false');
            if (b) b.style.maxHeight = null;
        });

        if (!wasActive && body) {
            item.classList.add('is-open');
            head.setAttribute('aria-expanded', 'true');
            body.style.maxHeight = body.scrollHeight + 'px';
            // icon pop-in stagger
            item.querySelectorAll('.ect-dropdown-icon').forEach((icon, i) => {
                icon.classList.remove('ect-pop');
                icon.style.animationDelay = (60 + i * 50) + 'ms';
                void icon.offsetWidth;
                icon.classList.add('ect-pop');
                icon.addEventListener('animationend', () => {
                    icon.classList.remove('ect-pop');
                    icon.style.animationDelay = '';
                }, { once: true });
            });
        }
    });

    /* ---------- Hamburger Toggle ---------- */
    const ectMobileToggle = document.getElementById('ectMobileToggle');
    if (ectMobileToggle && mobilePanel) {
        ectMobileToggle.addEventListener('click', () => {
            const open = mobilePanel.classList.toggle('is-open');
            ectMobileToggle.classList.toggle('is-open', open);
            ectMobileToggle.setAttribute('aria-expanded', open);
            ectMobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            // The panel's aria-hidden was hardcoded "true" in the HTML and
            // never updated here — so it stayed aria-hidden while visually
            // open, and any focus landing inside it (e.g. the Services
            // accordion toggle) violated the same aria-hidden/focus rule
            // fixed in contact-popup.js. Keep it in sync with is-open.
            mobilePanel.setAttribute('aria-hidden', open ? 'false' : 'true');
            document.body.style.overflow = open ? 'hidden' : '';
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !mobilePanel.classList.contains('is-open')) return;
            ectMobileToggle.focus();
            mobilePanel.classList.remove('is-open');
            ectMobileToggle.classList.remove('is-open');
            ectMobileToggle.setAttribute('aria-expanded', 'false');
            ectMobileToggle.setAttribute('aria-label', 'Open menu');
            mobilePanel.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            window.requestAnimationFrame(() => ectMobileToggle.focus());
        });

        /* ---------- Reset mobile panel if resized to desktop ---------- */
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024 && mobilePanel.classList.contains('is-open')) {
                mobilePanel.classList.remove('is-open');
                ectMobileToggle.classList.remove('is-open');
                ectMobileToggle.setAttribute('aria-expanded', false);
                ectMobileToggle.setAttribute('aria-label', 'Open menu');
                mobilePanel.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
    }
}

/* ---------- Desktop dropdown behavior ---------- */
(function () {
    const dropdownItems = Array.from(
        document.querySelectorAll('.ect-navbar-menu > .ect-nav-item.ect-has-dropdown')
    );

    function setOpen(item, open) {
        item.classList.toggle('is-open', open);
        const trigger = item.querySelector(':scope > .ect-nav-link');
        if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeOthers(except) {
        dropdownItems.forEach(item => {
            if (item !== except) setOpen(item, false);
        });
    }

    dropdownItems.forEach(li => {
        const trigger = li.querySelector(':scope > .ect-nav-link');
        if (!trigger) return;

        li.addEventListener('mouseenter', () => {
            closeOthers(li);
            setOpen(li, true);
            li.querySelectorAll('.ect-dropdown-icon').forEach((icon, i) => {
                icon.classList.remove('ect-pop');
                icon.style.animationDelay = (60 + i * 50) + 'ms';
                void icon.offsetWidth;
                icon.classList.add('ect-pop');
                icon.addEventListener('animationend', () => {
                    icon.classList.remove('ect-pop');
                    icon.style.animationDelay = '';
                }, { once: true });
            });
        });

        li.addEventListener('mouseleave', () => {
            if (!li.contains(document.activeElement)) setOpen(li, false);
        });

        trigger.addEventListener('click', event => {
            event.preventDefault();
            const shouldOpen = !li.classList.contains('is-open');
            closeOthers(li);
            setOpen(li, shouldOpen);
            if (shouldOpen) {
                const firstLink = li.querySelector('.ect-dropdown a[href]');
                if (event.detail === 0 && firstLink) firstLink.focus();
            }
        });

        li.addEventListener('focusout', event => {
            if (!li.contains(event.relatedTarget)) setOpen(li, false);
        });
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('.ect-navbar-menu')) closeOthers(null);
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        const openItem = document.querySelector('.ect-navbar-menu > .ect-has-dropdown.is-open');
        if (!openItem) return;
        const trigger = openItem.querySelector(':scope > .ect-nav-link');
        setOpen(openItem, false);
        if (trigger) trigger.focus();
    });
})();


/* ============================================================
 ECT HERO SECTION — script.js (scoped & reusable)
 ------------------------------------------------------------
 Auto-initialises every <section data-ect-hero> on the page:
 1. Renders the 10 service cards from data-* attributes
 2. Runs the ping-pong marquee (left ⇄ right, rAF + translate3d)
 3. Pause on hover/touch/focus at the EXACT position, resume
 4. Measures the Explore arrow travel distance (pixel-perfect)
 5. Respects prefers-reduced-motion, pauses on hidden tab
 ============================================================ */

(function () {
    "use strict";

    var SPEED = 40;          // marquee speed in px/second
    var STAGGER = 0.08;      // entrance stagger between cards (s)
    var BASE_DELAY = 0.6;    // first card entrance delay (s)

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* Lucide "arrow-up-right" icon (inline SVG string) */
    var ARROW_SVG =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
        'aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

    /* ----------------------------------------------------------
       Card renderer — builds inner markup from data-* attributes
       so content stays editable in the HTML, markup stays DRY
       ---------------------------------------------------------- */
    function renderCards(track) {
        var cards = track.querySelectorAll(".ect-card");

        cards.forEach(function (card, i) {
            var title = card.dataset.title || "";
            var desc = card.dataset.desc || "";
            var href = card.dataset.href || "#";

            card.style.setProperty("--d", (BASE_DELAY + i * STAGGER) + "s");

            card.innerHTML =
                '<h3 class="ect-card__title">' + title + "</h3>" +
                '<p class="ect-card__desc">' + desc + "</p>" +
                '<a href="' + href + '" class="ect-explore">' +
                '<span class="ect-explore__text">Explore</span>' +
                '<span class="ect-explore__icon">' + ARROW_SVG + "</span>" +
                "</a>";
        });
    }

    /* ----------------------------------------------------------
       Explore arrow — measure exact travel distance
       (button width − arrow width), set as --travel per button
       ---------------------------------------------------------- */
    function measureExploreTravel(root) {
        root.querySelectorAll(".ect-explore").forEach(function (btn) {
            var icon = btn.querySelector(".ect-explore__icon");
            if (!icon) return;
            btn.style.setProperty(
                "--travel",
                (btn.offsetWidth - icon.offsetWidth) + "px"
            );
        });
    }

    /* ----------------------------------------------------------
       Ping-pong marquee for one hero section
       ---------------------------------------------------------- */
    function createMarquee(track) {
        var viewport = track.parentElement; // .ect-cards

        var x = 0;          // current translateX (px)
        var direction = 1;  // 1 → moving right, -1 → moving left
        var paused = false;
        var maxShift = 0;
        var lastTime = null;
        var rafId = null;

        function measure() {
            maxShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
            x = Math.min(0, Math.max(-maxShift, x)); // clamp into new range
        }

        function apply() {
            track.style.transform = "translate3d(" + x + "px, 0, 0)";
        }

        function tick(now) {
            if (lastTime === null) lastTime = now;
            var dt = (now - lastTime) / 1000;
            lastTime = now;

            if (!paused && maxShift > 0) {
                x += direction * SPEED * dt;

                /* Reverse smoothly at each end — no jump, no reset */
                if (x >= 0) { x = 0; direction = -1; }
                else if (x <= -maxShift) { x = -maxShift; direction = 1; }

                apply();
            }
            rafId = requestAnimationFrame(tick);
        }

        function play() {
            if (reduceMotion.matches) { stop(); x = 0; apply(); return; }
            if (!rafId) { lastTime = null; rafId = requestAnimationFrame(tick); }
        }

        function stop() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        /* Hover / touch / keyboard-focus: freeze at exact position */
        viewport.addEventListener("pointerenter", function () { paused = true; });
        viewport.addEventListener("pointerleave", function () { paused = false; });
        viewport.addEventListener("touchstart", function () { paused = true; }, { passive: true });
        viewport.addEventListener("touchend", function () { paused = false; }, { passive: true });
        viewport.addEventListener("focusin", function () { paused = true; });
        viewport.addEventListener("focusout", function () { paused = false; });

        return {
            init: function () {
                measure();
                x = -maxShift;   // start fully left so motion begins left → right
                direction = 1;
                apply();
                play();
            },
            measure: measure,
            play: play,
            stop: stop
        };
    }

    /* ----------------------------------------------------------
       Initialise every hero section on the page
       ---------------------------------------------------------- */
    function initHero(root) {
        var track = root.querySelector("[data-ect-track]");
        if (!track) return;

        renderCards(track);
        var marquee = createMarquee(track);

        function boot() {
            marquee.init();
            measureExploreTravel(root);
        }

        /* Re-measure on resize (debounced) */
        var resizeTimer;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                marquee.measure();
                measureExploreTravel(root);
            }, 150);
        });

        /* Battery friendly: stop the loop when the tab is hidden */
        document.addEventListener("visibilitychange", function () {
            document.hidden ? marquee.stop() : marquee.play();
        });

        /* Honour reduced-motion changes live */
        reduceMotion.addEventListener("change", boot);

        /* Boot after full load so web-font widths are final */
        if (document.readyState === "complete") boot();
        else window.addEventListener("load", boot);
    }

    document.querySelectorAll("[data-ect-hero]").forEach(initHero);
})();





/* ============================================================
   ECT ABOUT SECTION — js/about.js  (scoped & reusable)
   ------------------------------------------------------------
   Auto-initialises every <section data-ect-about>:
   1. Play/Pause toggle on the blob video (icon swaps)
   2. Scroll-in entrance animations via IntersectionObserver
      (staggered: blob → label → heading → paragraphs → button)
   3. Respects prefers-reduced-motion
   ============================================================ */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var STAGGER = 0.12; // seconds between each animated element

    function initAbout(root) {

        /* ----------------------------------------------------------
           1. Play / Pause toggle
           ---------------------------------------------------------- */
        var video = root.querySelector(".ect-about__video");
        var btn = root.querySelector("[data-play]");

        if (video && btn) {
            btn.addEventListener("click", function () {
                if (video.paused) {
                    video.play();
                    btn.classList.remove("is-paused");
                    btn.setAttribute("aria-label", "Pause video");
                    btn.setAttribute("aria-pressed", "false");
                } else {
                    video.pause();
                    btn.classList.add("is-paused");
                    btn.setAttribute("aria-label", "Play video");
                    btn.setAttribute("aria-pressed", "true");
                }
            });

            /* Keep icon in sync if the video is paused/resumed by
               other means (media keys, browser UI, etc.) */
            video.addEventListener("pause", function () {
                btn.classList.add("is-paused");
                btn.setAttribute("aria-label", "Play video");
            });
            video.addEventListener("play", function () {
                btn.classList.remove("is-paused");
                btn.setAttribute("aria-label", "Pause video");
            });
        }

        /* ----------------------------------------------------------
           2. Scroll-in entrance animation
           ---------------------------------------------------------- */
        var animated = root.querySelectorAll(".ect-about-anim");

        /* Stagger delays in document order */
        animated.forEach(function (el, i) {
            el.style.setProperty("--d", (i * STAGGER) + "s");
        });

        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            animated.forEach(function (el) { el.classList.add("is-inview"); });
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-inview");
                        observer.unobserve(entry.target); // animate once
                    }
                });
            },
            { threshold: 0.18 }
        );

        animated.forEach(function (el) { observer.observe(el); });
    }

    document.querySelectorAll("[data-ect-about]").forEach(initAbout);
})();




/**
 * ==========================================================================
 * WHAT ECT DELIVER — UNIFORM INTERACTION FOR ALL SIX CARDS
 * ==========================================================================
 */
(function () {
  "use strict";

  function initECTServices() {
    var section = document.querySelector(".ect-services");

    if (!section || section.dataset.cardsInitialized === "true") {
      return;
    }

    /*
     * Prevent duplicate event registration because this function
     * may be reached more than once.
     */
    section.dataset.cardsInitialized = "true";

    var columns = section.querySelectorAll(
      ".ect-services__column[data-service-column]"
    );

    function getCards(column) {
      return Array.prototype.slice.call(
        column.querySelectorAll(
          ":scope > .service-card[data-service-card]"
        )
      );
    }

    function getDefaultCard(column) {
      return (
        column.querySelector(
          ':scope > .service-card[data-default-active="true"]'
        ) ||
        column.querySelector(
          ":scope > .service-card[data-service-card]"
        )
      );
    }

    function stopActivationAnimation(card) {
      if (card._ectServiceAnimationTimer) {
        window.clearTimeout(
          card._ectServiceAnimationTimer
        );
      }

      card._ectServiceAnimationTimer =
        window.setTimeout(function () {
          card.classList.remove("is-activating");
        }, 850);
    }

    function activateCard(column, selectedCard) {
      var cards = getCards(column);

      cards.forEach(function (card) {
        var shouldActivate = card === selectedCard;
        var wasActive =
          card.classList.contains("is-active");

        card.classList.toggle(
          "is-active",
          shouldActivate
        );

        card.setAttribute(
          "aria-expanded",
          shouldActivate ? "true" : "false"
        );

        if (shouldActivate && !wasActive) {
          card.classList.remove("is-activating");

          /*
           * Force reflow so the animation restarts
           * for Website, Software, Zoho, HR,
           * Digital Marketing and IT Infrastructure.
           */
          void card.offsetWidth;

          card.classList.add("is-activating");
          stopActivationAnimation(card);
        }

        if (!shouldActivate) {
          card.classList.remove("is-activating");

          if (card._ectServiceAnimationTimer) {
            window.clearTimeout(
              card._ectServiceAnimationTimer
            );
          }
        }
      });
    }

    function restoreDefaultCard(column) {
      var defaultCard = getDefaultCard(column);

      if (defaultCard) {
        activateCard(column, defaultCard);
      }
    }

    columns.forEach(function (column) {
      var cards = getCards(column);
      var restoreTimer = null;

      restoreDefaultCard(column);

      cards.forEach(function (card) {
        var arrow =
          card.querySelector(".service-card__arrow");

        card.addEventListener(
          "pointerenter",
          function () {
            window.clearTimeout(restoreTimer);
            activateCard(column, card);
          }
        );

        card.addEventListener(
          "focusin",
          function () {
            window.clearTimeout(restoreTimer);
            activateCard(column, card);
          }
        );

        card.addEventListener(
          "click",
          function (event) {
            if (
              event.target.closest(
                ".service-card__link"
              )
            ) {
              return;
            }

            activateCard(column, card);
          }
        );

        if (arrow) {
          arrow.addEventListener(
            "click",
            function (event) {
              event.preventDefault();
              event.stopPropagation();

              activateCard(column, card);
            }
          );
        }
      });

      column.addEventListener(
        "pointerenter",
        function () {
          window.clearTimeout(restoreTimer);
        }
      );

      column.addEventListener(
        "pointerleave",
        function () {
          window.clearTimeout(restoreTimer);

          restoreTimer =
            window.setTimeout(function () {
              restoreDefaultCard(column);
            }, 100);
        }
      );

      column.addEventListener(
        "focusout",
        function (event) {
          if (
            !column.contains(event.relatedTarget)
          ) {
            restoreDefaultCard(column);
          }
        }
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initECTServices,
      { once: true }
    );
  } else {
    initECTServices();
  }
})();



// (function () {
//     "use strict";

//     var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
//     var STAGGER = 0.1; // seconds between animated elements

//     function initServices(root) {
//         var animated = root.querySelectorAll(".ect-svc-anim");

//         /* Assign stagger delays in document order */
//         animated.forEach(function (el, i) {
//             el.style.setProperty("--d", (i * STAGGER) + "s");
//         });

//         if (reduceMotion.matches || !("IntersectionObserver" in window)) {
//             animated.forEach(function (el) { el.classList.add("is-inview"); });
//             return;
//         }

//         var observer = new IntersectionObserver(
//             function (entries) {
//                 entries.forEach(function (entry) {
//                     if (entry.isIntersecting) {
//                         entry.target.classList.add("is-inview");
//                         observer.unobserve(entry.target); // animate once
//                     }
//                 });
//             },
//             { threshold: 0.15 }
//         );

//         animated.forEach(function (el) { observer.observe(el); });
//     }

//     document.querySelectorAll("[data-ect-svc]").forEach(initServices);
// })();



/* ============================================================
   ECT BUSINESS SOLUTIONS — SAME-IMAGE CARD INTERACTION
   ------------------------------------------------------------
   IMPORTANT:
   - The image source is never changed.
   - Desktop: hover/focus activates a small lift and drop shadow.
   - Touch: a short press adds the same restrained interaction.
   - Existing card dimensions, content and button navigation remain.
   ============================================================ */
(function () {
  "use strict";

  function initBusinessSolutionCards() {
    var section = document.querySelector(".ect-products");

    if (!section || section.dataset.productHoverReady === "true") {
      return;
    }

    section.dataset.productHoverReady = "true";

    var cards = section.querySelectorAll(".ect-pcard");
    var touchMode = window.matchMedia(
      "(hover: none), (pointer: coarse)"
    ).matches;

    cards.forEach(function (card) {
      var releaseTimer = null;

      function activate() {
        window.clearTimeout(releaseTimer);
        card.classList.add("is-interacting");
      }

      function deactivate() {
        window.clearTimeout(releaseTimer);
        card.classList.remove("is-interacting");
      }

      /* Keyboard users receive the same visual feedback. */
      card.addEventListener("focusin", activate);

      card.addEventListener("focusout", function (event) {
        if (!card.contains(event.relatedTarget)) {
          deactivate();
        }
      });

      /*
       * On touch screens there is no reliable hover.
       * Apply a brief interaction while the card is pressed.
       */
      if (touchMode) {
        card.addEventListener("pointerdown", activate);

        card.addEventListener("pointerup", function () {
          releaseTimer = window.setTimeout(deactivate, 180);
        });

        card.addEventListener("pointercancel", deactivate);
        card.addEventListener("pointerleave", deactivate);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initBusinessSolutionCards,
      { once: true }
    );
  } else {
    initBusinessSolutionCards();
  }
})();


/* ============================================================
   ECT SERVICES SECTION — js/services.js  (scoped & reusable)
   ------------------------------------------------------------
   Minimal by design — all hover micro-interactions are pure
   CSS. JS only handles:
   1. Staggered entrance animation via IntersectionObserver
      (heading → intro → cards, in document order)
   2. Reduced-motion / no-IO fallback (everything just visible)
   Auto-initialises every <section data-ect-svc>.
   ============================================================ */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var STAGGER = 0.1; // seconds between animated elements

    function initServices(root) {

        /* --------------------------------------------------------
           Scooped-notch clip-path
           Draws a rounded rect with a concave scoop carved out of
           the top-right corner (where the floating arrow sits).
           Regenerated per card on resize so the curve radii stay
           fixed in px while the card size is fluid.
           -------------------------------------------------------- */
        function rem() {
            return parseFloat(getComputedStyle(document.documentElement).fontSize);
        }

        function notchPath(w, h, R, nw, nh, c) {
            /* R  = main corner radius
               nw = notch width, nh = notch height
               c  = concave transition radius            */
            var x1 = w - nw;   // notch left wall
            var y1 = nh;       // notch floor
            return "path('" +
                "M " + R + " 0 " +
                "H " + (x1 - c) + " " +
                "Q " + x1 + " 0 " + x1 + " " + c + " " +          // concave dip in
                "V " + (y1 - c) + " " +
                "Q " + x1 + " " + y1 + " " + (x1 + c) + " " + y1 + " " + // rounded inner corner
                "H " + (w - c) + " " +
                "Q " + w + " " + y1 + " " + w + " " + (y1 + c) + " " +   // concave out to right edge
                "V " + (h - R) + " " +
                "Q " + w + " " + h + " " + (w - R) + " " + h + " " +
                "H " + R + " " +
                "Q 0 " + h + " 0 " + (h - R) + " " +
                "V " + R + " " +
                "Q 0 0 " + R + " 0 Z')";
        }

        function applyNotches() {
            var px = rem();
            root.querySelectorAll(".ect-svc__card").forEach(function (card) {
                var shape = card.querySelector("[data-notch]");
                if (!shape) return;
                var cs = getComputedStyle(card);
                var R = parseFloat(cs.getPropertyValue("--card-r")) * px || 24;
                var nw = parseFloat(cs.getPropertyValue("--notch-w")) * px || 80;
                var nh = parseFloat(cs.getPropertyValue("--notch-h")) * px || 72;
                var c = parseFloat(cs.getPropertyValue("--notch-r")) * px || 20;
                var w = shape.offsetWidth;
                var h = shape.offsetHeight;
                if (w && h) {
                    shape.style.clipPath = notchPath(w, h, R, nw, nh, c);
                    shape.style.webkitClipPath = shape.style.clipPath;
                }
            });
        }

        applyNotches();

        var rt;
        window.addEventListener("resize", function () {
            clearTimeout(rt);
            rt = setTimeout(applyNotches, 120);
        });

        /* Re-clip once fonts settle (text height can change) */
        window.addEventListener("load", applyNotches);

        var animated = root.querySelectorAll(".ect-svc-anim");

        /* Assign stagger delays in document order */
        animated.forEach(function (el, i) {
            el.style.setProperty("--d", (i * STAGGER) + "s");
        });

        if (reduceMotion.matches || !("IntersectionObserver" in window)) {
            animated.forEach(function (el) { el.classList.add("is-inview"); });
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-inview");
                        observer.unobserve(entry.target); // animate once
                    }
                });
            },
            { threshold: 0.15 }
        );

        animated.forEach(function (el) { observer.observe(el); });
    }

    document.querySelectorAll("[data-ect-svc]").forEach(initServices);
})();



function viewProjects(name) {
    console.log('View projects:', name);
    // hook your navigation here, e.g. window.location.href = '/projects';
}


function explore(name) {
    console.log('Explore clicked:', name);
    // Add navigation logic here, e.g.:
    // window.location.href = '/projects/' + encodeURIComponent(name);
}





/**
 * Why Businesses Choose ECT - Premium Interactions
 * Vanilla JS | 60FPS | GPU Accelerated
 * Wrapped in an init function to safely integrate with existing pages.
 */
function initECTSection() {
    const section = document.getElementById('whySection');
    if (!section) return; // Stop if section doesn't exist on this page

    // 1. Entrance Animations using IntersectionObserver
    const animatedElements = section.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                entry.target.style.transitionDelay = `${delay}ms`;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));

    // 2. 60FPS Mouse Parallax using Lerp & RequestAnimationFrame
    const wrap = document.getElementById('collageWrap');
    const badge = document.getElementById('badge');

    if (!wrap || !badge) return;

    const images = wrap.querySelectorAll('.collage-img');
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Listen to mouse move globally for smooth trailing effect
    window.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        // Calculate normalized mouse position (-1 to 1) relative to the wrap container
        targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    // Listen to mouse leave to gently reset
    window.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
    });

    // Animation loop
    function animateParallax() {
        // Smooth lerp interpolation for 60fps rendering
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;

        // Apply transforms to images via CSS Variables (Alternating speeds for depth)
        images.forEach((img, index) => {
            const speed = index % 2 === 0 ? 12 : -12;
            const x = currentX * speed;
            const y = currentY * speed;
            // Outputting in REM units as per strict CSS standards
            img.style.setProperty('--px', `${x / 10}rem`);
            img.style.setProperty('--py', `${y / 10}rem`);
        });

        // Apply transform to floating badge (Gentler movement)
        const badgeX = currentX * 6;
        const badgeY = currentY * 6;
        badge.style.setProperty('--bx', `${badgeX / 10}rem`);
        badge.style.setProperty('--by', `${badgeY / 10}rem`);

        requestAnimationFrame(animateParallax);
    }

    // Start the RAF loop
    requestAnimationFrame(animateParallax);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initECTSection);
} else {
    initECTSection();
}





(function () {
  var testimonials = [
    { name: "David Brown", role: "Sakthi Masala", quote: "ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional. ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=12" },
    { name: "Meera Krishnan", role: "Aravind Textiles", quote: "Working with ECT felt like having an in-house team. They understood our workflow gaps instantly and delivered a platform that just works, day in and day out. Working with ECT felt like having an in-house team. They understood our workflow gaps instantly and delivered a platform that just works, day in and day out. Working with ECT felt like having an in-house team. They understood our workflow gaps instantly and delivered a platform that just works, day in and day out. ", img: "https://i.pravatar.cc/100?img=32" },
    { name: "manu", role: "Coral Foods", quote: "From planning to deployment, ECT stayed transparent and proactive. The system they built has cut our order processing time nearly in half.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=14" },
    { name: "Priya Nathan", role: "Velan Constructions", quote: "Their team translated a messy spreadsheet-driven process into a clean, scalable application. Support after launch has been just as impressive.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=47" },
    { name: "Arjun Menon", role: "Silver Line Logistics", quote: "ECT's engineers asked the right questions before writing a single line of code. That upfront clarity saved us months of rework later.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=15" },
    { name: "Divya Suresh", role: "Ponni Agro", quote: "We needed a partner who could move fast without cutting corners. ECT delivered exactly that, on time and within budget.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=48" },
    { name: "Karthik Raman", role: "BlueWave Exports", quote: "The dashboard ECT built gives our leadership real visibility for the first time. Decisions that took days now take minutes.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=17" },
    { name: "Anitha Balan", role: "Grand Spice Mills", quote: "Every milestone was communicated clearly. ECT treated our business like their own, and it showed in the final product.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=44" },
    { name: "Vignesh Kumar", role: "Orion Retail Group", quote: "ECT rebuilt our legacy system without a single day of downtime. Their process discipline is honestly rare to find.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=19" },
    { name: "Lakshmi Narayan", role: "TrustPoint Finance", quote: "Reliable, responsive, and genuinely invested in our outcomes. ECT has become our go-to technology partner.ECT delivered a solution that perfectly aligned with our business goals. Their expertise, attention to detail, and commitment to quality made the entire experience seamless and highly professional.", img: "https://i.pravatar.cc/100?img=45" }
  ];

  var current = 0;
  var autoTimer = null;
  var section = document.querySelector(".ect-clients");
  if (!section) return;

  var track = document.getElementById("ectTrack");
  var progress = document.getElementById("ectProgress");
  var stageEl = section.querySelector(".ect-clients__stage");

  function applyResponsiveVars() {
    var w = window.innerWidth;
    var v;

    if (w <= 480) {
      v = { cw: "300px", cp: "20px 18px 22px", sh: "360px", ox: "0px", oy: "0px", sc: "1", ss: "1", ns: true };
    } else if (w <= 640) {
      v = { cw: "320px", cp: "20px 18px 22px", sh: "370px", ox: "170px", oy: "-40px", sc: "1", ss: "0.85", ns: false };
    } else if (w <= 820) {
      v = { cw: "340px", cp: "22px 20px 24px", sh: "390px", ox: "230px", oy: "-45px", sc: "1", ss: "0.85", ns: false };
    } else if (w <= 1024) {
      v = { cw: "360px", cp: "24px 22px 26px", sh: "400px", ox: "330px", oy: "-50px", sc: "1", ss: "0.9", ns: false };
    } else if (w <= 1366) {
      v = { cw: "397px", cp: "24px 24px 26px", sh: "410px", ox: "400px", oy: "-55px", sc: "1", ss: "0.95", ns: false };
    } else {
      v = { cw: "397px", cp: "24px 24px 26px", sh: "410px", ox: "430px", oy: "-55px", sc: "1", ss: "1", ns: false };
    }

    section.style.setProperty("--ect-card-w", v.cw);
    section.style.setProperty("--ect-card-pad", v.cp);
    section.style.setProperty("--ect-stage-h", v.sh);
    section.style.setProperty("--ect-off-x", v.ox);
    section.style.setProperty("--ect-off-y", v.oy);
    section.style.setProperty("--ect-scale-c", v.sc);
    section.style.setProperty("--ect-scale-s", v.ss);
    section.classList.toggle("ect-clients--no-side", v.ns);
  }

  applyResponsiveVars();
  window.addEventListener("resize", applyResponsiveVars);
  window.addEventListener("orientationchange", applyResponsiveVars);

  function buildCards() {
    testimonials.forEach(function (t, i) {
      var card = document.createElement("div");
      card.className = "ect-clients__card";
      card.dataset.index = i;
      card.innerHTML =
        '<div class="ect-clients__avatar-row">' +
          '<img class="ect-clients__avatar" src="' + t.img + '" alt="' + t.name + '">' +
          '<div>' +
            '<div class="ect-clients__name">' + t.name + '</div>' +
            '<div class="ect-clients__role">' + t.role + '</div>' +
          '</div>' +
        '</div>' +
        '<p class="ect-clients__quote">"' + t.quote + '"</p>' +
        '<button class="ect-clients__readmore" type="button">Read more</button>';

      var moreBtn = card.querySelector(".ect-clients__readmore");

      moreBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var expanded = card.classList.toggle("ect-clients__card--expanded");
        moreBtn.textContent = expanded ? "Read less" : "Read more";
        if (expanded) clearInterval(autoTimer);
        else resetAuto();
      });

      card.addEventListener("click", function () {
        var idx = parseInt(card.dataset.index);
        if (idx !== current) { goTo(idx); resetAuto(); }
      });
      track.appendChild(card);
    });

    testimonials.forEach(function (_, i) {
      var dot = document.createElement("div");
      dot.className = "ect-clients__dot";
      dot.addEventListener("click", function () { goTo(i); resetAuto(); });
      progress.appendChild(dot);
    });

    // hide Read more on short quotes
    requestAnimationFrame(function () {
      var all = track.querySelectorAll(".ect-clients__card");
      for (var k = 0; k < all.length; k++) {
        var q = all[k].querySelector(".ect-clients__quote");
        var b = all[k].querySelector(".ect-clients__readmore");
        if (q.scrollHeight <= q.clientHeight + 2) b.style.display = "none";
      }
    });
  }

  function mod(n, m) { return ((n % m) + m) % m; }

  function render() {
    var cards = track.children;
    var n = testimonials.length;
    for (var i = 0; i < n; i++) {
      var card = cards[i];
      var rel = mod(i - current, n);
      card.className = "ect-clients__card";
      var rb = card.querySelector(".ect-clients__readmore");
      if (rb && rb.style.display !== "none") rb.textContent = "Read more";
      if (rel === 0) card.classList.add("ect-clients__card--center");
      else if (rel === 1) card.classList.add("ect-clients__card--right");
      else if (rel === n - 1) card.classList.add("ect-clients__card--left");
      else if (rel === 2) card.classList.add("ect-clients__card--hidden-right");
      else if (rel === n - 2) card.classList.add("ect-clients__card--hidden-left");
      else card.classList.add("ect-clients__card--far");
    }
    var dots = progress.children;
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle("ect-clients__dot--active", j === current);
    }
  }

  function goTo(i) {
    current = mod(i, testimonials.length);
    render();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() { autoTimer = setInterval(next, 4200); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }

  document.getElementById("ectNextBtn").addEventListener("click", function () { next(); resetAuto(); });
  document.getElementById("ectPrevBtn").addEventListener("click", function () { prev(); resetAuto(); });

  stageEl.addEventListener("mouseenter", function () { clearInterval(autoTimer); });
  stageEl.addEventListener("mouseleave", function () { startAuto(); });

  var touchStartX = 0;
  stageEl.addEventListener("touchstart", function (e) { touchStartX = e.touches[0].clientX; });
  stageEl.addEventListener("touchend", function (e) {
    var diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      diff < 0 ? next() : prev();
      resetAuto();
    }
  });

  buildCards();
  render();
  startAuto();
})();




/* ============================================
   ECT Clients Section — Interactions
   1. Scroll-triggered reveal (IntersectionObserver)
   2. Cursor-driven tilt / parallax on card images
   ============================================ */

(function () {
  "use strict";

  var section = document.getElementById("ectClientsSection");
  if (!section) return;

  // --- 1. Scroll reveal ---
  var animatedEls = section.querySelectorAll(
    ".ect-eyebrow, .ect-heading span, .ect-intro, .ect-card"
  );

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animatedEls.forEach(function (el) {
            el.style.animationPlayState = "running";
          });
          io.disconnect();
        }
      });
    },
    { threshold: 0.15 }
  );

  // Only pause if the section starts below the viewport
  var rect = section.getBoundingClientRect();
  if (rect.top > window.innerHeight) {
    animatedEls.forEach(function (el) {
      el.style.animationPlayState = "paused";
    });
    io.observe(section);
  }

  // --- 2. Tilt / parallax on hover ---
  var cards = section.querySelectorAll("[data-ect-tilt]");

  cards.forEach(function (card) {
    var thumb = card.querySelector(".ect-thumb");
    var img = card.querySelector("img");

    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;

      thumb.style.transform =
        "perspective(700px) rotateX(" +
        (-y * 4).toFixed(2) +
        "deg) rotateY(" +
        (x * 6).toFixed(2) +
        "deg)";

      img.style.transform =
        "scale(1.08) translate(" +
        (-x * 8).toFixed(1) +
        "px, " +
        (-y * 8).toFixed(1) +
        "px)";
    });

    card.addEventListener("mouseleave", function () {
      thumb.style.transform = "";
      img.style.transform = "";
    });
  });
})();



/**
 * ECOG Footer Section — Interactive Logic
 * Place this script at the bottom of your page,
 * or wrap in DOMContentLoaded if loading in <head>.
 */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Newsletter Form ---------- */
  var nlForm = document.getElementById('ectNlForm');
  var nlMsg  = document.getElementById('ectNlMsg');

  if (nlForm && nlMsg) {
    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var emailInput = nlForm.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : '';

      if (!email) {
        showNlMsg('Please enter a valid email address.', false);
        return;
      }

      showNlMsg('Subscribing...', true);

      fetch(nlForm.action, {
        method: 'POST',
        body: new FormData(nlForm),
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          showNlMsg(result.data.message, result.ok);
          if (result.ok) nlForm.reset();
        })
        .catch(function () {
          showNlMsg('Subscription could not be completed. Please try again.', false);
        });
    });
  }

  function showNlMsg(text, isSuccess) {
    nlMsg.textContent = text;
    nlMsg.style.color = isSuccess ? '#9ccc80' : '#e57373';
    nlMsg.style.opacity = '1';

    // Auto-hide success message after 4 seconds
    if (isSuccess) {
      setTimeout(function () {
        nlMsg.style.opacity = '0';
      }, 4000);
    }
  }

  /* ---------- CTA Button Clicks ---------- */
  var ctaBtns = document.querySelectorAll('.ect-cta-btns a');
  ctaBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      // Remove '#' default if you want to prevent jump
      // e.preventDefault();
      // Add your own navigation or modal logic here
    });
  });

});




/* ECT Work — Portfolio section
   Navigation & interaction logic */

document.addEventListener('DOMContentLoaded', function () {

  var prevBtn = document.querySelector('.nav-btn[aria-label="Previous project"]');
  var nextBtn = document.querySelector('.nav-btn[aria-label="Next project"]');
  var grid   = document.querySelector('.work__grid');

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

  /* ---- "View Projects" button click handler ---- */
  var viewBtns = document.querySelectorAll('.btn-view');
  // Click handler removed to allow <a> tags to handle navigation naturally.

  /* ---- Tablet/mobile: the button above is hidden below 1024px, so the
     full card image becomes the tap target and links to the same place
     the button did. Desktop keeps the button as the only link. ---- */
  var workLinkQuery = window.matchMedia('(max-width: 1024px)');
  document.querySelectorAll('.work .card').forEach(function (card) {
    var imgwrap = card.querySelector('.card__imgwrap');
    var link = card.querySelector('.card__cta a[href]');
    if (!imgwrap || !link) return;

    var href = link.getAttribute('href');
    imgwrap.setAttribute('role', 'link');
    imgwrap.setAttribute('tabindex', '0');

    function go() {
      if (!workLinkQuery.matches) return;
      window.location.href = href;
    }

    imgwrap.addEventListener('click', go);
    imgwrap.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        go();
      }
    });
  });

});

/* ============================================================
   KEYBOARD ACCESSIBILITY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ect-nav-item')) {
            if (document.activeElement && document.activeElement.closest('.ect-nav-item')) {
                document.activeElement.blur();
            }
        }
    });

});

/* =========================================================
   FEATURE SECTION — script.js
   Vanilla JS · No dependencies
   ========================================================= */

(function () {
  'use strict';

  var isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* —— IntersectionObserver — Fade-in on scroll —— */
  function initRevealAnimations() {
    const revealElements = document.querySelectorAll('[data-reveal]');
    if (!revealElements.length) return;

    // Fallback: if IntersectionObserver is not supported, show everything
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    const observerOptions = {
      root: null,           // viewport
      rootMargin: '0px 0px -60px 0px', // trigger slightly before element enters
      threshold: 0.15       // 15% visible
    };

    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // animate only once
        }
      });
    }, observerOptions);

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* —— Enhanced hover ripple on action buttons —— */
  function initButtonInteractions() {
    const buttons = document.querySelectorAll('.feature-card__action');

    buttons.forEach(function (btn) {
      // Add focus-visible styles for accessibility
      btn.addEventListener('focus', function () {
        this.style.outline = '2px solid ' + getComputedStyle(document.documentElement)
          .getPropertyValue('--color-border').trim();
        this.style.outlineOffset = '2px';
      });

      btn.addEventListener('blur', function () {
        this.style.outline = '';
        this.style.outlineOffset = '';
      });
    });
  }

  /* —— Parallax-lite for center image on mouse move ——
     Skipped entirely on touch devices — mousemove doesn't fire there
     and we avoid attaching a dead listener. */
  function initImageParallax() {
    if (isTouchDevice) return;

    var wrapper = document.querySelector('.features__image-wrapper');
    if (!wrapper) return;

    var img = wrapper.querySelector('.features__image');
    if (!img) return;

    wrapper.addEventListener('mousemove', function (e) {
      var rect = wrapper.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      img.style.transform = 'scale(1.03) translate(' + (x * 6) + 'px, ' + (y * 6) + 'px)';
    });

    wrapper.addEventListener('mouseleave', function () {
      img.style.transform = 'scale(1)';
    });
  }

  /* —— Card tap swaps center image (touch devices only) ——
     Desktop hover/preview is handled by initFeatureAutoCycle instead,
     since there the hover also needs to pause the auto-rotation and
     control the green active border in sync with the image. */
  function initCardImageSwap() {
    if (!isTouchDevice) return;

    var img = document.getElementById('featuresImage');
    if (!img) return;

    var cards = document.querySelectorAll('.feature-card[data-image]');
    if (!cards.length) return;

    var defaultSrc = img.getAttribute('src');
    var activeCard = null;
    var fadeTimer = null;

    function swapTo(src) {
      if (!src || img.getAttribute('src') === src) return;

      if (fadeTimer) {
        window.clearTimeout(fadeTimer);
      }

      img.classList.add('is-fading');
      fadeTimer = window.setTimeout(function () {
        img.setAttribute('src', src);
        img.classList.remove('is-fading');
        fadeTimer = null;
      }, 180); // half of the 0.35s CSS opacity transition
    }

    function resetToDefault() {
      swapTo(defaultSrc);
    }

    cards.forEach(function (card) {
      var newSrc = card.getAttribute('data-image');

      // Mobile / touch: tap to select, tap again to switch/deselect
      card.addEventListener('click', function (e) {
        // Don't hijack the corner arrow button's own click behavior
        if (e.target.closest('.feature-card__action')) return;

        if (activeCard === card) {
          activeCard.classList.remove('is-active');
          activeCard = null;
          resetToDefault();
        } else {
          if (activeCard) {
            activeCard.classList.remove('is-active');
          }
          activeCard = card;
          card.classList.add('is-active');
          swapTo(newSrc);
        }
      });
    });
  }

  /* —— Auto-cycle the feature cards one at a time, looping forever ——
     Desktop only (touch devices already have tap-to-select via
     initCardImageSwap). Runs continuously on a fixed timer regardless
     of mouse position, so the active card + image always keep moving. */
  function initFeatureAutoCycle() {
    if (isTouchDevice) return;

    var img = document.getElementById('featuresImage');
    if (!img) return;

    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.features__column .feature-card[data-image]')
    );
    if (cards.length < 2) return;

    var index = 0;
    var fadeTimer = null;
    var timer = null;

    function render(card) {
      cards.forEach(function (c) { c.classList.remove('is-auto-active'); });
      card.classList.add('is-auto-active');

      var src = card.getAttribute('data-image');
      if (src && img.getAttribute('src') !== src) {
        if (fadeTimer) window.clearTimeout(fadeTimer);
        img.classList.add('is-fading');
        fadeTimer = window.setTimeout(function () {
          img.setAttribute('src', src);
          img.classList.remove('is-fading');
          fadeTimer = null;
        }, 180);
      }
    }

    function activate(i) {
      render(cards[i]);
    }

    function tick() {
      index = (index + 1) % cards.length;
      activate(index);
    }

    function start() {
      if (timer) return;
      timer = window.setInterval(tick, 5000);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    // Manually hovering/focusing a card previews it (green border + its
    // image) and pauses the loop; leaving resumes from where it left off.
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        stop();
        render(card);
      });
      card.addEventListener('mouseleave', function () {
        render(cards[index]);
        start();
      });
      card.addEventListener('focusin', function () {
        stop();
        render(card);
      });
      card.addEventListener('focusout', function () {
        render(cards[index]);
        start();
      });
    });

    activate(index);
    start();
  }

  /* —— Re-evaluate touch mode on viewport resize (e.g. device rotation,
     or a tablet transitioning between touch and mouse/trackpad usage) —— */
  function initResizeGuard() {
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var nowTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        if (nowTouch !== isTouchDevice) {
          // Input mode changed — reload swap/parallax bindings cleanly.
          window.location.reload();
        }
      }, 400);
    });
  }

  /* —— Init on DOM ready —— */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initRevealAnimations();
    initButtonInteractions();
    initImageParallax();
    initCardImageSwap();
    initFeatureAutoCycle();
    initResizeGuard();
  }

})();





// connected business

(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Split heading into words for masked rise ---------- */
  var heading = document.querySelector('[data-split]');
  if (heading && !reduced) {
    var html = '';
    heading.childNodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.trim().split(/\s+/).forEach(function (word) {
          if (word) html += '<span class="w"><span>' + word + '</span></span> ';
        });
      } else if (node.nodeName === 'BR') {
        html += '<br>';
      }
    });
    heading.innerHTML = html.trim();
  }

  /* ---------- 2. Scroll reveal via IntersectionObserver ---------- */
  var header = document.getElementById('cbsHeader');
  var cols = document.querySelectorAll('.cbs-col');

  if (reduced) {
    if (header) header.classList.add('is-revealed');
    cols.forEach(function (c) { c.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target === header) header.classList.add('is-revealed');
      else e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });

  if (header) {
    io.observe(header);
  }
  cols.forEach(function (c) { io.observe(c); });

  /* ---------- 3. Micro-interaction: 3D tilt on image hover ---------- */
  var fine = window.matchMedia('(pointer: fine)').matches;
  if (fine) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          'perspective(50rem) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 4) + 'deg) translateZ(0)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ---------- 4. Subtle scroll parallax inside images ---------- */
  var pEls = document.querySelectorAll('[data-parallax] img');
  var ticking = false;
  function parallax() {
    var vh = window.innerHeight;
    pEls.forEach(function (img) {
      var box = img.parentElement;
      // This effect only targets home-page .cbs-col elements, but the
      // [data-parallax] attribute is also reused by unrelated elements on
      // other pages (e.g. about.html's Who We Are photo grid), which have
      // no .cbs-col ancestor — closest() returns null there, and reading
      // .classList off null used to throw and abort the whole forEach.
      var cbsCol = box.closest('.cbs-col');
      if (!cbsCol || !cbsCol.classList.contains('in')) return;
      var r = box.getBoundingClientRect();
      var progress = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.setProperty('--py', (progress * -12) + 'px');
      if (!box.matches(':hover')) {
        img.style.transform = 'scale(1.08) translateY(' + (progress * -12) + 'px)';
      }
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
  }, { passive: true });
})();



// ECT Section — scroll-reveal trigger
(function () {
  var section = document.getElementById('ectSection');
  if (!section) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        section.classList.add('in-view');
        observer.disconnect();
      }
    });
  }, { threshold: 0.25 });

  observer.observe(section);
})();



//hero section

(function () {
  'use strict';

  var dropdown = document.getElementById('challengeDropdown');
  var toggle = document.getElementById('dropdownToggle');
  var label = document.getElementById('dropdownLabel');
  var list = document.getElementById('dropdownList');
  if (!dropdown || !toggle || !label || !list) return;
  var options = Array.prototype.slice.call(list.querySelectorAll('.dropdown__option'));
  var focusedIndex = -1;

  function openDropdown() {
    dropdown.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    var selected = options.findIndex(function (o) {
      return o.getAttribute('aria-selected') === 'true';
    });
    setFocused(selected >= 0 ? selected : 0);
  }

  function closeDropdown() {
    dropdown.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    setFocused(-1);
  }

  function isOpen() {
    return dropdown.classList.contains('is-open');
  }

  function setFocused(index) {
    options.forEach(function (o, i) {
      o.classList.toggle('is-focused', i === index);
    });
    focusedIndex = index;
    if (index >= 0) options[index].scrollIntoView({ block: 'nearest' });
  }

  function selectOption(index) {
    options.forEach(function (o, i) {
      if (i === index) {
        o.setAttribute('aria-selected', 'true');
      } else {
        o.removeAttribute('aria-selected');
      }
    });
    label.textContent = options[index].textContent;
    label.removeAttribute('data-placeholder');
    label.classList.remove('swap-in');
    void label.offsetWidth;
    label.classList.add('swap-in');
    dropdown.classList.remove('pulse');
    void dropdown.offsetWidth;
    dropdown.classList.add('pulse');
    closeDropdown();
    toggle.focus();
  }

  /* Typing placeholder effect */
  var hints = [
    'Select a business challenge...',
    'Struggling with follow-ups?',
    'Too many manual processes?',
    'Need better visibility?',
    'Team lacks accountability?'
  ];
  var hintIdx = 0;
  var charIdx = 0;
  var deleting = false;
  var typeTimer;

  function typeLoop() {
    if (!label.hasAttribute('data-placeholder') || isOpen()) {
      typeTimer = setTimeout(typeLoop, 800);
      return;
    }
    var full = hints[hintIdx];
    if (!deleting) {
      charIdx++;
      label.textContent = full.slice(0, charIdx);
      if (charIdx === full.length) {
        deleting = true;
        typeTimer = setTimeout(typeLoop, 2200);
        return;
      }
      typeTimer = setTimeout(typeLoop, 45);
    } else {
      charIdx--;
      label.textContent = full.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        hintIdx = (hintIdx + 1) % hints.length;
        typeTimer = setTimeout(typeLoop, 350);
        return;
      }
      typeTimer = setTimeout(typeLoop, 22);
    }
  }

  typeTimer = setTimeout(typeLoop, 1200);

  /* Toggle click */
  toggle.addEventListener('click', function () {
    isOpen() ? closeDropdown() : openDropdown();
  });

  /* Option click & hover */
  options.forEach(function (option, index) {
    option.addEventListener('click', function () {
      selectOption(index);
    });
    option.addEventListener('mousemove', function () {
      setFocused(index);
    });
  });

  /* Close on outside click */
  document.addEventListener('click', function (event) {
    if (isOpen() && !dropdown.contains(event.target)) closeDropdown();
  });

  /* Keyboard navigation on toggle */
  toggle.addEventListener('keydown', function (event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen()) openDropdown();
        else setFocused(Math.min(focusedIndex + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen()) setFocused(Math.max(focusedIndex - 1, 0));
        break;
      case 'Enter':
      case ' ':
        if (isOpen()) {
          event.preventDefault();
          if (focusedIndex >= 0) selectOption(focusedIndex);
        }
        break;
      case 'Escape':
        if (isOpen()) {
          event.preventDefault();
          closeDropdown();
          toggle.focus();
        }
        break;
      case 'Tab':
        if (isOpen()) closeDropdown();
        break;
    }
  });

  /* Global Escape */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) closeDropdown();
  });
})();

/* Magnetic hover effect — independent of the business-challenge dropdown
   above, so it still runs on pages that don't have that dropdown. */
(function () {
  'use strict';

  function magnetize(el, strength) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      el.style.setProperty('--mx', (x * strength) + 'px');
      el.style.setProperty('--my', (y * strength) + 'px');
      el.classList.add('is-magnet');
    });
    el.addEventListener('mouseleave', function () {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
      el.classList.remove('is-magnet');
    });
  }

  document.querySelectorAll('.btn').forEach(function (b) {
    magnetize(b, 0.25);
  });

  var toggle = document.getElementById('dropdownToggle');
  if (toggle) magnetize(toggle, 0.06);
})();





/* ============================================================
   BUSINESS CHALLENGES — TABLET / MOBILE SCROLL EXPERIENCE
   - Six existing cards and their existing data-image mappings
   - 5-second automatic progression while the section is visible
   - Native vertical scroll/swipe plus previous/next arrow controls
   - Desktop above 1024px remains on the original implementation
============================================================ */
(function () {
  'use strict';

  var responsiveQuery = window.matchMedia('(max-width: 64rem)');
  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initResponsiveBusinessChallenges() {
    var section = document.querySelector('.features');
    var grid = section ? section.querySelector('.features__grid') : null;
    var image = section ? section.querySelector('#featuresImage') : null;
    var sourceCards = section ? Array.prototype.slice.call(
      section.querySelectorAll('.features__column .feature-card[data-image]')
    ) : [];

    if (!section || !grid || !image || sourceCards.length !== 6) return;
    if (section.querySelector('.features__mobile-slider')) return;

    var slider = document.createElement('div');
    slider.className = 'features__mobile-slider';
    slider.setAttribute('aria-label', 'Business challenges');

    var previousButton = document.createElement('button');
    previousButton.className = 'features__mobile-arrow features__mobile-arrow--previous';
    previousButton.type = 'button';
    previousButton.setAttribute('aria-label', 'Show previous business challenge');
    previousButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var viewport = document.createElement('div');
    viewport.className = 'features__mobile-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Scrollable business challenges');

    var track = document.createElement('div');
    track.className = 'features__mobile-track';

    var slides = sourceCards.map(function (card, index) {
      var sourceTitle = card.querySelector('.feature-card__title');
      var sourceDescription = card.querySelector('.feature-card__desc');
      var slide = document.createElement('article');
      var title = document.createElement('h3');
      var description = document.createElement('p');

      slide.className = 'features__mobile-slide';
      slide.dataset.image = card.getAttribute('data-image');
      slide.dataset.index = String(index);
      slide.setAttribute('aria-label', (index + 1) + ' of ' + sourceCards.length);

      title.className = 'features__mobile-slide-title';
      title.textContent = sourceTitle ? sourceTitle.textContent.trim() : '';

      description.className = 'features__mobile-slide-desc';
      description.textContent = sourceDescription ? sourceDescription.textContent.trim() : '';

      slide.appendChild(title);
      slide.appendChild(description);
      track.appendChild(slide);
      return slide;
    });

    var nextButton = document.createElement('button');
    nextButton.className = 'features__mobile-arrow features__mobile-arrow--next';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Show next business challenge');
    nextButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    viewport.appendChild(track);
    slider.appendChild(previousButton);
    slider.appendChild(viewport);
    slider.appendChild(nextButton);
    grid.appendChild(slider);
    section.classList.add('is-mobile-slider-ready');

    var currentIndex = 0;
    var autoTimer = null;
    var fadeTimer = null;
    var scrollTimer = null;
    var ignoreScroll = false;
    var sectionIsVisible = false;

    function updateImage(index) {
      var slide = slides[index];
      var source = slide.dataset.image;
      var title = slide.querySelector('.features__mobile-slide-title');
      var nextAlt = title ? title.textContent.trim() : 'Business challenge';

      image.alt = nextAlt;
      if (!source || image.getAttribute('src') === source) return;

      if (fadeTimer) window.clearTimeout(fadeTimer);

      if (reducedMotionQuery.matches) {
        image.setAttribute('src', source);
        image.classList.remove('is-fading');
        return;
      }

      image.classList.add('is-fading');
      fadeTimer = window.setTimeout(function () {
        image.setAttribute('src', source);

        var revealImage = function () {
          window.requestAnimationFrame(function () {
            image.classList.remove('is-fading');
          });
        };

        if (image.complete) {
          revealImage();
        } else {
          image.addEventListener('load', revealImage, { once: true });
          image.addEventListener('error', revealImage, { once: true });
        }

        fadeTimer = null;
      }, 225);
    }

    function stopAutoChange() {
      if (autoTimer) {
        window.clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function scheduleAutoChange(delay) {
      stopAutoChange();
      if (!responsiveQuery.matches || reducedMotionQuery.matches || !sectionIsVisible) return;

      autoTimer = window.setTimeout(function () {
        goTo((currentIndex + 1) % slides.length, false);
        scheduleAutoChange(5000);
      }, delay);
    }

    function goTo(index, userInitiated) {
      var normalizedIndex = (index + slides.length) % slides.length;
      var target = slides[normalizedIndex];

      currentIndex = normalizedIndex;
      updateImage(currentIndex);

      ignoreScroll = true;
      viewport.scrollTo({
        top: target.offsetTop,
        behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
      });

      window.setTimeout(function () {
        ignoreScroll = false;
      }, reducedMotionQuery.matches ? 0 : 650);

      scheduleAutoChange(userInitiated ? 8000 : 5000);
    }

    function nearestSlideIndex() {
      var viewportCenter = viewport.scrollTop + (viewport.clientHeight / 2);
      var closestIndex = 0;
      var closestDistance = Infinity;

      slides.forEach(function (slide, index) {
        var slideCenter = slide.offsetTop + (slide.offsetHeight / 2);
        var distance = Math.abs(viewportCenter - slideCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    }

    function pauseForInteraction() {
      scheduleAutoChange(8000);
    }

    previousButton.addEventListener('click', function () {
      goTo(currentIndex - 1, true);
    });

    nextButton.addEventListener('click', function () {
      goTo(currentIndex + 1, true);
    });

    viewport.addEventListener('pointerdown', pauseForInteraction, { passive: true });
    viewport.addEventListener('touchstart', pauseForInteraction, { passive: true });
    viewport.addEventListener('wheel', pauseForInteraction, { passive: true });

    viewport.addEventListener('scroll', function () {
      if (ignoreScroll) return;
      if (scrollTimer) window.clearTimeout(scrollTimer);

      scrollTimer = window.setTimeout(function () {
        var nextIndex = nearestSlideIndex();
        if (nextIndex !== currentIndex) {
          currentIndex = nextIndex;
          updateImage(currentIndex);
        }
        scheduleAutoChange(8000);
      }, 90);
    }, { passive: true });

    viewport.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goTo(currentIndex - 1, true);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goTo(currentIndex + 1, true);
      }
    });

    if ('IntersectionObserver' in window) {
      var visibilityObserver = new IntersectionObserver(function (entries) {
        sectionIsVisible = entries[0].isIntersecting;
        if (sectionIsVisible) {
          scheduleAutoChange(5000);
        } else {
          stopAutoChange();
        }
      }, { threshold: 0.25 });
      visibilityObserver.observe(section);
    } else {
      sectionIsVisible = true;
      scheduleAutoChange(5000);
    }

    function handlePreferenceChange() {
      if (!responsiveQuery.matches || reducedMotionQuery.matches) {
        stopAutoChange();
      } else if (sectionIsVisible) {
        scheduleAutoChange(5000);
      }
    }

    if (responsiveQuery.addEventListener) {
      responsiveQuery.addEventListener('change', handlePreferenceChange);
      reducedMotionQuery.addEventListener('change', handlePreferenceChange);
    } else {
      responsiveQuery.addListener(handlePreferenceChange);
      reducedMotionQuery.addListener(handlePreferenceChange);
    }

    viewport.scrollTop = 0;
    updateImage(0);

    window.setTimeout(function () {
      currentIndex = 0;
      viewport.scrollTop = 0;
      updateImage(0);
    }, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveBusinessChallenges);
  } else {
    initResponsiveBusinessChallenges();
  }
})();

/* ============================================================
   ECT CLIENTS — testimonials carousel

   Desktop (>900px): a real sliding track of 5 recycled card slots (2
   buffer cards off-screen on each side of the visible 3). Every 5s —
   or on arrow click, or clicking a visible side card — the track
   slides right-to-left (or reverse) by exactly one card, then the
   moment the slide finishes, transform snaps back to rest and every
   slot's text is silently reassigned to the next window of
   testimonials. Because the snap and the content swap happen in the
   same frame, it reads as one continuous, looping slide rather than
   five fixed elements being recycled.

   Mobile/tablet (<=900px): a completely different, much simpler
   mechanism — a native horizontally-scrolling, scroll-snap track
   holding every real testimonial card, swiped by touch only (no
   arrows, no auto-advance). A couple of cards are cloned at each end
   so scrolling past the last (or before the first) keeps going
   instead of hitting a wall — see initClientsMobileTrack.
============================================================ */
(function () {
  'use strict';

  function initClientsCarousel() {
    var dataEl = document.getElementById('clients-data');
    if (!dataEl) return;

    var testimonials;
    try {
      testimonials = JSON.parse(dataEl.textContent);
    } catch (err) {
      return;
    }
    if (!testimonials || testimonials.length < 2) return;

    if (window.matchMedia('(max-width: 900px)').matches) {
      initClientsMobileTrack(testimonials);
    } else {
      initClientsDesktopTrack(testimonials);
    }
  }

  function initClientsMobileTrack(testimonials) {
    var track = document.getElementById('clientsMobileTrack');
    if (!track) return;

    var total = testimonials.length;
    var cloneCount = Math.min(2, total - 1);

    function fill(card, item) {
      card.querySelector('.client-card__avatar').textContent = item.initial;
      card.querySelector('.client-card__name').textContent = item.name;
      card.querySelector('.client-card__company').textContent = item.company;
      card.querySelector('.client-card__quote').textContent = '"' + item.message + '"';
    }

    function buildCard(item) {
      var card = document.createElement('article');
      card.className = 'client-card';
      card.innerHTML =
        '<div class="client-card__top">' +
          '<span class="client-card__avatar"></span>' +
          '<div>' +
            '<p class="client-card__name"></p>' +
            '<p class="client-card__company"></p>' +
          '</div>' +
        '</div>' +
        '<p class="client-card__quote"></p>';
      fill(card, item);
      return card;
    }

    // Order: [clone of last N] [all real, in order] [clone of first N]
    var order = [];
    for (var i = total - cloneCount; i < total; i++) order.push(i);
    for (var i = 0; i < total; i++) order.push(i);
    for (var i = 0; i < cloneCount; i++) order.push(i);

    order.forEach(function (idx) {
      track.appendChild(buildCard(testimonials[idx]));
    });

    var cards = Array.prototype.slice.call(track.children);
    var firstRealIndex = cloneCount;

    function targetScrollLeft(el) {
      var trackRect = track.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      return track.scrollLeft + (elRect.left - trackRect.left);
    }

    // Start on the first real card, not the leading clones.
    track.scrollLeft = targetScrollLeft(cards[firstRealIndex]);

    // Once the user stops scrolling, silently teleport back into the
    // real range if they've swiped into a cloned card — since the
    // clone shows identical content to the real card it stands in
    // for, the jump is invisible.
    var settleTimer = null;
    track.addEventListener('scroll', function () {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () {
        var trackLeft = track.getBoundingClientRect().left;
        var nearestIndex = 0;
        var nearestDist = Infinity;
        cards.forEach(function (c, i) {
          var d = Math.abs(c.getBoundingClientRect().left - trackLeft);
          if (d < nearestDist) {
            nearestDist = d;
            nearestIndex = i;
          }
        });

        if (nearestIndex < firstRealIndex) {
          var realFromLeading = firstRealIndex + total - cloneCount + nearestIndex;
          track.scrollLeft = targetScrollLeft(cards[realFromLeading]);
        } else if (nearestIndex >= firstRealIndex + total) {
          var realFromTrailing = firstRealIndex + (nearestIndex - (firstRealIndex + total));
          track.scrollLeft = targetScrollLeft(cards[realFromTrailing]);
        }
        settleTimer = null;
      }, 120);
    }, { passive: true });

    // Slow continuous auto-scroll, mobile/tablet only — pauses for as
    // long as the user is actually holding the track (showing whatever
    // card is under their finger), then resumes on its own the moment
    // they let go. Skipped entirely for prefers-reduced-motion.
    if (window.matchMedia('(max-width: 900px)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var AUTO_SCROLL_SPEED = 0.35; // px per frame — a slow, gentle drift
      var autoScrollFrame = null;
      // scrollLeft rounds to whole pixels, so reading it back each
      // frame and adding a sub-pixel amount just rounds away to
      // nothing — track the true (fractional) position separately.
      var scrollPos = track.scrollLeft;
      // Distance between a real card and its counterpart one full
      // loop later — used to silently wrap back into the real range
      // once the drift scrolls past the trailing clones, the same
      // invisible-jump trick the swipe teleport above relies on.
      var loopWidth = targetScrollLeft(cards[firstRealIndex + total]) - targetScrollLeft(cards[firstRealIndex]);
      // scroll-snap-type actively reverts any programmatic scrollLeft
      // change smaller than roughly half a card width straight back to
      // the nearest snap point — which silently ate every one of the
      // slow drift's sub-pixel steps. Suspended only while auto-scroll
      // is actually running, so a held/manual swipe still snaps
      // normally, then re-suspended once the drift resumes.
      var originalSnapType = track.style.scrollSnapType;

      function autoScrollStep() {
        scrollPos += AUTO_SCROLL_SPEED;
        if (scrollPos >= track.scrollWidth - track.clientWidth) {
          scrollPos -= loopWidth;
        }
        track.scrollLeft = scrollPos;
        autoScrollFrame = window.requestAnimationFrame(autoScrollStep);
      }

      function pauseAutoScroll() {
        if (!autoScrollFrame) return;
        window.cancelAnimationFrame(autoScrollFrame);
        autoScrollFrame = null;
        track.style.scrollSnapType = originalSnapType;
      }

      function resumeAutoScroll() {
        if (autoScrollFrame) return;
        // Pick up from wherever the user actually left it — they may
        // have swiped to a different card while holding the track.
        scrollPos = track.scrollLeft;
        track.style.scrollSnapType = 'none';
        autoScrollFrame = window.requestAnimationFrame(autoScrollStep);
      }

      ['touchstart', 'pointerdown'].forEach(function (evt) {
        track.addEventListener(evt, pauseAutoScroll, { passive: true });
      });
      ['touchend', 'touchcancel', 'pointerup', 'pointercancel'].forEach(function (evt) {
        track.addEventListener(evt, resumeAutoScroll, { passive: true });
      });

      // A wheel gesture (trackpad on a touch-enabled tablet) has no
      // discrete "release" moment, so treat a short pause in wheel
      // activity as the release instead.
      var wheelResumeTimer = null;
      track.addEventListener('wheel', function () {
        pauseAutoScroll();
        if (wheelResumeTimer) window.clearTimeout(wheelResumeTimer);
        wheelResumeTimer = window.setTimeout(resumeAutoScroll, 1200);
      }, { passive: true });

      resumeAutoScroll();
    }
  }

  function initClientsDesktopTrack(testimonials) {
    var viewport = document.getElementById('clientsViewport');
    var track = document.getElementById('clientsTrack');
    if (!viewport || !track) return;

    var total = testimonials.length;
    var slots = Array.prototype.slice.call(track.querySelectorAll('.client-card'));
    if (slots.length !== 5) return;

    var centerIndex = 0;
    var step = 0; // card width + gap, in px
    var animating = false;
    var timer = null;

    function fill(card, item) {
      if (!item) return;
      card.querySelector('.client-card__avatar').textContent = item.initial;
      card.querySelector('.client-card__name').textContent = item.name;
      card.querySelector('.client-card__company').textContent = item.company;
      card.querySelector('.client-card__quote').textContent = '"' + item.message + '"';
    }

    function fillAllSlots() {
      for (var i = 0; i < 5; i++) {
        var itemIndex = (centerIndex - 2 + i + total * 2) % total;
        fill(slots[i], testimonials[itemIndex]);
      }
    }

    // The settle bounce now lives entirely in CSS (margin-top uses a
    // slight-overshoot easing curve), so the card arrives with a gentle
    // spring as ONE continuous motion. A separate JS-triggered "pop up
    // then ease down" layered on top after the fact used to land at the
    // exact same instant as the position/content reset and read as an
    // abrupt jump rather than a settle.

    // Cards animate via margin-top, and the viewport has no height of
    // its own — left alone it just auto-sizes to whichever child is
    // tallest at that instant, so the whole section visibly grew and
    // shrank throughout every slide. Measuring the worst case up front
    // (longest quote, in the active/lower position) and pinning the
    // viewport to that height means the section truly never resizes,
    // no matter which testimonial is showing or mid-animation.
    function measureMaxCardHeight() {
      var probe = document.createElement('article');
      probe.className = 'client-card client-card--active client-card--shape';
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.pointerEvents = 'none';
      probe.style.left = '-9999px';
      probe.style.top = '0';
      probe.innerHTML = slots[2].innerHTML;
      track.appendChild(probe);

      // offsetHeight is border-box only — margin-top (the 71px active
      // drop, which itself varies by breakpoint) has to be added back
      // in separately to get the true space the card occupies.
      var marginTop = parseFloat(window.getComputedStyle(probe).marginTop) || 0;
      var max = 0;
      for (var i = 0; i < total; i++) {
        fill(probe, testimonials[i]);
        max = Math.max(max, probe.offsetHeight + marginTop);
      }

      track.removeChild(probe);
      return max;
    }

    function measure() {
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 24;
      step = slots[0].getBoundingClientRect().width + gap;
      viewport.style.width = (step * 3 - gap) + 'px';
      viewport.style.height = (measureMaxCardHeight() + 12) + 'px';
      track.style.transition = 'none';
      track.style.transform = 'translateX(' + (-step) + 'px)';
      // Force reflow so the transition is disabled only for this jump.
      void track.offsetHeight;
      track.style.transition = '';
    }

    function slideDesktop(direction) {
      if (animating) return;
      animating = true;

      // The card physically becoming the new center (slot 3 sliding in
      // from the right, or slot 1 from the left) drops down as it moves;
      // the card leaving the center rises back up — both happen together
      // with the horizontal slide, so each card travels diagonally.
      var incoming = direction > 0 ? slots[3] : slots[1];
      var outgoing = slots[2];

      // Shape/border hands off in lockstep with position, both at the
      // start of the slide: exactly one card carries the green border
      // at any instant — never two at once, and never one that's
      // already left the center — it's always whichever card is
      // currently on its way to (or already at) the active slot.
      outgoing.classList.remove('client-card--active');
      outgoing.classList.remove('client-card--shape');
      incoming.classList.add('client-card--active');
      incoming.classList.add('client-card--shape');

      var target = -step - (direction * step);
      track.style.transform = 'translateX(' + target + 'px)';

      var onEnd = function (e) {
        if (e.target !== track || e.propertyName !== 'transform') return;
        track.removeEventListener('transitionend', onEnd);

        centerIndex = (centerIndex + direction + total) % total;

        // Snap the track, and the active/shape classes, back onto the
        // permanent center slot (slots[2]) at the same instant the
        // content is remapped — so nothing visibly jumps even though
        // the DOM nodes are recycled. `incoming` currently holds the
        // classes (and is showing the content that's becoming active);
        // after this, slots[2] holds both, always — that's what keeps
        // the recycling illusion consistent from cycle to cycle.
        track.style.transition = 'none';
        incoming.style.transition = 'none';
        outgoing.style.transition = 'none';
        track.style.transform = 'translateX(' + (-step) + 'px)';
        incoming.classList.remove('client-card--active');
        incoming.classList.remove('client-card--shape');
        outgoing.classList.add('client-card--active');
        outgoing.classList.add('client-card--shape');
        fillAllSlots();
        void track.offsetHeight;
        track.style.transition = '';
        incoming.style.transition = '';
        outgoing.style.transition = '';

        animating = false;
      };
      track.addEventListener('transitionend', onEnd);
    }

    function slide(direction) {
      slideDesktop(direction);
    }

    function start() {
      if (timer) return;
      timer = window.setInterval(function () { slide(1); }, 5000);
    }
    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }
    function restart() {
      stop();
      start();
    }

    var prevBtn = document.getElementById('clientsPrev');
    var nextBtn = document.getElementById('clientsNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { slide(-1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { slide(1); restart(); });

    // Clicking the visible left/right (inactive) card brings it to center.
    slots[1].addEventListener('click', function () { slide(-1); restart(); });
    slots[3].addEventListener('click', function () { slide(1); restart(); });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    });

    fillAllSlots();
    measure();
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientsCarousel);
  } else {
    initClientsCarousel();
  }
})();
