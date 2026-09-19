// // /* ============================================================
// //    ECT HERO — ripple.js  (WebGL water ripple cursor effect)
// //    ------------------------------------------------------------
// //    • Auto-attaches to every <section data-ect-hero>
// //    • Injects a <canvas class="ect-ripple"> just above the video
// //    • Moving the cursor (or touch) drops ripples that spread,
// //      reflect and fade — the background (video OR fallback
// //      color) is refracted like real water
// //    • Content (heading, search, cards) stays crisp on top
// //    • Graceful: if WebGL/float-textures are unavailable, or the
// //      user prefers reduced motion, the effect simply doesn't run
// //    ------------------------------------------------------------
// //    Include AFTER the hero markup:
// //      <script src="ripple.js" defer></script>
// //    ============================================================ */

// // (function () {
// //   "use strict";

// //   var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// //   if (reduceMotion.matches) return;

// //   /* ---------- Tunables ---------- */
// //   var SIM_SCALE   = 0.5;   // simulation resolution (0.5 = half res, fast)
// //   var DROP_RADIUS = 0.03;  // ripple size relative to canvas
// //   var DROP_POWER  = 0.05;  // ripple strength per pointer move
// //   var DAMPING     = 0.986; // how quickly waves calm (closer to 1 = longer)
// //   var REFRACTION  = 0.06;  // how much waves bend the background

// //   /* ---------- Shaders ---------- */
// //   var VERT = [
// //     "attribute vec2 p;",
// //     "varying vec2 uv;",
// //     "void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }"
// //   ].join("\n");

// //   /* Wave propagation: classic 2-buffer height-field water */
// //   var FRAG_SIM = [
// //     "precision highp float;",
// //     "varying vec2 uv;",
// //     "uniform sampler2D uPrev;",   // t-1
// //     "uniform sampler2D uCurr;",   // t
// //     "uniform vec2 uTexel;",
// //     "uniform vec2 uDrop;",        // drop position (uv), x<0 = none
// //     "uniform float uDropRadius;",
// //     "uniform float uDropPower;",
// //     "uniform float uDamping;",
// //     "void main(){",
// //     "  float n = texture2D(uCurr, uv + vec2(0.0,  uTexel.y)).r;",
// //     "  float s = texture2D(uCurr, uv - vec2(0.0,  uTexel.y)).r;",
// //     "  float e = texture2D(uCurr, uv + vec2(uTexel.x, 0.0)).r;",
// //     "  float w = texture2D(uCurr, uv - vec2(uTexel.x, 0.0)).r;",
// //     "  float prev = texture2D(uPrev, uv).r;",
// //     "  float h = (n + s + e + w) * 0.5 - prev;",
// //     "  h *= uDamping;",
// //     "  if (uDrop.x >= 0.0) {",
// //     "    float d = distance(uv, uDrop);",
// //     "    h += uDropPower * max(0.0, 1.0 - d / uDropRadius);",
// //     "  }",
// //     "  gl_FragColor = vec4(h, 0.0, 0.0, 1.0);",
// //     "}"
// //   ].join("\n");

// //   /* Render: refract the background through the height field */
// //   var FRAG_DRAW = [
// //     "precision highp float;",
// //     "varying vec2 uv;",
// //     "uniform sampler2D uWater;",
// //     "uniform sampler2D uBg;",
// //     "uniform vec2 uTexel;",
// //     "uniform float uRefraction;",
// //     "uniform int uHasBg;",
// //     "uniform vec3 uColor;",
// //     "void main(){",
// //     "  float hx = texture2D(uWater, uv + vec2(uTexel.x, 0.0)).r",
// //     "           - texture2D(uWater, uv - vec2(uTexel.x, 0.0)).r;",
// //     "  float hy = texture2D(uWater, uv + vec2(0.0, uTexel.y)).r",
// //     "           - texture2D(uWater, uv - vec2(0.0, uTexel.y)).r;",
// //     "  vec2 offset = vec2(hx, hy) * uRefraction;",
// //     "  vec3 base;",
// //     "  if (uHasBg == 1) {",
// //     "    base = texture2D(uBg, vec2(uv.x, 1.0 - uv.y) + offset).rgb;",
// //     "  } else {",
// //     "    base = uColor;",
// //     "  }",
// //     "  float spec = clamp((hx + hy) * 4.0, -0.25, 0.35);", // light glint
// //     "  gl_FragColor = vec4(base + spec, 1.0);",
// //     "}"
// //   ].join("\n");

// //   /* ---------- Tiny WebGL helpers ---------- */
// //   function makeShader(gl, type, src) {
// //     var s = gl.createShader(type);
// //     gl.shaderSource(s, src);
// //     gl.compileShader(s);
// //     return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
// //   }

// //   function makeProgram(gl, fragSrc) {
// //     var v = makeShader(gl, gl.VERTEX_SHADER, VERT);
// //     var f = makeShader(gl, gl.FRAGMENT_SHADER, fragSrc);
// //     if (!v || !f) return null;
// //     var p = gl.createProgram();
// //     gl.attachShader(p, v);
// //     gl.attachShader(p, f);
// //     gl.linkProgram(p);
// //     return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
// //   }

// //   function makeSimTexture(gl, w, h, type) {
// //     var t = gl.createTexture();
// //     gl.bindTexture(gl.TEXTURE_2D, t);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
// //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);
// //     return t;
// //   }

