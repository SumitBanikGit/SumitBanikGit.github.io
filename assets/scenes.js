/* Page scenes for the inner pages.
   Each page header has its own animation, drawn on the header canvas inside the
   stage on the right, in the brass and green palette of the site:
     Research       a tour of the papers, one small animation for each
     Publications   a constellation of the papers, by year and field
     Talks          the talks around the world, one year at a time
     Funding        the fellowships and grants as medals along the years
     Teaching       equations from the courses taught, written on a blackboard
     Supervision    the students and their projects
     CV             the path from Kolkata to Stanford on a timeline
     Contact        a globe turning under SLAC, with messages arriving
   The home page keeps its collider event display, which lives in the page itself. */
(function () {
  'use strict';
  var host = document.querySelector('.hero[data-scene]');
  if (!host || !window.requestAnimationFrame) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2, D2R = Math.PI / 180;
  var RGB = { green: '28,53,47', pine: '46,92,78', brass: '168,137,79', brassD: '122,95,42', slate: '74,90,102',
              crimson: '110,44,52', cream: '238,231,214', paper: '251,248,241', plum: '90,61,85' };
  var SANS = 'Inter, system-ui, sans-serif', SERIF = '"Source Serif 4", Georgia, serif',
      DISPLAY = '"Cormorant Garamond", Georgia, serif';

  /* ---------- small helpers ---------- */
  function ink(c, a) { return 'rgba(' + RGB[c] + ',' + (a <= 0 ? 0 : a >= 1 ? 1 : Math.round(a * 1000) / 1000) + ')'; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp01(x); return 1 - (1 - x) * (1 - x) * (1 - x); }
  function easeInOut(x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2; }
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(TAU * r()); }
  function font(size, family, weight, italic) {
    return (italic ? 'italic ' : '') + (weight || 400) + ' ' + (Math.round(size * 100) / 100) + 'px ' + family;
  }
  function tracking(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
  function caps(ctx, text, x, y, color, size, align) {          // small capitals label
    ctx.font = font(size || 8.5, SANS, 600); tracking(ctx, 1.1);
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(text, x, y);
    tracking(ctx, 0);
  }
  function layer(w, h, dpr) {                         // an offscreen canvas in CSS pixel units
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, ctx: x };
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function edgeFade(ctx, x, y, w, h, fx, fy) {       // fade out towards all four sides of a frame
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fx, '#000'); g.addColorStop(1 - fx, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fy, '#000'); g.addColorStop(1 - fy, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.restore();
  }
  function dot(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function ring(ctx, x, y, r, color, lw) { ctx.strokeStyle = color; ctx.lineWidth = lw || 1; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  function line(ctx, x1, y1, x2, y2, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw || 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  /* ---------- the engine: sizing, clock, pointer, captions ---------- */
  function swapper(el, fallback) {                  // fade a caption or hint from one text to the next
    var shown = el ? el.innerHTML : '', timer = null;
    return function (html) {
      if (!el) return;
      html = html || fallback();
      if (html === shown) return;
      shown = html;
      if (reduce) { el.innerHTML = html; return; }
      el.classList.add('swap');
      clearTimeout(timer);
      timer = setTimeout(function () { el.innerHTML = shown; el.classList.remove('swap'); }, 190);
    };
  }
  function run(scene) {
    var cv = host.querySelector('.field'), stage = host.querySelector('.hero-stage');
    if (!cv || !cv.getContext || !stage) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var meta = stage.querySelector('.scene-meta'), cap = stage.querySelector('.scene-cap'), hint = stage.querySelector('.scene-hint');
    var touch = window.matchMedia('(hover: none)').matches;
    var env = { ctx: ctx, dpr: dpr, stage: stage, data: readData(), t: 0, dt: 0, active: false, reduce: reduce, touch: touch };
    if (touch && hint && scene.touchHint) hint.textContent = scene.touchHint;
    env.defaultCaption = cap ? cap.innerHTML : ''; env.defaultHint = hint ? hint.innerHTML : '';
    env.caption = swapper(cap, function () { return env.defaultCaption; });
    env.hint = swapper(hint, function () { return env.defaultHint; });
    host.sceneEnv = env;
    var raf = null, last = 0, visible = true;
    function size() {
      var r = host.getBoundingClientRect(), s = stage.getBoundingClientRect();
      env.W = r.width; env.H = r.height;
      cv.width = Math.round(env.W * dpr); cv.height = Math.round(env.H * dpr);
      var gap = meta ? meta.offsetHeight + 16 : 0;
      env.x = s.left - r.left; env.y = s.top - r.top; env.w = s.width; env.h = s.height - gap;
      env.active = env.w > 60 && env.h > 60;
      mathCache = {};
      if (env.active && scene.layout) scene.layout(env);
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, env.W, env.H);
      ctx.save(); scene.frame(env, env.t); ctx.restore();
    }
    function tick(now) {
      raf = null;
      if (!env.active || !visible || document.hidden) { last = 0; return; }
      env.dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now; env.t += env.dt;
      draw();
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (!env.active) return;
      if (reduce) { draw(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    env.redraw = start;
    function local(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    function inside(p) { return p.x >= env.x && p.x <= env.x + env.w && p.y >= env.y && p.y <= env.y + env.h + 30; }

    if (scene.init) scene.init(env);
    if (reduce) env.t = scene.still || 0;
    size();
    start();
    var dragged = 0;
    if (scene.click) stage.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('a')) return;          // a link in the caption opens the paper
      if (dragged > 6) { dragged = 0; return; }
      var p = local(ev);
      if (env.active && inside(p)) { scene.click(env, p.x, p.y); start(); }
    });
    if (scene.move) {
      stage.addEventListener('mousemove', function (ev) {
        var p = local(ev);
        scene.move(env, env.active && inside(p) ? p : null);
        if (reduce) draw();
      });
      stage.addEventListener('mouseleave', function () { scene.move(env, null); if (reduce) draw(); });
    }
    if (scene.drag) {
      var grab = null;
      stage.addEventListener('pointerdown', function (ev) {
        if (ev.button) return;
        grab = { x: ev.clientX }; dragged = 0; env.dragging = true;
      });
      window.addEventListener('pointermove', function (ev) {
        if (!grab) return;
        var dx = ev.clientX - grab.x;
        grab.x = ev.clientX; dragged += Math.abs(dx);
        scene.drag(env, dx);
        if (reduce) draw();
      });
      var release = function () { grab = null; env.dragging = false; };
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
    }
    window.addEventListener('resize', function () { size(); start(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(host);
    }
    if (document.fonts && document.fonts.load) {       // lay out again once the web fonts have arrived
      var sample = 'ΓΦγλμνψεπ∂∫∮∞ 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      Promise.all(['500 10px Inter', '600 10px Inter', '700 10px Inter', '400 24px "Source Serif 4"',
                   'italic 400 24px "Source Serif 4"', '700 24px "Source Serif 4"', 'italic 600 14px "Cormorant Garamond"']
        .map(function (f) { return document.fonts.load(f, sample); }))
        .then(function () { size(); start(); }, function () {});
    }
  }
  function readData() {
    var el = host.querySelector('.scene-data');
    try { return el ? JSON.parse(el.textContent) : {}; } catch (err) { return {}; }
  }
  function fadeMap(map, present, dt, rate) {          // smooth appearance and disappearance of keyed items
    var k;
    for (k in present) { if (!map[k]) map[k] = { a: 0 }; map[k].p = present[k]; map[k].on = true; }
    for (k in map) {
      var m = map[k];
      m.a = clamp01(m.a + (m.on ? dt : -dt) / rate);
      if (!m.on && m.a <= 0) delete map[k]; else m.on = false;
    }
  }

  var SCENES = {};

  /* =====================================================================
     A tiny typesetter for mathematics: ^ and _ for scripts, \frac{}{},
     \int, \oint, \bar{}, \rm{}, \bf{}, \to, \cdot, \langle, \rangle,
     \, for a thin space and \quad for a wide one.
     ===================================================================== */
  var mathCache = {};
  function parseTeX(src) {
    var i = 0;
    function arg() {
      if (src[i] === '{') { i++; return seq(); }
      var out = []; one(out); return out;
    }
    function one(out) {
      var c = src[i];
      if (c === '{') { i++; out.push({ k: 'grp', b: seq() }); return; }
      if (c === '^' || c === '_') { i++; out.push({ k: c === '^' ? 'sup' : 'sub', b: arg() }); return; }
      if (c === ' ') { i++; return; }
      if (c === '\\') {
        var m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i)), cmd = m[1];
        i += m[0].length;
        if (cmd === 'frac') { var n = arg(); out.push({ k: 'frac', n: n, d: arg() }); }
        else if (cmd === 'int') out.push({ k: 'big', s: '∫' });
        else if (cmd === 'oint') out.push({ k: 'big', s: '∮' });
        else if (cmd === 'sum') out.push({ k: 'big', s: '∑', sum: 1 });
        else if (cmd === ',') out.push({ k: 'sp', w: 0.18 });
        else if (cmd === 'quad') out.push({ k: 'sp', w: 1 });
        else if (cmd === 'rm') out.push({ k: 'grp', b: arg(), st: 'rm' });
        else if (cmd === 'bf') out.push({ k: 'grp', b: arg(), st: 'bf' });
        else if (cmd === 'bar') out.push({ k: 'bar', b: arg() });
        else if (cmd === 'to') out.push({ k: 'g', s: '→', op: 1 });
        else if (cmd === 'cdot') out.push({ k: 'g', s: '·', op: 1 });
        else if (cmd === 'langle') out.push({ k: 'g', s: '⟨' });
        else if (cmd === 'rangle') out.push({ k: 'g', s: '⟩' });
        else if (cmd === 'cdots') out.push({ k: 'g', s: '⋯' });
        return;
      }
      out.push({ k: 'g', s: c }); i++;
    }
    function seq() {
      var out = [];
      while (i < src.length) { if (src[i] === '}') { i++; return out; } one(out); }
      return out;
    }
    return seq();
  }
  function measure(ctx, s, f, size) {
    ctx.font = f;
    var m = ctx.measureText(s), a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
    if (!(a >= 0)) { a = 0.72 * size; d = 0.22 * size; }
    return { w: m.width, a: a, d: d };
  }
  var ITALIC = /[A-Za-zα-ω]/;
  function typeset(ctx, nodes, S, script, st) {      // glyphs and rules in writing order
    var x = 0, asc = 0.72 * S, desc = 0.24 * S, prims = [], prev = 'start';
    function place(box, dx, dy) {
      box.prims.forEach(function (p) { p.x += dx; p.y += dy; prims.push(p); });
      asc = Math.max(asc, box.asc - dy); desc = Math.max(desc, box.desc + dy);
    }
    for (var n = 0; n < nodes.length; n++) {
      var nd = nodes[n];
      if (nd.k === 'sp') { x += nd.w * S; continue; }
      if (nd.k === 'g' || nd.k === 'big') {
        var big = nd.k === 'big', sz = big ? S * (nd.sum ? 1.45 : 1.85) : S;
        var it = !big && st !== 'rm' && st !== 'bf' && ITALIC.test(nd.s);
        var op = !script && !big && (nd.op || '=+−≠'.indexOf(nd.s) >= 0) && (prev === 'x' || nd.s === '→' || (nd.s === '=' && prev === 'start'));
        var pad = nd.s === '=' || nd.s === '→' || nd.s === '≠' ? 0.3 * S : nd.s === '·' ? 0.14 * S : 0.22 * S;
        if (op) x += pad;
        var f = font(sz, SERIF, st === 'bf' ? 700 : 400, it), m = measure(ctx, nd.s, f, sz), y = 0;
        if (big) y = -0.27 * S + (m.a - m.d) / 2;     // centre the big operator on the maths axis
        prims.push({ t: 'txt', s: nd.s, f: f, x: x, y: y, w: m.w, a: m.a, d: m.d, big: big });
        x += m.w + (it ? 0.04 * S : 0);
        if (op) x += pad;
        asc = Math.max(asc, m.a - y); desc = Math.max(desc, m.d + y);
        prev = op ? 'op' : (nd.s === '(' || nd.s === '[' || nd.s === '⟨') ? 'open' : 'x';
        continue;
      }
      if (nd.k === 'grp') {
        var g = typeset(ctx, nd.b, S, script, nd.st || st);
        place(g, x, 0); x += g.w; prev = 'x';
        continue;
      }
      if (nd.k === 'bar') {
        var bb = typeset(ctx, nd.b, S, script, st), top = 0;
        bb.prims.forEach(function (p) { top = Math.min(top, p.t === 'rule' ? p.y : p.y - p.a); });
        place(bb, x, 0);
        prims.push({ t: 'rule', x: x + bb.w * 0.18, y: top - 0.14 * S, w: bb.w * 0.72, h: Math.max(1, 0.055 * S) });
        asc = Math.max(asc, -top + 0.2 * S);
        x += bb.w; prev = 'x';
        continue;
      }
      if (nd.k === 'sup' || nd.k === 'sub') {
        var sup = nd.k === 'sup' ? nd.b : null, sub = nd.k === 'sub' ? nd.b : null, nx = nodes[n + 1];
        if (nx && (nx.k === 'sup' || nx.k === 'sub') && nx.k !== nd.k) { if (nx.k === 'sup') sup = nx.b; else sub = nx.b; n++; }
        var base = prims[prims.length - 1], onBig = base && base.big && base.x + base.w >= x - 0.5;
        var up = sup && typeset(ctx, sup, S * 0.7, true, st), dn = sub && typeset(ctx, sub, S * 0.7, true, st);
        var right = x;
        if (up) {
          var upY = onBig ? base.y - base.a + up.asc * 0.9 : -0.42 * S;
          place(up, x, upY); right = Math.max(right, x + up.w);
        }
        if (dn) {
          var dnX = onBig && !base.s.match(/∑/) ? x - 0.36 * S : x, dnY = onBig ? base.y + base.d : 0.2 * S + (up ? 0.06 * S : 0);
          place(dn, dnX, dnY); right = Math.max(right, dnX + dn.w);
        }
        x = right + 0.05 * S; prev = 'x';
        continue;
      }
      if (nd.k === 'frac') {
        var fs = S * 0.92, nu = typeset(ctx, nd.n, fs, script, st), de = typeset(ctx, nd.d, fs, script, st);
        var fw = Math.max(nu.w, de.w) + 0.35 * S, axis = -0.27 * S, gp = 0.16 * S;
        x += 0.08 * S;
        place(nu, x + (fw - nu.w) / 2, axis - gp - nu.desc);
        prims.push({ t: 'rule', x: x, y: axis - 0.03 * S, w: fw, h: Math.max(1.1, 0.055 * S) });
        place(de, x + (fw - de.w) / 2, axis + gp + de.asc);
        x += fw + 0.08 * S; prev = 'x';
      }
    }
    return { w: x, asc: asc, desc: desc, prims: prims };
  }
  function extent(prims) {
    var top = Infinity, bot = -Infinity;
    prims.forEach(function (p) {
      if (p.t === 'rule') { top = Math.min(top, p.y); bot = Math.max(bot, p.y + p.h); }
      else { top = Math.min(top, p.y - p.a); bot = Math.max(bot, p.y + p.d); }
    });
    return [top, bot];
  }
  function mathBox(ctx, src, S) {
    var key = src + '|' + S;
    return mathCache[key] || (mathCache[key] = typeset(ctx, parseTeX(src), S, false, ''));
  }
  function drawMath(ctx, src, x, y, S, color, align, upto) {   // upto: how many glyphs to show (writing order)
    var b = mathBox(ctx, src, S), ox = align === 'center' ? x - b.w / 2 : align === 'right' ? x - b.w : x;
    ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    var n = upto === undefined ? b.prims.length : Math.floor(upto);
    for (var i = 0; i < n && i < b.prims.length; i++) {
      var p = b.prims[i];
      if (p.t === 'rule') ctx.fillRect(ox + p.x, y + p.y, p.w, p.h);
      else { ctx.font = p.f; ctx.fillText(p.s, ox + p.x, y + p.y); }
    }
    return b;
  }

  /* =====================================================================
     Feynman diagrams. Nodes sit in a frame 1.9 wide and 1 high; edges are
     drawn one after another: f fermion (arrow), p plain propagator,
     s scalar (dashed), ph photon (wavy), w weak boson (wavy), g gluon (curly).
     ===================================================================== */
  function dFrame(e, aspect, pad) {
    aspect = aspect || 1.9; pad = pad === undefined ? 12 : pad;
    var h = Math.min(e.h - 2 * pad, (e.w - 2 * pad) / aspect);
    return { x: e.x + (e.w - h * aspect) / 2, y: e.y + (e.h - h) / 2, s: h };
  }
  function edgePts(F, D, ed) {
    var pts = [], N = 56, i;
    if (ed.arc) {                                  // an arc of a circle [cx, cy, r, from, to] in frame units
      var c = ed.arc;
      for (i = 0; i <= N; i++) {
        var an = c[3] + (c[4] - c[3]) * i / N;
        pts.push([F.x + (c[0] + c[2] * Math.cos(an)) * F.s, F.y + (c[1] + c[2] * Math.sin(an)) * F.s]);
      }
      return pts;
    }
    var A = D.n[ed.a], B = D.n[ed.b];
    var ax = F.x + A[0] * F.s, ay = F.y + A[1] * F.s, bx = F.x + B[0] * F.s, by = F.y + B[1] * F.s;
    var bend = ed.bend || 0, cx = (ax + bx) / 2 - (by - ay) * bend, cy = (ay + by) / 2 + (bx - ax) * bend;
    for (i = 0; i <= N; i++) {
      var u = i / N, w1 = (1 - u) * (1 - u), w2 = 2 * u * (1 - u), w3 = u * u;
      pts.push([w1 * ax + w2 * cx + w3 * bx, w1 * ay + w2 * cy + w3 * by]);
    }
    return pts;
  }
  function pathGeo(pts) {
    var L = [0];
    for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, L: L, len: L[L.length - 1] };
  }
  function pathAt(g, s) {                           // point and unit tangent at arc length s
    var L = g.L, n = L.length - 1, lo = 1, hi = n;
    s = Math.max(0, Math.min(g.len, s));
    while (lo < hi) { var mid = (lo + hi) >> 1; if (L[mid] < s) lo = mid + 1; else hi = mid; }
    var p = g.pts[lo - 1], q = g.pts[lo], seg = L[lo] - L[lo - 1], u = seg > 0 ? (s - L[lo - 1]) / seg : 0;
    var tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1;
    return [p[0] + tx * u, p[1] + ty * u, tx / tl, ty / tl];
  }
  var EDGE_STYLE = {
    f: ['green', 1.4], p: ['green', 1.5], s: ['crimson', 1.35], ph: ['brassD', 1.2], w: ['pine', 1.3], g: ['pine', 1.1]
  };
  function drawEdge(ctx, g, type, k, color, lw, t) {
    var end = g.len * k, s;
    if (end <= 0.5) return;
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (type === 'ph' || type === 'w') {
      var A = type === 'w' ? 3.1 : 2.6, lam = type === 'w' ? 10 : 8;
      lam = g.len / Math.max(1, Math.round(g.len / lam));
      for (s = 0; s <= end; s += 0.7) {
        var q = pathAt(g, s), off = A * Math.sin(TAU * s / lam);
        if (s === 0) ctx.moveTo(q[0] - q[3] * off, q[1] + q[2] * off); else ctx.lineTo(q[0] - q[3] * off, q[1] + q[2] * off);
      }
    } else if (type === 'g') {
      var r = 2.8, lg = g.len / Math.max(2, Math.round(g.len / 6.4));
      for (s = 0; s <= end; s += 0.35) {
        var ph = TAU * s / lg, q2 = pathAt(g, s + r * 0.9 * Math.sin(ph)), off2 = -r * Math.cos(ph) + r * 0.2;
        if (s === 0) ctx.moveTo(q2[0] - q2[3] * off2, q2[1] + q2[2] * off2); else ctx.lineTo(q2[0] - q2[3] * off2, q2[1] + q2[2] * off2);
      }
    } else {
      if (type === 's') { ctx.setLineDash([4.5, 3.5]); ctx.lineDashOffset = -(t || 0) * 9; }
      var p0 = g.pts[0]; ctx.moveTo(p0[0], p0[1]);
      for (var i = 1; i < g.pts.length && g.L[i] <= end; i++) ctx.lineTo(g.pts[i][0], g.pts[i][1]);
      var qe = pathAt(g, end); ctx.lineTo(qe[0], qe[1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function arrowAt(ctx, g, rev, color, size) {       // fermion-number arrow at the middle of an edge
    var q = pathAt(g, g.len / 2), dx = rev ? -q[2] : q[2], dy = rev ? -q[3] : q[3], a = size || 4.6;
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(q[0] + dx * a, q[1] + dy * a);
    ctx.lineTo(q[0] - dx * a * 0.7 - dy * a * 0.62, q[1] - dy * a * 0.7 + dx * a * 0.62);
    ctx.lineTo(q[0] - dx * a * 0.7 + dy * a * 0.62, q[1] - dy * a * 0.7 - dx * a * 0.62);
    ctx.closePath(); ctx.fill();
  }
  function opVertex(ctx, x, y, r, k, t) {           // an effective operator: a crossed circle
    ctx.save();
    ctx.globalAlpha *= k;
    dot(ctx, x, y, r, ink('paper', 1));
    ring(ctx, x, y, r, ink('brassD', 1), 1.5);
    var d = r * 0.62;
    line(ctx, x - d, y - d, x + d, y + d, ink('brassD', 1), 1.4); line(ctx, x - d, y + d, x + d, y - d, ink('brassD', 1), 1.4);
    ring(ctx, x, y, r + 3 + 3 * (0.5 + 0.5 * Math.sin(t * 3)), ink('brass', 0.35), 1);
    ctx.restore();
  }
  function diagramLayout(v, D) {
    v.F = dFrame(v, D.aspect || 1.9, D.pad);
    v.geo = D.e.map(function (ed) { return pathGeo(edgePts(v.F, D, ed)); });
  }
  function drawDiagram(ctx, v, D, t, t0) {         // t0: when the first edge starts
    var F = v.F, st = D.stagger || 0.34, du = D.edgeDur || 0.5, started = {};
    t0 = t0 === undefined ? 0.35 : t0;
    D.e.forEach(function (ed, i) {
      var g = v.geo[i], k = v.reduce ? 1 : ease((t - t0 - (ed.at !== undefined ? ed.at : i * st)) / du);
      var sty = EDGE_STYLE[ed.t], col = ink(ed.c || sty[0], 0.92), lw = ed.lw || sty[1];
      if (k > 0) started[ed.a] = 1;
      if (k > 0.95) started[ed.b] = 1;
      drawEdge(ctx, g, ed.t, k, col, lw, t);
      if (ed.t === 'f' && k > 0.6) arrowAt(ctx, g, ed.rev, col);
      if (ed.lab && k > 0.8) {
        var la = clamp01((k - 0.8) / 0.2), q = pathAt(g, g.len * (ed.lt || 0.5)), o = ed.lo || [0, -12];
        ctx.save(); ctx.globalAlpha *= la;
        drawMath(ctx, ed.lab, q[0] + o[0], q[1] + o[1], D.labSize || 13, ink('green', 0.95), 'center');
        ctx.restore();
      }
    });
    Object.keys(D.n).forEach(function (id) {       // vertices
      var n = D.n[id];
      if (!n[2] || !started[id]) return;
      var x = F.x + n[0] * F.s, y = F.y + n[1] * F.s;
      if (n[2] === 'op') opVertex(ctx, x, y, 6.5, 1, t);
      else if (n[2] === 'blob') { dot(ctx, x, y, 6.5, ink('green', 0.9)); ring(ctx, x, y, 9, ink('green', 0.3), 1); }
      else dot(ctx, x, y, 2.3, ink('green', 0.95));
    });
  }
  function diagramVignette(o) {                    // a paper whose picture is a single diagram
    return {
      key: o.key, paper: o.paper, cap: o.cap, ref: o.ref, dur: o.dur || 10,
      layout: function (v) { diagramLayout(v, o.D); if (o.layout) o.layout(v); },
      frame: function (v, t) { drawDiagram(v.ctx, v, o.D, t); if (o.extra) o.extra(v, t); }
    };
  }

  /* =====================================================================
     Research: a tour of the papers
     ===================================================================== */
  function delaunay(P) {                              // Bowyer-Watson
    var n = P.length, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    P.forEach(function (p) {
      minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
    });
    var d = Math.max(maxX - minX, maxY - minY) * 10, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
    var pts = P.concat([[mx - d, my - d], [mx, my + d], [mx + d, my - d]]);
    function circ(t) {
      var a = pts[t[0]], b = pts[t[1]], c = pts[t[2]];
      var D = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
      if (Math.abs(D) < 1e-12) return { x: 0, y: 0, r2: Infinity };
      var a2 = a[0] * a[0] + a[1] * a[1], b2 = b[0] * b[0] + b[1] * b[1], c2 = c[0] * c[0] + c[1] * c[1];
      var x = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / D;
      var y = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / D;
      return { x: x, y: y, r2: (a[0] - x) * (a[0] - x) + (a[1] - y) * (a[1] - y) };
    }
    var tris = [[n, n + 1, n + 2]], cc = [circ(tris[0])];
    for (var i = 0; i < n; i++) {
      var p = pts[i], bad = [], keepT = [], keepC = [];
      for (var j = 0; j < tris.length; j++) {
        var c = cc[j], dx = p[0] - c.x, dy = p[1] - c.y;
        if (dx * dx + dy * dy < c.r2) bad.push(tris[j]); else { keepT.push(tris[j]); keepC.push(c); }
      }
      var edges = {};
      bad.forEach(function (t) {
        [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]].forEach(function (e) {
          var k = Math.min(e[0], e[1]) + ',' + Math.max(e[0], e[1]);
          edges[k] = (k in edges) ? null : e;           // shared by two cavity triangles: interior
        });
      });
      tris = keepT; cc = keepC;
      Object.keys(edges).forEach(function (k) {
        var e = edges[k];
        if (e) { var t = [e[0], e[1], i]; tris.push(t); cc.push(circ(t)); }
      });
    }
    return tris.filter(function (t) { return t[0] < n && t[1] < n && t[2] < n; });
  }
  function hull(P) {                                  // Andrew's monotone chain
    var idx = P.map(function (p, i) { return i; })
      .sort(function (a, b) { return P[a][0] - P[b][0] || P[a][1] - P[b][1]; });
    function cross(o, a, b) { return (P[a][0] - P[o][0]) * (P[b][1] - P[o][1]) - (P[a][1] - P[o][1]) * (P[b][0] - P[o][0]); }
    var lower = [], upper = [];
    idx.forEach(function (i) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], i) <= 0) lower.pop();
      lower.push(i);
    });
    idx.slice().reverse().forEach(function (i) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], i) <= 0) upper.pop();
      upper.push(i);
    });
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }
  function centroid(pos, v) {
    var a = pos[v[0]], b = pos[v[1]], c = pos[v[2]];
    return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
  }
  function nearestCell(cells, pos, c) {
    var best = null, bd = Infinity;
    Object.keys(cells).forEach(function (k) {
      var m = centroid(pos, cells[k]), d = (m[0] - c[0]) * (m[0] - c[0]) + (m[1] - c[1]) * (m[1] - c[1]);
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }
  function sharedCount(a, b) { var n = 0; for (var i = 0; i < 3; i++) if (b.indexOf(a[i]) >= 0) n++; return n; }
  function triPath(ctx, pos, v) {
    var a = pos[v[0]], b = pos[v[1]], c = pos[v[2]];
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
  }

  SCENES.triangulation = {
    still: 14,
    touchHint: 'Tap to add a point',
    init: function (e) {
      var r = seeded(2026), pts = [], tries = 0;
      while (pts.length < 20 && tries++ < 5000) {       // spread out, never two points on top of each other
        var a = r() * TAU, rr = Math.sqrt(r()), u = Math.cos(a) * rr, v = Math.sin(a) * rr, ok = true;
        for (var i = 0; i < pts.length && ok; i++) ok = Math.hypot(pts[i].u - u, pts[i].v - v) > 0.3;
        if (ok) pts.push({ id: pts.length, u: u, v: v, born: 0.1 + pts.length * 0.05, ph: r() * TAU, sp: 0.55 + r() * 0.9 });
      }
      e.pts = pts; e.nextId = pts.length; e.edges = {}; e.cells = {}; e.trail = {};
      e.cell = null; e.prev = null; e.cellC = null; e.hopAt = 4.8;
    },
    frame: function (e, t) {
      var ctx = e.ctx, dt = e.reduce ? 1e9 : e.dt, ids = [], P = [], pos = {};
      var cx = e.x + e.w / 2, cy = e.y + e.h / 2, rx = e.w * 0.47, ry = e.h * 0.45;
      e.pts.forEach(function (p) {                     // every point drifts gently
        if (t < p.born) return;
        var q = [cx + (p.u + 0.055 * Math.sin(t * 0.33 * p.sp + p.ph)) * rx,
                 cy + (p.v + 0.055 * Math.cos(t * 0.29 * p.sp + p.ph * 1.7)) * ry];
        ids.push(p.id); P.push(q); pos[p.id] = q;
      });
      var tris = P.length > 2 ? delaunay(P) : [], hullIdx = P.length > 2 ? hull(P) : [];
      var sweep = e.reduce ? 2 : (t - 1.2) / 2.3, wash = e.reduce ? 1 : ease((t - 3.3) / 1.4);
      var cells = {}, edges = {}, onHull = {};
      tris.forEach(function (tr) {
        var v = [ids[tr[0]], ids[tr[1]], ids[tr[2]]].sort(function (a, b) { return a - b; });
        cells[v.join(',')] = v;
        edges[v[0] + ',' + v[1]] = [v[0], v[1]]; edges[v[1] + ',' + v[2]] = [v[1], v[2]]; edges[v[0] + ',' + v[2]] = [v[0], v[2]];
      });
      hullIdx.forEach(function (i) { onHull[ids[i]] = 1; });
      fadeMap(e.edges, edges, dt, 0.5);                // flips fade rather than jump
      fadeMap(e.cells, cells, dt, 0.6);

      // a highlighted cell walks through the triangulation, one neighbour at a time
      if (!e.cell || !cells[e.cell]) e.cell = nearestCell(cells, pos, e.cellC || [cx, cy]);
      if (!e.reduce && e.cell && t > e.hopAt) {
        var cur = cells[e.cell], nb = Object.keys(cells).filter(function (k) {
          return k !== e.cell && k !== e.prev && sharedCount(cells[k], cur) === 2;
        });
        if (nb.length) { e.trail[e.cell] = t; e.prev = e.cell; e.cell = nb[Math.floor(Math.random() * nb.length)]; }
        e.hopAt = t + 1.5;
      }
      if (e.cell) e.cellC = centroid(pos, cells[e.cell]);
      Object.keys(e.trail).forEach(function (k) { if (t - e.trail[k] > 4.5) delete e.trail[k]; });

      // cells: faint washes, the fading trail of the walk, the current cell
      Object.keys(e.cells).forEach(function (k) {
        var m = e.cells[k], v = m.p;
        if (!pos[v[0]] || !pos[v[1]] || !pos[v[2]]) return;
        var h = (v[0] * 7 + v[1] * 13 + v[2] * 29) % 5, a = 0, col = 'pine';
        if (h === 0) { a = 0.075; col = 'brass'; } else if (h < 3) a = 0.05;
        if (e.trail[k] !== undefined) { a = Math.max(a, 0.2 * (1 - (t - e.trail[k]) / 4.5)); col = 'brass'; }
        if (k === e.cell) { a = 0.27; col = 'brass'; }
        a *= m.a * wash;
        if (a < 0.004) return;
        ctx.fillStyle = ink(col, a); triPath(ctx, pos, v); ctx.fill();
      });

      // edges, revealed once by a sweep from left to right
      ctx.lineWidth = 0.8; ctx.lineCap = 'round';
      var front = e.x - 60 + (e.w + 120) * sweep;
      Object.keys(e.edges).forEach(function (k) {
        var m = e.edges[k], a = pos[m.p[0]], b = pos[m.p[1]];
        if (!a || !b) return;
        var s = sweep >= 1.2 ? 1 : clamp01((front - (a[0] + b[0]) / 2) / 60), al = 0.42 * m.a * s;
        if (al < 0.004) return;
        ctx.strokeStyle = ink('pine', al);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      });

      // the convex hull, traced in brass
      var hk = e.reduce ? 1 : ease((t - 0.7) / 1.4);
      if (hullIdx.length > 2 && hk > 0) {
        var per = 0;
        for (var i = 0; i < hullIdx.length; i++) {
          var p1 = P[hullIdx[i]], p2 = P[hullIdx[(i + 1) % hullIdx.length]];
          per += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        }
        ctx.save();
        if (hk < 1) ctx.setLineDash([per * hk, per]);
        ctx.lineWidth = 1.35; ctx.lineJoin = 'round'; ctx.strokeStyle = ink('brass', 0.85);
        ctx.beginPath();
        hullIdx.forEach(function (i, j) { if (j) ctx.lineTo(P[i][0], P[i][1]); else ctx.moveTo(P[i][0], P[i][1]); });
        ctx.closePath(); ctx.stroke(); ctx.restore();
      }

      // the points; vertices of the hull in brass
      e.pts.forEach(function (p) {
        var q = pos[p.id];
        if (!q) return;
        var age = t - p.born, k = e.reduce ? 1 : ease(age / 0.45), big = onHull[p.id];
        if (p.user && age < 1.3 && !e.reduce) {
          ctx.strokeStyle = ink('brass', 0.65 * (1 - age / 1.3)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(q[0], q[1], 4 + age * 18, 0, TAU); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(q[0], q[1], (big ? 3.2 : 2.6) * (0.3 + 0.7 * k), 0, TAU);
        ctx.fillStyle = ink('paper', k); ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = big ? ink('brassD', k) : ink('green', 0.85 * k); ctx.stroke();
      });
      if (e.cell && cells[e.cell] && wash > 0) cells[e.cell].forEach(function (id) {
        var q = pos[id];
        ctx.fillStyle = ink('brass', wash); ctx.beginPath(); ctx.arc(q[0], q[1], 1.7, 0, TAU); ctx.fill();
      });
    },
    click: function (e, x, y) {                        // add a point where the visitor clicks
      var t = e.t, cx = e.x + e.w / 2, cy = e.y + e.h / 2, rx = e.w * 0.47, ry = e.h * 0.45;
      for (var i = 0; i < e.pts.length; i++) {
        var o = e.pts[i];
        var ox = cx + (o.u + 0.055 * Math.sin(t * 0.33 * o.sp + o.ph)) * rx, oy = cy + (o.v + 0.055 * Math.cos(t * 0.29 * o.sp + o.ph * 1.7)) * ry;
        if (Math.hypot(ox - x, oy - y) < 8) return;
      }
      var p = { id: e.nextId++, born: t, ph: Math.random() * TAU, sp: 0.55 + Math.random() * 0.9, user: true };
      p.u = (x - cx) / rx - 0.055 * Math.sin(t * 0.33 * p.sp + p.ph);
      p.v = (y - cy) / ry - 0.055 * Math.cos(t * 0.29 * p.sp + p.ph * 1.7);
      e.pts.push(p);
      var users = e.pts.filter(function (q) { return q.user; });
      if (users.length > 16) e.pts.splice(e.pts.indexOf(users[0]), 1);
    }
  };
  function bkg(m) { return Math.exp(-(m - 65) / 42); }
  function sig(m) { return 0.12 * Math.exp(-Math.pow(m - 95, 2) / 23) + 0.085 * Math.exp(-Math.pow(m - 152, 2) / 23); }
  function sb(m) { return bkg(m) + sig(m); }

  SCENES.spectrum = {
    touchHint: 'Tap for a new pseudo-experiment',
    init: function (e) { e.seed = 3; e.c0 = 0; this.toy(e); },
    toy: function (e) {                                // one pseudo-experiment
      var r = seeded(1 + e.seed * 7919);
      e.bins = [];
      for (var m = 67; m <= 163; m += 4) {
        var mu = sb(m), err = 0.02 + 0.042 * Math.sqrt(mu);
        e.bins.push({ m: m, v: Math.max(0.01, mu + 0.85 * err * gauss(r)), err: err });
      }
    },
    frame: function (e, t) {
      var ctx = e.ctx, C = 13, c = e.reduce ? 9 : t - e.c0;
      if (c > C) { e.seed++; this.toy(e); e.c0 = t; c = 0; }
      var L = e.x + 34, R = e.x + e.w - 6, T = e.y + 8, B = e.y + e.h - 30;
      function X(m) { return L + (m - 65) / 100 * (R - L); }
      function Y(v) { return B - v / 1.1 * (B - T); }
      var fade = e.reduce ? 1 : (c > C - 1 ? C - c : 1), ax = e.reduce ? 1 : ease(c / 0.5);
      var fk = e.reduce ? 1 : ease((c - 4.2) / 1.3), sk = e.reduce ? 1 : ease((c - 5.7) / 1.3);
      var bk = e.reduce ? 1 : ease((c - 6.4) / 0.9);
      ctx.globalAlpha = fade;

      // axes, ticks and titles
      ctx.strokeStyle = ink('green', 0.6 * ax); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      ctx.font = font(9.5, SANS, 500); ctx.fillStyle = ink('slate', 0.9 * ax);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (var m = 70; m <= 160; m += 10) {
        var major = m % 20 === 10, x = X(m);
        ctx.beginPath(); ctx.moveTo(x, B); ctx.lineTo(x, B + (major ? 5 : 3)); ctx.stroke();
        if (major) ctx.fillText(String(m), x, B + 16);
      }
      for (var v = 0.2; v < 1.1; v += 0.2) { var yv = Y(v); ctx.beginPath(); ctx.moveTo(L, yv); ctx.lineTo(L - 3, yv); ctx.stroke(); }
      ctx.textAlign = 'right';
      var unit = ' [GeV]', uw = ctx.measureText(unit).width;
      ctx.fillText(unit, R, B + 28);
      ctx.font = font(8.5, SERIF, 400, true); var gw = ctx.measureText('γγ').width;
      ctx.fillText('γγ', R - uw, B + 30.5);
      ctx.font = font(12, SERIF, 400, true); ctx.fillText('m', R - uw - gw - 0.5, B + 28);
      ctx.save(); ctx.translate(L - 14, T); ctx.rotate(-Math.PI / 2);
      ctx.font = font(9.5, SANS, 500); ctx.textAlign = 'right'; ctx.fillText('Events / 4 GeV', 0, 0);
      ctx.restore();

      // the excess regions
      if (bk > 0) [95, 152].forEach(function (m0) {
        ctx.fillStyle = ink('crimson', 0.075 * bk); ctx.fillRect(X(m0 - 5), T, X(m0 + 5) - X(m0 - 5), B - T);
      });
      // fits: the smooth background, then signal plus background
      function curve(k, f) {
        ctx.beginPath();
        for (var mm = 65; mm <= 65 + 100 * k + 0.001; mm += 0.5) { var yy = Y(f(mm)); if (mm === 65) ctx.moveTo(X(mm), yy); else ctx.lineTo(X(mm), yy); }
        ctx.stroke();
      }
      if (fk > 0) { ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4; ctx.strokeStyle = ink('brass', 0.95); curve(fk, bkg); ctx.restore(); }
      if (sk > 0) { ctx.lineWidth = 1.3; ctx.strokeStyle = ink('crimson', 0.85); curve(sk, sb); }
      // toy data, rising bin by bin
      e.bins.forEach(function (b, i) {
        var k = e.reduce ? 1 : ease((c - 0.5 - i * 0.14) / 0.45);
        if (k <= 0) return;
        var x = X(b.m), y = Y(b.v * k), ey = b.err / 1.1 * (B - T);
        ctx.strokeStyle = ink('green', 0.8 * k); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y - ey); ctx.lineTo(x, y + ey); ctx.stroke();
        ctx.fillStyle = ink('green', 0.95 * k); ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
      });
      // the two excesses, named
      if (bk > 0) [95, 152].forEach(function (m0) {
        var top = 0;
        e.bins.forEach(function (b) { if (Math.abs(b.m - m0) <= 6) top = Math.max(top, b.v + b.err); });
        ctx.font = font(14, DISPLAY, 600, true); ctx.fillStyle = ink('crimson', 0.95 * bk); ctx.textAlign = 'center';
        ctx.fillText(m0 + ' GeV', X(m0), Y(top) - 9);
      });
      // legend
      ctx.font = font(9, SANS, 500); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      [['Toy data', 0], ['Background', 1], ['Signal + background', 2]].forEach(function (row, i) {
        var y = T + 7 + i * 14, tx = X(143), w = ctx.measureText(row[0]).width, sx = tx - w - 28;
        ctx.fillStyle = ink('slate', 0.9 * ax); ctx.fillText(row[0], tx, y);
        if (row[1] === 0) {
          ctx.strokeStyle = ink('green', 0.8 * ax); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx + 10, y - 5); ctx.lineTo(sx + 10, y + 5); ctx.stroke();
          ctx.fillStyle = ink('green', 0.95 * ax); ctx.beginPath(); ctx.arc(sx + 10, y, 2.2, 0, TAU); ctx.fill();
        } else {
          ctx.save();
          if (row[1] === 1) { ctx.setLineDash([5, 4]); ctx.strokeStyle = ink('brass', ax); ctx.lineWidth = 1.4; }
          else { ctx.strokeStyle = ink('crimson', 0.85 * ax); ctx.lineWidth = 1.3; }
          ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + 20, y); ctx.stroke(); ctx.restore();
        }
      });
    },
    click: function (e) { e.seed++; this.toy(e); e.c0 = e.t - 0.5; }
  };
  var TRI = SCENES.triangulation, SPEC = SCENES.spectrum;
  delete SCENES.triangulation; delete SCENES.spectrum;

  /* Conic hulls, as in FIG. 1 of the paper. The two-fold Mellin-Barnes integral of the
     Appell F1 function has five Gamma functions in the numerator. The coefficient vectors of
     z in their arguments span cones at the origin; a set of cones with a common
     intersection gives one series representation, and the intersection (the master conic
     hull) gives its master series. The five representations converge in five regions that
     tile the quadrant of |u1| and |u2|. */
  var F1E = [[-1, 0], [0, -1], [1, 1], [1, 0], [0, 1]];
  var F1CONES = [{ a: 45, b: 180, col: 'brass', lab: 'C_{13}' }, { a: 45, b: 90, col: 'brassD', lab: 'C_{35}' },
                 { a: 0, b: 90, col: 'crimson', lab: 'C_{45}' }];
  var F1REG = [
    { p: [[0, 0], [1, 0], [1, 1], [0, 1]], col: 'pine', lab: 'R_1', c: [0.5, 0.5] },
    { p: [[0, 1], [1, 1], [1, 5], [0, 5]], col: 'slate', lab: 'R_2', c: [0.5, 3] },
    { p: [[1, 1], [5, 5], [1, 5]], col: 'crimson', lab: 'R_3', c: [2.3, 3.7] },
    { p: [[1, 0], [5, 0], [5, 1], [1, 1]], col: 'brass', lab: 'R_4', c: [3, 0.5] },
    { p: [[1, 1], [5, 1], [5, 5]], col: 'brassD', lab: 'R_5', c: [3.7, 2.3] }
  ];
  function wedge(ctx, ox, oy, R, a0, a1) {           // a cone between two directions, in degrees, counterclockwise
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, R, -a0 * D2R, -a1 * D2R, true); ctx.closePath();
  }
  function arrowHead(ctx, x, y, ang, s, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x - s * Math.cos(ang - 0.42), y - s * Math.sin(ang - 0.42));
    ctx.lineTo(x - s * Math.cos(ang + 0.42), y - s * Math.sin(ang + 0.42)); ctx.closePath(); ctx.fill();
  }
  var CONIC = {
    key: 'conic', paper: '2012.15108', dur: 13.5, cap: 'Conic hulls and series representations',
    layout: function (v) {
      v.S = Math.max(9, Math.min(12, v.w / 44));
      var side = Math.min(v.h - 16, v.w * 0.43);
      v.A = { cx: v.x + side / 2 + 4, cy: v.y + v.h / 2, u: side / 3.3 };
      var s2 = Math.min(v.h - 34, v.w * 0.36);
      v.B = { x: v.x + v.w - s2 - 6, y: v.y + 8, s: s2 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, A = v.A, u = A.u, S = v.S;
      function P(x, y) { return [A.cx + x * u, A.cy - y * u]; }
      var ak = R ? 1 : ease(t / 0.8);
      ctx.save(); ctx.globalAlpha *= ak;
      line(ctx, A.cx - 1.55 * u, A.cy, A.cx + 1.55 * u, A.cy, ink('green', 0.3), 1);
      line(ctx, A.cx, A.cy - 1.55 * u, A.cx, A.cy + 1.55 * u, ink('green', 0.3), 1);
      ctx.restore();
      F1CONES.forEach(function (C, i) {                // the three cones of FIG. 1, one after another
        var k = R ? 1 : ease((t - 2.2 - i * 1.3) / 0.8);
        if (k <= 0) return;
        ctx.fillStyle = ink(C.col, 0.13 * k); wedge(ctx, A.cx, A.cy, 1.45 * u, C.a, C.a + (C.b - C.a) * k); ctx.fill();
      });
      var mk = R ? 1 : ease((t - 6.2) / 0.8);          // their common intersection: the master conic hull C35
      if (mk > 0) {
        ctx.fillStyle = ink('brassD', 0.28 * mk); wedge(ctx, A.cx, A.cy, 1.45 * u, 45, 90); ctx.fill();
        ctx.strokeStyle = ink('brassD', 0.9 * mk); ctx.lineWidth = 1.4; wedge(ctx, A.cx, A.cy, 1.45 * u, 45, 90); ctx.stroke();
        ctx.save(); ctx.globalAlpha *= mk;
        var mp = P(0.5, 1.5);
        caps(ctx, 'MASTER CONE', mp[0] + 6, mp[1] - 2, ink('brassD', 1), 7.5, 'left');
        ctx.restore();
      }
      F1E.forEach(function (e, i) {                    // the five vectors, labelled by their Gamma function
        var k = R ? 1 : ease((t - 0.4 - i * 0.25) / 0.6);
        if (k <= 0) return;
        var n = Math.hypot(e[0], e[1]), L = 1.2 * k, tip = P(e[0] / n * L, e[1] / n * L);
        line(ctx, A.cx, A.cy, tip[0], tip[1], ink('green', 0.9), 1.4);
        arrowHead(ctx, tip[0], tip[1], Math.atan2(tip[1] - A.cy, tip[0] - A.cx), 6, ink('green', 0.9));
        if (k > 0.9) {
          var lp = P(e[0] / n * 1.42, e[1] / n * 1.42);
          dot(ctx, lp[0], lp[1], 7, ink('paper', 0.95)); ring(ctx, lp[0], lp[1], 7, ink('green', 0.6), 0.8);
          ctx.font = font(9, SANS, 600); ctx.fillStyle = ink('green', 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), lp[0], lp[1] + 0.5); ctx.textBaseline = 'alphabetic';
        }
      });
      var B = v.B, s = B.s / 5, rk = R ? 1 : ease((t - 7.4) / 0.6);   // the five regions in the quadrant
      if (rk > 0) {
        ctx.save(); ctx.globalAlpha *= rk;
        function Q(x, y) { return [B.x + x * s, B.y + B.s - y * s]; }
        F1REG.forEach(function (Rg, i) {
          var k = R ? 1 : ease((t - 7.6 - i * 0.35) / 0.4);
          if (k <= 0) return;
          ctx.fillStyle = ink(Rg.col, (i === 2 ? 0.3 : 0.16) * k); ctx.beginPath();
          Rg.p.forEach(function (q, j) { var c = Q(q[0], q[1]); if (j) ctx.lineTo(c[0], c[1]); else ctx.moveTo(c[0], c[1]); });
          ctx.closePath(); ctx.fill();
          var cc = Q(Rg.c[0], Rg.c[1]);
          drawMath(ctx, Rg.lab, cc[0], cc[1] + 4, S * 0.95, ink(Rg.col, k), 'center');
        });
        ctx.strokeStyle = ink('green', 0.55); ctx.lineWidth = 1;
        var o = Q(0, 0), a1 = Q(1, 0), a2 = Q(1, 5), b1 = Q(0, 1), b2 = Q(5, 1), d1 = Q(1, 1), d2 = Q(5, 5);
        ctx.strokeRect(o[0], d2[1], 5 * s, 5 * s);
        line(ctx, a1[0], a1[1], a2[0], a2[1], ink('green', 0.45), 1); line(ctx, b1[0], b1[1], b2[0], b2[1], ink('green', 0.45), 1);
        line(ctx, d1[0], d1[1], d2[0], d2[1], ink('green', 0.45), 1);
        drawMath(ctx, '|u_1|', B.x + B.s, B.y + B.s + 13, S * 0.85, ink('slate', 0.95), 'right');
        drawMath(ctx, '|u_2|', B.x - 4, B.y + 9, S * 0.85, ink('slate', 0.95), 'right');
        var fk = R ? 1 : ease((t - 9.8) / 0.6);
        if (fk > 0) { ctx.globalAlpha *= fk; drawMath(ctx, 'R_3:\\,B_{13}+B_{35}^{∗}+B_{45}', B.x + B.s, B.y + B.s + 27, S * 0.85, ink('crimson', 0.95), 'right'); }
        ctx.restore();
      }
      if (v.w > 420) {                                 // the Gamma functions behind the vectors
        ctx.save(); ctx.globalAlpha *= ak;
        drawMath(ctx, '1\\,Γ(−z_1)\\quad 2\\,Γ(−z_2)\\quad 3\\,Γ(a+z_1+z_2)', v.x + 2, v.y + 9, S * 0.76, ink('slate', 0.85), 'left');
        drawMath(ctx, '4\\,Γ(b_1+z_1)\\quad 5\\,Γ(b_2+z_2)', v.x + 2, v.y + 9 + S * 1.5, S * 0.76, ink('slate', 0.85), 'left');
        ctx.restore();
      }
    }
  };

  /* Straight contours, as in Fig. 1 of the paper: the poles of the five Gamma functions of a
     two-fold integral form lines in the plane of Re z1 and Re z2. The contour at the first
     point separates every pole set. At the second point the straight contours split the poles
     of Gamma(-z1) and Gamma(3/5 + z2), which are rewritten with the reflection formula before
     the conic hull method applies. */
  var SPLIT_FAM = [
    { col: 'pine', lab: 'Γ(−z_1)', lines: [0, 1, 2, 3], dir: 'v' },
    { col: 'brassD', lab: 'Γ(\\frac{2}{3}+z_1)', lines: [-2 / 3, -5 / 3, -8 / 3], dir: 'v' },
    { col: 'crimson', lab: 'Γ(−z_2)', lines: [0, 1, 2, 3], dir: 'h' },
    { col: 'brass', lab: 'Γ(\\frac{3}{5}+z_2)', lines: [-3 / 5, -8 / 5, -13 / 5], dir: 'h' },
    { col: 'slate', lab: 'Γ(\\frac{3}{7}+z_1+z_2)', lines: [0, 1, 2, 3, 4], dir: 'd' }
  ];
  var CONTOUR = {
    key: 'contour', paper: '2212.11839', dur: 13, cap: 'Mellin-Barnes integrals with straight contours',
    layout: function (v) {
      v.S = Math.max(9, Math.min(12, v.w / 44));
      var side = Math.min(v.h - 10, v.w * 0.5);
      v.u = side / 7.2; v.ox = v.x + 4 + 3.6 * v.u; v.oy = v.y + v.h / 2; v.side = side;
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, u = v.u, S = v.S, lim = 3.5;
      function X(z) { return v.ox + z * u; }
      function Y(z) { return v.oy - z * u; }
      ctx.save(); ctx.beginPath(); ctx.rect(X(-lim), Y(lim), 2 * lim * u, 2 * lim * u); ctx.clip();
      var ak = R ? 1 : ease(t / 0.6);
      line(ctx, X(-lim), Y(0), X(lim), Y(0), ink('green', 0.35 * ak), 1); line(ctx, X(0), Y(-lim), X(0), Y(lim), ink('green', 0.35 * ak), 1);
      var bk = R ? 1 : ease((t - 4.2) / 0.6), pulse = R ? 1 : 0.5 + 0.5 * Math.sin(t * 5);
      SPLIT_FAM.forEach(function (F, fi) {             // pole lines, one family after another
        var k = R ? 1 : ease((t - 0.6 - fi * 0.45) / 0.5);
        if (k <= 0) return;
        F.lines.forEach(function (c) {
          var split = bk > 0 && ((fi === 0 && c < 7 / 3) || (fi === 3 && c > -3 / 2));
          var al = (split ? 0.45 + 0.45 * pulse * bk : 0.42) * k, lw = split ? 1.6 : 1;
          ctx.save(); if (!split) ctx.setLineDash([3, 3]);
          if (F.dir === 'v') line(ctx, X(c), Y(lim), X(c), Y(-lim), ink(F.col, al), lw);
          else if (F.dir === 'h') line(ctx, X(-lim), Y(c), X(lim), Y(c), ink(F.col, al), lw);
          else { var s0 = -3 / 7 - c; line(ctx, X(-lim), Y(s0 + lim), X(lim), Y(s0 - lim), ink(F.col, al), lw); }
          ctx.restore();
        });
      });
      var pk = R ? 1 : ease((t - 3) / 0.5);             // the first choice of contour: nothing is split
      if (pk > 0) {
        var ax = X(-1 / 7), ay = Y(-1 / 9);
        dot(ctx, ax, ay, 3.6 * pk, ink('green', 1)); ring(ctx, ax, ay, 6.5, ink('green', 0.6 * pk), 1);
      }
      if (bk > 0) {                                    // the second: straight lines through (7/3, -3/2)
        var bx = X(7 / 3), by = Y(-3 / 2);
        ctx.save(); ctx.setLineDash([5, 4]);
        line(ctx, bx, Y(lim), bx, Y(-lim), ink('crimson', 0.7 * bk), 1.1); line(ctx, X(-lim), by, X(lim), by, ink('crimson', 0.7 * bk), 1.1);
        ctx.restore();
        dot(ctx, bx, by, 3.8 * bk, ink('crimson', 1)); ring(ctx, bx, by, 7, ink('crimson', 0.6 * bk), 1);
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= ak;
      ctx.strokeStyle = ink('green', 0.4); ctx.lineWidth = 1; ctx.strokeRect(X(-lim), Y(lim), 2 * lim * u, 2 * lim * u);
      drawMath(ctx, '\\rm{Re}\\,z_1', X(lim) - 3, Y(0) - 5, S * 0.8, ink('slate', 0.95), 'right');
      drawMath(ctx, '\\rm{Re}\\,z_2', X(0) + 5, Y(lim) + 12, S * 0.8, ink('slate', 0.95), 'left');
      ctx.restore();
      var lx = X(lim) + 16, ly = v.y + 18, room = v.x + v.w - lx;   // legend of the five families
      if (room > 100) {
        SPLIT_FAM.forEach(function (F, fi) {
          var k = R ? 1 : ease((t - 0.6 - fi * 0.45) / 0.5);
          if (k <= 0) return;
          ctx.save(); ctx.globalAlpha *= k;
          var yy = ly + fi * (S * 2.05);
          line(ctx, lx, yy - 4, lx + 16, yy - 4, ink(F.col, 0.9), 1.6);
          drawMath(ctx, F.lab, lx + 22, yy, S * 0.88, ink('green', 0.95), 'left');
          ctx.restore();
        });
        var fk = R ? 1 : ease((t - 6.6) / 0.8);
        if (fk > 0) {
          ctx.save(); ctx.globalAlpha *= fk;
          caps(ctx, 'SPLIT POLES ARE REWRITTEN', lx, ly + 5 * S * 2.05 + 6, ink('crimson', 0.9), 7.5);
          drawMath(ctx, 'Γ(−z_1)=−\\frac{Γ(3−z_1)\\,Γ(−2+z_1)}{Γ(1+z_1)}', lx, ly + 5 * S * 2.05 + S * 2.9, S * 0.9, ink('green', 0.95), 'left');
          ctx.restore();
        }
      }
    }
  };

  /* Double box and hexagon: the two conformal integrals of the paper, drawn in turn. */
  var DOUBLEBOX = {
    n: { a: [0.62, 0.2, 1], b: [0.95, 0.2, 1], c: [1.28, 0.2, 1], d: [0.62, 0.8, 1], e: [0.95, 0.8, 1], f: [1.28, 0.8, 1],
         p1: [0.36, 0.02], p2: [0.36, 0.98], p3: [1.54, 0.02], p4: [1.54, 0.98] },
    e: [{ a: 'p1', b: 'a', t: 'p', c: 'brassD', lab: 'p_1', lt: 0.1, lo: [-12, 6] }, { a: 'p2', b: 'd', t: 'p', c: 'brassD', lab: 'p_2', lt: 0.1, lo: [-12, -2] },
        { a: 'a', b: 'b', t: 'p' }, { a: 'b', b: 'c', t: 'p' }, { a: 'a', b: 'd', t: 'p' }, { a: 'b', b: 'e', t: 'p' },
        { a: 'c', b: 'f', t: 'p' }, { a: 'd', b: 'e', t: 'p' }, { a: 'e', b: 'f', t: 'p' },
        { a: 'c', b: 'p3', t: 'p', c: 'brassD', lab: 'p_3', lt: 0.9, lo: [12, 6] }, { a: 'f', b: 'p4', t: 'p', c: 'brassD', lab: 'p_4', lt: 0.9, lo: [12, -2] }],
    stagger: 0.22, edgeDur: 0.45
  };
  var HEXAGON = (function () {
    var n = {}, e = [];
    for (var k = 0; k < 6; k++) {
      var an = (k * 60 - 90) * D2R;
      n['v' + k] = [0.95 + 0.33 * Math.cos(an), 0.5 + 0.33 * Math.sin(an), 1];
      n['x' + k] = [0.95 + 0.5 * Math.cos(an), 0.5 + 0.5 * Math.sin(an)];
    }
    for (k = 0; k < 6; k++) e.push({ a: 'v' + k, b: 'v' + ((k + 1) % 6), t: 'p' });
    for (k = 0; k < 6; k++) e.push({ a: 'v' + k, b: 'x' + k, t: 'p', c: 'brassD' });
    return { n: n, e: e, stagger: 0.2, edgeDur: 0.45 };
  })();
  var CONFORMAL = {
    key: 'conformal', paper: '2007.08360', dur: 12, cap: 'Double box and hexagon conformal integrals',
    layout: function (v) {
      v.box = Object.create(v); diagramLayout(v.box, DOUBLEBOX);
      v.hex = Object.create(v); diagramLayout(v.hex, HEXAGON);
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, split = 6;
      var a1 = R ? 1 : clamp01((split - t) / 0.5), a2 = R ? 0 : clamp01((t - split) / 0.5);
      if (a1 > 0) {
        ctx.save(); ctx.globalAlpha *= a1; drawDiagram(ctx, v.box, DOUBLEBOX, t);
        drawMath(ctx, 'k_1', v.box.F.x + 0.785 * v.box.F.s, v.box.F.y + 0.53 * v.box.F.s, 12, ink('slate', 0.9 * clamp01(t - 3)), 'center');
        drawMath(ctx, 'k_2', v.box.F.x + 1.115 * v.box.F.s, v.box.F.y + 0.53 * v.box.F.s, 12, ink('slate', 0.9 * clamp01(t - 3)), 'center');
        caps(ctx, 'TWO LOOPS', v.x + 4, v.y + 12, ink('slate', 0.85), 8); ctx.restore();
      }
      if (a2 > 0) {
        ctx.save(); ctx.globalAlpha *= a2; drawDiagram(ctx, v.hex, HEXAGON, t - split);
        caps(ctx, 'ONE LOOP, SIX POINTS', v.x + 4, v.y + 12, ink('slate', 0.85), 8); ctx.restore();
      }
    }
  };

  /* The sunset integral with three different masses, as in chiral perturbation theory. */
  var SUNSET = diagramVignette({
    key: 'sunset', paper: '2512.07727', dur: 9.5, cap: 'Sunset integrals with three mass scales',
    D: { n: { i: [0.1, 0.5], v1: [0.5, 0.5, 1], v2: [1.4, 0.5, 1], o: [1.8, 0.5] },
         e: [{ a: 'i', b: 'v1', t: 'p', c: 'brassD', lab: 'p', lo: [0, -10] },
             { a: 'v1', b: 'v2', t: 'p', bend: -0.36, c: 'brassD', lab: 'm_1', lo: [0, -10] },
             { a: 'v1', b: 'v2', t: 'p', c: 'pine', lab: 'm_2', lo: [0, -8] },
             { a: 'v1', b: 'v2', t: 'p', bend: 0.36, c: 'crimson', lab: 'm_3', lo: [0, 20] },
             { a: 'v2', b: 'o', t: 'p', c: 'brassD', lab: 'p', lo: [0, -10] }], stagger: 0.5, edgeDur: 0.7 }
  });

  /* Baryon number violation in the SMEFT. A heavy S1 leptoquark generates the four
     baryon-number-violating operators at tree level: as its mass is sent to the matching
     scale, the exchange shrinks into a point interaction. The two-loop running from
     M = 6.5 x 10^15 GeV down to 100 GeV then enhances the coefficients; the values are read
     from Fig. 2 of the paper. */
  var BNV_BARS = [['C_{duqℓ}', 2.3], ['C_{qque}', 2.45], ['C_{duue}^{+}', 2.1], ['C_{duue}^{−}', 1.4], ['S_{qqqℓ}', 4.5], ['M_{qqqℓ}', 2.0]];
  var BNV = {
    key: 'bnv', paper: '2510.08682', dur: 12.5, cap: 'Baryon number violation in the SMEFT',
    layout: function (v) { v.F = dFrame(v, 1.9, 14); v.S = Math.max(9, Math.min(12, v.w / 44)); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, F = v.F, S = v.S, split = 5.6;
      function P(x, y) { return [F.x + x * F.s, F.y + y * F.s]; }
      var a1 = R ? 0 : clamp01((split - t) / 0.5), a2 = R ? 1 : clamp01((t - split) / 0.5);
      if (a1 > 0) {                                    // the S1 exchange shrinks into the operator
        ctx.save(); ctx.globalAlpha *= a1;
        var sk = R ? 1 : easeInOut((t - 2.4) / 1.8), gap = 0.42 * (1 - sk), c = 0.95;
        var L = P(c - gap, 0.5), Rr = P(c + gap, 0.5), k = R ? 1 : ease((t - 0.3) / 0.9);
        var legs = [[0.2, 0.12, L, 'q', [-10, -2]], [0.2, 0.88, L, 'q', [-10, 12]], [1.7, 0.12, Rr, 'q', [10, -2]], [1.7, 0.88, Rr, 'ℓ', [10, 12]]];
        legs.forEach(function (g) {
          var a = P(g[0], g[1]), geo = pathGeo([a, [(a[0] + g[2][0]) / 2, (a[1] + g[2][1]) / 2], g[2]]);
          drawEdge(ctx, geo, 'f', k, ink('green', 0.92), 1.4, t);
          if (k > 0.6) arrowAt(ctx, geo, false, ink('green', 0.92));
          if (k > 0.8) drawMath(ctx, g[3], a[0] + g[4][0], a[1] + g[4][1], 13, ink('green', 0.95), 'center');
        });
        if (gap > 0.01) {
          var sg = pathGeo([L, Rr]); drawEdge(ctx, sg, 's', R ? 1 : ease((t - 1) / 0.6), ink('crimson', 0.9), 1.4, t);
          if (t > 1.4) drawMath(ctx, 'S_1', (L[0] + Rr[0]) / 2, L[1] - 9, 13, ink('crimson', 0.95), 'center');
          dot(ctx, L[0], L[1], 2.3, ink('green', 0.95)); dot(ctx, Rr[0], Rr[1], 2.3, ink('green', 0.95));
        } else opVertex(ctx, L[0], L[1], 7, 1, t);
        var mk = R ? 1 : ease((t - 4.2) / 0.5);
        if (mk > 0) { ctx.globalAlpha *= mk; drawMath(ctx, '\\rm{matching\\,at}\\,M,\\quad ΔB=ΔL=1', v.x + v.w - 4, v.y + v.h - 9, S * 0.9, ink('slate', 0.95), 'right'); }
        ctx.restore();
      }
      if (a2 > 0) {                                    // the enhancement at 100 GeV, coefficient by coefficient
        ctx.save(); ctx.globalAlpha *= a2;
        var L0 = v.x + 30, R0 = v.x + v.w - 6, T0 = v.y + 30, B0 = v.y + v.h - 26, n = BNV_BARS.length, bw = (R0 - L0) / n;
        function Y(val) { return B0 - val / 5 * (B0 - T0); }
        line(ctx, L0, T0, L0, B0, ink('green', 0.55), 1); line(ctx, L0, B0, R0, B0, ink('green', 0.55), 1);
        ctx.font = font(9, SANS, 500); ctx.fillStyle = ink('slate', 0.9); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        [1, 2, 3, 4, 5].forEach(function (g) { line(ctx, L0 - 3, Y(g), L0, Y(g), ink('green', 0.55), 1); ctx.fillText(String(g), L0 - 6, Y(g)); });
        ctx.textBaseline = 'alphabetic';
        ctx.save(); ctx.setLineDash([3, 3]); line(ctx, L0, Y(1), R0, Y(1), ink('brass', 0.7), 1); ctx.restore();
        BNV_BARS.forEach(function (b, i) {
          var k = R ? 1 : ease((t - split - 0.3 - i * 0.22) / 1.1), val = 1 + (b[1] - 1) * k, x = L0 + bw * (i + 0.2), w = bw * 0.6;
          ctx.fillStyle = ink(i === 4 ? 'crimson' : 'pine', 0.22); ctx.fillRect(x, Y(val), w, B0 - Y(val));
          ctx.fillStyle = ink(i === 4 ? 'crimson' : 'pine', 0.9); ctx.fillRect(x, Y(val) - 1, w, 2);
          drawMath(ctx, b[0], x + w / 2, B0 + 15, S * 0.82, ink('green', 0.95), 'center');
          if (k > 0.95) { ctx.font = font(9, SANS, 600); ctx.fillStyle = ink('slate', 1); ctx.textAlign = 'center'; ctx.fillText('≈' + b[1], x + w / 2, Y(val) - 5); }
        });
        drawMath(ctx, '\\frac{C(100\\,\\rm{GeV})}{C(M)},\\quad M=6.5×10^{15}\\,\\rm{GeV}', v.x + v.w - 4, v.y + 14, S * 0.85, ink('slate', 0.95), 'right');
        ctx.restore();
      }
    }
  };

  /* Drell-Yan production of a real Higgs triplet: the neutral member decays to two photons
     and the charged one, near 152 GeV, mostly to W and Z. */
  var TRIPLET = diagramVignette({
    key: 'triplet', paper: '2402.00101', dur: 10.5, cap: 'Drell-Yan production of a Higgs triplet',
    D: { n: { q: [0.12, 0.1], qb: [0.12, 0.9], v1: [0.5, 0.5, 1], v2: [0.95, 0.5, 1], vc: [1.32, 0.24, 1], vn: [1.32, 0.76, 1],
              w: [1.8, 0.06], z: [1.82, 0.4], g1: [1.82, 0.62], g2: [1.8, 0.96] },
         e: [{ a: 'q', b: 'v1', t: 'f', lab: 'q', lo: [-10, -4] }, { a: 'qb', b: 'v1', t: 'f', rev: 1, lab: "\\bar{q}'", lo: [-12, 8] },
             { a: 'v1', b: 'v2', t: 'w', lab: 'W^{±∗}', lo: [0, -12] },
             { a: 'v2', b: 'vc', t: 's', lab: 'Δ^±', lo: [-10, -8] }, { a: 'v2', b: 'vn', t: 's', lab: 'Δ^0', lo: [-12, 16] },
             { a: 'vc', b: 'w', t: 'w', lab: 'W^±', lt: 0.85, lo: [0, -9] }, { a: 'vc', b: 'z', t: 'w', lab: 'Z', lt: 0.85, lo: [4, 13] },
             { a: 'vn', b: 'g1', t: 'ph', lab: 'γ', lt: 0.85, lo: [0, -9] }, { a: 'vn', b: 'g2', t: 'ph', lab: 'γ', lt: 0.85, lo: [4, 14] }],
         stagger: 0.36, edgeDur: 0.55 },
    extra: function (v, t) {
      var k = v.reduce ? 1 : ease((t - 4) / 0.6);
      if (k > 0) drawMath(v.ctx, 'm_Δ≈152\\,\\rm{GeV}', v.x + 4, v.y + v.h - 9, 11.5, ink('slate', 0.9 * k), 'left');
    }
  });

  /* Two-loop Barr-Zee diagram for an electric dipole moment: a neutral scalar and a photon
     connect the fermion line to a loop of top quarks, W bosons or charged Higgs bosons. */
  var BARRZEE = diagramVignette({
    key: 'barrzee', paper: '2412.00523', dur: 10, cap: 'Electric dipole moments from Barr-Zee diagrams',
    D: { n: { e1: [0.1, 0.9], a1: [0.62, 0.9, 1], a2: [1.28, 0.9, 1], e2: [1.8, 0.9],
              l1: [0.95 - 0.17, 0.42 + 0.1, 1], l2: [0.95 + 0.17, 0.42 + 0.1, 1], l3: [0.95, 0.22, 1], out: [0.95, 0.0] },
         e: [{ a: 'e1', b: 'a1', t: 'f', lab: 'e', lo: [0, 16] }, { a: 'a1', b: 'a2', t: 'f' }, { a: 'a2', b: 'e2', t: 'f', lab: 'e', lo: [0, 16] },
             { a: 'a1', b: 'l1', t: 's', lab: 'h_k', lo: [-14, 0] }, { a: 'a2', b: 'l2', t: 'ph', lab: 'γ', lo: [12, 2] },
             { a: 'l1', b: 'l3', t: 'f', arc: [0.95, 0.42, 0.2, 150 * D2R, 270 * D2R] },
             { a: 'l3', b: 'l2', t: 'f', arc: [0.95, 0.42, 0.2, 270 * D2R, 390 * D2R] },
             { a: 'l2', b: 'l1', t: 'f', arc: [0.95, 0.42, 0.2, 30 * D2R, 150 * D2R] },
             { a: 'l3', b: 'out', t: 'ph', lab: 'γ', lt: 0.7, lo: [12, 0] }], stagger: 0.36, edgeDur: 0.55 },
    extra: function (v, t) {
      var k = v.reduce ? 1 : ease((t - 3.4) / 0.6), F = v.F;
      if (k > 0) drawMath(v.ctx, 't,\\,W^±,\\,H^±', F.x + 1.2 * F.s, F.y + 0.36 * F.s, 12, ink('green', 0.9 * k), 'left');
    }
  });

  /* Asymmetric di-Higgs: a heavy scalar H, produced in gluon fusion through a loop (the
     blob), decays into the singlet-like S and the Higgs boson h, seen as b b-bar plus two
     photons. */
  var DIHIGGS = diagramVignette({
    key: 'dihiggs', paper: '2303.11351', dur: 10.5, cap: 'Asymmetric di-Higgs signals',
    D: { n: { g1: [0.08, 0.12], g2: [0.08, 0.88], B: [0.42, 0.5, 'blob'], V: [0.82, 0.5, 1], S: [1.2, 0.26, 1], h: [1.2, 0.74, 1],
              b1: [1.8, 0.06], b2: [1.82, 0.42], a1: [1.82, 0.6], a2: [1.8, 0.96] },
         e: [{ a: 'g1', b: 'B', t: 'g', lab: 'g', lt: 0.35, lo: [6, -10] }, { a: 'g2', b: 'B', t: 'g', lab: 'g', lt: 0.35, lo: [6, 18] },
             { a: 'B', b: 'V', t: 's', lab: 'H', lo: [0, -9] },
             { a: 'V', b: 'S', t: 's', lab: 'S', lo: [-8, -8] }, { a: 'V', b: 'h', t: 's', lab: 'h', lo: [-8, 16] },
             { a: 'S', b: 'b1', t: 'f', lab: 'b', lt: 0.85, lo: [0, -8] }, { a: 'S', b: 'b2', t: 'f', rev: 1, lab: '\\bar{b}', lt: 0.85, lo: [4, 14] },
             { a: 'h', b: 'a1', t: 'ph', lab: 'γ', lt: 0.85, lo: [0, -9] }, { a: 'h', b: 'a2', t: 'ph', lab: 'γ', lt: 0.85, lo: [4, 14] }],
         stagger: 0.36, edgeDur: 0.55 },
    extra: function (v, t) {
      var k = v.reduce ? 1 : ease((t - 4) / 0.6);
      if (k > 0) drawMath(v.ctx, 'm_H≈650\\,\\rm{GeV},\\quad m_{b\\bar{b}}≈90\\,\\rm{GeV}', v.x + 4, v.y + v.h - 9, 11.5, ink('slate', 0.9 * k), 'left');
    }
  });

  /* Top-quark pairs in the e mu b b channel, and the new Higgs bosons that give the same
     final state: g g to H (270 GeV) to S (152 GeV) and S' (95 GeV), with S to W W and S' to b b-bar. */
  var TT_SM = { n: { g1: [0.06, 0.16], g2: [0.06, 0.84], v1: [0.36, 0.5, 1], v2: [0.66, 0.5, 1], T: [1.0, 0.22, 1], Tb: [1.0, 0.78, 1],
                     b: [1.38, 0.04], Wp: [1.3, 0.34, 1], ep: [1.8, 0.2], nu: [1.8, 0.44], bb: [1.38, 0.96], Wm: [1.3, 0.66, 1], mu: [1.8, 0.56], nb: [1.8, 0.8] },
                e: [{ a: 'g1', b: 'v1', t: 'g', lab: 'g', lt: 0.35, lo: [12, -6] }, { a: 'g2', b: 'v1', t: 'g', lab: 'g', lt: 0.35, lo: [12, 14] },
                    { a: 'v1', b: 'v2', t: 'g' },
                    { a: 'v2', b: 'T', t: 'f', lab: 't', lo: [-6, -8] }, { a: 'v2', b: 'Tb', t: 'f', rev: 1, lab: '\\bar{t}', lo: [-6, 16] },
                    { a: 'T', b: 'b', t: 'f', lab: 'b', lt: 0.8, lo: [-8, -2] }, { a: 'T', b: 'Wp', t: 'w', lab: 'W^+', lt: 0.6, lo: [-12, 10] },
                    { a: 'Wp', b: 'ep', t: 'f', rev: 1, lab: 'e^+', lt: 0.9, lo: [10, -4] }, { a: 'Wp', b: 'nu', t: 'f', lab: 'ν', lt: 0.9, lo: [10, 6] },
                    { a: 'Tb', b: 'bb', t: 'f', rev: 1, lab: '\\bar{b}', lt: 0.8, lo: [-10, 10] }, { a: 'Tb', b: 'Wm', t: 'w', lab: 'W^−', lt: 0.6, lo: [-12, -4] },
                    { a: 'Wm', b: 'mu', t: 'f', lab: 'μ^−', lt: 0.9, lo: [10, -4] }, { a: 'Wm', b: 'nb', t: 'f', rev: 1, lab: '\\bar{ν}', lt: 0.9, lo: [10, 8] }],
                stagger: 0.2, edgeDur: 0.45, labSize: 12 };
  var TT_NP = { n: { g1: [0.06, 0.16], g2: [0.06, 0.84], B: [0.34, 0.5, 'blob'], V: [0.66, 0.5, 1], S: [1.0, 0.28, 1], Sp: [1.0, 0.76, 1],
                     Wp: [1.36, 0.1, 1], Wm: [1.36, 0.44, 1], ep: [1.82, 0.02], nu: [1.82, 0.18], mu: [1.82, 0.36], nb: [1.82, 0.52],
                     b: [1.62, 0.66], bb: [1.62, 0.96] },
                e: [{ a: 'g1', b: 'B', t: 'g', lab: 'g', lt: 0.35, lo: [12, -6] }, { a: 'g2', b: 'B', t: 'g', lab: 'g', lt: 0.35, lo: [12, 14] },
                    { a: 'B', b: 'V', t: 's', lab: 'H', lo: [0, -9] },
                    { a: 'V', b: 'S', t: 's', lab: 'S', lo: [-8, -8] }, { a: 'V', b: 'Sp', t: 's', lab: "S'", lo: [-8, 16] },
                    { a: 'S', b: 'Wp', t: 'w', lab: 'W^+', lt: 0.55, lo: [-12, -4] }, { a: 'S', b: 'Wm', t: 'w', lab: 'W^−', lt: 0.55, lo: [-6, 14] },
                    { a: 'Wp', b: 'ep', t: 'f', rev: 1, lab: 'e^+', lt: 0.9, lo: [10, -3] }, { a: 'Wp', b: 'nu', t: 'f', lab: 'ν', lt: 0.9, lo: [10, 5] },
                    { a: 'Wm', b: 'mu', t: 'f', lab: 'μ^−', lt: 0.9, lo: [10, -3] }, { a: 'Wm', b: 'nb', t: 'f', rev: 1, lab: '\\bar{ν}', lt: 0.9, lo: [10, 7] },
                    { a: 'Sp', b: 'b', t: 'f', lab: 'b', lt: 0.85, lo: [0, -8] }, { a: 'Sp', b: 'bb', t: 'f', rev: 1, lab: '\\bar{b}', lt: 0.85, lo: [4, 14] }],
                stagger: 0.2, edgeDur: 0.45, labSize: 12 };
  var TTBAR = {
    key: 'ttbar', paper: '2308.07953', dur: 12, cap: 'Top-quark pairs and new Higgs bosons',
    layout: function (v) { v.sm = Object.create(v); diagramLayout(v.sm, TT_SM); v.np = Object.create(v); diagramLayout(v.np, TT_NP); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, split = 5.6;
      var a1 = R ? 0 : clamp01((split - t) / 0.5), a2 = R ? 1 : clamp01((t - split) / 0.5);
      if (a1 > 0) { ctx.save(); ctx.globalAlpha *= a1; drawDiagram(ctx, v.sm, TT_SM, t); caps(ctx, 'STANDARD MODEL', v.x + 4, v.y + 12, ink('slate', 0.85), 8); ctx.restore(); }
      if (a2 > 0) {
        ctx.save(); ctx.globalAlpha *= a2; drawDiagram(ctx, v.np, TT_NP, t - split);
        caps(ctx, 'NEW HIGGS BOSONS, SAME FINAL STATE', v.x + 4, v.y + 12, ink('crimson', 0.85), 8);
        drawMath(ctx, 'm_H≈270,\\quad m_S≈152,\\quad m_{S\'}≈95\\,\\rm{GeV}', v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9), 'left');
        ctx.restore();
      }
    }
  };

  /* The Newton polytope of the two-loop sunset: the exponents of the monomials of its
     Lee-Pomeransky polynomial G = U + F, the point configuration behind its GKZ system. */
  var POLY_PTS = [[1, 1, 0], [0, 1, 1], [1, 0, 1], [2, 1, 0], [2, 0, 1], [1, 0, 2], [0, 1, 2], [0, 2, 1], [1, 2, 0], [1, 1, 1]];
  var POLY_EDGES = [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 3],
                    [0, 3], [0, 8], [2, 4], [2, 5], [1, 6], [1, 7]];
  var POLYTOPE = {
    key: 'polytope', paper: '2211.01285', dur: 10.5, cap: 'GKZ systems and Newton polytopes',
    layout: function (v) { v.sc = Math.min(v.h * 0.3, v.w * 0.19); v.cx = v.x + v.w * 0.36; v.cy = v.y + v.h * 0.52; v.S = Math.max(9.5, Math.min(12.5, v.w / 42)); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, th = (R ? 0.7 : t * 0.45) + 0.4, tilt = 0.55;
      var cxm = 1, cym = 1, czm = 1;                              // rotate about the centre of the configuration
      var P = POLY_PTS.map(function (p) {
        var x = p[0] - cxm * 0.9, y = p[1] - cym * 0.9, z = p[2] - czm * 0.9;
        var x1 = x * Math.cos(th) - y * Math.sin(th), y1 = x * Math.sin(th) + y * Math.cos(th);
        var y2 = y1 * Math.cos(tilt) - z * Math.sin(tilt), z2 = y1 * Math.sin(tilt) + z * Math.cos(tilt);
        return [v.cx + x1 * v.sc, v.cy + z2 * -v.sc + y2 * 0.12 * v.sc, y2];
      });
      var ek = R ? 1 : ease((t - 0.6) / 1.6);
      POLY_EDGES.forEach(function (ed, i) {
        var a = P[ed[0]], b = P[ed[1]], k = R ? 1 : ease((t - 0.6 - i * 0.1) / 0.5), back = (a[2] + b[2]) / 2 > 0.3;
        if (k <= 0) return;
        ctx.save(); if (back) ctx.setLineDash([3, 3]);
        line(ctx, a[0], a[1], a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, ink(i < 3 ? 'brassD' : i < 9 ? 'pine' : 'green', back ? 0.35 : 0.85), 1.2);
        ctx.restore();
      });
      var hex = [3, 4, 5, 6, 7, 8], fk = R ? 1 : ease((t - 3.4) / 1);                 // the hexagonal face, fanned from its inner point
      if (fk > 0) {
        ctx.fillStyle = ink('pine', 0.08 * fk); ctx.beginPath();
        hex.forEach(function (i, j) { if (j) ctx.lineTo(P[i][0], P[i][1]); else ctx.moveTo(P[i][0], P[i][1]); }); ctx.closePath(); ctx.fill();
        hex.forEach(function (i, j) { var k2 = R ? 1 : ease((t - 3.8 - j * 0.18) / 0.4); if (k2 > 0) line(ctx, P[9][0], P[9][1], P[9][0] + (P[i][0] - P[9][0]) * k2, P[9][1] + (P[i][1] - P[9][1]) * k2, ink('crimson', 0.6), 1); });
      }
      P.forEach(function (p, i) {
        var k = R ? 1 : ease((t - 0.2 - i * 0.07) / 0.4);
        if (k <= 0) return;
        dot(ctx, p[0], p[1], (i === 9 ? 3.1 : 2.7) * k, ink('paper', 1)); ring(ctx, p[0], p[1], (i === 9 ? 3.1 : 2.7) * k, ink(i === 9 ? 'crimson' : 'green', 0.95), 1.2);
      });
      var S = v.S, tx = v.x + v.w * 0.66, fk2 = R ? 1 : ease((t - 0.3) / 0.8);
      ctx.save(); ctx.globalAlpha *= fk2;
      drawMath(ctx, 'G=U+F', tx, v.y + v.h * 0.3, S * 1.1, ink('green', 0.95), 'left');
      drawMath(ctx, 'U=x_1x_2+x_2x_3+x_3x_1', tx, v.y + v.h * 0.3 + S * 2.1, S * 0.85, ink('slate', 0.95), 'left');
      caps(ctx, 'SUNSET, TWO LOOPS', tx, v.y + v.h * 0.3 + S * 4, ink('slate', 0.85), 7.5);
      ctx.restore();
    }
  };

  /* HyperPrecision: the partial sums of an Appell F1 series settle digit by digit on its
     exact value, 6 ln(4/3). The sums were computed exactly when the site was built. */
  var PRECISION = {
    key: 'precision', paper: '2605.30216', dur: 11, cap: 'Hypergeometric functions to high precision',
    layout: function (v) { v.S = Math.max(9, Math.min(13, v.w / 38)); v.D = Math.max(9, Math.min(15.5, v.w / 31)); },
    frame: function (v, t) {
      var ctx = v.ctx, hp = (v.data && v.data.hp) || null, R = v.reduce;
      if (!hp) return;
      var S = v.S, fk = R ? 1 : ease(t / 0.7), sums = hp.sums, exact = hp.exact;
      ctx.save(); ctx.globalAlpha *= fk;
      drawMath(ctx, 'F_1(x,y)=\\sum_{m,n≥0}\\frac{x^m\\,y^n}{m+n+1}', v.x + 4, v.y + 26, S, ink('green', 0.95), 'left');
      drawMath(ctx, 'x=\\frac{1}{2},\\quad y=\\frac{1}{3}', v.x + v.w - 4, v.y + 26, S * 0.9, ink('slate', 0.95), 'right');
      drawMath(ctx, 'a=b_1=b_2=1,\\quad c=2', v.x + 4, v.y + 26 + S * 2.4, S * 0.82, ink('slate', 0.9), 'left');
      ctx.restore();
      var prog = R ? 1 : easeInOut((t - 0.8) / 6.5), idx = Math.min(sums.length - 1, Math.floor(prog * (sums.length - 1) + 1e-9));
      var cur = sums[idx][1], order = sums[idx][0], good = 0;
      while (good < cur.length && cur[good] === exact[good]) good++;
      var digits = cur.replace('.', '').length, correct = Math.max(0, (good > 1 ? good - 1 : good));
      var Dz = v.D, y = v.y + v.h * 0.5;                                // the value: 1. then two lines of thirty decimals
      ctx.font = font(Dz, SERIF, 400, false); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      var cw = ctx.measureText('0').width, x0 = v.x + 4, pre = ctx.measureText('1.').width + cw * 0.35;
      ctx.fillStyle = good > 1 ? ink('brassD', 1) : ink('slate', 0.3); ctx.fillText(cur.slice(0, 2) || '1.', x0, y);
      for (var i = 0; i < 60; i++) {
        var ch = cur[i + 2] || '·', ok = i + 2 < good, ln = Math.floor(i / 30), col = i % 30;
        ctx.fillStyle = ok ? ink('brassD', 1) : ink('slate', ch === '·' ? 0.18 : 0.3);
        ctx.fillText(ch, x0 + pre + col * cw + Math.floor(col / 5) * cw * 0.5, y + ln * Dz * 1.55);
      }
      caps(ctx, 'ORDER ' + order + ' · ' + correct + (correct === 1 ? ' CORRECT DIGIT' : ' CORRECT DIGITS'), v.x + 4, v.y + v.h - 6, ink('slate', 0.9), 8);
      var ek = R ? 1 : ease((t - 7.6) / 0.8);
      if (ek > 0) { ctx.save(); ctx.globalAlpha *= ek; drawMath(ctx, '=6\\,\\rm{ln}(4/3)', v.x + v.w - 4, v.y + v.h - 6, S, ink('crimson', 0.95), 'right'); ctx.restore(); }
    }
  };

  /* The method of brackets: its two basic rules, written out. */
  var BRACKETS = {
    key: 'brackets', paper: '2112.09679', dur: 10.5, cap: 'The method of brackets',
    lines: ['\\int_0^∞x^{α−1}\\,\\rm{d}x=\\langle α\\rangle',
            '\\sum_nφ_n\\,f(n)\\,\\langle an+b\\rangle=\\frac{1}{|a|}\\,f(n^∗)\\,Γ(−n^∗)',
            'φ_n=\\frac{(−1)^n}{Γ(n+1)},\\quad n^∗=−\\frac{b}{a}'],
    layout: function (v) { v.S = Math.max(10, Math.min(16, v.w / 30)); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, rate = 16, sizes = [S * 1.05, S, S * 0.88], t0 = 0.4, total = 0;
      BRACKETS.lines.forEach(function (src, i) { var ex = extent(mathBox(ctx, src, sizes[i]).prims); total += ex[1] - ex[0] + (i ? S * 1.3 : 0); });
      var y = v.y + (v.h - total) / 2 + S * 1.1;
      BRACKETS.lines.forEach(function (src, i) {
        var b = mathBox(ctx, src, sizes[i]), n = b.prims.length, k = R ? n : Math.max(0, (t - t0) * rate);
        drawMath(ctx, src, v.x + (v.w - b.w) / 2, y, sizes[i], ink(i === 2 ? 'slate' : 'green', 0.95), 'left', k);
        t0 += n / rate + 0.5;
        var ex = extent(b.prims); y += (ex[1] - ex[0]) + S * 1.3;
      });
    }
  };

  /* Triangulations of point configurations, as in Figs. 1 and 2 of the paper. For the
     Appell F1 integral the point configuration lies in the plane x + y + z = 1: a triangle
     P3 P4 P5 with P1 and P2 at the midpoints of two edges. Its five regular triangulations
     give the five series representations; each triangle corresponds, through the labels it
     leaves out, to one cone of the conic hull method. */
  var TRI_P = { 1: [0.5, 0.866], 2: [0.25, 0.433], 3: [0, 0.866], 4: [1, 0.866], 5: [0.5, 0] };
  var TRI_SETS = [
    { s: [[3, 4, 5]], b: 'B_{12}' },
    { s: [[1, 4, 5], [1, 3, 5]], b: 'B_{23}+B_{24}' },
    { s: [[2, 3, 4], [2, 4, 5]], b: 'B_{13}+B_{15}' },
    { s: [[1, 2, 3], [1, 2, 5], [1, 4, 5]], b: 'B_{23}+B_{34}+B_{45}' },
    { s: [[1, 2, 3], [1, 2, 4], [2, 4, 5]], b: 'B_{13}+B_{35}+B_{45}' }
  ];
  var TRIF = {
    key: 'triangulation', paper: '2309.00409', dur: 13, cap: 'Triangulations of point configurations',
    layout: function (v) {
      v.S = Math.max(9, Math.min(12, v.w / 44));
      var side = Math.min((v.h - 26) / 0.866, v.w * 0.5);
      v.T = { x: v.x + 10, y: v.y + (v.h - 0.866 * side) / 2 - 4, s: side };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, T = v.T, S = v.S, cols = ['brass', 'pine', 'crimson'];
      function P(i) { return [T.x + TRI_P[i][0] * T.s, T.y + TRI_P[i][1] * T.s]; }
      var step = 2.1, t0 = 1.6, idx = R ? 4 : Math.max(0, Math.min(4, Math.floor((t - t0) / step)));
      var into = R ? 1 : clamp01((t - t0 - idx * step) / 0.45), k0 = R ? 1 : ease((t - 0.3) / 0.9);
      function cells(set, a) {
        set.s.forEach(function (tri, j) {
          var p = tri.map(P);
          ctx.fillStyle = ink(cols[j % 3], 0.16 * a); ctx.beginPath();
          ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.lineTo(p[2][0], p[2][1]); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = ink('green', 0.75 * a); ctx.lineWidth = 1.1; ctx.stroke();
        });
      }
      if (t > t0 || R) {                               // the current triangulation, faded in over the last
        if (idx > 0 && into < 1) { ctx.save(); ctx.globalAlpha *= 1 - into; cells(TRI_SETS[idx - 1], 1); ctx.restore(); }
        cells(TRI_SETS[idx], into);
      }
      ctx.save(); ctx.globalAlpha *= k0;               // the triangle and its five points
      var A = P(3), B = P(4), C = P(5);
      ctx.strokeStyle = ink('brass', 0.9); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.stroke();
      [1, 2, 3, 4, 5].forEach(function (i) {
        var p = P(i), off = { 1: [0, 14], 2: [-11, -4], 3: [-10, 10], 4: [10, 10], 5: [0, -9] }[i];
        dot(ctx, p[0], p[1], 3.4, ink('paper', 1)); ring(ctx, p[0], p[1], 3.4, ink('green', 0.95), 1.3);
        ctx.font = font(9.5, SANS, 600); ctx.fillStyle = ink('green', 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('P' + i, p[0] + off[0], p[1] + off[1]); ctx.textBaseline = 'alphabetic';
      });
      ctx.restore();
      var px = T.x + T.s + 20, room = v.x + v.w - px;  // which triangulation, and the series it gives
      if (room > 110) {
        ctx.save(); ctx.globalAlpha *= k0;
        caps(ctx, 'FIVE REGULAR TRIANGULATIONS', px, v.y + 16, ink('slate', 0.85), 7.5);
        ctx.restore();
        TRI_SETS.forEach(function (set, j) {
          var shown = R || t > t0 + j * step;
          if (!shown) return;
          var on = j === idx, yy = v.y + 38 + j * (S * 2.2);
          ctx.save(); ctx.globalAlpha *= on ? 1 : 0.45;
          ctx.font = font(S * 0.95, DISPLAY, 600, true); ctx.fillStyle = ink(on ? 'brassD' : 'slate', 1); ctx.textAlign = 'left';
          ctx.fillText('(' + 'abcde'[j] + ')', px, yy);
          drawMath(ctx, set.b, px + S * 2.1, yy, S * 0.95, ink('green', 0.95), 'left');
          ctx.restore();
        });
      }
    }
  };

  /* Renormalization group evolution with scalar leptoquarks: the one-loop running of the
     three gauge couplings in the Standard Model, and with the triplet leptoquark Phi3 added
     at 10^6 TeV, which brings them together near 10^14 GeV. The beta-function coefficients
     are those of the paper; its figures are at two loops. */
  var RUNNING = {
    key: 'running', paper: '2307.06800', dur: 12, cap: 'Running couplings with scalar leptoquarks',
    layout: function (v) { v.L = v.x + 34; v.R = v.x + v.w - 40; v.T = v.y + 10; v.B = v.y + v.h - 26; },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, L = v.L, Rr = v.R, T = v.T, B = v.B;
      function X(l) { return L + (l - 2) / 15 * (Rr - L); }
      function Y(a) { return B - a / 65 * (B - T); }
      var ak = R ? 1 : ease(t / 0.6), MZ = Math.log10(91.19), lq = 9;
      line(ctx, L, T, L, B, ink('green', 0.6 * ak), 1); line(ctx, L, B, Rr, B, ink('green', 0.6 * ak), 1);
      ctx.save(); ctx.globalAlpha *= ak;
      [2, 5, 8, 11, 14, 17].forEach(function (l) { line(ctx, X(l), B, X(l), B + 4, ink('green', 0.6), 1); drawMath(ctx, '10^{' + l + '}', X(l), B + 16, 10, ink('slate', 0.9), 'center'); });
      [10, 20, 30, 40, 50, 60].forEach(function (a) { line(ctx, L, Y(a), L - 3, Y(a), ink('green', 0.6), 1); });
      drawMath(ctx, 'μ\\,[\\rm{GeV}]', Rr - 4, B - 7, 10.5, ink('slate', 0.9), 'right');
      drawMath(ctx, 'α^{−1}', L - 8, T + 8, 11, ink('slate', 0.9), 'right');
      ctx.restore();
      var inv = [59.0, 29.6, 8.47], b = [41 / 10, -19 / 6, -7], db = [1 / 5, 2, 1 / 2], cols = ['brassD', 'pine', 'crimson'];
      function sm(i, l) { return inv[i] - b[i] / TAU * (l - MZ) * Math.LN10; }
      function lqv(i, l) { return l <= lq ? sm(i, l) : sm(i, lq) - (b[i] + db[i]) / TAU * (l - lq) * Math.LN10; }
      var reach = R ? 17 : 2 + 15 * easeInOut((t - 0.8) / 4.2), lk = R ? 1 : ease((t - 5.6) / 0.6), reach2 = R ? 17 : lq + 8 * easeInOut((t - 6.2) / 3);
      inv.forEach(function (a0, i) {                  // the Standard Model, dashed once the leptoquark enters
        ctx.save(); if (lk > 0) ctx.setLineDash([4, 4]);
        ctx.strokeStyle = ink(cols[i], lk > 0 ? 0.45 : 0.92); ctx.lineWidth = 1.5; ctx.beginPath();
        for (var l = MZ; l <= reach; l += 0.1) { var y = Y(sm(i, l)); if (l === MZ) ctx.moveTo(X(l), y); else ctx.lineTo(X(l), y); }
        ctx.stroke(); ctx.restore();
      });
      if (lk > 0) {                                   // with Phi3 from 10^9 GeV on
        ctx.save(); ctx.globalAlpha *= lk;
        ctx.save(); ctx.setLineDash([2, 3]); line(ctx, X(lq), T, X(lq), B, ink('brass', 0.8), 1); ctx.restore();
        drawMath(ctx, 'Φ_3\\,\\rm{at}\\,10^6\\,\\rm{TeV}', X(lq) + 5, T + 10, 11, ink('brassD', 0.95), 'left');
        inv.forEach(function (a0, i) {
          ctx.strokeStyle = ink(cols[i], 0.95); ctx.lineWidth = 1.7; ctx.beginPath();
          for (var l = lq; l <= reach2; l += 0.05) { var y = Y(lqv(i, l)); if (l === lq) ctx.moveTo(X(l), y); else ctx.lineTo(X(l), y); }
          ctx.stroke();
          if (reach2 > lq + 0.5) drawMath(ctx, 'α_' + (i + 1) + '^{−1}', X(Math.min(reach2, 17)) + 6, Y(lqv(i, Math.min(reach2, 17))) + 4 + (i - 1) * 9, 10.5, ink(cols[i], 0.95), 'left');
        });
        var uk = R ? 1 : ease((t - 9.4) / 0.6);
        if (uk > 0) { ring(ctx, X(14.3), Y(40), 9, ink('brassD', 0.8 * uk), 1.2); drawMath(ctx, '\\rm{near}\\,10^{14}\\,\\rm{GeV}', X(14.3), Y(40) - 14, 10.5, ink('brassD', 0.95 * uk), 'center'); }
        ctx.restore();
      }
    }
  };

  var SPECV = { key: 'excesses', paper: '2306.15722', dur: 11.5, cap: 'The di-photon excesses at 95 and 152 GeV',
                ref: 'Phys. Rev. D 2023 · JHEP 2024 · Phys. Lett. B 2025',
                init: function (v) { SPEC.init.call(SPEC, v); }, frame: function (v, t) { SPEC.frame.call(SPEC, v, t); } };

  var TOUR = [CONIC, SPECV, TRIF, BNV, CONTOUR, TRIPLET, CONFORMAL, BARRZEE, SUNSET, DIHIGGS, POLYTOPE, TTBAR, PRECISION, RUNNING, BRACKETS];

  SCENES.tour = {
    touchHint: 'Tap for the next paper',
    init: function (e) {
      e.refs = (e.data && e.data.refs) || {};
      e.vs = TOUR.map(function (V) { var v = Object.create(e); v.V = V; return v; });
      e.i = 0; e.t0 = 0; e.begun = false;
    },
    layout: function (e) {
      var m = 24;
      e.box = { x: e.x - m, y: e.y - m, w: e.w + 2 * m, h: e.h + 2 * m };
      e.lay = layer(e.box.w, e.box.h, e.dpr);
      e.lay.ctx.setTransform(e.dpr, 0, 0, e.dpr, -e.box.x * e.dpr, -e.box.y * e.dpr);
      e.vs.forEach(function (v) { v.ctx = e.lay.ctx; v.laid = false; });
    },
    begin: function (e, i, t) {
      e.i = (i + e.vs.length) % e.vs.length; e.t0 = t;
      var v = e.vs[e.i], V = v.V, ref = e.refs[V.paper] || {};
      if (V.init) V.init(v);
      v.laid = false;
      e.caption(ref.u ? '<a href="' + ref.u + '" tabindex="-1" rel="noopener" target="_blank">' + V.cap + '</a>' : V.cap);
      e.hint(V.ref || ref.r || '');
    },
    frame: function (e, t) {
      if (!e.lay) return;
      if (!e.begun) { this.begin(e, 0, t); e.begun = true; }
      var v = e.vs[e.i], V = v.V, lt = e.reduce ? 60 : t - e.t0;
      if (!e.reduce && lt > V.dur) { this.begin(e, e.i + 1, t); v = e.vs[e.i]; V = v.V; lt = 0; }
      if (!v.laid) { if (V.layout) V.layout(v); v.laid = true; }
      var c = e.lay.ctx, a = e.reduce ? 1 : Math.max(0, Math.min(1, lt / 0.45, (V.dur - lt) / 0.45));
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, e.lay.c.width, e.lay.c.height); c.restore();
      c.save(); V.frame(v, lt); c.restore();
      var ctx = e.ctx;
      ctx.save(); ctx.globalAlpha = a; ctx.drawImage(e.lay.c, e.box.x, e.box.y, e.box.w, e.box.h); ctx.restore();
      var n = e.vs.length, gap = Math.min(9, (e.w - 20) / n), y = e.y + e.h + 7;       // where we are in the tour
      for (var i = 0; i < n; i++) {
        var x = e.x + 3 + i * gap;
        if (i === e.i) {
          dot(ctx, x, y, 2.6, ink('brass', 1));
          if (!e.reduce) { ctx.strokeStyle = ink('brassD', 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4.6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp01(lt / V.dur)); ctx.stroke(); }
        } else dot(ctx, x, y, 1.5, ink('slate', 0.35));
      }
    },
    click: function (e) { this.begin(e, e.i + 1, e.t); }
  };

  /* =====================================================================
     Publications and Talks
     ===================================================================== */
  SCENES.constellation = {
    touchHint: 'Tap a star to see the paper',
    init: function (e) { e.pubs = e.data.pubs || []; e.hover = -1; e.clock = 0; e.sx = -1e9; e.fade = 0; },
    layout: function (e) {
      var d = e.pubs;
      if (!d.length) return;
      var y0 = Infinity, y1 = -Infinity;
      d.forEach(function (p) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
      e.y0 = y0; e.y1 = y1;
      e.L = e.x + 6; e.R = e.x + e.w - 6; e.T = e.y + 30; e.B = e.y + e.h - 26;
      var colW = (e.R - e.L) / (y1 - y0 + 1), bandH = (e.B - e.T) * 0.42, r = seeded(3), cells = {}, pos = [];
      d.forEach(function (p, i) { var k = p.y + p.t; (cells[k] = cells[k] || []).push(i); });
      Object.keys(cells).forEach(function (k) {         // spread the papers of one year and field over their cell
        var list = cells[k], n = list.length, slot = list.map(function (_, j) { return j; });
        for (var j = n - 1; j > 0; j--) { var q = Math.floor(r() * (j + 1)), tmp = slot[j]; slot[j] = slot[q]; slot[q] = tmp; }
        list.forEach(function (i, j) {
          var p = d[i], col = e.L + (p.y - y0) * colW, top = p.t === 'pheno' ? e.T + (e.B - e.T) * 0.58 : e.T;
          var fx = n === 1 ? 0.5 : 0.16 + 0.68 * j / (n - 1), fy = (slot[j] + 0.5) / n;
          pos[i] = [col + colW * fx + (r() - 0.5) * colW * 0.08, top + bandH * (0.1 + 0.8 * fy) + (r() - 0.5) * bandH * 0.08];
        });
      });
      e.pos = pos;
      e.chains = ['fi', 'pheno'].map(function (f) {    // constellation lines, left to right within a field
        return d.map(function (p, i) { return i; }).filter(function (i) { return d[i].t === f; })
          .sort(function (a, b) { return pos[a][0] - pos[b][0]; });
      });
    },
    frame: function (e, t) {
      var d = e.pubs;
      if (!d.length || !e.pos) return;
      if (e.hover < 0) e.clock += e.dt;                // the sky holds still while a star is inspected
      var ctx = e.ctx, C = 14, c = e.reduce ? 11 : e.clock % C, span = e.R - e.L, v = (span + 24) / 8;
      var sx = e.reduce ? e.R + 1e4 : e.L - 12 + (span + 24) * clamp01((c - 0.3) / 8);
      var fade = e.reduce ? 1 : (c > C - 1 ? C - c : Math.min(1, c / 0.3));
      e.sx = sx; e.fade = fade;
      ctx.globalAlpha = fade;

      // the time axis
      var colW = span / (e.y1 - e.y0 + 1);
      ctx.strokeStyle = ink('brass', 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(e.L, e.B + 6); ctx.lineTo(e.R, e.B + 6); ctx.stroke();
      ctx.font = font(9.5, SANS, 500); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (var yr = e.y0; yr <= e.y1; yr++) {
        var x = e.L + (yr - e.y0 + 0.5) * colW;
        ctx.beginPath(); ctx.moveTo(x, e.B + 3); ctx.lineTo(x, e.B + 9); ctx.stroke();
        ctx.fillStyle = ink('slate', sx >= x - colW / 2 ? 0.9 : 0.45); ctx.fillText(String(yr), x, e.B + 21);
      }
      // the two fields, and a legend when there is room
      tracking(ctx, 1.2); ctx.font = font(8.5, SANS, 600); ctx.textAlign = 'left';
      ctx.fillStyle = ink('brassD', 0.9); ctx.fillText('FEYNMAN INTEGRALS', e.L, e.y + 12);
      ctx.fillStyle = ink('pine', 0.9); ctx.fillText('PHENOMENOLOGY', e.L, e.T + (e.B - e.T) * 0.58 - 6);
      if (e.w > 420) {
        ctx.font = font(8, SANS, 600); ctx.textAlign = 'right'; tracking(ctx, 1);
        var lx = e.R;
        [['THESIS', 'thesis'], ['PROCEEDINGS', 'proceedings'], ['ARTICLE', 'article']].forEach(function (L) {
          ctx.fillStyle = ink('slate', 0.85); ctx.fillText(L[0], lx, e.y + 12);
          var ring = L[1] === 'thesis' ? 4 : 0, mx = lx - ctx.measureText(L[0]).width - 9 - ring, my = e.y + 9;
          SCENES.constellation.star(ctx, mx, my, L[1], 'slate', 1, 0.9);
          lx = mx - 16 - ring;
        });
      }
      tracking(ctx, 0);

      // constellation lines grow with the cursor
      e.chains.forEach(function (chain, ci) {
        ctx.strokeStyle = ci ? ink('pine', 0.34) : ink('brass', 0.45); ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (var j = 1; j < chain.length; j++) {
          var a = e.pos[chain[j - 1]], b = e.pos[chain[j]];
          if (sx <= a[0]) break;
          var k = clamp01((sx - a[0]) / Math.max(1, b[0] - a[0]));
          ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k);
        }
        ctx.stroke();
      });

      // the stars light up as the cursor passes
      d.forEach(function (p, i) {
        var q = e.pos[i], age = (sx - q[0]) / v;
        if (age < 0) return;
        var k = e.reduce ? 1 : ease(age / 0.35), tw = 0.8 + 0.2 * Math.sin(t * 1.9 + i * 2.3);
        var col = p.t === 'pheno' ? 'pine' : 'brassD';
        if (!e.reduce && age < 1) {
          ctx.strokeStyle = ink(col, 0.5 * (1 - age)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(q[0], q[1], 5 + age * 12, 0, TAU); ctx.stroke();
        }
        ctx.fillStyle = ink(col, 0.12 * tw * k); ctx.beginPath(); ctx.arc(q[0], q[1], 8.5, 0, TAU); ctx.fill();
        SCENES.constellation.star(ctx, q[0], q[1], p.k, col, 0.5 + 0.5 * k, k);
        if (i === e.hover) {
          ctx.lineWidth = 1.2; ctx.strokeStyle = ink('brass', 1);
          ctx.beginPath(); ctx.arc(q[0], q[1], 8.5, 0, TAU); ctx.stroke();
        }
      });

      // the cursor
      if (!e.reduce && c < 8.35 && sx > e.L - 12) {
        var g = ctx.createLinearGradient(sx - 40, 0, sx, 0);
        g.addColorStop(0, ink('brass', 0)); g.addColorStop(1, ink('brass', 0.14));
        ctx.fillStyle = g; ctx.fillRect(sx - 40, e.T - 6, 40, e.B - e.T + 12);
        ctx.strokeStyle = ink('brass', 0.7); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, e.T - 6); ctx.lineTo(sx, e.B + 6); ctx.stroke();
      }
    },
    star: function (ctx, x, y, kind, col, s, a) {   // articles filled, proceedings hollow, the thesis ringed
      var r = (kind === 'proceedings' ? 2.5 : 3.1) * s;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      if (kind === 'proceedings') {
        ctx.fillStyle = ink('paper', a); ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = ink(col, 0.95 * a); ctx.stroke();
      } else { ctx.fillStyle = ink(col, 0.95 * a); ctx.fill(); }
      if (kind === 'thesis') {
        ctx.lineWidth = 1; ctx.strokeStyle = ink(col, 0.85 * a);
        ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.stroke();
      }
    },
    move: function (e, p) {
      var best = -1, bd = 11;
      if (p && e.pos && e.fade > 0.5) e.pubs.forEach(function (q, i) {
        var s = e.pos[i], dd = Math.hypot(s[0] - p.x, s[1] - p.y);
        if (dd < bd && e.sx >= s[0]) { bd = dd; best = i; }
      });
      if (best === e.hover) return;
      e.hover = best;
      e.stage.style.cursor = best >= 0 ? 'pointer' : '';
      e.caption(best >= 0 ? e.pubs[best].y + ' · ' + e.pubs[best].n : null);
    },
    click: function (e, x, y) {                       // on a touch screen, the first tap names the paper
      SCENES.constellation.move(e, { x: x, y: y });
      var p = e.pubs[e.hover];
      if (!p) return;
      if (e.touch && e.tapped !== e.hover) { e.tapped = e.hover; return; }
      if (p.u) window.open(p.u, '_blank', 'noopener');
    }
  };
  SCENES.talkmap = {
    init: function (e) {
      var d = e.data, talks = d.talks || [], years = [], seg = 2.4;
      e.view = d.view || [0, 0, 1200, 482];
      e.land = d.land && window.Path2D ? new Path2D(d.land) : null;
      e.grat = d.grat && window.Path2D ? new Path2D(d.grat) : null;
      talks.forEach(function (tk) { if (years.indexOf(tk.y) < 0) years.push(tk.y); });
      years.forEach(function (yr, yi) {
        var mates = talks.filter(function (tk) { return tk.y === yr; }), gap = Math.min(0.45, 1.8 / mates.length);
        mates.forEach(function (tk, j) { tk.at = yi * seg + 0.35 + j * gap; });
      });
      e.talks = talks; e.years = years; e.seg = seg; e.end = years.length * seg; e.cycle = e.end + 4.5;
    },
    layout: function (e) {                             // the map is drawn once per size
      var v = e.view, s = Math.min(e.w / v[2], e.h / v[3]), L = layer(e.w, e.h, e.dpr), c = L.ctx;
      e.s = s; e.ox = e.x + (e.w - v[2] * s) / 2 - v[0] * s; e.oy = e.y + (e.h - v[3] * s) / 2 - v[1] * s;
      var vx = e.ox - e.x + v[0] * s, vy = e.oy - e.y + v[1] * s, vw = v[2] * s, vh = v[3] * s;
      c.save(); c.beginPath(); c.rect(vx, vy, vw, vh); c.clip();
      c.translate(e.ox - e.x, e.oy - e.y); c.scale(s, s);
      if (e.grat) { c.lineWidth = 0.7 / s; c.strokeStyle = ink('pine', 0.14); c.stroke(e.grat); }
      if (e.land) {
        c.fillStyle = '#e1e5d5'; c.fill(e.land);
        c.lineWidth = 0.8 / s; c.lineJoin = 'round'; c.strokeStyle = '#b3bc9f'; c.stroke(e.land);
      }
      c.restore();
      edgeFade(c, vx, vy, vw, vh, 0.1, 0.16);
      e.map = L.c;
    },
    frame: function (e, t) {
      var ctx = e.ctx, talks = e.talks, s = e.s, ox = e.ox, oy = e.oy;
      var c = e.reduce ? e.end + 1 : t % e.cycle, fade = e.reduce ? 1 : (c > e.cycle - 0.9 ? (e.cycle - c) / 0.9 : 1);
      var yi = Math.floor(c / e.seg);
      if (e.map) ctx.drawImage(e.map, e.x, e.y, e.w, e.h);
      if (!e.reduce) {                                 // the caption follows the year
        if (yi < e.years.length && c > 0.2) {
          var yr = e.years[yi], n = talks.filter(function (tk) { return tk.y === yr; }).length;
          e.caption(yr + ' · ' + n + (n === 1 ? ' talk' : ' talks'));
        } else e.caption(null);
      }
      ctx.globalAlpha = fade;

      // an arc from each talk to the next, bright while new
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      for (var i = 1; i < talks.length; i++) {
        var b = talks[i];
        if (c < b.at) break;
        var a = talks[i - 1], age = c - b.at;
        var x1 = ox + a.x * s, y1 = oy + a.v * s, x2 = ox + b.x * s, y2 = oy + b.v * s, dist = Math.hypot(x2 - x1, y2 - y1);
        if (dist < 2) continue;
        var nx = -(y2 - y1) / dist, ny = (x2 - x1) / dist;
        if (ny > 0) { nx = -nx; ny = -ny; }             // bow every arc to the north
        var lift = dist * (dist < 60 ? 0.4 : 0.22), mx = (x1 + x2) / 2 + nx * lift, my = (y1 + y2) / 2 + ny * lift;
        var k = e.reduce ? 1 : ease(age / 0.6), al = e.reduce ? 0.22 : 0.16 + 0.6 * Math.exp(-age / 1.3);
        var steps = Math.max(2, Math.ceil(28 * k)), px = x1, py = y1;
        ctx.strokeStyle = ink('brass', al); ctx.beginPath(); ctx.moveTo(x1, y1);
        for (var j = 1; j <= steps; j++) {
          var u = k * j / steps, w1 = (1 - u) * (1 - u), w2 = 2 * u * (1 - u), w3 = u * u;
          px = w1 * x1 + w2 * mx + w3 * x2; py = w1 * y1 + w2 * my + w3 * y2; ctx.lineTo(px, py);
        }
        ctx.stroke();
        if (k < 1) { ctx.fillStyle = ink('brassD', 1); ctx.beginPath(); ctx.arc(px, py, 1.9, 0, TAU); ctx.fill(); }
      }

      // the cities: a dot that grows with every talk there, hollow when the talks were online
      var cities = {}, order = [], newest = null;
      talks.forEach(function (tk) {
        if (c < tk.at) return;
        var m = cities[tk.c];
        if (!m) { m = cities[tk.c] = { n: 0, live: 0, x: ox + tk.x * s, y: oy + tk.v * s, yr: 0, at: 0 }; order.push(m); }
        m.n++; if (!tk.o) m.live = 1; m.yr = tk.y; m.at = tk.at; newest = tk;
      });
      var curYear = e.years[Math.min(yi, e.years.length - 1)];
      order.forEach(function (m) {
        var r = 1.7 + 1.15 * Math.sqrt(m.n), age = c - m.at;
        if (!e.reduce && age < 1.4) {
          ctx.strokeStyle = ink('pine', 0.55 * (1 - age / 1.4)); ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.arc(m.x, m.y, r + 2 + age * 14, 0, TAU); ctx.stroke();
        }
        if (!e.reduce && c < e.end && m.yr === curYear) {
          ctx.strokeStyle = ink('brass', 0.7); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(m.x, m.y, r + 3, 0, TAU); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, TAU);
        if (m.live) { ctx.fillStyle = ink('green', 0.9); ctx.fill(); }
        else { ctx.fillStyle = ink('paper', 0.95); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = ink('green', 0.9); ctx.stroke(); }
      });

      // the city of the newest talk, named for a moment
      if (newest && !e.reduce) {
        var la = c - newest.at, lk = la < 0.15 ? la / 0.15 : la < 1.1 ? 1 : 1 - (la - 1.1) / 0.3;
        if (lk > 0) {
          var m2 = cities[newest.c], right = m2.x > e.x + e.w - 90;
          ctx.font = font(10, SANS, 600); tracking(ctx, 0.3);
          ctx.textAlign = right ? 'right' : 'left'; ctx.textBaseline = 'middle';
          var lx = m2.x + (right ? -9 : 9), ly = m2.y - 10;
          ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = ink('paper', 0.92 * lk); ctx.strokeText(newest.c, lx, ly);
          ctx.fillStyle = ink('green', lk); ctx.fillText(newest.c, lx, ly);
          tracking(ctx, 0);
        }
      }
    }
  };

  /* =====================================================================
     Funding: the fellowships and grants as medals along the years
     ===================================================================== */
  function medal(ctx, x, y, r, label, k, lift) {
    ctx.save(); ctx.globalAlpha *= k;
    var tail = function (sgn, col) {                // ribbon tails with notched ends
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x + sgn * 0.12 * r, y + 0.55 * r); ctx.lineTo(x + sgn * 0.62 * r, y + 0.45 * r);
      ctx.lineTo(x + sgn * 0.78 * r, y + 1.75 * r); ctx.lineTo(x + sgn * 0.52 * r, y + 1.52 * r); ctx.lineTo(x + sgn * 0.3 * r, y + 1.85 * r);
      ctx.closePath(); ctx.fill();
    };
    tail(-1, ink('pine', 0.9)); tail(1, ink('crimson', 0.85));
    if (lift > 0) { ctx.shadowColor = 'rgba(122,95,42,' + (0.45 * lift) + ')'; ctx.shadowBlur = 12 * lift; }
    var g = ctx.createRadialGradient(x - 0.35 * r, y - 0.4 * r, 0.1 * r, x, y, r);
    g.addColorStop(0, '#f6ebc6'); g.addColorStop(0.55, '#d6bb7c'); g.addColorStop(1, '#9a7a3c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ring(ctx, x, y, r, ink('brassD', 1), 1.1); ring(ctx, x, y, r * 0.8, 'rgba(122,95,42,.5)', 0.8);
    var fs = r * 0.5; ctx.font = font(fs, SANS, 700);
    var w = ctx.measureText(label).width;
    if (w > r * 1.35) { fs *= r * 1.35 / w; ctx.font = font(fs, SANS, 700); }
    ctx.fillStyle = '#5b4520'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 0.5);
    ctx.restore();
  }
  function glint(ctx, x, y, r, u) {                 // a band of light passing over a medal
    if (u <= 0 || u >= 1) return;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    var gx = x - 1.6 * r + 3.2 * r * u, g = ctx.createLinearGradient(gx - r * 0.5, y - r, gx + r * 0.5, y + r);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
  }
  SCENES.medals = {
    touchHint: 'Tap for the next award',
    init: function (e) { e.aw = (e.data && e.data.awards) || []; e.sel = -1; e.selAt = 0; e.nextSel = 5; },
    layout: function (e) {
      var A = e.aw, n = A.length;
      if (!n) return;
      e.L = e.x + 12; e.R = e.x + e.w - 12; e.base = e.y + e.h - 30;
      e.mr = Math.max(10, Math.min(16.5, e.w / 30, e.h / 12));
      var low = e.base - 12 - 1.9 * e.mr, high = e.y + e.mr + 10;
      e.pos = A.map(function (a, i) {                 // evenly along the path, rising with each award
        return [e.L + (i + 0.5) / n * (e.R - e.L), low - (low - high) * (i / Math.max(1, n - 1))];
      });
    },
    frame: function (e, t) {
      var A = e.aw, n = A.length, ctx = e.ctx, R = e.reduce;
      if (!n || !e.pos) return;
      line(ctx, e.L, e.base, e.R, e.base, ink('brass', 0.55), 1);                                   // the years
      ctx.font = font(9.5, SANS, 500); ctx.textAlign = 'center';
      A.forEach(function (a, i) {
        var x = e.pos[i][0];
        line(ctx, x, e.base - 3, x, e.base + 3, ink('brass', 0.6), 1);
        ctx.fillStyle = ink(i === e.sel ? 'brassD' : 'slate', 0.9); ctx.fillText(String(a.y), x, e.base + 15);
      });
      var split = A.filter(function (a) { return a.y < 2024; }).length;                           // doctoral years and postdoctoral years
      if (split > 0 && split < n) {
        caps(ctx, 'MASTER’S AND DOCTORAL', (e.pos[0][0] + e.pos[split - 1][0]) / 2, e.base + 27, ink('slate', 0.7), 7, 'center');
        caps(ctx, 'POSTDOCTORAL', (e.pos[split][0] + e.pos[n - 1][0]) / 2, e.base + 27, ink('slate', 0.7), 7, 'center');
        var xm = (e.pos[split - 1][0] + e.pos[split][0]) / 2;
        line(ctx, xm, e.base + 18, xm, e.base + 30, ink('brass', 0.45), 1);
      }
      ctx.save(); ctx.strokeStyle = ink('brass', 0.55); ctx.lineWidth = 1.2; ctx.setLineDash([2, 4]); ctx.beginPath();  // the path of the awards
      var shownPath = R ? n : (t - 0.3) / 0.55 + 1;
      for (var i = 0; i < n && i < shownPath; i++) { var p = e.pos[i]; if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
      ctx.stroke(); ctx.restore();
      if (!R && t > 4.4 && t > e.nextSel) { e.sel = (e.sel + 1) % n; e.selAt = t; e.nextSel = t + 3.2; this.announce(e); }
      if (R && e.sel < 0) { e.sel = n - 1; this.announce(e); }
      A.forEach(function (a, i) {
        var p = e.pos[i], age = t - 0.3 - i * 0.55, k = R ? 1 : ease(age / 0.5);
        if (k <= 0) return;
        var sel = i === e.sel, lift = sel ? (R ? 1 : ease((t - e.selAt) / 0.4)) : 0, s = (R ? 1 : 1 + 0.35 * (1 - ease(age / 0.5))) * (1 + 0.1 * lift);
        if (!R && age < 1.2) ring(ctx, p[0], p[1], e.mr * (1 + age * 1.4), ink('brass', 0.5 * (1 - age / 1.2)), 1);
        medal(ctx, p[0], p[1] - 3 * lift, e.mr * s, a.s, k * (e.sel < 0 || sel ? 1 : 0.62), lift);
        if (sel && !R) glint(ctx, p[0], p[1] - 3 * lift, e.mr * s, (t - e.selAt - 0.2) / 0.9);
      });
    },
    announce: function (e) {
      var a = e.aw[e.sel];
      e.caption(a.n);
      e.hint(a.s + ', ' + a.c + ' · ' + a.y + ' · ' + a.amt + (a.st ? ' · awarded, ' + a.st : ''));
    },
    click: function (e) {
      if (!e.aw.length) return;
      e.sel = (e.sel + 1) % e.aw.length; e.selAt = e.t; e.nextSel = e.t + 5; this.announce(e);
    }
  };

  /* =====================================================================
     Teaching: equations from the courses, written on a blackboard
     ===================================================================== */
  var EQUATIONS = [
    { name: 'The Dirac equation', course: 'Quantum Field Theory', lines: ['(iγ^μ\\,∂_μ−m)\\,ψ=0'] },
    { name: 'The Feynman propagator', course: 'Quantum Field Theory', lines: ['D_F(p)=\\frac{i}{p^2−m^2+iε}'] },
    { name: 'Unitarity of the CKM matrix', course: 'Flavour Physics', lines: ['V_{ud}V^∗_{ub}+V_{cd}V^∗_{cb}+V_{td}V^∗_{tb}=0'] },
    { name: 'Gauss’s law and Faraday’s law', course: 'Introductory Physics', lines: ['\\oint\\bf{E}\\cdot\\rm{d}\\bf{A}=\\frac{Q}{ε_0}', '\\oint\\bf{E}\\cdot\\rm{d}\\bf{l}=−\\frac{\\rm{d}Φ_B}{\\rm{d}t}'] }
  ];
  function courseOf(e, eq) {
    var list = (e.data && e.data.courses) || [];
    for (var i = 0; i < list.length; i++) if (list[i].c.indexOf(eq.course) === 0) return list[i];
    return null;
  }
  function chalk(e, index) {                          // one equation in chalk, with its writing schedule
    var eq = EQUATIONS[index], bw = e.bw, bh = e.bh, L = layer(bw, bh, e.dpr), c = L.ctx;
    var S = Math.min(34, bh * 0.18), lines, wmax, htot, gap;
    for (var pass = 0; pass < 3; pass++) {             // shrink until it fits the board
      lines = eq.lines.map(function (src) { var b = typeset(c, parseTeX(src), S, false, ''); b.ext = extent(b.prims); return b; });
      gap = 0.55 * S; wmax = 0; htot = -gap;
      lines.forEach(function (ln) { wmax = Math.max(wmax, ln.w); htot += ln.ext[1] - ln.ext[0] + gap; });
      var fit = Math.min((bw - 64) / wmax, (bh - 104) / htot, 1);
      if (fit > 0.995) break;
      S *= fit;
    }
    var rects = [], T = 0.2, course = courseOf(e, eq);
    if (course) {                                      // the course, written small in the corner
      var lab = course.c + ' · ' + course.i + ', ' + course.y, fs = Math.min(13, bw / 30);
      c.font = font(fs, DISPLAY, 600, true);
      var lw = c.measureText(lab).width;
      if (lw > bw - 40) { fs *= (bw - 40) / lw; c.font = font(fs, DISPLAY, 600, true); lw = c.measureText(lab).width; }
      c.fillStyle = 'rgba(238,231,214,.62)'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(lab, 18, 26);
      c.fillRect(18, 31, lw, 0.8);
      rects.push({ r: [16, 26 - fs, lw + 4, fs + 8], t0: T, dur: 0.5 }); T += 0.6;
    }
    var y = 42 + (bh - 50 - htot) / 2;
    lines.forEach(function (ln) {
      var ox = (bw - wmax) / 2, oy = y - ln.ext[0];
      ln.prims.forEach(function (p) {
        var r, dur;
        if (p.t === 'rule') {
          c.fillStyle = 'rgba(238,231,214,.93)'; c.fillRect(ox + p.x, oy + p.y, p.w, p.h);
          r = [ox + p.x - 1, oy + p.y - 2, p.w + 2, p.h + 4]; dur = 0.14 + p.w / 520;
        } else {
          c.font = p.f;
          c.fillStyle = 'rgba(238,231,214,.93)'; c.fillText(p.s, ox + p.x, oy + p.y);
          c.fillStyle = 'rgba(238,231,214,.28)'; c.fillText(p.s, ox + p.x + 0.45, oy + p.y - 0.35);
          r = [ox + p.x - 1.5, oy + p.y - p.a - 2, p.w + 3, p.a + p.d + 4]; dur = 0.05 + p.w / 320;
        }
        rects.push({ r: r, t0: T, dur: dur }); T += dur + 0.012;
      });
      y += ln.ext[1] - ln.ext[0] + gap;
    });
    var rnd = seeded(31 * index + 7);                  // chalk grain: tiny gaps in every stroke
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath();
    rects.forEach(function (q) {
      var r = q.r, n = Math.round(r[2] * r[3] / 5);
      for (var i = 0; i < n; i++) {
        var gx = r[0] + rnd() * r[2], gy = r[1] + rnd() * r[3], gs = 0.3 + rnd() * 0.55;
        c.moveTo(gx + gs, gy); c.arc(gx, gy, gs, 0, TAU);
      }
    });
    c.fill(); c.globalCompositeOperation = 'source-over';
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;      // a hand-drawn box around the equation
    rects.slice(course ? 1 : 0).forEach(function (q) { x0 = Math.min(x0, q.r[0]); y0 = Math.min(y0, q.r[1]); x1 = Math.max(x1, q.r[0] + q.r[2]); y1 = Math.max(y1, q.r[1] + q.r[3]); });
    x0 -= 13; y0 -= 9; x1 += 13; y1 += 9;
    function j() { return (rnd() - 0.5) * 3.2; }
    var pts = [[x0 + j(), y0 + j()], [x1 + j(), y0 + j()], [x1 + j(), y1 + j()], [x0 + j(), y1 + j()]];
    pts.push([pts[0][0], pts[0][1]], [pts[0][0] + 9, pts[0][1] - 0.6]);
    var per = 0;
    for (var i = 1; i < pts.length; i++) per += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { c: L.c, rects: rects, Tw: T, box: { pts: pts, per: per } };
  }
  function revealed(ctx, q, tau, ox, oy, grow) {    // clip path of the glyphs written by time tau
    var tip = null;
    q.rects.forEach(function (g) {
      var k = clamp01((tau - g.t0) / g.dur);
      if (k <= 0) return;
      ctx.rect(ox + g.r[0] - grow, oy + g.r[1] - grow, g.r[2] * k + 2 * grow, g.r[3] + 2 * grow);
      if (k < 1) tip = [ox + g.r[0] + g.r[2] * k, oy + g.r[1] + g.r[3] * (0.45 + 0.2 * Math.sin(tau * 37))];
    });
    return tip;
  }
  function boxStroke(ctx, q, k, ox, oy, alpha) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(ox, oy);
    ctx.setLineDash([q.box.per * k, q.box.per + 20]);
    ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(220,197,143,' + alpha + ')';        // yellow chalk
    ctx.beginPath();
    q.box.pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.stroke(); ctx.restore();
  }
  function board(e) {
    var L = layer(e.w + 60, e.h + 60, e.dpr), c = L.ctx, x = e.bx - e.x + 30, y = e.by - e.y + 30, w = e.bw, h = e.bh;
    c.save();
    c.shadowColor = 'rgba(20,38,33,.3)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
    var g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#28473e'); g.addColorStop(1, '#1b3530');
    roundRect(c, x, y, w, h, 7); c.fillStyle = g; c.fill();
    c.restore();
    c.save(); roundRect(c, x, y, w, h, 7); c.clip();
    var r = seeded(42);
    for (var i = 0; i < 7; i++) {                      // the haze of old chalk
      var sx = x + r() * w, sy = y + r() * h, sr = 40 + r() * 90, sg = c.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(238,231,214,.045)'); sg.addColorStop(1, 'rgba(238,231,214,0)');
      c.fillStyle = sg; c.fillRect(sx - sr, sy - sr, 2 * sr, 2 * sr);
    }
    var lg = c.createRadialGradient(x + w * 0.2, y, 0, x + w * 0.2, y, w * 0.9);
    lg.addColorStop(0, 'rgba(255,255,255,.05)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = lg; c.fillRect(x, y, w, h);
    c.restore();
    c.lineWidth = 2; c.strokeStyle = 'rgba(168,137,79,.95)'; roundRect(c, x + 1, y + 1, w - 2, h - 2, 6); c.stroke();
    c.lineWidth = 1; c.strokeStyle = 'rgba(238,231,214,.1)'; roundRect(c, x + 6, y + 6, w - 12, h - 12, 3); c.stroke();
    c.lineCap = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(168,137,79,.9)';          // chalk tray
    c.beginPath(); c.moveTo(x + 16, y + h + 8); c.lineTo(x + w - 16, y + h + 8); c.stroke();
    c.fillStyle = '#efe9da'; roundRect(c, x + w - 76, y + h + 2.4, 22, 4.2, 2); c.fill();
    c.fillStyle = '#e4dcc8'; roundRect(c, x + w - 47, y + h + 2.4, 9, 4.2, 2); c.fill();
    return L.c;
  }
  SCENES.chalkboard = {
    touchHint: 'Tap for the next equation',
    init: function (e) { e.idx = 0; e.t0 = 0.6; e.cur = null; e.cut = null; },
    layout: function (e) {
      e.bx = e.x + 8; e.by = e.y + 4; e.bw = e.w - 16; e.bh = e.h - 20;
      e.board = board(e); e.residue = layer(e.bw, e.bh, e.dpr); e.cur = null;
    },
    frame: function (e, t) {
      var ctx = e.ctx;
      ctx.drawImage(e.board, e.x - 30, e.y - 30, e.w + 60, e.h + 60);
      ctx.drawImage(e.residue.c, e.bx, e.by, e.bw, e.bh);
      if (!e.cur) e.cur = chalk(e, e.idx);
      var q = e.cur, tau = e.reduce ? 1e3 : t - e.t0, tBox = q.Tw + 0.2, tErase = q.Tw + 4.6, tEnd = tErase + 0.9;
      e.caption(EQUATIONS[e.idx].name);
      var written = e.cut !== null ? e.cut : tau, boxK = ease((written - tBox) / 0.7);
      if (tau < tErase) {                              // writing, glyph by glyph
        ctx.save(); ctx.beginPath();
        var tip = revealed(ctx, q, tau, e.bx, e.by, 0);
        ctx.clip(); ctx.drawImage(q.c, e.bx, e.by, e.bw, e.bh); ctx.restore();
        boxStroke(ctx, q, boxK, e.bx, e.by, 0.75);
        if (tip) {
          var g = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 7);
          g.addColorStop(0, 'rgba(238,231,214,.35)'); g.addColorStop(1, 'rgba(238,231,214,0)');
          ctx.fillStyle = g; ctx.fillRect(tip[0] - 7, tip[1] - 7, 14, 14);
          ctx.fillStyle = 'rgba(246,241,229,.95)'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 1.7, 0, TAU); ctx.fill();
        }
      } else if (tau < tEnd) {                         // the eraser sweeps from left to right
        var front = e.bx - 20 + (e.bw + 40) * easeInOut((tau - tErase) / 0.9);
        ctx.save(); ctx.beginPath(); ctx.rect(front, e.by, e.bx + e.bw - front + 40, e.bh); ctx.clip();
        ctx.save(); ctx.beginPath(); revealed(ctx, q, written, e.bx, e.by, 0); ctx.clip();
        ctx.drawImage(q.c, e.bx, e.by, e.bw, e.bh); ctx.restore();
        boxStroke(ctx, q, boxK, e.bx, e.by, 0.75);
        ctx.restore();
        ctx.save(); roundRect(ctx, e.bx + 2, e.by + 2, e.bw - 4, e.bh - 4, 6); ctx.clip();
        var dust = ctx.createLinearGradient(front - 30, 0, front + 4, 0);
        dust.addColorStop(0, 'rgba(238,231,214,0)'); dust.addColorStop(1, 'rgba(238,231,214,.11)');
        ctx.fillStyle = dust; ctx.fillRect(front - 30, e.by, 34, e.bh);
        ctx.restore();
      } else {                                         // a faint smear stays behind, as on a real board
        var r = e.residue.ctx;
        r.save(); r.globalCompositeOperation = 'destination-out'; r.fillStyle = 'rgba(0,0,0,.5)'; r.fillRect(0, 0, e.bw, e.bh); r.restore();
        r.save(); r.beginPath(); revealed(r, q, written, 0, 0, 5); r.clip();
        r.globalAlpha = 0.025; r.drawImage(q.c, -2.5, 0.6, e.bw, e.bh); r.drawImage(q.c, 2.5, -0.6, e.bw, e.bh);
        r.globalAlpha = 0.02; r.drawImage(q.c, 0, 0, e.bw, e.bh);
        r.restore();
        boxStroke(r, q, boxK, 0, 0, 0.04);
        e.idx = (e.idx + 1) % EQUATIONS.length; e.cur = null; e.cut = null; e.t0 = t + 0.35;
      }
    },
    click: function (e) {                              // wipe the board and write the next one
      var q = e.cur;
      if (!q || e.reduce) return;
      var tau = e.t - e.t0, tErase = q.Tw + 4.6;
      if (tau < 0 || tau >= tErase) return;
      e.cut = tau; e.t0 = e.t - tErase;
    }
  };

  /* =====================================================================
     Supervision: the students and their projects
       Feynman diagrams turned into Mellin-Barnes integrals
       a compendium of two-body decays
       new techniques for perturbative quantum field theory
     ===================================================================== */
  var DECAYS = [
    { p: 's', d: ['f', 'f'], rev: [0, 1], lab: 'H\\to b\\bar{b}' }, { p: 'w', d: ['f', 'f'], rev: [0, 1], lab: 'Z\\to μ^+μ^−' },
    { p: 'w', d: ['f', 'f'], rev: [1, 0], lab: 'W^+\\to e^+ν' }, { p: 'f', d: ['f', 'w'], rev: [0, 0], lab: 't\\to b\\,W^+' },
    { p: 's', d: ['ph', 'ph'], rev: [0, 0], lab: 'π^0\\to γγ' }
  ];
  function seg(ctx, x1, y1, x2, y2, type, k, color, lw, t, rev) {   // one line of a mini diagram
    var g = pathGeo([[x1, y1], [x2, y2]]);
    if (type === 'f' || type === 'p' || type === 's') { g = pathGeo([[x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2], [x2, y2]]); }
    drawEdge(ctx, g, type, k, color, lw, t);
    if (type === 'f' && k > 0.6) arrowAt(ctx, g, rev, color, 3.8);
  }
  function loopArc(ctx, cx, cy, r, a0, a1, k, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * k); ctx.stroke();
  }
  SCENES.mentoring = {
    touchHint: 'Tap for the next student',
    init: function (e) { e.st = (e.data && e.data.students) || []; e.sel = 0; e.selAt = 0; e.nextSel = 6; },
    layout: function (e) {
      var n = Math.max(1, e.st.length);
      e.pw = e.w / n; e.vh = e.h - 50; e.su = Math.min(e.pw / 150, e.vh / 105);
    },
    frame: function (e, t) {
      var ctx = e.ctx, n = e.st.length, R = e.reduce;
      if (!n) return;
      if (!R && t > e.nextSel) { e.sel = (e.sel + 1) % n; e.selAt = t; e.nextSel = t + 5.5; this.announce(e); }
      if (e.selAt === 0 && !e.said) { e.said = 1; this.announce(e); }
      e.cy = e.y + (e.h - (116 * e.su + 31)) / 2 + 50 * e.su;           // the projects and their timeline, centred
      var by = e.cy + 66 * e.su + 16;
      line(ctx, e.x + e.pw * 0.5, by, e.x + e.pw * (n - 0.5), by, ink('brass', 0.5), 1);      // the students, in time
      for (var i = 0; i < n; i++) {
        var s = e.st[i], cx = e.x + e.pw * (i + 0.5), cy = e.cy, u = e.su, on = i === e.sel;
        var a = R ? 1 : (on ? 1 : 0.38), lt = R ? 30 : (on ? t - e.selAt : 30);
        ctx.save(); ctx.globalAlpha *= a;
        this.project[i % 3](ctx, cx, cy, u, lt, t, R);
        ctx.restore();
        dot(ctx, cx, by, on ? 3.6 : 2.6, on ? ink('brass', 1) : ink('slate', 0.6));
        caps(ctx, s.y + ' · ' + s.l.replace(' student', '').toUpperCase(), cx, by + 15, on ? ink('brassD', 1) : ink('slate', 0.6), 7.5, 'center');
      }
    },
    project: [
      function (ctx, cx, cy, u, lt, t, R) {            // a one-loop bubble becomes a Mellin-Barnes integral
        var k1 = R ? 1 : ease(lt / 1), k2 = R ? 1 : ease((lt - 1.2) / 0.6), k3 = R ? 1 : ease((lt - 1.8) / 1.2), bx = cx - 44 * u, r = 15 * u;
        seg(ctx, bx - 30 * u, cy, bx - r, cy, 'p', k1, ink('brassD', 0.95), 1.3, t);
        loopArc(ctx, bx, cy, r, Math.PI, Math.PI * 3, k1, ink('green', 0.95), 1.4);
        seg(ctx, bx + r, cy, bx + 30 * u, cy, 'p', k1, ink('brassD', 0.95), 1.3, t);
        if (k2 > 0) { drawMath(ctx, '\\to', cx + 2 * u, cy + 5, 16 * Math.max(0.8, u), ink('slate', 0.9 * k2), 'center'); }
        var mx = cx + 38 * u;
        if (k3 > 0) {
          line(ctx, mx, cy + 30 * u, mx, cy + 30 * u - 60 * u * k3, ink('green', 0.95), 1.4);
          for (var j = 0; j < 3; j++) {
            var kk = clamp01(k3 * 3 - j);
            if (kk > 0) { dot(ctx, mx + (9 + j * 9) * u, cy, 2.2 * kk, ink('pine', 0.95)); dot(ctx, mx - (8 + j * 9) * u, cy, 2.2 * kk, ink('brassD', 0.95)); }
          }
        }
      },
      function (ctx, cx, cy, u, lt, t, R) {            // two-body decays, one after another
        var i = Math.floor((R ? 0 : Math.max(0, lt)) / 2.2) % DECAYS.length, dk = R ? 1 : ease(((lt % 2.2) + 2.2) % 2.2 / 0.9);
        var D = DECAYS[R ? 0 : (Math.floor(Math.max(0, lt) / 2.2) % DECAYS.length)], th = (R ? 0.5 : t * 0.35);
        seg(ctx, cx - 52 * u, cy, cx, cy, D.p, dk, ink(D.p === 's' ? 'crimson' : D.p === 'w' ? 'pine' : 'green', 0.95), 1.3, t, 0);
        var L = 44 * u, a1 = 0.55 + 0.12 * Math.sin(th * 2.3), a2 = -0.5 - 0.1 * Math.sin(th * 1.7), kd = clamp01(dk * 1.6 - 0.6);
        var c0 = function (d) { return ink(d === 'ph' ? 'brassD' : d === 'w' ? 'pine' : 'green', 0.95); };
        seg(ctx, cx, cy, cx + L * Math.cos(a1), cy - L * Math.sin(a1), D.d[0], kd, c0(D.d[0]), 1.3, t, D.rev[0]);
        seg(ctx, cx, cy, cx + L * Math.cos(a2), cy - L * Math.sin(a2), D.d[1], kd, c0(D.d[1]), 1.3, t, D.rev[1]);
        dot(ctx, cx, cy, 2.4, ink('green', 0.95));
        drawMath(ctx, D.lab, cx, cy + 50 * u, 12, ink('green', 0.95 * (R ? 1 : clamp01(dk * 2))), 'center');
        return i;
      },
      function (ctx, cx, cy, u, lt, t, R) {            // a propagator, order by order in perturbation theory
        var w = 30 * u, xs = [cx - 52 * u, cx, cx + 52 * u], labels = ['+', '+'];
        for (var j = 0; j < 3; j++) {
          var k = R ? 1 : ease((lt - j * 0.9) / 0.8), x = xs[j];
          if (k <= 0) continue;
          line(ctx, x - w / 2 - 4 * u, cy, x - w / 2 - 4 * u + (w + 8 * u) * Math.min(1, k * 1.3), cy, ink('green', 0.95), 1.3);
          if (j >= 1) loopArc(ctx, x, cy, 8 * u, Math.PI, Math.PI * 3, k, ink('pine', 0.95), 1.3);
          if (j === 2) { line(ctx, x - 8 * u, cy - 8 * u * 0, x + 8 * u, cy, ink('pine', 0.95), 1.3); loopArc(ctx, x, cy, 12 * u, Math.PI, Math.PI * 2, k, ink('brassD', 0.9), 1.1); }
          if (j < 2 && k > 0.9) drawMath(ctx, labels[j], x + 26 * u, cy + 5, 13, ink('slate', 0.9), 'center');
        }
        var dk = R ? 1 : ease((lt - 2.9) / 0.6);
        if (dk > 0) drawMath(ctx, '+\\,\\cdots', cx + 52 * u + 24 * u, cy + 5, 13, ink('slate', 0.9 * dk), 'left');
        caps(ctx, 'TREE · ONE LOOP · TWO LOOPS', cx, cy + 40 * u, ink('slate', 0.75), 7, 'center');
      }
    ],
    announce: function (e) {
      var s = e.st[e.sel];
      if (!s) return;
      e.caption(s.n + ', ' + s.l.replace('’', '’'));
      e.hint(s.i + ' · ' + s.y);
    },
    click: function (e) { if (!e.st.length) return; e.sel = (e.sel + 1) % e.st.length; e.selAt = e.t; e.nextSel = e.t + 7; this.announce(e); }
  };

  /* =====================================================================
     CV: the path from Kolkata to Stanford, on a timeline
     ===================================================================== */
  SCENES.timeline = {
    touchHint: 'Tap for the next stage',
    init: function (e) { e.st = (e.data && e.data.stages) || []; e.now = (e.data && e.data.now) || 2026.8; e.c0 = 0; e.cur = -2; },
    layout: function (e) {
      if (!e.st.length) return;
      e.L = e.x + 16; e.R = e.x + e.w - 30; e.ay = e.y + e.h * 0.62;
      e.y0 = Math.floor(e.st[0].s); e.y1 = e.now + 0.5;
    },
    frame: function (e, t) {
      var ctx = e.ctx, st = e.st, R = e.reduce, T = 9.5, C = 14;
      if (!st.length) return;
      var c = R ? 99 : (t - e.c0) % C, yc = R ? e.now : e.y0 + (e.now - e.y0) * clamp01(c / T);
      function X(yr) { return e.L + (yr - e.y0) / (e.y1 - e.y0) * (e.R - e.L); }
      line(ctx, e.L, e.ay, e.R, e.ay, ink('green', 0.35), 1);                                        // the years
      ctx.font = font(9, SANS, 500); ctx.textAlign = 'center'; ctx.fillStyle = ink('slate', 0.85);
      for (var yr = e.y0; yr <= Math.floor(e.now); yr += 2) { line(ctx, X(yr), e.ay + 7, X(yr), e.ay + 11, ink('green', 0.4), 1); ctx.fillText(String(yr), X(yr), e.ay + 23); }
      var groups = [];                                                                                // cities, bracketed above
      st.forEach(function (s, i) { var g = groups[groups.length - 1]; if (g && g.c === s.c) g.e = i; else groups.push({ c: s.c, s: i, e: i }); });
      groups.forEach(function (g) {
        var a = st[g.s].s, b = st[g.e].e || e.now, k = R ? 1 : clamp01((yc - a) / 0.8);
        if (k <= 0) return;
        var xa = X(a) + 2, xb = X(b) - 2, yb = e.ay - 44;
        ctx.save(); ctx.globalAlpha *= k;
        line(ctx, xa, yb + 4, xa, yb, ink('brass', 0.8), 1); line(ctx, xa, yb, xb, yb, ink('brass', 0.8), 1); line(ctx, xb, yb, xb, yb + 4, ink('brass', 0.8), 1);
        caps(ctx, g.c.toUpperCase(), (xa + xb) / 2, yb - 6, ink('brassD', 0.95), 7.5, 'center');
        ctx.font = font(12.5, DISPLAY, 500, true);
        var name = st[g.s].os || st[g.s].o, nw = ctx.measureText(name).width;
        var nx = Math.max(e.x + nw / 2 + 2, Math.min(e.x + e.w - nw / 2 - 2, (xa + xb) / 2));
        ctx.fillStyle = ink('slate', 0.9); ctx.textAlign = 'center'; ctx.fillText(name, nx, e.ay + 42);
        ctx.restore();
      });
      var active = -1;
      st.forEach(function (s, i) {                                                                   // the stages
        var end = s.e || e.now;
        if (yc < s.s) return;
        if (yc <= end + 0.001) active = i;
        var xa = X(s.s), xb = X(Math.min(end, yc)), col = s.k === 'edu' ? 'brass' : 'pine';
        ctx.strokeStyle = ink(col, 0.95); ctx.lineWidth = 6; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(xa + 1.5, e.ay); ctx.lineTo(Math.max(xa + 1.5, xb - 1.5), e.ay); ctx.stroke();
        var k = R ? 1 : clamp01((yc - s.s) / 0.6);
        ctx.save(); ctx.globalAlpha *= k;
        drawMath(ctx, '\\rm{' + s.t + '}', (xa + X(end)) / 2, e.ay - 14, 13, ink(i === active ? 'green' : 'slate', 0.95), 'center');
        ctx.restore();
        dot(ctx, xa, e.ay, 4, ink('paper', 1)); ring(ctx, xa, e.ay, 4, ink(col === 'brass' ? 'brassD' : 'pine', 1), 1.3);
      });
      if (!R) {                                                                                       // the present, moving along
        var xc = X(yc), g = ctx.createRadialGradient(xc, e.ay, 0, xc, e.ay, 12);
        g.addColorStop(0, ink('brass', 0.5)); g.addColorStop(1, ink('brass', 0));
        ctx.fillStyle = g; ctx.fillRect(xc - 12, e.ay - 12, 24, 24); dot(ctx, xc, e.ay, 2.8, ink('brassD', 1));
      }
      if (c > T || R) {
        var pk = R ? 0.5 : ((t * 0.8) % 1);
        ring(ctx, X(e.now), e.ay, 4 + pk * 12, ink('pine', 0.6 * (1 - pk)), 1.2);
        caps(ctx, 'NOW', X(e.now) + 4, e.ay + 23, ink('pine', 0.9), 7.5, 'left');
      }
      var show = c > T && !R ? -1 : active;
      if (show !== e.cur) {
        e.cur = show;
        if (show < 0) { e.caption(null); e.hint(null); }
        else { e.caption(st[show].title + ', ' + st[show].o); e.hint(st[show].c + ' · ' + st[show].w); }
      }
    },
    click: function (e) {                              // jump to the start of the next stage
      var st = e.st, T = 9.5, C = 14;
      if (!st.length) return;
      var c = (e.t - e.c0) % C, yc = e.y0 + (e.now - e.y0) * clamp01(c / T), next = null;
      for (var i = 0; i < st.length; i++) if (st[i].s > yc + 0.05) { next = st[i].s; break; }
      var target = next === null ? 0.01 : (next - e.y0) / (e.now - e.y0) * T + 0.3;
      e.c0 = e.t - target;
    }
  };

  /* =====================================================================
     Contact: a globe turning under SLAC, with messages arriving from afar
     ===================================================================== */
  var CITIES = [[51.51, -0.13], [35.68, 139.69], [-33.87, 151.21], [-23.55, -46.63], [12.97, 77.59], [39.9, 116.4],
                [-33.92, 18.42], [43.65, -79.38], [19.43, -99.13], [-34.6, -58.38], [37.57, 126.98], [22.57, 88.36],
                [41.88, -87.63], [21.31, -157.86], [-36.85, 174.76], [-33.45, -70.67], [40.71, -74.0], [47.38, 8.54],
                [64.14, -21.94], [4.71, -74.07], [61.22, -149.9], [-12.05, -77.04], [1.35, 103.82], [55.75, 37.62]];
  function unit(lat, lon) { var c = Math.cos(lat); return [c * Math.cos(lon), c * Math.sin(lon), Math.sin(lat)]; }
  SCENES.globe = {
    touchHint: 'Drag to turn the globe',
    init: function (e) {
      e.rings = ((e.data && e.data.land) || []).map(function (r) {
        var out = [];
        for (var i = 0; i < r.length; i += 2) out.push(unit(r[i + 1] / 10 * D2R, r[i] / 10 * D2R));
        return out;
      });
      e.home = unit(37.42 * D2R, -122.2 * D2R); e.spin = 0; e.dragLon = 0; e.arcs = []; e.nextArc = 0.8; e.pings = [];
    },
    layout: function (e) { e.Rg = Math.min(e.h * 0.46, e.w * 0.3); e.cx = e.x + e.w / 2; e.cy = e.y + e.h / 2 + 3; },
    frame: function (e, t) {
      var ctx = e.ctx, Rg = e.Rg, cx = e.cx, cy = e.cy, R = e.reduce;
      if (!R && !e.dragging) { e.spin += e.dt; e.dragLon *= Math.pow(0.35, e.dt); }
      var lam0 = -122.2 * D2R + 0.5 * Math.sin((R ? 1.2 : e.spin) * 0.16) + e.dragLon, phi0 = 0.38;
      var cl0 = Math.cos(lam0), sl0 = Math.sin(lam0), cp = Math.cos(phi0), sp = Math.sin(phi0);
      function view(V) {                            // rotate a point of the Earth into view: [x right, y up, z towards us]
        var x = V[1] * cl0 - V[0] * sl0, c = V[0] * cl0 + V[1] * sl0;
        return [x, cp * V[2] - sp * c, sp * V[2] + cp * c];
      }
      var halo = ctx.createRadialGradient(cx, cy, Rg * 0.9, cx, cy, Rg * 1.18);                    // atmosphere
      halo.addColorStop(0, ink('brass', 0.16)); halo.addColorStop(1, ink('brass', 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, Rg * 1.18, 0, TAU); ctx.fill();
      var sea = ctx.createRadialGradient(cx - Rg * 0.35, cy - Rg * 0.4, Rg * 0.1, cx, cy, Rg);
      sea.addColorStop(0, '#fbfaf4'); sea.addColorStop(1, '#e6eadf');
      ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(cx, cy, Rg, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Rg, 0, TAU); ctx.clip();
      ctx.strokeStyle = ink('pine', 0.13); ctx.lineWidth = 0.7;                                      // graticule
      var lat, lon, first, P;
      for (lon = -180; lon < 180; lon += 30) {
        ctx.beginPath(); first = true;
        for (lat = -80; lat <= 80; lat += 4) { P = view(unit(lat * D2R, lon * D2R)); if (P[2] < 0) { first = true; continue; } if (first) ctx.moveTo(cx + Rg * P[0], cy - Rg * P[1]); else ctx.lineTo(cx + Rg * P[0], cy - Rg * P[1]); first = false; }
        ctx.stroke();
      }
      for (lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); first = true;
        for (lon = -180; lon <= 180; lon += 4) { P = view(unit(lat * D2R, lon * D2R)); if (P[2] < 0) { first = true; continue; } if (first) ctx.moveTo(cx + Rg * P[0], cy - Rg * P[1]); else ctx.lineTo(cx + Rg * P[0], cy - Rg * P[1]); first = false; }
        ctx.stroke();
      }
      ctx.fillStyle = '#d9e0cc'; ctx.strokeStyle = '#a9b596'; ctx.lineWidth = 0.8; ctx.lineJoin = 'round';   // land
      e.rings.forEach(function (ringPts) {
        var pts = ringPts.map(view), any = false;
        for (var i = 0; i < pts.length; i++) if (pts[i][2] > 0) { any = true; break; }
        if (!any) return;
        ctx.beginPath();
        pts.forEach(function (p, i) {
          var x = p[0], y = p[1];
          if (p[2] < 0) { var l = Math.hypot(x, y) || 1; x /= l; y /= l; }     // hidden points sit on the rim
          if (i) ctx.lineTo(cx + Rg * x, cy - Rg * y); else ctx.moveTo(cx + Rg * x, cy - Rg * y);
        });
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        for (var j = 1; j < pts.length; j++) {
          if (pts[j][2] > 0 && pts[j - 1][2] > 0) { ctx.moveTo(cx + Rg * pts[j - 1][0], cy - Rg * pts[j - 1][1]); ctx.lineTo(cx + Rg * pts[j][0], cy - Rg * pts[j][1]); }
        }
        ctx.stroke();
      });
      var shade = ctx.createRadialGradient(cx - Rg * 0.4, cy - Rg * 0.45, Rg * 0.2, cx, cy, Rg * 1.05);   // light from the upper left
      shade.addColorStop(0, 'rgba(255,255,255,.18)'); shade.addColorStop(0.7, 'rgba(255,255,255,0)'); shade.addColorStop(1, 'rgba(28,53,47,.12)');
      ctx.fillStyle = shade; ctx.fillRect(cx - Rg, cy - Rg, 2 * Rg, 2 * Rg);
      ctx.restore();
      ring(ctx, cx, cy, Rg, ink('brass', 0.75), 1.2);
      var H = view(e.home), hx = cx + Rg * H[0], hy = cy - Rg * H[1], homeUp = H[2] > 0.05;
      if (!R && t > e.nextArc) {                                                                     // a message sets out
        var tries = 0, V, P2;
        do { V = CITIES[Math.floor(Math.random() * CITIES.length)]; P2 = view(unit(V[0] * D2R, V[1] * D2R)); } while (P2[2] < 0.12 && ++tries < 12);
        if (P2[2] >= 0.12) e.arcs.push({ from: unit(V[0] * D2R, V[1] * D2R), t0: t });
        e.nextArc = t + 0.75 + Math.random() * 0.5;
      }
      if (R && !e.arcs.length) { [0, 3, 7, 8, 13].forEach(function (i) { var V = CITIES[i]; e.arcs.push({ from: unit(V[0] * D2R, V[1] * D2R), t0: -1.2 }); }); }
      var alive = [];
      e.arcs.forEach(function (a) {
        var age = R ? 1.2 : t - a.t0, travel = 1.9;
        if (age > travel + 1.2) return;
        alive.push(a);
        var A = a.from, B = e.home, dotAB = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])), om = Math.acos(dotAB), so = Math.sin(om) || 1;
        var head = R ? 1 : clamp01(age / travel), fade = R ? 0.5 : clamp01(1 - (age - travel) / 1.2), lift = 0.06 + 0.2 * om / Math.PI;
        ctx.strokeStyle = ink('brassD', 0.75 * fade); ctx.lineWidth = 1.1; ctx.beginPath();
        var started = false, last = null;
        for (var s = 0; s <= 40 * head; s++) {
          var u = s / 40, w1 = Math.sin((1 - u) * om) / so, w2 = Math.sin(u * om) / so, h = 1 + lift * Math.sin(Math.PI * u);
          var Pv = view([(w1 * A[0] + w2 * B[0]) * h, (w1 * A[1] + w2 * B[1]) * h, (w1 * A[2] + w2 * B[2]) * h]);
          var vis = Pv[2] > 0 || Pv[0] * Pv[0] + Pv[1] * Pv[1] > 1;
          var sx = cx + Rg * Pv[0], sy = cy - Rg * Pv[1];
          if (!vis) { started = false; continue; }
          if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
          last = [sx, sy];
        }
        ctx.stroke();
        if (last && head < 1) dot(ctx, last[0], last[1], 2, ink('brassD', 1));
        if (!R && head >= 1 && !a.arrived) { a.arrived = true; e.pings.push(t); }
      });
      e.arcs = alive;
      if (homeUp) {                                                                                   // SLAC
        e.pings = e.pings.filter(function (p) { return t - p < 1.4; });
        e.pings.forEach(function (p) { var k = (t - p) / 1.4; ring(ctx, hx, hy, 4 + k * 16, ink('crimson', 0.6 * (1 - k)), 1.2); });
        dot(ctx, hx, hy, 3.4, ink('crimson', 1)); ring(ctx, hx, hy, 5.2, ink('paper', 0.9), 1.2);
        caps(ctx, 'SLAC', hx + 8, hy - 6, ink('green', 0.95), 8);
      }
    },
    drag: function (e, dx) { e.dragLon -= dx / (e.Rg || 100); }
  };

  var scene = SCENES[host.getAttribute('data-scene')];
  if (scene) run(scene);
})();
