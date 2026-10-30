(() => {
  "use strict";

  // Closing banner background: a drifting network of nodes and links. Packets travel along the links,
  // nodes near the pointer light up and connect to it, and the neon bands lean toward the pointer.
  const section = document.querySelector("[data-infra-cta]");
  const canvas = section && section.querySelector("[data-infra-cta-net]");
  if (!section || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const LINK = 150;          // max distance for a link between two nodes
  const REACH = 190;         // how far the pointer reaches
  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];
  let packets = [];
  let visible = false;
  let frame = 0;
  // Pointer: tx/ty is where it is (-0.5 .. 0.5), cx/cy eases toward it; mx/my in canvas pixels.
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let mx = -9999;
  let my = -9999;

  function resize() {
    const box = section.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(90, Math.max(28, Math.round((width * height) / 12000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: 1.2 + Math.random() * 1.6,
      hub: Math.random() < 0.12
    }));
    packets = [];
    draw();
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = width + 20;
      if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20;
      if (n.y > height + 20) n.y = -20;

      // The pointer nudges nearby nodes away a little, then they drift back into the flow.
      const dx = n.x - mx;
      const dy = n.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120 && d2 > 1) {
        const d = Math.sqrt(d2);
        const push = (1 - d / 120) * 0.9;
        n.x += (dx / d) * push;
        n.y += (dy / d) * push;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const near = [];

    // Links between nodes.
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        const alpha = (1 - Math.sqrt(d2) / LINK) * 0.55;
        ctx.strokeStyle = `rgba(150, 215, 70, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (packets.length < 14 && Math.random() < 0.0009) packets.push({ a, b, t: 0 });
      }
    }

    // Nodes; the ones near the pointer glow and connect to it.
    for (const n of nodes) {
      const dx = n.x - mx;
      const dy = n.y - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      let lit = 0;
      if (d < REACH) {
        lit = 1 - d / REACH;
        near.push({ n, lit });
      }
      const radius = n.r * (n.hub ? 1.7 : 1) + lit * 1.8;
      ctx.fillStyle = lit > 0
        ? `rgba(215, 255, 90, ${(0.55 + lit * 0.45).toFixed(3)})`
        : n.hub ? "rgba(170, 230, 80, 0.85)" : "rgba(150, 215, 70, 0.7)";
      if (lit > 0.15) {
        ctx.shadowColor = "rgba(190, 245, 60, 0.9)";
        ctx.shadowBlur = 12 * lit;
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const { n, lit } of near) {
      ctx.strokeStyle = `rgba(215, 255, 90, ${(lit * 0.7).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    }

    // Data packets running along links.
    packets = packets.filter((p) => p.t < 1);
    for (const p of packets) {
      p.t += 0.012;
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.fillStyle = "rgba(235, 255, 150, 0.95)";
      ctx.shadowColor = "rgba(210, 255, 80, 1)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    frame = 0;
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    section.style.setProperty("--px", cx.toFixed(4));
    section.style.setProperty("--py", cy.toFixed(4));
    section.style.setProperty("--gx", `${((cx + 0.5) * 100).toFixed(2)}%`);
    section.style.setProperty("--gy", `${((cy + 0.5) * 100).toFixed(2)}%`);
    step();
    draw();
    if (visible) frame = window.requestAnimationFrame(loop);
  }

  function start() {
    if (!frame && visible && !reduce.matches) frame = window.requestAnimationFrame(loop);
  }

  section.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const box = section.getBoundingClientRect();
    mx = event.clientX - box.left;
    my = event.clientY - box.top;
    tx = mx / box.width - 0.5;
    ty = my / box.height - 0.5;
  });

  section.addEventListener("pointerleave", () => {
    mx = -9999;
    my = -9999;
    tx = 0;
    ty = 0;
  });

  window.addEventListener("resize", resize);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(section);
  } else {
    visible = true;
    start();
  }

  resize();
})();
