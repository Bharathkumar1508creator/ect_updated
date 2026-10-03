/* ============================================================
   ECT Scroll Hero — animation engine
   ============================================================ */

const track   = document.getElementById('track');
const heading = document.getElementById('heading');
const cards   = [0, 1, 2, 3, 4].map(i => document.getElementById('c' + i));

/* ---- helpers ---- */
const vw    = () => innerWidth;
const vh    = () => innerHeight;
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* quintic ease-in-out — smooth start & stop */
function ease(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/* map raw 0-1 progress into a sub-range [a, b] with easing */
function seg(raw, a, b) {
  return ease(clamp((raw - a) / (b - a), 0, 1));
}

/* ---- layout states ---- */
/*
  Each card has three keyframe positions:
    p = peek  (below viewport, only top edge visible)
    a = arc   (arranged in a curved row)
    f = final (center expands, edges peek, outer two fade out)

  Values are in viewport units (vw / vh / vw-scaled px).
*/
function states() {
  const W = vw();
  const H = vh();
  const isMobile = W < 768;
  const m = isMobile ? clamp(W / 400, 0.7, 1.2) : clamp(W / 1300, 0.5, 1.15);

  if (isMobile) {
    return [
      // card 0 — hidden on mobile
      { p: { x: 0, y: 100 }, a: { x: 0, y: 100, w: 0, h: 0 }, f: { x: 0, y: 100, w: 0, h: 0, o: 0 } },
      // card 1 — outer left
      {
        p: { x: -25, y: 45 },
        a: { x: -25, y: 20, w: W * 0.40, h: H * 0.30 },
        f: { x: -50, y: 0,  w: W * 0.45, h: H * 0.40, o: 0 },
      },
      // card 2 — center
      {
        p: { x: 0,   y: 35 },
        a: { x: 0,   y: 15, w: W * 0.75, h: H * 0.38 },
        f: { x: 0,   y: 0,  w: W * 0.85, h: H * 0.55, o: 1 },
      },
      // card 3 — outer right
      {
        p: { x: 25,  y: 45 },
        a: { x: 25,  y: 20, w: W * 0.40, h: H * 0.30 },
        f: { x: 50,  y: 0,  w: W * 0.45, h: H * 0.40, o: 0 },
      },
      // card 4 — hidden on mobile
      { p: { x: 0, y: 100 }, a: { x: 0, y: 100, w: 0, h: 0 }, f: { x: 0, y: 100, w: 0, h: 0, o: 0 } },
    ];
  }

  return [
    // card 0 — far left
    {
      p: { x: -46, y: 80 },
      a: { x: -46, y: 11, w: 170 * m, h: 210 * m },
      f: { x: -58, y: 11, w: 170 * m, h: 210 * m, o: 0 },
    },
    // card 1 — inner left
    {
      p: { x: -28, y: 80 },
      a: { x: -28, y: 8,  w: 230 * m, h: 290 * m },
      f: { x: -49, y: 0,  w: W * 0.22, h: H * 0.56, o: 1 },
    },
    // card 2 — center
    {
      p: { x: 0,   y: 58 },
      a: { x: 0,   y: 6,  w: 400 * m, h: 340 * m },
      f: { x: 0,   y: 0,  w: W * 0.72, h: H * 0.74, o: 1 },
    },
    // card 3 — inner right
    {
      p: { x: 28,  y: 80 },
      a: { x: 28,  y: 8,  w: 230 * m, h: 290 * m },
      f: { x: 49,  y: 0,  w: W * 0.22, h: H * 0.56, o: 1 },
    },
    // card 4 — far right
    {
      p: { x: 46,  y: 80 },
      a: { x: 46,  y: 11, w: 170 * m, h: 210 * m },
      f: { x: 58,  y: 11, w: 170 * m, h: 210 * m, o: 0 },
    },
  ];
}

/* ---- main render loop ---- */
function render() {
  const rect  = track.getBoundingClientRect();
  const total = rect.height - vh();
  const raw   = clamp(-rect.top / total, 0, 1);   // 0 at top, 1 at bottom
  const st    = states();

  /* -- heading: fades out during stage 2 -- */
  const tHead = seg(raw, 0.30, 0.55);
  // heading.style.transform = `translateY(${-tHead * 70}vh)`;
  heading.style.transform =
  `translate(-50%, ${-tHead * 70}vh)`;
  heading.style.opacity   = 1 - tHead;

  /* -- cards -- */
  cards.forEach((el, i) => {
    if (!el) return;
    const { p, a, f } = st[i];

    // each card rises at a slightly different time
    const riseStart = i === 2 ? 0    : 0.32 + Math.abs(i - 2) * 0.03;
    const riseEnd   = i === 2 ? 0.50 : 0.62;

    const t1 = seg(raw, riseStart, riseEnd);   // peek → arc
    const t2 = seg(raw, 0.65, 0.97);           // arc  → final

    // interpolate position
    let x = lerp(p.x, a.x, t1);
    let y = lerp(p.y, a.y, t1);
    let w = a.w;
    let h = a.h;
    let o = 1;

    // interpolate into final positions
    x = lerp(x, f.x, t2);
    y = lerp(y, f.y, t2);
    w = lerp(w, f.w, t2);
    h = lerp(h, f.h, t2);

    // outer cards (0 & 4) fade out in stage 3
    if (f.o === 0) {
      o = t2 < 0.55 ? 1 : 1 - (t2 - 0.55) / 0.45;
    }

    // z-index: center on top, inner cards next, outer cards behind
    el.style.zIndex    = i === 2 ? 5 : (Math.abs(i - 2) === 1 ? 3 : 2);
    el.style.width     = w + 'px';
    el.style.height    = h + 'px';
    el.style.opacity   = o;
    el.style.borderRadius = lerp(16, 22, t2) + 'px';
    el.style.transform = `translate(calc(-50% + ${x}vw), calc(-50% + ${y}vh))`;
  });

  requestAnimationFrame(render);
}

/* kick off */
// The legacy frame-by-frame engine is intentionally disabled.
// The damped transform-only engine below owns the hero animation.


/* ============================================================
   ECT Scroll Hero — exact five-card Figma transition
   ============================================================ */
(function () {
  'use strict';

  const heroTrack = document.getElementById('track');
  const heroStage = heroTrack ? heroTrack.querySelector('.stage') : null;
  const heroHeading = document.getElementById('heading');
  const heroCards = [0, 1, 2, 3, 4].map(i => document.getElementById('c' + i));
  const heroImages = heroCards.map(card => card ? card.querySelector('img') : null);

  if (!heroTrack || !heroHeading || heroCards.every(card => !card)) return;

  /* Mobile & tablet (<=1024px): skip the scroll-jack engine entirely.
     CSS (.hero-compact) shows a static heading + centre image with no
     pinned scroll runway, so no scroll math or inline styles are needed. */
  const heroCompactQuery = window.matchMedia('(max-width: 1024px)');
  if (heroCompactQuery.matches) {
    heroTrack.classList.add('hero-compact');
    heroCompactQuery.addEventListener('change', function () {
      window.location.reload();
    });
    return;
  }

  const reduceHeroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const heroClamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const heroLerp = (from, to, amount) => from + (to - from) * amount;

  function heroEase(value) {
    const t = heroClamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function heroSegment(progress, start, end) {
    return heroEase((progress - start) / (end - start));
  }

  let heroViewportWidth = window.innerWidth;
  let heroViewportHeight = window.innerHeight;
  let heroStageWidth = window.innerWidth;
  let heroStageHeight = window.innerHeight;
  let heroDesignScale = 1;
  let heroGreenLine = 486;
  let heroCardStates = [];
  let heroTargetProgress = 0;
  let heroCurrentProgress = 0;
  let heroAnimationFrame = 0;
  let heroIsVisible = true;

  function buildHeroStates() {
    heroViewportWidth = window.innerWidth;
    heroViewportHeight = window.innerHeight;
    heroStageWidth = heroStage ? heroStage.clientWidth : heroViewportWidth;
    heroStageHeight = heroStage ? heroStage.clientHeight : heroViewportHeight;
    heroDesignScale = Math.min(heroStageWidth / 1440, 1);

    /* Figma boundary is y=483 because the 486px rectangle starts at -3px.
       Small screens keep a usable green header instead of shrinking it into
       the title. */
    heroGreenLine = heroStageWidth < 600
      ? heroClamp(heroStageHeight * 0.58, 340, 430)
      : 483 * heroDesignScale;

    heroStage.style.setProperty('--about-hero-green-line', heroGreenLine + 'px');

    /* Stable final composition: 60% centre + 16% side + 4% gap on
       each side. The remaining outer margin is equal on both sides. */
    const finalRowWidth = Math.min(1440, Math.max(280, heroStageWidth - 48));
    const finalWidth = finalRowWidth * 0.60;
    const sideFinalWidth = finalRowWidth * 0.16;
    const finalGap = finalRowWidth * 0.04;
    const finalHeight = Math.min(540, heroStageHeight * 0.62);
    const finalY = heroStageHeight * 0.55 - heroStageHeight / 2;
    const sideFinalHeight = finalHeight * 0.82;

    /* Exact Figma card geometry at 1440px:
       outer 193x255 at +/-623.5; inner 194x308 at +/-406;
       centre 570x350. The y values are card centres relative to the
       green/white boundary, so the whole row stays locked to that line. */
    const figmaCards = [
      { x: -623.5, y: 21.5, width: 193, height: 255 },
      { x: -406,   y: -5,   width: 194, height: 308 },
      { x: 0,      y: -26,  width: 570, height: 350 },
      { x: 406,    y: -5,   width: 194, height: 308 },
      { x: 623.5,  y: 21.5, width: 193, height: 255 }
    ];

    heroCardStates = figmaCards.map((item, index) => {
      const initialWidth = item.width * heroDesignScale;
      const initialHeight = item.height * heroDesignScale;
      const initialX = item.x * heroDesignScale;
      const initialY = heroGreenLine + item.y * heroDesignScale - heroStageHeight / 2;

      if (index === 2) {
        return {
          initial: { x: initialX, y: initialY, w: initialWidth, h: initialHeight },
          final: { x: 0, y: finalY, w: finalWidth, h: finalHeight, opacity: 1 }
        };
      }

      const direction = index < 2 ? -1 : 1;

      /* The inner pair remains fully visible with equal spacing from the
         centre card. */
      if (index === 1 || index === 3) {
        return {
          initial: { x: initialX, y: initialY, w: initialWidth, h: initialHeight },
          final: {
            x: direction * (finalWidth / 2 + finalGap + sideFinalWidth / 2),
            y: finalY,
            w: sideFinalWidth,
            h: sideFinalHeight,
            opacity: 1
          }
        };
      }

      /* Only the two outermost cards leave the viewport. */
      return {
        initial: { x: initialX, y: initialY, w: initialWidth, h: initialHeight },
        final: {
          x: initialX + direction * Math.max(80, heroStageWidth * 0.10),
          y: initialY + 16,
          w: initialWidth,
          h: initialHeight,
          opacity: 0
        }
      };
    });

    heroCards.forEach((card, index) => {
      if (!card) return;
      const state = heroCardStates[index];
      card.style.visibility = 'visible';
      card.style.width = state.initial.w + 'px';
      card.style.height = state.initial.h + 'px';
      card.style.borderRadius = Math.max(8, 24 * heroDesignScale) + 'px';
      card.style.zIndex = index === 2 ? '5' : (Math.abs(index - 2) === 1 ? '3' : '2');
    });
  }

  function readHeroProgress() {
    const rectangle = heroTrack.getBoundingClientRect();
    const scrollRange = Math.max(1, heroTrack.offsetHeight - heroViewportHeight);
    return heroClamp(-rectangle.top / scrollRange, 0, 1);
  }

  function renderHero(progress) {
    const headingProgress = heroSegment(progress, 0.08, 0.28);
    heroHeading.style.transform = `translate(-50%, ${heroLerp(0, -48, headingProgress)}px)`;
    heroHeading.style.opacity = String(1 - headingProgress);

    heroCards.forEach((card, index) => {
      if (!card) return;
      const state = heroCardStates[index];
      if (!state) return;

      const transitionProgress = index >= 1 && index <= 3
        ? heroSegment(progress, 0.12, 0.74)
        : heroSegment(progress, 0.10, 0.48);

      const x = heroLerp(state.initial.x, state.final.x, transitionProgress);
      const y = heroLerp(state.initial.y, state.final.y, transitionProgress);
      const width = heroLerp(state.initial.w, state.final.w, transitionProgress);
      const height = heroLerp(state.initial.h, state.final.h, transitionProgress);
      const scaleX = width / state.initial.w;
      const scaleY = height / state.initial.h;
      const coverScale = Math.max(scaleX, scaleY);
      const opacity = heroLerp(1, state.final.opacity, transitionProgress);
      const visualRadius = heroLerp(
        Math.max(8, 24 * heroDesignScale),
        24,
        index === 2 ? transitionProgress : 0
      );

      card.style.opacity = String(opacity);
      card.style.borderRadius = (visualRadius / coverScale) + 'px';
      card.style.transform =
        `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) ` +
        `scale(${scaleX}, ${scaleY})`;

      if (heroImages[index]) {
        heroImages[index].style.transform =
          `scale(${coverScale / scaleX}, ${coverScale / scaleY})`;
      }
    });
  }

  function renderReducedHero() {
    /* Reduced-motion users receive the exact approved five-card opening
       composition without any scroll-driven movement. */
    renderHero(0);
  }

  function stopHeroAnimation() {
    if (heroAnimationFrame) {
      window.cancelAnimationFrame(heroAnimationFrame);
      heroAnimationFrame = 0;
    }
  }

  function animateHero() {
    heroCurrentProgress = heroTargetProgress;
    renderHero(heroCurrentProgress);
    heroAnimationFrame = 0;
  }

  function startHeroAnimation() {
    if (!heroAnimationFrame && !reduceHeroMotion.matches && heroIsVisible) {
      heroAnimationFrame = window.requestAnimationFrame(animateHero);
    }
  }

  function updateHeroFromScroll() {
    if (!heroIsVisible && !reduceHeroMotion.matches) return;

    if (reduceHeroMotion.matches) {
      stopHeroAnimation();
      renderReducedHero();
      return;
    }

    heroTargetProgress = readHeroProgress();

    if (!heroIsVisible) {
      heroCurrentProgress = heroTargetProgress;
      renderHero(heroCurrentProgress);
      return;
    }

    startHeroAnimation();
  }

  function handleHeroResize() {
    stopHeroAnimation();
    buildHeroStates();
    if (reduceHeroMotion.matches) {
      renderReducedHero();
      return;
    }
    heroTargetProgress = readHeroProgress();
    heroCurrentProgress = heroTargetProgress;
    renderHero(heroCurrentProgress);
  }

  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroIsVisible = entries[0].isIntersecting;

      if (heroIsVisible || reduceHeroMotion.matches) {
        updateHeroFromScroll();
        return;
      }

      stopHeroAnimation();
      const rectangle = heroTrack.getBoundingClientRect();
      heroTargetProgress = rectangle.bottom <= 0 ? 1 : 0;
      heroCurrentProgress = heroTargetProgress;
      renderHero(heroCurrentProgress);
    }, { rootMargin: '25% 0px 25% 0px' });
    heroObserver.observe(heroTrack);
  }

  let heroResizeTimer = 0;
  window.addEventListener('scroll', updateHeroFromScroll, { passive: true });
  window.addEventListener('resize', function () {
    window.clearTimeout(heroResizeTimer);
    heroResizeTimer = window.setTimeout(handleHeroResize, 120);
  }, { passive: true });

  reduceHeroMotion.addEventListener('change', function () {
    stopHeroAnimation();
    if (reduceHeroMotion.matches) {
      renderReducedHero();
      return;
    }
    buildHeroStates();
    heroTargetProgress = readHeroProgress();
    heroCurrentProgress = heroTargetProgress;
    renderHero(heroCurrentProgress);
  });

  buildHeroStates();
  if (reduceHeroMotion.matches) {
    renderReducedHero();
  } else {
    heroTargetProgress = readHeroProgress();
    heroCurrentProgress = heroTargetProgress;
    renderHero(heroCurrentProgress);
  }
})();