// //   /* ---------- Per-hero setup ---------- */
// //   function initRipple(hero) {
// //     var video = hero.querySelector(".ect-hero__video");

// //     /* Canvas layer: above video (z -1), below content */
// //     var canvas = document.createElement("canvas");
// //     canvas.className = "ect-ripple";
// //     canvas.setAttribute("aria-hidden", "true");
// //     canvas.style.cssText =
// //       "position:absolute;inset:0;width:100%;height:100%;" +
// //       "z-index:0;pointer-events:none;";
// //     hero.insertBefore(canvas, hero.firstChild.nextSibling);

// //     /* Content must sit above the canvas */
// //     Array.prototype.forEach.call(hero.children, function (child) {
// //       if (child !== canvas && child !== video) {
// //         child.style.position = "relative";
// //         child.style.zIndex = "1";
// //       }
// //     });

// //     var gl = canvas.getContext("webgl", {
// //       alpha: false,
// //       antialias: false,
// //       preserveDrawingBuffer: false
// //     });
// //     if (!gl) return;

// //     /* Float textures needed for the height field */
// //     var floatExt = gl.getExtension("OES_texture_float");
// //     var texType = floatExt ? gl.FLOAT : null;
// //     if (texType && !floatExt) return;
// //     if (!texType) {
// //       var halfExt = gl.getExtension("OES_texture_half_float");
// //       if (!halfExt) return;
// //       texType = halfExt.HALF_FLOAT_OES;
// //     }

// //     var progSim = makeProgram(gl, FRAG_SIM);
// //     var progDraw = makeProgram(gl, FRAG_DRAW);
// //     if (!progSim || !progDraw) return;

// //     /* Fullscreen quad */
// //     var quad = gl.createBuffer();
// //     gl.bindBuffer(gl.ARRAY_BUFFER, quad);
// //     gl.bufferData(
// //       gl.ARRAY_BUFFER,
// //       new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
// //       gl.STATIC_DRAW
// //     );

// //     function bindQuad(prog) {
// //       var loc = gl.getAttribLocation(prog, "p");
// //       gl.bindBuffer(gl.ARRAY_BUFFER, quad);
// //       gl.enableVertexAttribArray(loc);
// //       gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
// //     }

// //     /* Simulation state (3 rotating textures + framebuffer) */
// //     var simW = 0, simH = 0;
// //     var texA, texB, texC, fbo = gl.createFramebuffer();
// //     var bgTex = gl.createTexture();

// //     /* Fallback color = --ect-bg token */
// //     var bgColor = [0.957, 0.957, 0.945]; // #f4f4f1
// //     var cs = getComputedStyle(hero).getPropertyValue("--ect-bg").trim();
// //     var m = /^#([0-9a-f]{6})$/i.exec(cs);
// //     if (m) {
// //       bgColor = [
// //         parseInt(m[1].slice(0, 2), 16) / 255,
// //         parseInt(m[1].slice(2, 4), 16) / 255,
// //         parseInt(m[1].slice(4, 6), 16) / 255
// //       ];
// //     }

// //     gl.bindTexture(gl.TEXTURE_2D, bgTex);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// //     function resize() {
// //       var dpr = Math.min(window.devicePixelRatio || 1, 2);
// //       canvas.width = Math.round(hero.clientWidth * dpr);
// //       canvas.height = Math.round(hero.clientHeight * dpr);
// //       simW = Math.max(2, Math.round(canvas.width * SIM_SCALE));
// //       simH = Math.max(2, Math.round(canvas.height * SIM_SCALE));
// //       texA = makeSimTexture(gl, simW, simH, texType);
// //       texB = makeSimTexture(gl, simW, simH, texType);
// //       texC = makeSimTexture(gl, simW, simH, texType);
// //     }
// //     resize();

// //     /* Pointer → drops (listen on the hero, canvas is pass-through) */
// //     var drop = { x: -1, y: -1 };
// //     var lastMove = 0;

// //     function pointerDrop(clientX, clientY, force) {
// //       var now = performance.now();
// //       if (!force && now - lastMove < 16) return; // ~60/s max
// //       lastMove = now;
// //       var r = hero.getBoundingClientRect();
// //       drop.x = (clientX - r.left) / r.width;
// //       drop.y = 1.0 - (clientY - r.top) / r.height;
// //     }

// //     hero.addEventListener("pointermove", function (e) {
// //       pointerDrop(e.clientX, e.clientY, false);
// //     });
// //     hero.addEventListener("pointerdown", function (e) {
// //       pointerDrop(e.clientX, e.clientY, true);
// //     });

// //     /* Uniform locations */
// //     var uS = {
// //       prev: gl.getUniformLocation(progSim, "uPrev"),
// //       curr: gl.getUniformLocation(progSim, "uCurr"),
// //       texel: gl.getUniformLocation(progSim, "uTexel"),
// //       drop: gl.getUniformLocation(progSim, "uDrop"),
// //       dropRadius: gl.getUniformLocation(progSim, "uDropRadius"),
// //       dropPower: gl.getUniformLocation(progSim, "uDropPower"),
// //       damping: gl.getUniformLocation(progSim, "uDamping")
// //     };
// //     var uD = {
// //       water: gl.getUniformLocation(progDraw, "uWater"),
// //       bg: gl.getUniformLocation(progDraw, "uBg"),
// //       texel: gl.getUniformLocation(progDraw, "uTexel"),
// //       refraction: gl.getUniformLocation(progDraw, "uRefraction"),
// //       hasBg: gl.getUniformLocation(progDraw, "uHasBg"),
// //       color: gl.getUniformLocation(progDraw, "uColor")
// //     };

