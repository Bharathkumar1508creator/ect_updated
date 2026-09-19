// Fallback: if video fails to load (blocked in preview / no file), keep poster visible.
(function(){
  var video = document.querySelector('.ect-media video');
  var poster = document.querySelector('.ect-media-poster');
  if(!video) return;
  video.addEventListener('playing', function(){
    poster.style.display = 'none';
  });
  video.addEventListener('error', function(){
    poster.style.display = 'flex';
  }, true);
})();


/* ============================================================
   CAREERS FAQ — ACCORDION + SCROLL REVEAL
   ============================================================ */
(function () {
  "use strict";

  var section = document.querySelector('.career-faq');
  if (!section) return;

  var items = Array.prototype.slice.call(section.querySelectorAll('.faq-item'));
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  items.forEach(function (item) {
    var button = item.querySelector('.faq-q');
    var answer = item.querySelector('.faq-a');
    if (!button || !answer) return;

    answer.setAttribute('aria-hidden', 'true');

    button.addEventListener('click', function () {
      var shouldOpen = !item.classList.contains('open');

      items.forEach(function (otherItem) {
        var otherButton = otherItem.querySelector('.faq-q');
        var otherAnswer = otherItem.querySelector('.faq-a');
        otherItem.classList.remove('open');
        if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
        if (otherAnswer) otherAnswer.setAttribute('aria-hidden', 'true');
      });

      if (shouldOpen) {
        item.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
      }
    });
  });

  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (item) {
      item.classList.add('faq-in-view');
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var item = entry.target;
      var index = items.indexOf(item);
      item.style.animationDelay = ((index % 2 === 0) ? index * 60 : index * 60 + 40) + 'ms';
      item.classList.add('faq-in-view');
      observer.unobserve(item);
    });
  }, { threshold: 0.15 });

  items.forEach(function (item) {
    observer.observe(item);
  });
})();

// Pixel-perfect uniform scaling: the design is fixed at 1440px wide.
// Instead of wrapping/reflowing (which breaks exact Figma spacing),
// scale the whole stage down/up to fit the current viewport width,
// preserving every position and gap in exact proportion.
(function(){
  var DESIGN_WIDTH = 1440;
  var DESIGN_HEIGHT = 660;
  var outer = document.querySelector('.ect-hero-outer');
  var scaler = document.getElementById('ectHeroScaler');
  var compactQuery = window.matchMedia('(max-width: 900px)');

  function applyScale(){
    if (compactQuery.matches) {
      /* Mobile & tablet: a uniform scale-to-fit shrinks every element
         (including text and buttons) in lockstep, so on a phone the
         whole hero renders at ~25-30% size and becomes unreadable.
         Below 900px we hand off to the natural, stacked CSS layout
         instead (see career.css "HERO — COMPACT LAYOUT"). */
      scaler.style.transform = 'none';
      outer.style.height = 'auto';
      return;
    }
    var viewportWidth = outer.clientWidth;
    var scale = viewportWidth / DESIGN_WIDTH;
    scaler.style.transform = 'scale(' + scale + ')';
    outer.style.height = (DESIGN_HEIGHT * scale) + 'px';
  }

  applyScale();
  window.addEventListener('resize', applyScale);
  window.addEventListener('orientationchange', applyScale);
})();




