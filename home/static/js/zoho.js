/* ============================================================
   TECHNOLOGIES HONEYCOMB SECTION — script
   - Builds the two hives (3/3/3 rows = 18 visible hexagons)
   - Every 2s ALL hexagons flip (ripple stagger) and advance
     through the 52-icon pool, so every icon gets shown.

   👉 TO USE YOUR REAL LOGOS:
   Replace the entries in the ICONS array below with your own
   markup — either inline SVG strings or image tags like:
     '<img src="assets/logos/react.svg" alt="React">'
   Keep exactly 52 entries (or any count — it adapts).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 55 custom icons ---------- */
  const iconFiles = [
    'zoho-analytics 1.png', 'zoho-assist 1.png', 'zoho-backstage 1.png', 'zoho-bigin 1.png',
    'zoho-billing 1.png', 'zoho-bookings 1.png', 'zoho-books 1.png', 'zoho-bugtracker 1.png',
    'zoho-campaigns 1.png', 'zoho-catalyst 1.png', 'zoho-checkout 1.png', 'zoho-cliq 1.png',
    'zoho-commerce 1.png', 'zoho-contracts 1.png', 'zoho-creator 1.png', 'zoho-crm 1.png',
    'zoho-dataprep 1.png', 'zoho-desk 1.png', 'zoho-directory 1.png', 'zoho-domain.png',
    'zoho-expense 1.png', 'zoho-flow 1.png', 'zoho-forms 1.png', 'zoho-fsm 1.png',
    'zoho-inventory 1.png', 'zoho-invoice 1.png', 'zoho-iotplatform 1.png', 'zoho-lens 1.png',
    'zoho-mail 1.png', 'zoho-marketing 1.png', 'zoho-meeting 1.png', 'zoho-metools 1.png',
    'zoho-notebook 1.png', 'zoho-oneauth 1.png', 'zoho-payroll 1.png', 'zoho-people 1.png',
    'zoho-pos 1.png', 'zoho-projects 1.png', 'zoho-qengine 1.png', 'zoho-recruit 1.png',
    'zoho-routeiq 1.png', 'zoho-salesiq 1.png', 'zoho-sheet 1.png', 'zoho-shifts 1.png',
    'zoho-show 1.png', 'zoho-sign 1.png', 'zoho-social 1.png', 'zoho-sprints 1.png',
    'zoho-survey 1.png', 'zoho-vault 1.png', 'zoho-webinar 1.png', 'zoho-workdrive 1.png',
    'zoho-workerly 1.png', 'Zoho-workplace.png', 'zoho-writer 1.png'
  ];

  const ICONS = iconFiles.map(file => `<img src="/static/img/${file}" alt="Zoho Icon" style="width: 50px; height: 50px; object-fit: contain;">`);

  /* ---------- build the two hives ---------- */
  const hexIcons = [];

  function buildHive(el, startIndex) {
    if (!el) return;
    const rows = [3, 3, 3];
    let i = startIndex;
    rows.forEach(count => {
      const row = document.createElement('div');
      row.className = 'hive-row';
      for (let k = 0; k < count; k++) {
        const hex = document.createElement('div');
        hex.className = 'hex';
        const icon = document.createElement('div');
        icon.className = 'icon';
        icon.innerHTML = ICONS[i % ICONS.length];
        hex.appendChild(icon);
        row.appendChild(hex);
        hexIcons.push(icon);
        i++;
      }
      el.appendChild(row);
    });
  }

  function init() {
    buildHive(document.getElementById('hive-left'), 0);
    buildHive(document.getElementById('hive-right'), 9);
    if (!hexIcons.length) return;

    const TOTAL_VISIBLE = hexIcons.length; // 18
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let offset = 0;

    function rotateAll() {
      offset = (offset + TOTAL_VISIBLE) % ICONS.length;

      hexIcons.forEach((el, slot) => {
        const newIcon = ICONS[(offset + slot) % ICONS.length];
        const delay = slot * 40; // ripple stagger

        if (reduceMotion) {
          el.innerHTML = newIcon;
          return;
        }

        setTimeout(() => {
          el.classList.add('flip');
          setTimeout(() => { el.innerHTML = newIcon; }, 300); // swap mid-flip
          el.addEventListener('animationend', () => el.classList.remove('flip'), { once: true });
        }, delay);
      });
    }

    setInterval(rotateAll, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
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
    var mediaQuery = window.matchMedia("(max-width: 1024px)");
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






(function () {
  // Word-by-word 3D reveal for the heading
  var heading = document.getElementById('ectHeading');
  if (!heading) return;

  var delay = 0.25;

  function wrapWords(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      var frag = document.createDocumentFragment();
      var parts = node.textContent.split(/(\s+)/);

      parts.forEach(function (part) {
        if (/^\s+$/.test(part) || part === '') {
          frag.appendChild(document.createTextNode(part));
          return;
        }

        var span = document.createElement('span');
        span.className = 'ect-word';
        span.style.animationDelay = delay.toFixed(2) + 's';
        span.textContent = part;
        delay += 0.12;
        frag.appendChild(span);
      });

      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(wrapWords);
    }
  }

  var headingChildren = Array.prototype.slice.call(heading.childNodes);
  headingChildren.forEach(wrapWords);

  // Generate floating particles
  var section = document.querySelector('.ect-zoho-section');
  if (!section) return;

  for (var i = 0; i < 22; i++) {
    var particle = document.createElement('div');
    particle.className = 'ect-particle';

    var size = 2 + Math.random() * 4;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (8 + Math.random() * 9) + 's';
    particle.style.animationDelay = (Math.random() * 10) + 's';

    section.appendChild(particle);
  }
})();





(function () {
  var wrapper = document.getElementById('tabsWrapper');
  var track   = document.getElementById('tabsTrack');
  var panels  = document.querySelectorAll('#contentPanel .panel');
  var imageEl = document.getElementById('contentImage');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  if (!wrapper || !track || !panels.length) return;

  var SPEED = 0.5;
  var AUTO_PLAY_DELAY = 2000;
  var responsiveQuery = window.matchMedia('(max-width: 1024px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var autoplayTimer = null;
  var isInViewport = true;

  var originals = Array.prototype.slice.call(track.children);
  var total     = originals.length;

  originals.forEach(function (tab) {
    var clone = tab.cloneNode(true);
    clone.classList.add('is-clone');
    track.appendChild(clone);
  });

  var allTabs   = Array.prototype.slice.call(track.children);
  var current   = 0;
  var paused    = false;
  var offsetX   = 0;
  var loopWidth = 0;
  var positions = [];

  function measure() {
    var gap = parseFloat(getComputedStyle(track).gap) || 0;
    positions = [];
    var acc = 0;
    originals.forEach(function (t) {
      positions.push(acc);
      acc += t.offsetWidth + gap;
    });
    loopWidth = acc;
  }

  function indexAtOffset(x) {
    var m = ((x % loopWidth) + loopWidth) % loopWidth;
    var idx = 0;
    for (var i = 0; i < positions.length; i++) {
      if (positions[i] <= m) idx = i;
    }
    return idx;
  }

  function clearResponsiveAutoplay() {
    if (autoplayTimer !== null) {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleResponsiveAutoplay() {
    clearResponsiveAutoplay();
    if (!responsiveQuery.matches || reduceMotion || document.hidden || !isInViewport) return;

    autoplayTimer = window.setTimeout(function () {
      jumpTo(current + 1);
    }, AUTO_PLAY_DELAY);
  }

  function tickMarquee() {
    if (!responsiveQuery.matches && !paused) {
      offsetX += SPEED;
      if (offsetX >= loopWidth) offsetX -= loopWidth;
      track.style.transform = 'translateX(-' + offsetX + 'px)';

      var idx = indexAtOffset(offsetX);
      if (idx !== current) activate(idx);
    }
    requestAnimationFrame(tickMarquee);
  }

  function activate(index) {
    current = ((index % total) + total) % total;

    allTabs.forEach(function (t) {
      t.classList.toggle('active', +t.dataset.index === current);
    });
    panels.forEach(function (p) {
      var isActive = +p.dataset.index === current;
      p.classList.toggle('active', isActive);
      
      // Update the main image if this panel is active and has a data-image attribute
      if (isActive && p.dataset.image) {
        var imgEl = document.querySelector('#contentImage img');
        if (imgEl) {
          imgEl.src = p.dataset.image;
        }
      }
    });
  }

  function jumpTo(index) {
    index = ((index % total) + total) % total;
    offsetX = positions[index];

    if (responsiveQuery.matches) {
      offsetX -= (wrapper.clientWidth - originals[index].offsetWidth) / 2;
      if (loopWidth > 0) {
        offsetX = ((offsetX % loopWidth) + loopWidth) % loopWidth;
      }
    }

    track.style.transform = 'translateX(-' + offsetX + 'px)';
    activate(index);
    scheduleResponsiveAutoplay();
  }

  allTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      jumpTo(+tab.dataset.index);
    });
  });

  nextBtn.addEventListener('click', function () {
    jumpTo(current + 1);
  });

  prevBtn.addEventListener('click', function () {
    jumpTo(current - 1);
  });

  [wrapper, document.querySelector('.content-area')].forEach(function (el) {
    if (!el) return;
    el.addEventListener('mouseenter', function () { paused = true;  });
    el.addEventListener('mouseleave', function () { paused = false; });
  });

  measure();
  window.addEventListener('resize', function () {
    measure();
    if (responsiveQuery.matches) jumpTo(current);
  });
  activate(0);

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== wrapper) return;
        isInViewport = entry.isIntersecting;
        if (isInViewport) scheduleResponsiveAutoplay();
        else clearResponsiveAutoplay();
      });
    }, { threshold: 0.2 });
    observer.observe(wrapper);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearResponsiveAutoplay();
    else scheduleResponsiveAutoplay();
  });

  function syncResponsiveMode() {
    clearResponsiveAutoplay();
    measure();
    jumpTo(current);
  }

  if (typeof responsiveQuery.addEventListener === 'function') {
    responsiveQuery.addEventListener('change', syncResponsiveMode);
  } else if (typeof responsiveQuery.addListener === 'function') {
    responsiveQuery.addListener(syncResponsiveMode);
  }

  scheduleResponsiveAutoplay();

  if (!reduceMotion) requestAnimationFrame(tickMarquee);
})();