// //     var running = true;

// //     function frame() {
// //       if (!running) return;

// //       /* --- 1. simulate: (A=prev, B=curr) → C --- */
// //       gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
// //       gl.framebufferTexture2D(
// //         gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texC, 0
// //       );
// //       gl.viewport(0, 0, simW, simH);
// //       gl.useProgram(progSim);
// //       bindQuad(progSim);

// //       gl.activeTexture(gl.TEXTURE0);
// //       gl.bindTexture(gl.TEXTURE_2D, texA);
// //       gl.uniform1i(uS.prev, 0);
// //       gl.activeTexture(gl.TEXTURE1);
// //       gl.bindTexture(gl.TEXTURE_2D, texB);
// //       gl.uniform1i(uS.curr, 1);
// //       gl.uniform2f(uS.texel, 1 / simW, 1 / simH);
// //       gl.uniform2f(uS.drop, drop.x, drop.y);
// //       gl.uniform1f(uS.dropRadius, DROP_RADIUS);
// //       gl.uniform1f(uS.dropPower, DROP_POWER);
// //       gl.uniform1f(uS.damping, DAMPING);
// //       gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
// //       drop.x = -1; drop.y = -1; // consume the drop

// //       /* rotate: A ← B, B ← C, C ← A */
// //       var tmp = texA; texA = texB; texB = texC; texC = tmp;

// //       /* --- 2. upload video frame as background texture --- */
// //       var hasBg = 0;
// //       if (video && video.readyState >= 2 && video.videoWidth > 0) {
// //         gl.activeTexture(gl.TEXTURE2);
// //         gl.bindTexture(gl.TEXTURE_2D, bgTex);
// //         try {
// //           gl.texImage2D(
// //             gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video
// //           );
// //           hasBg = 1;
// //         } catch (e) { hasBg = 0; } // cross-origin video without CORS
// //       }

// //       /* --- 3. draw refracted background to screen --- */
// //       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
// //       gl.viewport(0, 0, canvas.width, canvas.height);
// //       gl.useProgram(progDraw);
// //       bindQuad(progDraw);

// //       gl.activeTexture(gl.TEXTURE0);
// //       gl.bindTexture(gl.TEXTURE_2D, texB);
// //       gl.uniform1i(uD.water, 0);
// //       gl.activeTexture(gl.TEXTURE2);
// //       gl.bindTexture(gl.TEXTURE_2D, bgTex);
// //       gl.uniform1i(uD.bg, 2);
// //       gl.uniform2f(uD.texel, 1 / simW, 1 / simH);
// //       gl.uniform1f(uD.refraction, REFRACTION);
// //       gl.uniform1i(uD.hasBg, hasBg);
// //       gl.uniform3f(uD.color, bgColor[0], bgColor[1], bgColor[2]);
// //       gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

// //       requestAnimationFrame(frame);
// //     }

// //     /* Resize (debounced) */
// //     var rt;
// //     window.addEventListener("resize", function () {
// //       clearTimeout(rt);
// //       rt = setTimeout(resize, 150);
// //     });

// //     /* Pause when tab hidden */
// //     document.addEventListener("visibilitychange", function () {
// //       if (document.hidden) { running = false; }
// //       else { running = true; requestAnimationFrame(frame); }
// //     });

// //     requestAnimationFrame(frame);
// //   }

// //   document.querySelectorAll("[data-ect-hero]").forEach(initRipple);
// // })();








// /* ============================================================
//    ECT HERO — ripple.js  (PREMIUM WebGL water ripple)
//    ------------------------------------------------------------
//    Upgrades over the basic version:
//    • VELOCITY TRAIL  — drops are interpolated along the cursor
//      path and scaled by speed, so fast sweeps leave a smooth
//      continuous wake (no dotted gaps)
//    • CLICK SPLASH    — clicking/tapping creates a big soft splash
//    • AMBIENT DROPS   — occasional gentle "raindrops" keep the
//      surface alive even when the cursor is idle
//    • CHROMATIC REFRACTION — R/G/B refract slightly differently
//      at wave edges (subtle prism fringe = premium glass look)
//    • SOFT LIGHTING   — directional specular highlight + shadow
//      computed from the surface normal, not a flat glint
//    ------------------------------------------------------------
//    • Auto-attaches to every <section data-ect-hero>
//    • Works over the video OR the fallback color
//    • Skips gracefully: reduced motion / no WebGL / no floats
//    ============================================================ */