(function(){
  document.querySelectorAll('.ect-check svg path').forEach(function(p){
    p.setAttribute('stroke', '#0C3C01');
    p.setAttribute('stroke-width', '1.6');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('fill', 'none');
  });

  document.querySelectorAll('.ect-btn, .ect-btn-m').forEach(function(btn){
    btn.addEventListener('click', function(){
      console.log('View Open Positions clicked');
    });
  });

  // Scale the pixel-exact desktop canvas to fit any viewport width
  var viewport = document.getElementById('ectViewport');
  var stage = document.getElementById('ectStage');
  var DESIGN_W = 1441;
  var DESIGN_H = 820;

  function fitStage(){
    if (getComputedStyle(viewport).display === 'none') return;
    var containerW = viewport.clientWidth;
    var scale = containerW / DESIGN_W;
    stage.style.transform = 'scale(' + scale + ')';
    viewport.style.height = (DESIGN_H * scale) + 'px';
  }

  fitStage();
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);

  function prefersReducedMotionCheck(){
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- Mouse parallax on the aurora layer (depth effect) ----
  var parallax = document.getElementById('ectParallax');
  if (parallax && stage && !prefersReducedMotionCheck()) {
    var targetX = 0, targetY = 0, curX = 0, curY = 0;
    var PARALLAX_STRENGTH = 22; // px of max drift

    stage.addEventListener('mousemove', function(e){
      var rect = stage.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width;   // 0..1
      var ny = (e.clientY - rect.top) / rect.height;   // 0..1
      targetX = (nx - 0.5) * 2 * PARALLAX_STRENGTH;
      targetY = (ny - 0.5) * 2 * PARALLAX_STRENGTH;
    });
    stage.addEventListener('mouseleave', function(){
      targetX = 0; targetY = 0;
    });

    function parallaxTick(){
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      parallax.style.transform = 'translate(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px)';
      requestAnimationFrame(parallaxTick);
    }
    requestAnimationFrame(parallaxTick);
  }

  // ---- 3D tilt micro-interaction on cards ----
  if (!prefersReducedMotionCheck()) {
    document.querySelectorAll('.ect-card-you, .ect-card-expect').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;   // 0..1
        var py = (e.clientY - rect.top) / rect.height;   // 0..1
        var rotateY = (px - 0.5) * 8;   // deg
        var rotateX = (0.5 - py) * 8;   // deg
        card.style.transform =
          'perspective(900px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateY(-4px) translateZ(0)';
        card.style.boxShadow = '0 26px 60px rgba(0,0,0,0.32)';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)';
        card.style.boxShadow = '0 24px 58px rgba(0,0,0,0.28), 0 0 0 3px rgba(216,224,214,0.24)';
      });
    });
  }

  // ---- Button micro-interaction: ripple on click ----
  document.querySelectorAll('.ect-btn, .ect-btn-m').forEach(function(btn){
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e){
      var ripple = document.createElement('span');
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      ripple.style.position = 'absolute';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(12,60,1,0.18)';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform .6s ease, opacity .6s ease';
      ripple.style.pointerEvents = 'none';
      btn.appendChild(ripple);
      requestAnimationFrame(function(){
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '0';
      });
      setTimeout(function(){ ripple.remove(); }, 650);
    });
  });

  // Scroll-reveal for cards (IntersectionObserver, respects reduced motion)
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var revealTargets = document.querySelectorAll('.ect-card-you, .ect-card-expect, .ect-card-m');
    revealTargets.forEach(function(el){
      el.style.opacity = '0';
      el.style.transform = (el.style.transform || '') + ' translateY(24px)';
      el.style.transition = 'opacity .7s ease, transform .7s ease';
    });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = entry.target.style.transform.replace('translateY(24px)', 'translateY(0)');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealTargets.forEach(function(el){ io.observe(el); });
  }
})();

/* ============================================================
   OUR JOURNEY GALLERY - Auto Scroll & Custom Cursor
   ============================================================ */