(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Build service items: icon + per-letter text ===== */
  var iconSVG = '<span class="ic"><svg viewBox="0 0 24 24">' +
    '<path class="badge" d="M12 1l3 2.6 3.9-.4 1 3.8 3.5 1.8-1.5 3.6 1.5 3.6-3.5 1.8-1 3.8-3.9-.4L12 23l-3-2.6-3.9.4-1-3.8L.6 15.2 2.1 11.6.6 8 4.1 6.2l1-3.8 3.9.4L12 1z"/>' +
    '<path class="check" d="M8 12.2l2.6 2.6 5.2-5.2"/>' +
    '</svg></span>';

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.querySelectorAll('.who-section .svc').forEach(function (el) {
    var label = el.getAttribute('data-label');
    var letters = [];
    for (var i = 0; i < label.length; i++) {
      var c = label[i];
      if (c === ' ') {
        letters.push('<span class="l sp" style="--i:' + i + '">&nbsp;</span>');
      } else {
        letters.push('<span class="l" style="--i:' + i + '">' + escapeHTML(c) + '</span>');
      }
    }
    el.innerHTML = '<span class="ring"></span>' + iconSVG +
      '<span class="txt" aria-label="' + escapeHTML(label) + '">' + letters.join('') + '</span>';
  });

  /* ===== Headline: char-level 3D flip with word grouping ===== */
  var h = document.getElementById('who-headline');
  if (h) {
    var ci = 0;
    var words = h.textContent.trim().split(' ');
    h.innerHTML = words.map(function (w) {
      var chars = [];
      for (var j = 0; j < w.length; j++) {
        chars.push('<span class="ch" style="--cd:' + (ci++) * 0.022 + 's">' + escapeHTML(w[j]) + '</span>');
      }
      return '<span style="display:inline-block;white-space:nowrap">' + chars.join('') + '</span>';
    }).join(' ');
  }

  /* ===== Sub: line mask reveal ===== */
  var sub = document.getElementById('who-subline');
  if (sub) {
    var subWords = sub.textContent.trim().split(' ');
    var third = Math.ceil(subWords.length / 3);
    var lines = [
      subWords.slice(0, third),
      subWords.slice(third, third * 2),
      subWords.slice(third * 2)
    ];
    sub.innerHTML = lines.map(function (line, idx) {
      return '<span class="ln"><span style="--d:' + (0.55 + idx * 0.12) + 's">' + line.join(' ') + '</span></span>';
    }).join('');
  }

  /* ===== Observer ===== */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.who-section [data-observe]').forEach(function (el) {
    io.observe(el);
  });

  /* Mobile/tablet: .head-row is display:contents there (see about.css,
     used to move the sub-line after the carousel), so it has no box and
     IntersectionObserver can never report it as intersecting — the
     heading/sub-line would stay invisible forever. Reveal it immediately
     instead of waiting on an intersection that never fires. Desktop keeps
     the normal scroll-triggered reveal untouched. */
  if (window.matchMedia('(max-width: 980px)').matches) {
    var headRow = document.querySelector('.who-section .head-row');
    if (headRow) {
      headRow.classList.add('in-view');
      io.unobserve(headRow);
    }
  }

  if (!reduced) {

    /* ===== Magnetic pull on service items ===== */
    document.querySelectorAll('.who-section .magnetic').forEach(function (el) {
      var raf = null;

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.setProperty('--x', (e.clientX - r.left) + 'px');
        el.style.setProperty('--y', (e.clientY - r.top) + 'px');
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = 'translate(' + (dx * 10) + 'px,' + (dy * 6) + 'px)';
          el.style.transition = 'transform .15s ease-out';
        });
      });

      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)';
        el.style.transform = 'translate(0,0)';
      });
    });

    /* ===== Parallax on scroll ===== */
    var frames = Array.prototype.slice.call(
      document.querySelectorAll('.who-section [data-parallax]')
    );
    var ticking = false;

    function parallax() {
      var vh = window.innerHeight;
      frames.forEach(function (f) {
        var r = f.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        var img = f.querySelector('img');
        if (img) img.style.translate =
          '0 ' + (-p * parseFloat(f.dataset.parallax)).toFixed(1) + 'px';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(parallax);
        ticking = true;
      }
    }, { passive: true });

    parallax();

    /* ===== 3D tilt on images ===== */
    document.querySelectorAll('.who-section .tilt').forEach(function (el) {
      var raf = null;

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform =
            'perspective(900px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg) scale(1.015)';
          el.style.transition = 'transform .12s ease-out';
        });
      });

      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)';
        el.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale(1)';
      });
    });
  }
})();