(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    /* ---------- Tunables (feel free to play) ---------- */
    var SIM_SCALE = 0.5;    // simulation resolution factor
    var DAMPING = 0.990;  // wave persistence (closer to 1 = longer)
    var REFRACTION = 0.075;  // background distortion strength
    var CHROMA = 0.35;   // chromatic fringe amount (0 = off)
    var TRAIL_SPACING = 0.012;  // distance between interpolated drops (uv)
    var MOVE_RADIUS = 0.022;  // ripple size while moving
    var MOVE_POWER = 0.028;  // base ripple strength while moving
    var VELOCITY_BOOST = 2.2;    // extra strength from fast movement
    var SPLASH_RADIUS = 0.075;  // click splash size
    var SPLASH_POWER = 0.22;   // click splash strength
    var AMBIENT_EVERY = 2400;   // ms between ambient raindrops
    var AMBIENT_POWER = 0.05;

    /* ---------- Shaders ---------- */
    var VERT =
        "attribute vec2 p; varying vec2 uv;" +
        "void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";

    /* Height-field propagation. Up to 8 drops per frame so a fast
       cursor sweep can inject its whole interpolated trail at once. */
    var FRAG_SIM = [
        "precision highp float;",
        "varying vec2 uv;",
        "uniform sampler2D uPrev;",
        "uniform sampler2D uCurr;",
        "uniform vec2 uTexel;",
        "uniform float uDamping;",
        "uniform int uDropCount;",
        "uniform vec4 uDrops[8];", // xy = pos, z = radius, w = power
        "void main(){",
        "  float n = texture2D(uCurr, uv + vec2(0.0,  uTexel.y)).r;",
        "  float s = texture2D(uCurr, uv - vec2(0.0,  uTexel.y)).r;",
        "  float e = texture2D(uCurr, uv + vec2(uTexel.x, 0.0)).r;",
        "  float w = texture2D(uCurr, uv - vec2(uTexel.x, 0.0)).r;",
        "  float prev = texture2D(uPrev, uv).r;",
        "  float h = (n + s + e + w) * 0.5 - prev;",
        "  h *= uDamping;",
        "  for (int i = 0; i < 8; i++) {",
        "    if (i >= uDropCount) break;",
        "    vec4 d = uDrops[i];",
        "    float dist = distance(uv, d.xy);",
        "    float k = max(0.0, 1.0 - dist / d.z);",
        "    k = k * k * (3.0 - 2.0 * k);", // smoothstep bell = softer drop
        "    h += d.w * k;",
        "  }",
        "  gl_FragColor = vec4(h, 0.0, 0.0, 1.0);",
        "}"
    ].join("\n");

    /* Premium composite: chromatic refraction + directional light */
    var FRAG_DRAW = [
        "precision highp float;",
        "varying vec2 uv;",
        "uniform sampler2D uWater;",
        "uniform sampler2D uBg;",
        "uniform vec2 uTexel;",
        "uniform float uRefraction;",
        "uniform float uChroma;",
        "uniform int uHasBg;",
        "uniform vec3 uColor;",
        "void main(){",
        "  float hx = texture2D(uWater, uv + vec2(uTexel.x, 0.0)).r",
        "           - texture2D(uWater, uv - vec2(uTexel.x, 0.0)).r;",
        "  float hy = texture2D(uWater, uv + vec2(0.0, uTexel.y)).r",
        "           - texture2D(uWater, uv - vec2(0.0, uTexel.y)).r;",
        "  vec2 grad = vec2(hx, hy);",
        "  vec2 off = grad * uRefraction;",
        "  vec3 base;",
        "  if (uHasBg == 1) {",
        "    vec2 buv = vec2(uv.x, 1.0 - uv.y);",
        /*   sample R/G/B with slightly different offsets = prism fringe */
        "    float rr = texture2D(uBg, buv + off * (1.0 + uChroma)).r;",
        "    float gg = texture2D(uBg, buv + off).g;",
        "    float bb = texture2D(uBg, buv + off * (1.0 - uChroma)).b;",
        "    base = vec3(rr, gg, bb);",
        "  } else {",
        /*   flat color: fake the fringe by tinting with the gradient   */
        "    base = uColor;",
        "    base.r += (grad.x + grad.y) * uChroma * 0.6;",
        "    base.b -= (grad.x + grad.y) * uChroma * 0.6;",
        "  }",
        /* directional lighting: light from top-left, like studio softbox */
        "  vec3 normal = normalize(vec3(-grad.x, -grad.y, 0.12));",
        "  vec3 lightDir = normalize(vec3(-0.35, 0.45, 0.82));",
        "  float diff = dot(normal, lightDir);",
        "  float spec = pow(max(0.0, diff), 24.0) * 0.5;",   // crisp highlight
        "  float shade = (diff - 0.68) * 0.22;",             // gentle shadowing
        "  gl_FragColor = vec4(base + spec + shade, 1.0);",
        "}"
    ].join("\n");

    /* ---------- Tiny WebGL helpers ---------- */
    function makeShader(gl, type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }

    function makeProgram(gl, fragSrc) {
        var v = makeShader(gl, gl.VERTEX_SHADER, VERT);
        var f = makeShader(gl, gl.FRAGMENT_SHADER, fragSrc);
        if (!v || !f) return null;
        var p = gl.createProgram();
        gl.attachShader(p, v);
        gl.attachShader(p, f);
        gl.linkProgram(p);
        return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    }

    function makeSimTexture(gl, w, h, type) {
        var t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);
        return t;
    }

    /* ---------- Per-hero setup ---------- */
    function initRipple(hero) {
        var video = hero.querySelector(".ect-hero__video");

        var canvas = document.createElement("canvas");
        canvas.className = "ect-ripple";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText =
            "position:absolute;inset:0;width:100%;height:100%;" +
            "z-index:0;pointer-events:none;";
        hero.insertBefore(canvas, hero.firstChild.nextSibling);

        Array.prototype.forEach.call(hero.children, function (child) {
            if (child !== canvas && child !== video) {
                child.style.position = "relative";
                child.style.zIndex = "1";
            }
        });

        var gl = canvas.getContext("webgl", {
            alpha: false, antialias: false, preserveDrawingBuffer: false
        });
        if (!gl) return;

        var texType = null;
        if (gl.getExtension("OES_texture_float")) texType = gl.FLOAT;
        else {
            var half = gl.getExtension("OES_texture_half_float");
            if (half) texType = half.HALF_FLOAT_OES;
        }
        if (!texType) return;

        var progSim = makeProgram(gl, FRAG_SIM);
        var progDraw = makeProgram(gl, FRAG_DRAW);
        if (!progSim || !progDraw) return;

        var quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        function bindQuad(prog) {
            var loc = gl.getAttribLocation(prog, "p");
            gl.bindBuffer(gl.ARRAY_BUFFER, quad);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        }

        var simW = 0, simH = 0;
        var texA, texB, texC, fbo = gl.createFramebuffer();
        var bgTex = gl.createTexture();

        var bgColor = [0.957, 0.957, 0.945]; // #f4f4f1 fallback
        var cs = getComputedStyle(hero).getPropertyValue("--ect-bg").trim();
        var m = /^#([0-9a-f]{6})$/i.exec(cs);
        if (m) {
            bgColor = [
                parseInt(m[1].slice(0, 2), 16) / 255,
                parseInt(m[1].slice(2, 4), 16) / 255,
                parseInt(m[1].slice(4, 6), 16) / 255
            ];
        }

        gl.bindTexture(gl.TEXTURE_2D, bgTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(hero.clientWidth * dpr);
            canvas.height = Math.round(hero.clientHeight * dpr);
            simW = Math.max(2, Math.round(canvas.width * SIM_SCALE));
            simH = Math.max(2, Math.round(canvas.height * SIM_SCALE));
            texA = makeSimTexture(gl, simW, simH, texType);
            texB = makeSimTexture(gl, simW, simH, texType);
            texC = makeSimTexture(gl, simW, simH, texType);
        }
        resize();

        /* ---------- Drop queue (max 8 consumed per frame) ---------- */
        var queue = []; // each: [x, y, radius, power]

        function pushDrop(x, y, radius, power) {
            if (queue.length < 64) queue.push([x, y, radius, power]);
        }

        /* Pointer trail: interpolate between last & current position,
           scale power by velocity for that "premium wake" feel */
        var last = null;

        function toUV(clientX, clientY) {
            var r = hero.getBoundingClientRect();
            return [
                (clientX - r.left) / r.width,
                1.0 - (clientY - r.top) / r.height
            ];
        }

        hero.addEventListener("pointermove", function (e) {
            var p = toUV(e.clientX, e.clientY);
            if (!last) { last = p; return; }
            var dx = p[0] - last[0], dy = p[1] - last[1];
            var dist = Math.sqrt(dx * dx + dy * dy);
            var speed = Math.min(dist * 30, 1);              // 0..1 velocity
            var power = MOVE_POWER * (0.4 + speed * VELOCITY_BOOST);
            var steps = Math.max(1, Math.floor(dist / TRAIL_SPACING));
            for (var i = 1; i <= steps; i++) {
                var t = i / steps;
                pushDrop(last[0] + dx * t, last[1] + dy * t, MOVE_RADIUS, power);
            }
            last = p;
        });

        hero.addEventListener("pointerleave", function () { last = null; });

        /* Click / tap splash */
        hero.addEventListener("pointerdown", function (e) {
            var p = toUV(e.clientX, e.clientY);
            pushDrop(p[0], p[1], SPLASH_RADIUS, SPLASH_POWER);
            pushDrop(p[0], p[1], SPLASH_RADIUS * 0.45, -SPLASH_POWER * 0.6); // rebound dip
        });

        /* Ambient raindrops — subtle life while idle */
        var ambientTimer = setInterval(function () {
            if (document.hidden) return;
            pushDrop(
                0.1 + Math.random() * 0.8,
                0.1 + Math.random() * 0.8,
                0.015 + Math.random() * 0.02,
                AMBIENT_POWER * (0.5 + Math.random())
            );
        }, AMBIENT_EVERY);

        /* ---------- Uniform locations ---------- */
        var uS = {
            prev: gl.getUniformLocation(progSim, "uPrev"),
            curr: gl.getUniformLocation(progSim, "uCurr"),
            texel: gl.getUniformLocation(progSim, "uTexel"),
            damping: gl.getUniformLocation(progSim, "uDamping"),
            count: gl.getUniformLocation(progSim, "uDropCount"),
            drops: gl.getUniformLocation(progSim, "uDrops")
        };
        var uD = {
            water: gl.getUniformLocation(progDraw, "uWater"),
            bg: gl.getUniformLocation(progDraw, "uBg"),
            texel: gl.getUniformLocation(progDraw, "uTexel"),
            refraction: gl.getUniformLocation(progDraw, "uRefraction"),
            chroma: gl.getUniformLocation(progDraw, "uChroma"),
            hasBg: gl.getUniformLocation(progDraw, "uHasBg"),
            color: gl.getUniformLocation(progDraw, "uColor")
        };

        var dropArray = new Float32Array(8 * 4);
        var running = true;

        function frame() {
            if (!running) return;

            /* --- 1. simulate --- */
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texC, 0);
            gl.viewport(0, 0, simW, simH);
            gl.useProgram(progSim);
            bindQuad(progSim);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texA);
            gl.uniform1i(uS.prev, 0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texB);
            gl.uniform1i(uS.curr, 1);
            gl.uniform2f(uS.texel, 1 / simW, 1 / simH);
            gl.uniform1f(uS.damping, DAMPING);

            var count = Math.min(queue.length, 8);
            for (var i = 0; i < count; i++) {
                var d = queue.shift();
                dropArray[i * 4] = d[0];
                dropArray[i * 4 + 1] = d[1];
                dropArray[i * 4 + 2] = d[2];
                dropArray[i * 4 + 3] = d[3];
            }
            gl.uniform1i(uS.count, count);
            gl.uniform4fv(uS.drops, dropArray);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            var tmp = texA; texA = texB; texB = texC; texC = tmp;

            /* --- 2. video frame → background texture --- */
            var hasBg = 0;
            if (video && video.readyState >= 2 && video.videoWidth > 0) {
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, bgTex);
                try {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                        gl.UNSIGNED_BYTE, video);
                    hasBg = 1;
                } catch (e) { hasBg = 0; }
            }

            /* --- 3. composite --- */
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.useProgram(progDraw);
            bindQuad(progDraw);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texB);
            gl.uniform1i(uD.water, 0);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, bgTex);
            gl.uniform1i(uD.bg, 2);
            gl.uniform2f(uD.texel, 1 / simW, 1 / simH);
            gl.uniform1f(uD.refraction, REFRACTION);
            gl.uniform1f(uD.chroma, CHROMA);
            gl.uniform1i(uD.hasBg, hasBg);
            gl.uniform3f(uD.color, bgColor[0], bgColor[1], bgColor[2]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            requestAnimationFrame(frame);
        }

        var rt;
        window.addEventListener("resize", function () {
            clearTimeout(rt);
            rt = setTimeout(resize, 150);
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) { running = false; }
            else { running = true; requestAnimationFrame(frame); }
        });

        requestAnimationFrame(frame);
    }

    document.querySelectorAll("[data-ect-hero]").forEach(initRipple);
})();

