(function() {
  const gallery = document.getElementById('gallery');
  const track = document.getElementById('galleryTrack');
  const cursor = document.getElementById('cursor');
  if(!gallery || !track) return;

  let scrollPos = 0;
  let isHovered = false;
  let isDragging = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let speed = 1; // Auto-scroll speed
  let setWidth = track.scrollWidth / 2;
  
  // Recalculate on resize
  window.addEventListener('resize', () => {
    setWidth = track.scrollWidth / 2;
  });

  // Auto-scrolling loop
  function tick() {
    if(!isHovered && !isDragging) {
      scrollPos += speed;
      if(scrollPos >= setWidth) {
        scrollPos = 0;
      } else if (scrollPos <= 0) {
        scrollPos = setWidth;
      }
      gallery.scrollLeft = scrollPos;
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Custom Cursor Logic
  if (cursor && window.matchMedia("(pointer: fine)").matches) {
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if(isHovered) {
        // Move the custom cursor to follow the mouse
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        
        // Determine arrow direction
        const rect = gallery.getBoundingClientRect();
        if (mouseX < rect.left + rect.width / 2) {
          cursor.setAttribute('data-dir', 'left');
        } else {
          cursor.setAttribute('data-dir', 'right');
        }
      }
    });

    gallery.addEventListener('mouseenter', () => {
      isHovered = true;
      cursor.classList.add('is-visible');
    });

    gallery.addEventListener('mouseleave', () => {
      isHovered = false;
      isDragging = false;
      cursor.classList.remove('is-visible');
      cursor.classList.remove('is-dragging');
    });

    // Dragging
    gallery.addEventListener('mousedown', (e) => {
      isDragging = true;
      cursor.classList.add('is-dragging');
      
      // Ping ripple effect
      cursor.classList.remove('is-pinging');
      void cursor.offsetWidth; // trigger reflow
      cursor.classList.add('is-pinging');
      
      startX = e.pageX - gallery.offsetLeft;
      scrollLeftStart = gallery.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      if(isHovered) {
        cursor.classList.remove('is-dragging');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if(!isDragging) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      const walk = (x - startX) * 2; // Drag multiplier
      
      scrollPos = scrollLeftStart - walk;
      
      // Handle seamless loop bounds during drag
      if(scrollPos >= setWidth) {
        scrollPos -= setWidth;
        startX = e.pageX - gallery.offsetLeft;
        scrollLeftStart = scrollPos;
      } else if (scrollPos <= 0) {
        scrollPos += setWidth;
        startX = e.pageX - gallery.offsetLeft;
        scrollLeftStart = scrollPos;
      }
      
      gallery.scrollLeft = scrollPos;
    });
  }
})();


(function(){
  var section = document.getElementById('ectGrowth');
  var titleEl = document.getElementById('ectGrowthTitle');

  // split title into word spans for staggered reveal, preserving inner <span> wrapper
  (function splitWords(){
    var normal = [];
    var accent = null;

    Array.prototype.forEach.call(titleEl.childNodes, function(node){
      if(node.nodeType === 3){
        node.textContent.trim().split(' ').forEach(function(w){ if(w) normal.push(w); });
      } else if(node.nodeType === 1 && node.tagName === 'SPAN'){
        accent = node.textContent.trim();
      }
    });

    titleEl.innerHTML = '';
    var delay = 0;
    normal.forEach(function(word){
      var span = document.createElement('span');
      span.className = 'word';
      span.textContent = word + '\u00A0';
      span.style.transitionDelay = delay + 'ms';
      delay += 60;
      titleEl.appendChild(span);
    });
    if(accent){
      var wrap = document.createElement('span');
      accent.split(' ').forEach(function(word, idx, arr){
        var span = document.createElement('span');
        span.className = 'word';
        span.textContent = word + (idx < arr.length - 1 ? '\u00A0' : '');
        span.style.transitionDelay = delay + 'ms';
        delay += 60;
        wrap.appendChild(span);
      });
      titleEl.appendChild(wrap);
    }
  })();

  // scroll reveal
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){
    section.classList.add('ect-growth--in');
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          section.classList.add('ect-growth--in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    io.observe(section);
  } else {
    section.classList.add('ect-growth--in');
  }

  // cursor-tracked glow + 3D tilt + magnetic badge (skip on touch devices)
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var cards = section.querySelectorAll('.ect-level');

  cards.forEach(function(card){
    var badge = card.querySelector('.ect-level__badge');

    if(!isTouch && !reduced){
      card.addEventListener('mousemove', function(e){
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var px = (x / rect.width) * 100;
        var py = (y / rect.height) * 100;
        card.style.setProperty('--mx', px + '%');
        card.style.setProperty('--my', py + '%');

        // 3D tilt relative to center
        var cx = px - 50, cy = py - 50;
        var rotY = (cx / 50) * 7;   // left-right tilt
        var rotX = -(cy / 50) * 7;  // up-down tilt
        card.style.transform = 'translateY(-0.6rem) scale(1.015) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';

        // magnetic badge pull
        if(badge){
          var bx = (cx / 50) * 6;
          var by = (cy / 50) * 6;
          badge.style.transform = 'translate(' + bx + 'px,' + by + 'px) rotate(-3deg) scale(1.05)';
        }
      });

      card.addEventListener('mouseenter', function(){
        card.classList.add('is-hovering');
      });

      card.addEventListener('mouseleave', function(){
        card.classList.remove('is-hovering');
        card.style.transform = '';
        if(badge) badge.style.transform = '';
      });
    }

    // ripple + press feedback on click/tap
    card.addEventListener('pointerdown', function(e){
      var rect = card.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.4;
      var ripple = document.createElement('span');
      ripple.className = 'ect-level__ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      card.appendChild(ripple);
      ripple.addEventListener('animationend', function(){ ripple.remove(); });

      card.classList.add('is-pressed');
      card.style.transform = (card.style.transform || '') + ' scale(0.985)';
      setTimeout(function(){
        card.classList.remove('is-pressed');
        if(!isTouch) card.style.transform = card.style.transform.replace('scale(0.985)', '');
      }, 160);
    });
  });
})();



(function(){
  var section = document.getElementById('ectRoute');
  var titleEl = document.getElementById('ectRouteTitle');

  (function splitWords(){
    var lines = Array.prototype.slice.call(titleEl.querySelectorAll('.ect-route__title-line'));
    titleEl.innerHTML = '';
    var delay = 0;
    lines.forEach(function(line){
      var lineWrap = document.createElement('span');
      lineWrap.className = 'ect-route__title-line';
      var words = line.textContent.trim().split(/\s+/);
      words.forEach(function(word, idx){
        var span = document.createElement('span');
        span.className = 'word';
        span.textContent = word + (idx < words.length - 1 ? '\u00A0' : '');
        span.style.transitionDelay = delay + 'ms';
        delay += 55;
        lineWrap.appendChild(span);
      });
      titleEl.appendChild(lineWrap);
    });
  })();

  section.querySelectorAll('.ect-track__chain').forEach(function(chain, chainIdx){
    var children = chain.children;
    var d = chainIdx * 150 + 750;
    Array.prototype.forEach.call(children, function(el){
      if(el.classList.contains('ect-pill') || el.classList.contains('ect-arrow')){
        el.style.animationDelay = d + 'ms';
        d += 90;
      }
    });
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){
    section.classList.add('ect-route--in');
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          section.classList.add('ect-route--in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    io.observe(section);
  } else {
    section.classList.add('ect-route--in');
  }

  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var tracks = section.querySelectorAll('.ect-track');

  tracks.forEach(function(track){
    if(!isTouch && !reduced){
      track.addEventListener('mousemove', function(e){
        var rect = track.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var px = (x / rect.width) * 100;
        var py = (y / rect.height) * 100;
        track.style.setProperty('--mx', px + '%');
        track.style.setProperty('--my', py + '%');

        var cx = px - 50, cy = py - 50;
        var rotY = (cx / 50) * 3;
        var rotX = -(cy / 50) * 3;
        track.style.transform = 'translateY(-0.4rem) scale(1.008) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
      });

      track.addEventListener('mouseenter', function(){
        track.classList.add('is-hovering');
      });

      track.addEventListener('mouseleave', function(){
        track.classList.remove('is-hovering');
        track.style.transform = '';
      });
    }

    track.addEventListener('pointerdown', function(e){
      var rect = track.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.3;
      var ripple = document.createElement('span');
      ripple.className = 'ect-track__ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      var cx = (e.clientX !== undefined ? e.clientX : rect.left + rect.width / 2) - rect.left;
      var cy = (e.clientY !== undefined ? e.clientY : rect.top + rect.height / 2) - rect.top;
      ripple.style.left = cx + 'px';
      ripple.style.top = cy + 'px';
      track.appendChild(ripple);
      ripple.addEventListener('animationend', function(){ ripple.remove(); });
    });
  });

  /* signature interaction: click a stage pill to "select" it as your target level.
     The path lights up sequentially from the first stage up to the one clicked,
     like unlocking progress toward that role. Click the same pill again to reset. */
  section.querySelectorAll('.ect-track__chain').forEach(function(chain){
    var pills = Array.prototype.slice.call(chain.querySelectorAll('[data-pill]'));
    var arrows = Array.prototype.slice.call(chain.querySelectorAll('[data-arrow]'));
    var track = chain.closest('.ect-track');
    var icon = track.querySelector('.ect-track__icon');
    var rail = track.querySelector('[data-rail]');
    var activeIndex = -1;

    function burstParticles(originEl){
      var trackRect = track.getBoundingClientRect();
      var elRect = originEl.getBoundingClientRect();
      var ox = elRect.left - trackRect.left + elRect.width / 2;
      var oy = elRect.top - trackRect.top + elRect.height / 2;
      var count = 10;
      for(var i = 0; i < count; i++){
        var particle = document.createElement('span');
        particle.className = 'ect-particle';
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        var dist = 30 + Math.random() * 26;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist;
        particle.style.left = ox + 'px';
        particle.style.top = oy + 'px';
        particle.style.setProperty('--pt', 'translate(' + dx + 'px,' + dy + 'px)');
        particle.style.background = i % 2 === 0 ? '#3f8a34' : '#0C3C01';
        track.appendChild(particle);
        (function(p){
          setTimeout(function(){ p.remove(); }, 750);
        })(particle);
      }
    }

    function applySelection(targetIndex){
      pills.forEach(function(pill){ pill.classList.remove('is-active'); });
      arrows.forEach(function(arrow){ arrow.classList.remove('is-active'); });
      chain.classList.toggle('has-selection', targetIndex > -1);

      if(rail){
        var pct = targetIndex === -1 ? 0 : ((targetIndex + 1) / pills.length) * 100;
        rail.style.width = pct + '%';
      }

      if(targetIndex === -1) return;

      for(var i = 0; i <= targetIndex; i++){
        (function(i){
          var pillDelay = i * 90;
          setTimeout(function(){
            pills[i].classList.add('is-active');
            if(i === targetIndex){
              if(icon){
                icon.classList.remove('is-charged');
                void icon.offsetWidth;
                icon.classList.add('is-charged');
              }
              if(targetIndex === pills.length - 1){
                burstParticles(pills[i]);
              }
            }
          }, pillDelay);
          if(i < targetIndex){
            setTimeout(function(){
              arrows[i].classList.add('is-active');
            }, pillDelay + 60);
          }
        })(i);
      }
    }

    pills.forEach(function(pill, idx){
      pill.addEventListener('click', function(e){
        e.stopPropagation();
        activeIndex = (activeIndex === idx) ? -1 : idx;
        applySelection(activeIndex);
      });
      pill.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          pill.click();
        }
      });
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');

      // magnetic pull toward cursor
      if(!isTouch && !reduced){
        pill.addEventListener('mousemove', function(e){
          var r = pill.getBoundingClientRect();
          var mx = (e.clientX - r.left - r.width / 2) * 0.25;
          var my = (e.clientY - r.top - r.height / 2) * 0.25;
          pill.style.transform = 'translate(' + mx + 'px,' + (my - 2) + 'px) scale(1.04)';
        });
        pill.addEventListener('mouseleave', function(){
          pill.style.transform = '';
        });
      }
    });
  });
})();