//mission vission

document.addEventListener('DOMContentLoaded', () => {

  // --- Particle Canvas ---
  (function() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let w, h;

    function resize() {
      const section = document.getElementById('mvSection');
      w = canvas.width = section.offsetWidth;
      h = canvas.height = section.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.getElementById('mvSection').addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.08;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          this.x += (dx / dist) * force * 2;
          this.y += (dy / dist) * force * 2;
        }
        if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(22, 163, 74, ${this.opacity})`;
        ctx.fill();
      }
    }

    const count = Math.min(100, Math.floor((w * h) / 10000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(22, 163, 74, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      connectParticles();
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  })();


  // --- Text Reveal Wrappers ---
  document.querySelectorAll('.char-reveal-wrap').forEach(wrap => {
    const text = wrap.getAttribute('data-text');
    wrap.innerHTML = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.classList.add('char-reveal');
      if (char === ' ') {
        span.classList.add('char-space');
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = char;
      }
      span.style.transitionDelay = `${i * 0.03}s`;
      wrap.appendChild(span);
    });
  });

  document.querySelectorAll('.word-reveal-wrap').forEach(wrap => {
    const text = wrap.getAttribute('data-text');
    wrap.innerHTML = '';
    text.split(' ').forEach((word, i) => {
      const span = document.createElement('span');
      span.classList.add('word-reveal');
      span.textContent = word;
      span.style.transitionDelay = `${0.5 + i * 0.06}s`;
      wrap.appendChild(span);
      wrap.appendChild(document.createTextNode(' '));
    });
  });


  // --- Intersection Observer for Animations ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        if (entry.target.querySelector('.char-reveal')) {
          entry.target.querySelectorAll('.char-reveal').forEach(c => c.classList.add('visible'));
        }
        
        if (entry.target.querySelector('.word-reveal')) {
          entry.target.querySelectorAll('.word-reveal').forEach(w => w.classList.add('visible'));
        }
        
        if (entry.target.querySelectorAll('[data-chip]').length) {
          entry.target.querySelectorAll('[data-chip]').forEach((chip, i) => {
            setTimeout(() => chip.classList.add('visible'), 200 + i * 100);
          });
        }
        
        if (entry.target.hasAttribute('data-stat')) {
          animateCounter(entry.target.querySelector('.stat-number'));
        }
        
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  document.querySelectorAll('.char-reveal-wrap, .word-reveal-wrap').forEach(el => {
    el.setAttribute('data-animate', '');
    observer.observe(el);
  });

  // Safety fallback
  setTimeout(() => {
    document.querySelectorAll('.char-reveal').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('.word-reveal').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('visible'));
  }, 1000);


  // --- Tilt Cards Effect ---
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const glow = card.querySelector('.card-glow');
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.transition = 'transform 0.1s ease-out, border-color 0.5s ease, box-shadow 0.5s ease';
      if (glow) {
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
      }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.5s ease, box-shadow 0.5s ease';
    });
  });


  // --- Counter Animation ---
  function animateCounter(el) {
    if (!el) return;
    const target = parseInt(el.getAttribute('data-count'));
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + '+';
    }
    requestAnimationFrame(tick);
  }

  // Initialize Lucide Icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
});


/* ============================================================
   ABOUT ECT + PARTNER CTA — scoped interactions
   Existing page interactions above remain unchanged.
============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Lightweight scroll reveal for only the two new sections */
  var revealItems = document.querySelectorAll(
    ".about-ect [data-about-ect-reveal], .ect-partner [data-partner-reveal]"
  );

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }
})();


/* ============================================================
   ABOUT ECT — MEDIA SCALE
   The video and its play/mute/pause controls have been removed in
   favor of a static image; this keeps the poster image and
   decorative vectors registered to the same organic contour on
   desktop, tablet and mobile by scaling the whole Figma layer
   stack as one unit.
============================================================ */
(function () {
  "use strict";

  var media = document.querySelector(".about-ect__media");
  if (!media) return;

  function syncMediaScale() {
    var scale = Math.min(1, media.clientWidth / 602);
    media.style.setProperty("--about-ect-media-scale", String(scale));
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(syncMediaScale).observe(media);
  } else {
    window.addEventListener("resize", syncMediaScale, { passive: true });
  }

  syncMediaScale();
})();


/* ============================================================
   CORE PILLARS — hover-to-expand interaction
   Desktop (hover-capable): mouseenter expands, mouseleave collapses.
   Touch/mobile: tap toggles expand (accordion), tap again to close.
============================================================ */
(function () {
  const row = document.querySelector('[data-pillars-row]');
  if (!row) return;

  const pillars = Array.from(row.querySelectorAll('[data-pillar]'));
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setExpandedState(activePillar) {
    pillars.forEach(function (pillar) {
      const control = pillar.querySelector('.pillar__bar');
      const panel = pillar.querySelector('.pillar__card');
      const expanded = pillar === activePillar;
      if (control) control.setAttribute('aria-expanded', String(expanded));
      if (panel) panel.setAttribute('aria-hidden', String(!expanded));
    });
  }

  function activate(pillar) {
    row.setAttribute('data-active', 'true');
    pillars.forEach(function (p) {
      p.classList.toggle('is-active', p === pillar);
    });
    setExpandedState(pillar);
  }

  function deactivate() {
    row.removeAttribute('data-active');
    pillars.forEach(function (p) { p.classList.remove('is-active'); });
    setExpandedState(null);
  }

  if (supportsHover) {
    pillars.forEach(function (pillar) {
      const control = pillar.querySelector('.pillar__bar');
      pillar.addEventListener('mouseenter', function () { activate(pillar); });
      if (control) {
        control.addEventListener('focus', function () { activate(pillar); });
        control.addEventListener('click', function () { activate(pillar); });
      }
    });

    row.addEventListener('mouseleave', deactivate);

    row.addEventListener('focusout', function (e) {
      if (!row.contains(e.relatedTarget)) deactivate();
    });
  } else {
    pillars.forEach(function (pillar) {
      const control = pillar.querySelector('.pillar__bar');
      if (!control) return;
      control.addEventListener('click', function () {
        const alreadyActive = pillar.classList.contains('is-active');
        if (alreadyActive) {
          deactivate();
        } else {
          activate(pillar);
        }
      });
    });
  }

  setExpandedState(null);
})();