/* ============================================================
   ECT HERO — ripple.js  (Orbital Particle Field)
   ------------------------------------------------------------
   Spec implementation:
   • 1,200–2,000 tiny particles (auto-scaled to screen size,
     fewer on mobile for 60 FPS)
   • Radial/circular distribution around the hero center
   • Google palette: blue, red, yellow, green, purple
   • Mix of tiny dots (majority) and short rounded dashes
   • Randomized size, opacity, color per particle
   • Slow orbital motion + subtle sine/cosine floating drift
   • Independent fade in/out per particle (infinite loop)
   • Additive blending (globalCompositeOperation = "lighter")
     for a subtle glow
   • Motion blur via alpha trails — done with
     "destination-out" fading so the canvas STAYS TRANSPARENT
     over the hero video/background
   • requestAnimationFrame loop, delta-time based (60 FPS)
   • Auto-resizes with the window; particle objects are
     REUSED on resize (no reallocation, no leaks)
   • Mouse gently repels nearby particles; they spring back
     smoothly to their orbit
   ------------------------------------------------------------
   • Object-oriented: Particle class + ParticleField class
   • Auto-attaches to every <section data-ect-hero>
   • Skips for prefers-reduced-motion, pauses on hidden tab
   ============================================================ */

// (function () {
//     "use strict";

