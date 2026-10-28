(() => {
  "use strict";

  const section = document.querySelector("[data-why]");
  if (!section) return;

  const runway = section.querySelector("[data-why-runway]");
  const scene = section.querySelector("[data-why-scene]");
  const disc = section.querySelector("[data-why-disc]");
  const logo = section.querySelector("[data-why-logo]");
  const content = section.querySelector("[data-why-content]");
  const heading = section.querySelector("[data-why-heading]");
  const line1 = section.querySelector("[data-why-line1]");
  const line2 = section.querySelector("[data-why-line2]");
  const lead = section.querySelector("[data-why-lead]");
  const introCta = section.querySelector("[data-why-intro-cta]");
  const controls = section.querySelector("[data-why-controls]");
  const track = section.querySelector("[data-why-track]");
  const highlight = section.querySelector("[data-why-highlight]");
  const cards = Array.from(section.querySelectorAll("[data-why-card]"));
  const prevButton = section.querySelector("[data-why-prev]");
  const nextButton = section.querySelector("[data-why-next]");

  const sceneQuery = window.matchMedia("(min-width: 1200px) and (prefers-reduced-motion: no-preference)");

  // The scene is five states. One scroll swipe moves one state; the page glides there.
  //   1  the round logo has dropped from the navbar (it falls while the stage slides in)
  //   2  the logo grew into a big circle and hid; the intro and its button are showing
  //   3  the intro is gone; cards 1, 2 and 3 fill the row
  //   4  card 1 left, card 4 arrived (cards 2, 3, 4)
  //   5  card 2 left, card 5 arrived (cards 3, 4, 5); the next scroll leaves the section
  const FIRST_STATE = 1;
  const LAST_STATE = 5;
  const INTERVALS = LAST_STATE - FIRST_STATE; // 4 scroll intervals, one screen each
  const SLOTS = 3;
  const GAP = 24;
  // Exact Figma card: 466 x 658, picture 323 high. Never resized, only scaled as a whole if the screen is short.
  const CARD_WIDTH = 466;
  const CARD_HEIGHT = 658;
  const MEDIA_HEIGHT = 323;
  // How long each move takes, in ms: 1->2, 2->3, 3->4, 4->5, and the glide into the section.
  const STATE_DURATIONS = [1800, 3000, 1900, 1900];
  const ENTRY_MS = 1300;
  const EXIT_MS = 900;

  // Swipe detection (laptop trackpads keep sending small events for about a second after you lift off).
  const GESTURE_GAP_MS = 140; // a pause this long means a new swipe
  const MIN_BETWEEN_MS = 350; // one swipe can never trigger two moves
  const SPIKE_FACTOR = 2;
  const SPIKE_MIN = 14;

  let active = false;
  let layout = null;
  let hovered = null;
  let highlightPosition = 1;
  let frame = 0;
  let lastTime = 0;
  let tween = 0;
  let tweenTarget = null;
  let armedDown = true;
  let armedUp = false;
  let lastScrollY = window.scrollY;
  let lastWheelTime = 0;
  let lastWheelDir = 0;
  let averageDelta = 0;
  let lastAccepted = 0;
  let currentState = FIRST_STATE;
  let touchStartY = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const segment = (value, start, end) => clamp((value - start) / (end - start), 0, 1);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => {
    const c1 = 1.1;
    return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeSine = (t) => (1 - Math.cos(Math.PI * t)) / 2;

  function navbarLogoCentre() {
    const navLogo = document.querySelector(".ect-navbar-logo");
    if (navLogo) {
      const box = navLogo.getBoundingClientRect();
      if (box.width > 0) return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }
    return { x: window.innerWidth * 0.15, y: 32 };
  }

  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // The cards keep their exact Figma size. Only if the screen is too short is the whole scene scaled.
    const cardHeight = CARD_HEIGHT;
    const scale = Math.min(1, vh / (250 + cardHeight));
    const width = vw / scale;
    const height = vh / scale;
    const left = (width - 1240) / 2;

    // Three cards, 466px wide with 24px gaps, centred on the screen (as in the 1440px Figma frame).
    const step = CARD_WIDTH + GAP;
    const rowLeft = (width - (CARD_WIDTH * SLOTS + GAP * (SLOTS - 1))) / 2;

    content.style.width = `${width}px`;
    content.style.height = `${height}px`;
    content.style.transform = `scale(${scale})`;
    content.style.setProperty("--why-card-w", `${CARD_WIDTH}px`);
    content.style.setProperty("--why-card-h", `${cardHeight}px`);
    content.style.setProperty("--why-media-h", `${MEDIA_HEIGHT}px`);

    const discSize = Math.hypot(vw, vh) * 1.04;
    scene.style.setProperty("--disc-size", `${discSize}px`);

    const line1Width = line1.offsetWidth;
    const line2Width = line2.offsetWidth;
    const leadHeight = lead.offsetHeight;
    const introHeight = 106 + 8 + leadHeight + 16 + 36;
    const introTop = (height - introHeight) / 2;
    const headerTop = Math.max(96, (height - (130 + cardHeight)) / 2);
    const from = navbarLogoCentre();

    layout = {
      vw,
      vh,
      width,
      left,
      step,
      rowLeft,
      discScale: 72 / discSize,
      line2Shift: (line1Width - line2Width) / 2,
      introX: (width - line1Width) / 2,
      introTop,
      headerTop,
      leadX: (width - 967) / 2,
      leadY: introTop + 106 + 8,
      ctaX: (width - 349) / 2,
      ctaY: introTop + 106 + 8 + leadHeight + 16,
      controlsX: left + 1240 - 100,
      controlsY: headerTop + 64,
      cardsTop: headerTop + 130,
      logoFrom: { x: from.x, y: Math.max(from.y, 20) },
    };
  }

  function runwayInfo() {
    const rect = runway.getBoundingClientRect();
    const distance = rect.height - window.innerHeight;
    const progress = distance > 0 ? clamp(-rect.top / distance, 0, 1) : 0;
    // 0 while the stage is still below the screen, 1 once it has slid in and pinned.
    const entry = clamp(1 - rect.top / window.innerHeight, 0, 1);
    return {
      rect,
      distance,
      progress,
      entry,
      state: FIRST_STATE + progress * INTERVALS,
      pinned: rect.top <= 1 && rect.bottom >= window.innerHeight - 1,
    };
  }

  // How far the row has advanced, in whole cards (0 to 2). The move's own easing already shapes it.
  function advance(state) {
    return segment(state, 3, 4) + segment(state, 4, 5);
  }

  // Cards 1, 2 and 3 arrive one at a time, each over about a third of the move.
  function arrival(state, index) {
    if (index >= SLOTS) return 1;
    const c = segment(state, 2, 3);
    return easeSine(segment(c, 0.08 + 0.24 * index, 0.44 + 0.24 * index));
  }

  function render(info) {
    const l = layout;
    if (!l) return;
    const { state, entry } = info;
    const b = segment(state, 1, 2);
    const c = segment(state, 2, 3);

    // State 1: the logo falls out of the navbar while the stage slides up to the top.
    const drop = entry;
    const slide = easeSine(drop);
    const logoX = lerp(l.logoFrom.x, l.vw / 2, slide);
    const logoY = lerp(l.logoFrom.y, l.vh / 2, easeOutBack(drop));
    const logoScale = lerp(0.5, 1, slide) * (1 + 0.7 * segment(state, 1, 1.5));
    const logoOpacity = smooth(segment(entry, 0, 0.1)) * (1 - segment(state, 1.1, 1.5));
    logo.style.opacity = logoOpacity.toFixed(3);
    logo.style.transform = `translate3d(${(logoX - 28).toFixed(2)}px, ${(logoY - 28).toFixed(2)}px, 0) scale(${logoScale.toFixed(3)}) rotate(${((1 - slide) * -200).toFixed(1)}deg)`;

    // State 2: a circle opens behind the logo, grows over the whole section, the logo hides.
    const pop = easeOutBack(segment(entry, 0.88, 1));
    const grow = easeSine(segment(b, 0, 0.7));
    disc.style.transform = `scale(${lerp(l.discScale * pop, 1, grow).toFixed(4)})`;

    const headingIn = smooth(segment(b, 0.45, 0.8));
    const leadIn = smooth(segment(b, 0.55, 0.9));
    const ctaIn = smooth(segment(b, 0.65, 1));
    const introOut = smooth(segment(c, 0, 0.35));
    const move = easeSine(segment(c, 0, 0.6));

    heading.style.opacity = headingIn.toFixed(3);
    heading.style.transform = `translate3d(${lerp(l.introX, l.left, move).toFixed(2)}px, ${lerp(l.introTop + (1 - headingIn) * 28, l.headerTop, move).toFixed(2)}px, 0)`;
    line2.style.transform = `translate3d(${(l.line2Shift * (1 - move)).toFixed(2)}px, 0, 0)`;

    const leadOpacity = leadIn * (1 - introOut);
    lead.style.opacity = leadOpacity.toFixed(3);
    lead.style.transform = `translate3d(${l.leadX}px, ${(l.leadY + (1 - leadIn) * 24 - introOut * 18).toFixed(2)}px, 0)`;
    lead.style.pointerEvents = leadOpacity > 0.5 ? "auto" : "none";

    const ctaOpacity = ctaIn * (1 - introOut);
    introCta.style.opacity = ctaOpacity.toFixed(3);
    introCta.style.transform = `translate3d(${l.ctaX}px, ${(l.ctaY + (1 - ctaIn) * 24 - introOut * 18).toFixed(2)}px, 0)`;
    introCta.style.pointerEvents = ctaOpacity > 0.5 ? "auto" : "none";

    const controlsIn = smooth(segment(c, 0.55, 0.9));
    controls.style.opacity = controlsIn.toFixed(3);
    controls.style.pointerEvents = controlsIn > 0.5 ? "auto" : "none";
    controls.style.transform = `translate3d(${l.controlsX}px, ${(l.controlsY + (1 - controlsIn) * 12).toFixed(2)}px, 0)`;

    // States 3-5: cards 1, 2, 3 arrive from the right edge one after another; then the row advances.
    const shifted = advance(state);
    track.style.transform = `translate3d(${(l.rowLeft - shifted * l.step).toFixed(2)}px, ${l.cardsTop.toFixed(2)}px, 0)`;

    const arrived = cards.map((card, index) => arrival(state, index));
    const middle = Math.round(clamp(highlightPosition, 0, cards.length - 1));
    const highlightOpacity = smooth(clamp((arrived[middle] - 0.9) / 0.1, 0, 1));
    highlight.style.opacity = highlightOpacity.toFixed(3);
    highlight.style.transform = `translate3d(${(highlightPosition * l.step).toFixed(2)}px, 0, 0)`;

    cards.forEach((card, index) => {
      const cardArrival = arrived[index];
      const weight = smooth(clamp(1 - Math.abs(highlightPosition - index), 0, 1));
      const on = weight * highlightOpacity;
      const fromRight = index < SLOTS ? (1 - cardArrival) * (l.width + 40 - (l.rowLeft + index * l.step)) : 0;
      card.style.setProperty("--on", on.toFixed(3));
      // The text flips to white decisively, so it is never grey on grey mid-move.
      card.style.setProperty("--ink", smooth(clamp((on - 0.4) / 0.25, 0, 1)).toFixed(3));
      // Cards 4 and 5 only appear as the row advances; cards 1 and 2 fade out as they leave.
      const comesIn = index >= SLOTS ? smooth(segment(shifted, index - SLOTS, index - SLOTS + 0.5)) : 1;
      const goesOut = index < cards.length - SLOTS ? 1 - smooth(segment(shifted, index + 0.5, index + 1)) : 1;
      const visible = smooth(clamp(cardArrival / 0.25, 0, 1)) * comesIn * goesOut;
      card.style.opacity = visible.toFixed(3);
      card.style.transform = `translate3d(${fromRight.toFixed(2)}px, 0, 0) scale(${(0.95 + 0.05 * cardArrival).toFixed(4)})`;
      card.style.pointerEvents = visible > 0.8 ? "auto" : "none";
    });

    currentState = clamp(Math.round(state), FIRST_STATE, LAST_STATE);
    prevButton.disabled = currentState <= 3;
    nextButton.disabled = currentState >= LAST_STATE;
  }

  function highlightTarget(state) {
    return hovered !== null ? hovered : advance(state) + 1;
  }

  // Runs while the green panel is still gliding, and once per scroll render.
  function tick(time) {
    const elapsed = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    const info = runwayInfo();
    const goal = highlightTarget(info.state);
    highlightPosition += (goal - highlightPosition) * (1 - Math.exp(-elapsed * 6));
    if (Math.abs(goal - highlightPosition) < 0.001) highlightPosition = goal;

    render(info);
    frame = highlightPosition === goal ? 0 : window.requestAnimationFrame(tick);
  }

  function requestRender() {
    if (!frame) {
      lastTime = performance.now();
      frame = window.requestAnimationFrame(tick);
    }
  }

  // Glides the page to a scroll position. `kind` is only used to tell entry glides from step moves.
  function glideTo(endY, duration, easing, kind, targetState) {
    const startY = window.scrollY;
    if (Math.abs(endY - startY) < 1) return;
    window.cancelAnimationFrame(tween);
    tweenTarget = targetState;
    const startTime = performance.now();
    const run = (now) => {
      const t = clamp((now - startTime) / duration, 0, 1);
      window.scrollTo({ top: startY + (endY - startY) * easing(t), behavior: "instant" });
      if (t < 1) {
        tween = window.requestAnimationFrame(run);
      } else {
        tween = 0;
        tweenTarget = null;
      }
    };
    tween = window.requestAnimationFrame(run);
    glideKind = kind;
  }
  let glideKind = "";

  // Moves to a state (1-5). If another move is already playing, this one takes over from where the page is.
  function goToState(state, interrupted) {
    const info = runwayInfo();
    const target = clamp(state, FIRST_STATE, LAST_STATE);
    const endY = window.scrollY + info.rect.top + ((target - FIRST_STATE) / INTERVALS) * info.distance;
    const from = info.pinned || info.rect.top < 0 ? info.state : FIRST_STATE;
    const low = Math.min(from, target);
    const high = Math.max(from, target);
    let duration = 0;
    for (let k = 0; k < STATE_DURATIONS.length; k += 1) {
      duration += Math.max(0, Math.min(high, FIRST_STATE + k + 1) - Math.max(low, FIRST_STATE + k)) * STATE_DURATIONS[k];
    }
    duration = Math.max(700, interrupted ? duration * 0.8 : duration);
    glideTo(endY, duration, interrupted ? easeOut : easeInOut, "step", target);
  }

  // The state a swipe should lead to, counting a move that is still playing.
  function requestedState(down) {
    const base = tweenTarget !== null ? tweenTarget : (down ? Math.floor(runwayInfo().state + 0.001) : Math.ceil(runwayInfo().state - 0.001));
    const next = tweenTarget !== null ? base + (down ? 1 : -1) : base + (down ? 1 : -1);
    return clamp(next, FIRST_STATE, LAST_STATE);
  }

  function canIntercept(down) {
    const { progress, pinned } = runwayInfo();
    if (!pinned) return false;
    if (down && progress >= 0.9999) return false; // last state: let the page carry on
    if (!down && progress <= 0.0001) return false; // first state: let the page go back up
    return true;
  }

  // Is this wheel event the start of a new swipe, rather than the coasting tail of the last one?
  function isNewSwipe(event, now) {
    const delta = Math.abs(event.deltaY);
    const dir = event.deltaY > 0 ? 1 : -1;
    const gap = now - lastWheelTime;
    const spike = delta >= SPIKE_MIN && delta > averageDelta * SPIKE_FACTOR + 10;
    const fresh = gap >= GESTURE_GAP_MS || dir !== lastWheelDir || spike;
    lastWheelTime = now;
    lastWheelDir = dir;
    averageDelta = fresh ? delta : averageDelta * 0.5 + delta * 0.5;
    return fresh;
  }

  function onWheel(event) {
    if (!active || event.ctrlKey || event.deltaY === 0) return;
    const down = event.deltaY > 0;
    const info = runwayInfo();
    const inZone = info.rect.top < window.innerHeight && info.rect.bottom > 0;
    const playing = tween !== 0 && inZone;
    if (!canIntercept(down) && !playing) return;
    event.preventDefault();

    const now = performance.now();
    if (!isNewSwipe(event, now)) return;
    if (now - lastAccepted < MIN_BETWEEN_MS) return;
    if (glideKind === "entry" && tween !== 0) return; // let the logo finish dropping first

    lastAccepted = now;
    const target = requestedState(down);
    if (target === (tweenTarget !== null ? tweenTarget : Math.round(info.state))) return;
    goToState(target, tween !== 0);
  }

  function onKey(event) {
    if (!active || event.repeat) return;
    const tag = (event.target && event.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || event.target.isContentEditable) return;
    const down = ["ArrowDown", "PageDown", " "].includes(event.key) && !event.shiftKey;
    const up = ["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey);
    if (!down && !up) return;
    const playing = tween !== 0;
    if (!canIntercept(down) && !playing) return;
    event.preventDefault();
    if (glideKind === "entry" && tween !== 0) return;
    goToState(requestedState(down), playing);
  }

  function onTouchStart(event) {
    touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
  }

  function onTouchMove(event) {
    if (!active || touchStartY === null) return;
    const dy = touchStartY - event.touches[0].clientY;
    const down = dy > 0;
    if (!canIntercept(down) && tween === 0) return;
    event.preventDefault();
    if (Math.abs(dy) < 40 || (glideKind === "entry" && tween !== 0)) return;
    touchStartY = null;
    goToState(requestedState(down), tween !== 0);
  }

  function onScroll() {
    if (!active) return;
    const y = window.scrollY;
    const movingDown = y > lastScrollY;
    const movingUp = y < lastScrollY;
    lastScrollY = y;

    const info = runwayInfo();
    const vh = window.innerHeight;
    if (info.rect.top >= vh * 0.98) armedDown = true;
    if (info.pinned) armedUp = true;

    // Magnetic entry: as soon as the section starts to appear, glide into place while the logo falls.
    if (armedDown && tween === 0 && movingDown && info.rect.top < vh * 0.85 && info.rect.top > 2) {
      armedDown = false;
      glideTo(y + info.rect.top, ENTRY_MS, easeInOut, "entry", FIRST_STATE);
    }
    // Magnetic exit upwards: leaving the first state glides straight back out to the Tools section.
    if (armedUp && tween === 0 && movingUp && info.rect.top > 2 && info.rect.top < vh * 0.98) {
      armedUp = false;
      glideTo(y + info.rect.top - vh, EXIT_MS, easeInOut, "exit", null);
    }
    requestRender();
  }

  function clearInlineStyles() {
    [disc, logo, heading, line2, lead, introCta, controls, track, highlight, content].forEach((element) => {
      element.removeAttribute("style");
    });
    cards.forEach((card) => {
      card.removeAttribute("style");
    });
    scene.style.removeProperty("--disc-size");
  }

  // Simple mode (tablet, mobile, reduced motion): colour the card nearest the middle.
  function updateSimpleHighlight() {
    if (active) return;
    const rect = track.getBoundingClientRect();
    const centre = rect.left + rect.width / 2;
    let nearest = 0;
    let nearestDistance = Infinity;
    cards.forEach((card, index) => {
      const box = card.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - centre);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    cards.forEach((card, index) => {
      card.style.setProperty("--on", index === nearest ? "1" : "0");
    });
  }

  function enable() {
    if (active) return;
    active = true;
    section.dataset.mode = "scene";
    cards.forEach((card) => card.style.removeProperty("--on"));
    // Decode every card picture now, so none flashes grey when its card arrives.
    section.querySelectorAll(".ect-why__media img").forEach((image) => {
      if (image.decode) image.decode().catch(() => {});
    });
    measure();
    const info = runwayInfo();
    armedDown = info.rect.top > window.innerHeight * 0.85;
    armedUp = info.pinned;
    highlightPosition = highlightTarget(info.state);
    render(info);
  }

  function disable() {
    if (!active && !section.dataset.mode) return;
    active = false;
    delete section.dataset.mode;
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(tween);
    frame = 0;
    tween = 0;
    tweenTarget = null;
    hovered = null;
    clearInlineStyles();
    updateSimpleHighlight();
  }

  function sync() {
    if (sceneQuery.matches) enable();
    else disable();
  }

  // Only one card is green at a time: the middle one, or the one under the cursor.
  cards.forEach((card, index) => {
    card.addEventListener("pointerenter", (event) => {
      if (!active || event.pointerType !== "mouse") return;
      hovered = index;
      requestRender();
    });
    card.addEventListener("pointerleave", (event) => {
      if (!active || event.pointerType !== "mouse") return;
      hovered = null;
      requestRender();
    });
    card.addEventListener("focusin", () => {
      if (!active) return;
      hovered = index;
      requestRender();
    });
    card.addEventListener("focusout", () => {
      if (!active) return;
      hovered = null;
      requestRender();
    });
  });

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("resize", () => {
    if (!active) return;
    measure();
    render(runwayInfo());
  });

  track.addEventListener("scroll", updateSimpleHighlight, { passive: true });
  nextButton.addEventListener("click", () => goToState(clamp(currentState + 1, 3, LAST_STATE), tween !== 0));
  prevButton.addEventListener("click", () => goToState(clamp(currentState - 1, 3, LAST_STATE), tween !== 0));
  sceneQuery.addEventListener("change", sync);

  sync();
  updateSimpleHighlight();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!active) return;
      measure();
      render(runwayInfo());
    });
  }
})();