(function(){
  // Desktop-only: below 1025px the separate mobile/tablet
  // center-scroll carousel (further down this file) drives
  // .is-active instead, so the two systems don't fight over the
  // same class and cause flickering between cards.
  if (!window.matchMedia('(min-width: 1025px)').matches) return;

  // State machine:
  //  - Idle: showcase cycles 1 -> 2 -> 3 -> 4 -> 5 -> 1 -> ... forever,
  //    one tooltip visible at a time.
  //  - Hover: whichever card the mouse is actually on shows its own
  //    tooltip immediately, and only that one — the showcase pauses.
  //  - Leave: the tooltip closes, and the showcase restarts from card 1
  //    (not from wherever the hovered card was), so it always plays a
  //    full, predictable loop instead of resuming mid-sequence.
  var container = document.querySelector('.ect-hiring__steps');
  var steps = document.querySelectorAll('.ect-hiring__step');
  var current = 0;
  var timer = null;
  var INTERVAL = 2200;

  function showOnly(index){
    steps.forEach(function(s){ s.classList.remove('is-active'); });
    if (index !== null) steps[index].classList.add('is-active');
  }

  function next(){
    showOnly(current);
    current = (current + 1) % steps.length;
  }

  function startAutoplay(){
    clearInterval(timer);
    current = 0;
    next();
    timer = setInterval(next, INTERVAL);
  }

  // Per-card mouseenter only ever shows that one card — it never touches
  // the loop's "restart from card 1" behavior. That belongs solely to the
  // container's mouseleave below, which (unlike a per-card mouseleave)
  // does NOT fire when the mouse moves from one card directly to a
  // neighboring one — only when it leaves the whole row. Putting the
  // restart on each card's own mouseleave caused a real race: moving the
  // mouse straight from card A to card B passes through card B's
  // mouseenter and card A's mouseleave in an order the browser doesn't
  // guarantee, so the loop-restart from A's mouseleave could fire AFTER
  // B's mouseenter and silently steal focus back to a wrong card.
  steps.forEach(function(step){
    step.addEventListener('mouseenter', function(){
      clearInterval(timer);
      showOnly(parseInt(step.getAttribute('data-step'), 10));
    });

    // touch support
    step.addEventListener('touchstart', function(){
      clearInterval(timer);
      showOnly(parseInt(step.getAttribute('data-step'), 10));
    }, {passive:true});
  });

  if (container) {
    container.addEventListener('mouseleave', function(){
      showOnly(null);
      startAutoplay();
    });
  }

  startAutoplay();
})();