//     var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
//     if (reduceMotion.matches) return;

//     /* ---------------- Tunables ---------------- */
//     var CONFIG = {
//         MIN_PARTICLES: 1200,
//         MAX_PARTICLES: 2000,
//         AREA_PER_PARTICLE: 900,   // px² of hero area per particle
//         INNER_HOLE: 140,          // clear zone radius for hero text (px)
//         DOT_RATIO: 0.8,           // 80% dots, 20% dashes
//         DOT_SIZE: [0.8, 2.2],     // dot radius range (px)
//         DASH_LEN: [4, 8],         // dash length range (px)
//         DASH_W: [1.4, 2.4],       // dash thickness range (px)
//         ORBIT_SPEED: [0.02, 0.07],// rad/s range (slow orbit)
//         FLOAT_AMP: [2, 7],        // sine float amplitude (px)
//         FLOAT_SPEED: [0.3, 0.9],  // sine float speed (rad/s)
//         FADE_SPEED: [0.15, 0.5],  // fade cycle speed (rad/s)
//         BASE_ALPHA: [0.25, 0.8],  // per-particle max opacity range
//         TRAIL_FADE: 0.14,         // alpha-trail strength (0..1/frame)
//         REPEL_RADIUS: 110,        // mouse influence radius (px)
//         REPEL_FORCE: 42,          // max push distance (px)
//         RETURN_EASE: 0.06,        // spring-back smoothness
//         REPEL_EASE: 0.14          // push-out smoothness
//     };

//     /* Google palette (weighted roughly even) */
//     var PALETTE = [
//         "66,133,244",   // Blue   #4285F4
//         "234,67,53",    // Red    #EA4335
//         "251,188,5",    // Yellow #FBBC05
//         "52,168,83",    // Green  #34A853
//         "161,66,244"    // Purple #A142F4
//     ];

//     function rand(min, max) {
//         return min + Math.random() * (max - min);
//     }