/**
 * Zoho Implementation Section
 * — Triggers the icon spin animation when cells scroll into view
 */

(function () {
  const section = document.getElementById('zoho-implementation');
  if (!section) return;

  const cells = section.querySelectorAll('.zoho-implementation__cell');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-animated');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cells.forEach((cell) => observer.observe(cell));
  } else {
    cells.forEach((cell) => cell.classList.add('is-animated'));
  }
})();




// ── Word-by-word 3D reveal ──
// Keeps the gradient .accent span intact by walking child nodes recursively
document.querySelectorAll('#ectHeading').forEach(function (heading) {
  var delay = 0.25;

  function wrapWords(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      var fragment = document.createDocumentFragment();
      var parts = node.textContent.split(/(\s+)/);

      parts.forEach(function (part) {
        // Preserve whitespace as plain text nodes
        if (/^\s+$/.test(part) || part === '') {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        var span = document.createElement('span');
        span.className = 'word';
        span.style.animationDelay = delay.toFixed(2) + 's';
        span.textContent = part;
        delay += 0.12;
        fragment.appendChild(span);
      });

      node.replaceWith(fragment);

    } else if (node.nodeType === Node.ELEMENT_NODE) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(wrapWords);
    }
  }

  var headingChildren = Array.prototype.slice.call(heading.childNodes);
  headingChildren.forEach(wrapWords);
});


// ── Floating Particles ──
(function () {
  var section = document.querySelector('.ect-zoho-section');
  var count = 22;

  for (var i = 0; i < count; i++) {
    var p = document.createElement('div');
    p.className = 'particle';

    var size = 2 + Math.random() * 4;
    p.style.width  = size + 'px';
    p.style.height = size + 'px';
    p.style.left   = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 9) + 's';
    p.style.animationDelay    = (Math.random() * 10) + 's';

    section.appendChild(p);
  }
})();



// FAQ SECTION

(function () {

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

})();


/* =========================================================
   ZOHO HERO CTA — SMOOTH SCROLL
   ========================================================= */

(function () {
  "use strict";

  const button = document.querySelector(
    '.zoho-figma-hero__cta[data-smooth-scroll]'
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