/* ============================================================
   WHY JOIN ECT

   Layout and exact Figma geometry are handled entirely
   by HTML + CSS + SVG.

   Keep JavaScript isolated so this section cannot interfere
   with other website sections.
============================================================ */

(function () {
  "use strict";


  const section = document.querySelector(".ect-join");

  if (!section) return;


  const cta = section.querySelector(".ect-join__cta");

  if (!cta) return;


  /*
    No layout manipulation is needed.

    The CTA remains a normal accessible link.
  */

})();






/* ============================================================
   CAREER HERO — SMOOTH SCROLL TO OUR JOURNEY
   Leaves an exact 24px gap below the fixed navbar.
============================================================ */
(function () {
  "use strict";

  var links = document.querySelectorAll("[data-career-smooth-scroll]");
  if (!links.length) return;

  var activeFrame = null;

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var targetSelector = link.getAttribute("href");
      var target = document.querySelector(targetSelector);
      if (!target) return;

      event.preventDefault();

      if (activeFrame !== null) {
        window.cancelAnimationFrame(activeFrame);
        activeFrame = null;
      }

      var navbar = document.querySelector(
        ".nav-wrap, header, nav, .navbar, .site-navbar"
      );
      var navbarHeight = navbar
        ? navbar.getBoundingClientRect().height
        : 64;

      var startPosition = window.scrollY;
      var targetPosition = Math.max(
        0,
        target.getBoundingClientRect().top +
          window.scrollY -
          navbarHeight -
          24
      );
      var distance = targetPosition - startPosition;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, targetPosition);
        window.history.replaceState(null, "", targetSelector);
        return;
      }

      var duration = 2200;
      var startTime = null;

      function easeInOutCubic(progress) {
        return progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      }

      function animateScroll(currentTime) {
        if (startTime === null) startTime = currentTime;

        var elapsedTime = currentTime - startTime;
        var progress = Math.min(elapsedTime / duration, 1);
        var easedProgress = easeInOutCubic(progress);

        window.scrollTo(
          0,
          startPosition + distance * easedProgress
        );

        if (progress < 1) {
          activeFrame = window.requestAnimationFrame(animateScroll);
        } else {
          activeFrame = null;
          window.history.replaceState(null, "", targetSelector);
        }
      }

      activeFrame = window.requestAnimationFrame(animateScroll);
    });
  });
})();