//     /* ============================================================
//        Particle — one dot or dash on a slow orbit
//        ============================================================ */
//     function Particle() {
//         /* All properties are (re)assigned in reset(); declared here
//            once so the object shape stays stable (V8-friendly). */
//         this.baseR = 0;      // orbit radius
//         this.angle = 0;      // current orbit angle
//         this.speed = 0;      // orbit speed (rad/s)
//         this.isDash = false;
//         this.size = 0;       // dot radius OR dash length
//         this.width = 0;      // dash thickness
//         this.color = PALETTE[0];
//         this.maxAlpha = 0;
//         this.fadePhase = 0;  // independent fade in/out
//         this.fadeSpeed = 0;
//         this.floatAmpX = 0;  // sine/cosine drift
//         this.floatAmpY = 0;
//         this.floatSpeed = 0;
//         this.floatPhase = 0;
//         this.offX = 0;       // current mouse-repel offset (eased)
//         this.offY = 0;
//     }

//     /* (Re)initialise — used at build AND reuse on resize */
//     Particle.prototype.reset = function (maxRadius) {
//         /* sqrt-distribution → visually even radial density */
//         var t = Math.random();
//         this.baseR = CONFIG.INNER_HOLE +
//             Math.sqrt(t) * (maxRadius - CONFIG.INNER_HOLE);

//         this.angle = Math.random() * Math.PI * 2;
//         this.speed = rand(CONFIG.ORBIT_SPEED[0], CONFIG.ORBIT_SPEED[1]) *
//             (Math.random() < 0.5 ? 1 : -1) *
//             (CONFIG.INNER_HOLE / this.baseR + 0.4); // outer = slower

//         this.isDash = Math.random() > CONFIG.DOT_RATIO;
//         if (this.isDash) {
//             this.size = rand(CONFIG.DASH_LEN[0], CONFIG.DASH_LEN[1]);
//             this.width = rand(CONFIG.DASH_W[0], CONFIG.DASH_W[1]);
//         } else {
//             this.size = rand(CONFIG.DOT_SIZE[0], CONFIG.DOT_SIZE[1]);
//         }

//         this.color = PALETTE[(Math.random() * PALETTE.length) | 0];
//         this.maxAlpha = rand(CONFIG.BASE_ALPHA[0], CONFIG.BASE_ALPHA[1]);
//         this.fadePhase = Math.random() * Math.PI * 2;
//         this.fadeSpeed = rand(CONFIG.FADE_SPEED[0], CONFIG.FADE_SPEED[1]);

//         this.floatAmpX = rand(CONFIG.FLOAT_AMP[0], CONFIG.FLOAT_AMP[1]);
//         this.floatAmpY = rand(CONFIG.FLOAT_AMP[0], CONFIG.FLOAT_AMP[1]);
//         this.floatSpeed = rand(CONFIG.FLOAT_SPEED[0], CONFIG.FLOAT_SPEED[1]);
//         this.floatPhase = Math.random() * Math.PI * 2;

//         this.offX = 0;
//         this.offY = 0;
//     };

//     Particle.prototype.update = function (dt, field) {
//         this.angle += this.speed * dt;
//         this.fadePhase += this.fadeSpeed * dt;
//         this.floatPhase += this.floatSpeed * dt;

//         /* orbit position + sine/cosine float */
//         var ox = field.cx + Math.cos(this.angle) * this.baseR +
//             Math.sin(this.floatPhase) * this.floatAmpX;
//         var oy = field.cy + Math.sin(this.angle) * this.baseR +
//             Math.cos(this.floatPhase * 0.8) * this.floatAmpY;

//         /* mouse repulsion → eased offset, eased return */
//         var tX = 0, tY = 0;
//         if (field.mouseIn) {
//             var dx = ox - field.mx;
//             var dy = oy - field.my;
//             var d2 = dx * dx + dy * dy;
//             var rr = CONFIG.REPEL_RADIUS;
//             if (d2 < rr * rr && d2 > 0.01) {
//                 var d = Math.sqrt(d2);
//                 var push = (1 - d / rr);          // 0..1
//                 push = push * push;               // softer falloff
//                 tX = (dx / d) * CONFIG.REPEL_FORCE * push;
//                 tY = (dy / d) * CONFIG.REPEL_FORCE * push;
//             }
//         }
//         var ease = (tX || tY) ? CONFIG.REPEL_EASE : CONFIG.RETURN_EASE;
//         this.offX += (tX - this.offX) * ease;
//         this.offY += (tY - this.offY) * ease;

//         this.x = ox + this.offX;
//         this.y = oy + this.offY;
//     };

//     Particle.prototype.draw = function (ctx, dpr, W, H) {
//         if (this.x < -12 || this.x > W + 12 ||
//             this.y < -12 || this.y > H + 12) return;

//         /* independent fade in/out (never fully invisible) */
//         var alpha = this.maxAlpha *
//             (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(this.fadePhase)));

//         ctx.strokeStyle = ctx.fillStyle =
//             "rgba(" + this.color + "," + alpha.toFixed(3) + ")";

//         if (this.isDash) {
//             /* rounded dash oriented along its orbit (tangent) */
//             var tangent = this.angle + Math.PI / 2;
//             var hx = Math.cos(tangent) * this.size * 0.5;
//             var hy = Math.sin(tangent) * this.size * 0.5;
//             ctx.beginPath();
//             ctx.moveTo((this.x - hx) * dpr, (this.y - hy) * dpr);
//             ctx.lineTo((this.x + hx) * dpr, (this.y + hy) * dpr);
//             ctx.lineWidth = this.width * dpr;
//             ctx.stroke();
//         } else {
//             ctx.beginPath();
//             ctx.arc(this.x * dpr, this.y * dpr, this.size * dpr, 0, 6.2832);
//             ctx.fill();
//         }
//     };

//     /* ============================================================
//        ParticleField — owns the canvas, pool, and loop
//        ============================================================ */
//     function ParticleField(hero) {
//         this.hero = hero;
//         this.video = hero.querySelector(".ect-hero__video");

//         this.canvas = document.createElement("canvas");
//         this.canvas.className = "ect-ripple";
//         this.canvas.setAttribute("aria-hidden", "true");
//         this.canvas.style.cssText =
//             "position:absolute;inset:0;width:100%;height:100%;" +
//             "z-index:0;pointer-events:none;";
//         hero.insertBefore(this.canvas, hero.firstChild.nextSibling);

//         var self = this;
//         Array.prototype.forEach.call(hero.children, function (child) {
//             if (child !== self.canvas && child !== self.video) {
//                 child.style.position = "relative";
//                 child.style.zIndex = "1";
//             }
//         });

//         this.ctx = this.canvas.getContext("2d");
//         if (!this.ctx) return;

//         this.pool = [];        // reusable Particle objects
//         this.dpr = 1;
//         this.W = 0;
//         this.H = 0;
//         this.cx = 0;
//         this.cy = 0;
//         this.mx = 0;
//         this.my = 0;
//         this.mouseIn = false;
//         this.running = true;
//         this.lastTime = null;

//         this.bindEvents();
//         this.resize();
//         requestAnimationFrame(this.frame.bind(this));
//     }

//     ParticleField.prototype.particleCount = function () {
//         var byArea = (this.W * this.H) / CONFIG.AREA_PER_PARTICLE;
//         /* mobile: smaller screens naturally get fewer via area,
//            and we clamp into the 1200–2000 spec on desktop */
//         var isSmall = this.W < 768;
//         var min = isSmall ? 500 : CONFIG.MIN_PARTICLES;
//         return Math.max(min,
//             Math.min(CONFIG.MAX_PARTICLES, Math.round(byArea)));
//     };

//     ParticleField.prototype.resize = function () {
//         this.dpr = Math.min(window.devicePixelRatio || 1, 2);
//         this.W = this.hero.clientWidth;
//         this.H = this.hero.clientHeight;
//         this.canvas.width = Math.round(this.W * this.dpr);
//         this.canvas.height = Math.round(this.H * this.dpr);
//         this.cx = this.W / 2;
//         this.cy = this.H / 2;

//         var target = this.particleCount();
//         var maxRadius = Math.sqrt(this.W * this.W + this.H * this.H) * 0.55;

//         /* REUSE existing objects; only create the shortfall */
//         var i;
//         for (i = 0; i < this.pool.length && i < target; i++) {
//             this.pool[i].reset(maxRadius);
//         }
//         while (this.pool.length < target) {
//             var p = new Particle();
//             p.reset(maxRadius);
//             this.pool.push(p);
//         }
//         this.pool.length = target; // shrink without realloc churn
//     };

//     ParticleField.prototype.bindEvents = function () {
//         var self = this;
//         var rt;

//         this.hero.addEventListener("pointermove", function (e) {
//             var r = self.hero.getBoundingClientRect();
//             self.mx = e.clientX - r.left;
//             self.my = e.clientY - r.top;
//             self.mouseIn = true;
//         });

//         this.hero.addEventListener("pointerleave", function () {
//             self.mouseIn = false;
//         });

//         window.addEventListener("resize", function () {
//             clearTimeout(rt);
//             rt = setTimeout(function () { self.resize(); }, 150);
//         });

//         document.addEventListener("visibilitychange", function () {
//             if (document.hidden) {
//                 self.running = false;
//                 self.lastTime = null;
//             } else {
//                 self.running = true;
//                 requestAnimationFrame(self.frame.bind(self));
//             }
//         });
//     };

//     ParticleField.prototype.frame = function (now) {
//         if (!this.running) return;
//         if (this.lastTime === null) this.lastTime = now;
//         var dt = Math.min((now - this.lastTime) / 1000, 0.05);
//         this.lastTime = now;

//         var ctx = this.ctx;

//         /* --- motion blur trail, transparency-safe:
//            partially ERASE the previous frame instead of painting
//            over it, so the video/background stays visible --- */
//         ctx.globalCompositeOperation = "destination-out";
//         ctx.fillStyle = "rgba(0,0,0," + CONFIG.TRAIL_FADE + ")";
//         ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

//         /* --- additive glow for the particles --- */
//         ctx.globalCompositeOperation = "lighter";
//         ctx.lineCap = "round";

//         for (var i = 0; i < this.pool.length; i++) {
//             var p = this.pool[i];
//             p.update(dt, this);
//             p.draw(ctx, this.dpr, this.W, this.H);
//         }

//         requestAnimationFrame(this.frame.bind(this));
//     };

//     /* ---------- Auto-attach ---------- */
//     document.querySelectorAll("[data-ect-hero]").forEach(function (hero) {
//         new ParticleField(hero);
//     });
// })();