/* ============================================================
   Note: this file used to also contain a duplicate copy of the
   About page's "ECT Scroll Hero" scroll-jack animation engine
   (targeting #track/#heading/#c0..#c4). Those elements don't exist
   anywhere on the career page — it's an about.html-only hero — so
   every animation frame crashed immediately on
   track.getBoundingClientRect() (track was null). Removed; it never
   did anything functional here.
   ============================================================ */

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



/* ============================================================
   MOBILE/TABLET — Hiring Process steps: auto-advance to the next
   card every 3s, centering it in the scroll rail and showing its
   description, in addition to manual swipe. Desktop (>1024px) is
   untouched — the existing hover-driven tooltip behaviour there is
   not modified, and centring is skipped when the rail doesn't
   actually overflow (i.e. on desktop).
============================================================ */
(function () {
  "use strict";

  function init() {
    var container = document.querySelector(".ect-hiring__steps");
    var steps = document.querySelectorAll(".ect-hiring__step");
    if (!container || !steps.length) return;

    // This carousel's own advance()/activate() had no viewport guard,
    // despite the file comment claiming desktop is untouched — so its
    // interval ran on every screen size and silently fought the
    // separate desktop autoplay above over the same .is-active class,
    // which is why a card's tooltip would randomly change on its own
    // even while nothing else was happening.
    if (window.matchMedia("(min-width: 1025px)").matches) return;

    var mq = window.matchMedia("(max-width: 1024px)");
    var current = 0;
    var timer = null;
    var paused = false;
    var isAutoScrolling = false;
    var autoScrollDoneTimer = null;
    var HOLD_MS = 3000;

    function centerStep(step) {
      if (!mq.matches) return;
      var target = step.offsetLeft - (container.clientWidth - step.offsetWidth) / 2;
      isAutoScrolling = true;
      window.clearTimeout(autoScrollDoneTimer);
      container.scrollTo({
        left: Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth)),
        behavior: "smooth"
      });
      // No reliable cross-browser "scroll finished" event for smooth
      // scrollTo, so just assume the animation is done after a beat.
      autoScrollDoneTimer = window.setTimeout(function () {
        isAutoScrolling = false;
      }, 600);
    }

    function activate(index) {
      steps.forEach(function (s) { s.classList.remove("is-active"); });
      steps[index].classList.add("is-active");
      centerStep(steps[index]);
    }

    function advance() {
      if (paused) return;
      activate(current);
      current = (current + 1) % steps.length;
    }

    function start() {
      window.clearInterval(timer);
      advance();
      timer = window.setInterval(advance, HOLD_MS);
    }

    steps.forEach(function (step, index) {
      function activateThis() {
        if (!mq.matches) return;
        paused = true;
        window.clearInterval(timer);
        current = index;
        activate(index);
      }
      function resumeSoon() {
        if (!mq.matches) return;
        window.setTimeout(function () {
          paused = false;
          current = (index + 1) % steps.length;
          start();
        }, HOLD_MS);
      }
      step.addEventListener("touchstart", activateThis, { passive: true });
      step.addEventListener("touchend", resumeSoon, { passive: true });
    });

    container.addEventListener("scroll", function () {
      if (!mq.matches || isAutoScrolling) return;
      paused = true;
      window.clearInterval(timer);
      window.clearTimeout(container._resumeTimer);
      container._resumeTimer = window.setTimeout(function () {
        paused = false;
        start();
      }, HOLD_MS);
    }, { passive: true });

    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
