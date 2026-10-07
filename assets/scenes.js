/* Page scenes for the inner pages.
   Each page header has its own animation, drawn on the header canvas inside the
   stage on the right, in the brass and green palette of the site:
     Research       a tour of the papers, one small animation for each
     Publications   a constellation of the papers, by year and field
     Talks          the talks around the world, one after another
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
  /* the inks by day and by night (dark mode is <html data-theme="dark">), and the map and globe colours */
  var INKS = {
    light: { green: '28,53,47', pine: '46,92,78', brass: '168,137,79', brassD: '122,95,42', slate: '74,90,102',
             crimson: '110,44,52', cream: '238,231,214', paper: '252,251,248', plum: '90,61,85' },
    dark:  { green: '232,226,208', pine: '127,184,163', brass: '201,168,104', brassD: '214,180,110', slate: '170,182,186',
             crimson: '216,132,142', cream: '238,231,214', paper: '14,23,20', plum: '200,160,192' }
  };
  var TONES = {
    light: { land: '#e1e5d5', coast: '#b3bc9f', sea0: '#fbfaf4', sea1: '#e6eadf', gland: '#d9e0cc', gcoast: '#a9b596',
             shadeHi: 'rgba(255,255,255,.18)', shadeLo: 'rgba(28,53,47,.12)' },
    dark:  { land: '#1f2d27', coast: '#3b5047', sea0: '#17241f', sea1: '#0f1916', gland: '#26372f', gcoast: '#4a6155',
             shadeHi: 'rgba(255,255,255,.05)', shadeLo: 'rgba(0,0,0,.35)' }
  };
  var RGB = {}, TC = {};
  function palette() {
    var mode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', k;
    for (k in INKS[mode]) RGB[k] = INKS[mode][k];
    for (k in TONES[mode]) TC[k] = TONES[mode][k];
  }
  palette();
  document.addEventListener('themechange', palette);
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
    return function (html, now) {                   // now: change the text at once, as for a running count
      if (!el) return;
      html = html || fallback();
      if (html === shown) return;
      shown = html;
      if (reduce || now) { clearTimeout(timer); el.innerHTML = html; el.classList.remove('swap'); return; }
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
    var still = function () { return document.documentElement.classList.contains('still'); };   // paused by the button
    var env = { ctx: ctx, dpr: dpr, stage: stage, data: readData(), t: 0, dt: 0, active: false, reduce: reduce || still(), touch: touch };
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
      if (!env.active || !visible || document.hidden || still()) { last = 0; return; }   // (a pause keeps the last picture)
      env.dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now; if (!env.hovered) env.t += env.dt;     // a scene that cycles on its own waits while the pointer rests on it
      draw();
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (!env.active) return;
      if (env.reduce || still()) { draw(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    env.redraw = start;
    function local(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    function inside(p) { return p.x >= env.x && p.x <= env.x + env.w && p.y >= env.y && p.y <= env.y + env.h + 30; }

    if (scene.init) scene.init(env);
    if (env.reduce) env.t = scene.still || 0;
    document.addEventListener('motionchange', function () {   // paused: the whole picture, as without motion. Played: on from there
      if (reduce) return;
      env.reduce = still(); last = 0;
      start();
    });
    size();
    start();
    document.addEventListener('themechange', function () { size(); start(); });   // lay out again in the new inks
    var dragged = 0;
    if (scene.click) stage.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('a')) return;          // a link in the caption opens the paper
      if (dragged > 6) { dragged = 0; return; }
      var p = local(ev);
      if (env.active && inside(p)) { env.hovered = false; scene.click(env, p.x, p.y); start(); }   // a click means: go on
    });
    if (scene.pauseOnHover && window.matchMedia && matchMedia('(hover: hover)').matches) {   // not on touch screens
      stage.addEventListener('mouseenter', function () { env.hovered = true; });
      stage.addEventListener('mouseleave', function () { env.hovered = false; });
    }
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
      var release = function () {
        if (grab && scene.release) { scene.release(env); start(); }   // a scene may act when the drag ends (a swipe)
        grab = null; env.dragging = false;
      };
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
    }
    if (scene.step) document.addEventListener('keydown', function (ev) {   // the arrow keys step through it, while it is in view
      if ((ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      var tg = ev.target, r = stage.getBoundingClientRect();
      if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
      if (!env.active || document.querySelector('dialog[open]') || r.bottom < 60 || r.top > window.innerHeight - 60) return;
      env.hovered = false; scene.step(env, ev.key === 'ArrowRight' ? 1 : -1); start();
      ev.preventDefault();
    });
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
      out.push({ k: 'g', s: c === "'" ? '′' : c }); i++;   // a quote mark in maths is a prime, as in TeX
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
        var big = nd.k === 'big', sz = big ? S * (nd.sum ? 1.45 : 1.85) : nd.s === '∝' ? S * 1.3 : S;
        var it = !big && st !== 'rm' && st !== 'bf' && ITALIC.test(nd.s);
        var op = !script && !big && (nd.op || '=+−≠∝≈<>≤≥'.indexOf(nd.s) >= 0) && (prev === 'x' || nd.s === '→' || (nd.s === '=' && prev === 'start'));
        var pad = '=→≠∝≈<>≤≥'.indexOf(nd.s) >= 0 ? 0.3 * S : nd.s === '·' ? 0.14 * S : 0.22 * S;
        if (op) x += pad;
        var f = font(sz, SERIF, st === 'bf' ? 700 : 400, it), m = measure(ctx, nd.s, f, sz), y = 0;
        if (big) y = -0.27 * S + (m.a - m.d) / 2;     // centre the big operator on the maths axis
        else if (sz !== S) y = 0.07 * S;               // and a larger proportional sign too
        prims.push({ t: 'txt', s: nd.s, f: f, x: x, y: y, w: m.w, a: m.a, d: m.d, big: big });
        x += m.w + (it ? 0.04 * S : 0);
        if (op) x += pad;
        asc = Math.max(asc, m.a - y); desc = Math.max(desc, m.d + y);
        prev = op ? 'op' : '([⟨,;'.indexOf(nd.s) >= 0 ? 'open' : 'x';      // a minus after these is a sign
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

  /* The double box and hexagon conformal integrals, as in Fig. 1 of the paper, drawn in dual
     (position) space: the black vertices are the integration points, the open circles the
     six external points x1 to x6, which both integrals share. Each line carries the power of
     its propagator, and the dual momentum-space graph is dashed: each of its lines crosses
     exactly one line of the position-space graph. Conformal invariance fixes the sum of the
     powers at every vertex. The paper writes one representation of each integral as series of
     Horn type: 44 for the double box and 26 for the hexagon. */
  var CONF_X = (function () {                       // x1 ... x6 on a regular hexagon
    var p = [];
    for (var k = 0; k < 6; k++) { var an = (240 - k * 60) * D2R; p.push([2.02 * Math.cos(an), 2.02 * Math.sin(an)]); }
    return p;
  })();
  var CONF_BOX = {
    v: [[-0.8, 0], [0.8, 0]],
    l: [[0, 1, 'a'], [0, 2, 'b'], [0, 3, 'c'], [0, -2, 'ℓ'], [1, 4, 'd'], [1, 5, 'e'], [1, 6, 'f']],
    dual: [[[-1.6, 0.9], [1.6, 0.9]], [[-1.6, -0.9], [1.6, -0.9]], [[-1.6, -0.9], [-1.6, 0.9]], [[1.6, -0.9], [1.6, 0.9]], [[0, -0.9], [0, 0.9]]],
    legs: [[-1.6, 0.9, 150], [0, 0.9, 90], [1.6, 0.9, 30], [1.6, -0.9, -30], [0, -0.9, -90], [-1.6, -0.9, -150]],
    cond: 'a+b+c+ℓ=D,\\quad d+e+f+ℓ=D', top: 'TWO LOOPS, SIX POINTS', n: '44 SERIES OF HORN TYPE'
  };
  var CONF_HEX = (function () {
    var dual = [], legs = [], r = 1.155;
    for (var k = 0; k < 6; k++) {
      var a0 = (210 + k * 60) * D2R, a1 = (270 + k * 60) * D2R;
      dual.push([[r * Math.cos(a0), r * Math.sin(a0)], [r * Math.cos(a1), r * Math.sin(a1)]]);
      legs.push([r * Math.cos(a0), r * Math.sin(a0), 210 + k * 60]);
    }
    return { v: [[0, 0]], l: [[0, 1, 'a'], [0, 2, 'b'], [0, 3, 'c'], [0, 4, 'd'], [0, 5, 'e'], [0, 6, 'f']], dual: dual, legs: legs,
             cond: 'a+b+c+d+e+f=D', top: 'ONE LOOP, SIX POINTS', n: '26 SERIES OF HORN TYPE' };
  })();
  function confGraph(ctx, v, G, t, R) {            // one position-space graph, drawn line by line
    var P = v.P, u = P.u, i;
    function Q(p) { return [P.cx + p[0] * u, P.cy - p[1] * u]; }
    function end(j) { return j < 0 ? G.v[-j - 1] : CONF_X[j - 1]; }
    var dk = R ? 1 : ease((t - 3.2) / 0.8);
    if (dk > 0) {                                   // the dual momentum-space graph
      ctx.save(); ctx.setLineDash([3, 3]); ctx.globalAlpha *= dk;
      G.dual.forEach(function (s) { var a = Q(s[0]), b = Q(s[1]); line(ctx, a[0], a[1], b[0], b[1], ink('brass', 0.75), 1); });
      G.legs.forEach(function (s) {
        var a = Q(s), an = s[2] * D2R, b = Q([s[0] + 0.42 * Math.cos(an), s[1] + 0.42 * Math.sin(an)]);
        line(ctx, a[0], a[1], b[0], b[1], ink('brass', 0.75), 1);
      });
      ctx.restore();
    }
    var shown = {};
    G.l.forEach(function (L, j) {
      var k = R ? 1 : ease((t - 0.6 - j * 0.3) / 0.45);
      if (k <= 0) return;
      shown[L[0]] = 1; if (L[1] < 0 && k > 0.95) shown[-L[1] - 1] = 1;
      var a = Q(G.v[L[0]]), b = Q(end(L[1]));
      line(ctx, a[0], a[1], a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, ink('green', 0.9), 1.5);
      if (k > 0.8) {
        var dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, f = 0.74, sd = G.v.length > 1 && L[1] > 3 ? -1 : 1;
        var lx = a[0] + dx * f + (-dy / n) * 9 * sd, ly = a[1] + dy * f + (dx / n) * 9 * sd;
        if (L[1] < 0) { lx = a[0] + dx * 0.3; ly = a[1] - 8; }
        ctx.save(); ctx.globalAlpha *= clamp01((k - 0.8) / 0.2);
        drawMath(ctx, L[2], lx, ly + 4, v.S * 1.05, ink('brassD', 1), 'center');
        ctx.restore();
      }
    });
    G.v.forEach(function (p, j) { if (shown[j]) { var q = Q(p); dot(ctx, q[0], q[1], 3.4, ink('green', 1)); } });
    var ck = R ? 1 : ease((t - 3.8) / 0.6);
    if (ck > 0) {
      ctx.save(); ctx.globalAlpha *= ck;
      drawMath(ctx, G.cond, P.cx, v.y + v.h - 6, v.S * 0.95, ink('slate', 0.95), 'center');
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha *= R ? 1 : ease(t / 0.5);
    caps(ctx, G.top, v.x + 4, v.y + 11, ink('slate', 0.85), 7.5);
    if (v.w > 400) caps(ctx, G.n, v.x + 4, v.y + 24, ink('brassD', 0.85), 7.5);
    ctx.restore();
  }
  var CONFORMAL = {
    key: 'conformal', paper: '2007.08360', dur: 13, cap: 'Double box and hexagon conformal integrals',
    layout: function (v) {
      v.S = Math.max(9, Math.min(12, v.w / 44));
      var top = v.w < 400 ? 14 : 0, u = Math.min((v.h - 30 - top) / 4.15, (v.w - 20) / 5.4);   // room for the label on phones
      v.P = { u: u, cx: v.x + v.w / 2, cy: v.y + 4 + top + (v.h - 30 - top) / 2 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, P = v.P, split = 6.6, u = P.u;
      var pk = R ? 1 : ease((t - 0.1) / 0.6);       // the six external points, shared by both graphs
      CONF_X.forEach(function (p, i) {
        var x = P.cx + p[0] * u, y = P.cy - p[1] * u, n = Math.hypot(p[0], p[1]);
        ctx.save(); ctx.globalAlpha *= pk;
        dot(ctx, x, y, 3.3, ink('paper', 1)); ring(ctx, x, y, 3.3, ink('slate', 0.9), 1.2);
        drawMath(ctx, 'x_' + (i + 1), x + p[0] / n * 13, y - p[1] / n * 12 + 4, v.S * 0.85, ink('slate', 0.95), 'center');
        ctx.restore();
      });
      var a1 = R ? 1 : clamp01((split - t) / 0.45), a2 = R ? 0 : clamp01((t - split) / 0.45);
      if (a1 > 0) { ctx.save(); ctx.globalAlpha *= a1; confGraph(ctx, v, CONF_BOX, t, R); ctx.restore(); }
      if (a2 > 0) { ctx.save(); ctx.globalAlpha *= a2; confGraph(ctx, v, CONF_HEX, t - split, R); ctx.restore(); }
      var lk = R ? 1 : ease((t - 3.2) / 0.8) * Math.max(a1, ease((t - split - 3.2) / 0.8));
      if (lk > 0 && v.w > 330) {                    // what the dashed lines are
        ctx.save(); ctx.globalAlpha *= lk; ctx.setLineDash([3, 3]);
        line(ctx, v.x + v.w - 102, v.y + 8, v.x + v.w - 88, v.y + 8, ink('brass', 0.85), 1.1); ctx.restore();
        ctx.save(); ctx.globalAlpha *= lk; caps(ctx, 'MOMENTUM SPACE', v.x + v.w - 2, v.y + 11, ink('slate', 0.8), 7, 'right'); ctx.restore();
      }
    }
  };

  /* Massive one-loop conformal integrals. The three-fold MB representation of the massive
     conformal triangle has six Gamma functions in its numerator, with the vectors of Table 1
     of the paper. Of the twenty triples, 17 span three-dimensional cones, which give 17
     building blocks and 14 series representations. As in Figs. 3 and 4, the cones C125 and
     C126 meet in the master cone spanned by (-1,0,0), (0,-1,0) and (0,0,1), and their two
     building blocks form the series representation S2 = B125 + B126. */
  var MC_E = [[-1, 0, 0], [0, -1, 0], [0, 0, -1], [1, 1, 0], [1, 0, 1], [0, 1, 1]];
  var MC_CONES = [{ g: [0, 1, 4], col: 'crimson', lab: 'C_{125}', at: 2.1 }, { g: [0, 1, 5], col: 'brass', lab: 'C_{126}', at: 3.9 }];
  var MASSCONF = {
    key: 'massconf', paper: '2012.15646', dur: 13, cap: 'Massive one-loop conformal integrals',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 46));
      var side = Math.min(v.h - 6, v.w * 0.52);
      v.C = { cx: v.x + side * 0.5 + 4, cy: v.y + v.h * 0.55, u: side * 0.36 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, C = v.C, S = v.S;
      var th = (27 + 13 * Math.sin((R ? 2 : t) * 0.42)) * D2R, ph = 0.46;   // rocking gently, seen a little from above
      function pr(p) {
        var x1 = p[0] * Math.cos(th) - p[1] * Math.sin(th), y1 = p[0] * Math.sin(th) + p[1] * Math.cos(th);
        return [C.cx + x1 * C.u, C.cy - (p[2] * Math.cos(ph) + y1 * Math.sin(ph)) * C.u, y1 * Math.cos(ph) - p[2] * Math.sin(ph)];
      }
      function unit(e, L) { var n = Math.hypot(e[0], e[1], e[2]); return [e[0] / n * L, e[1] / n * L, e[2] / n * L]; }
      function cone(gens, col, fill, edge, lw) {     // a cone cut off at the length of the arrows: three faces and a cap
        var O = [0, 0, 0], G = gens.map(function (e) { return unit(e, 0.95); });
        if (fill > 0) {
          [[O, G[0], G[1]], [O, G[1], G[2]], [O, G[2], G[0]], [G[0], G[1], G[2]]].map(function (f) {
            var q = f.map(pr); return { q: q, d: (q[0][2] + q[1][2] + q[2][2]) / 3 };
          }).sort(function (A, B) { return B.d - A.d; }).forEach(function (f) {
            ctx.fillStyle = ink(col, fill); ctx.beginPath();
            ctx.moveTo(f.q[0][0], f.q[0][1]); ctx.lineTo(f.q[1][0], f.q[1][1]); ctx.lineTo(f.q[2][0], f.q[2][1]); ctx.closePath(); ctx.fill();
          });
        }
        ctx.strokeStyle = ink(col, edge); ctx.lineWidth = lw || 1.1;
        var q = G.map(pr);
        ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.closePath(); ctx.stroke();
        var o = pr(O);
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(q[2][0], q[2][1]); ctx.stroke();
      }
      var mk = R ? 1 : ease((t - 5.8) / 0.9);
      MC_CONES.forEach(function (K, i) {             // the two cones of Fig. 3, one after the other, then as outlines
        var k = R ? 1 : ease((t - K.at) / 0.9);
        if (k <= 0) return;
        var next = i === 0 ? (R ? 1 : ease((t - MC_CONES[1].at) / 0.9)) : mk;
        cone(K.g.map(function (j) { return MC_E[j]; }), K.col, 0.15 * k * (1 - next), (0.75 - 0.25 * next) * k, 1.1);
      });
      if (mk > 0) cone([[-1, 0, 0], [0, -1, 0], [0, 0, 1]], 'brassD', 0.24 * mk, 0.95 * mk, 1.5);   // Fig. 4: their intersection
      MC_E.forEach(function (e, i) {                // the six vectors, numbered as their Gamma functions
        var k = R ? 1 : ease((t - 0.3 - i * 0.22) / 0.6);
        if (k <= 0) return;
        var o = pr([0, 0, 0]), tip = pr(unit(e, 0.95 * k)), lp = pr(unit(e, 1.24));
        line(ctx, o[0], o[1], tip[0], tip[1], ink('green', 0.9), 1.4);
        arrowHead(ctx, tip[0], tip[1], Math.atan2(tip[1] - o[1], tip[0] - o[0]), 6, ink('green', 0.9));
        if (k > 0.9) {
          dot(ctx, lp[0], lp[1], 7, ink('paper', 0.95)); ring(ctx, lp[0], lp[1], 7, ink('green', 0.6), 0.8);
          ctx.font = font(9, SANS, 600); ctx.fillStyle = ink('green', 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), lp[0], lp[1] + 0.5); ctx.textBaseline = 'alphabetic';
        }
      });
      var px = C.cx + C.u * 1.55, room = v.x + v.w - px, ks = S * 0.8;   // the Gamma functions, the cones, and what they give
      if (room < 120) return;
      ctx.save(); ctx.globalAlpha *= R ? 1 : ease(t / 0.8);
      var col2 = px + ks * 4.6;
      ['1\\,Γ(−z_1)', '2\\,Γ(−z_2)', '3\\,Γ(−z_3)'].forEach(function (s, i) { drawMath(ctx, s, px, v.y + 14 + i * ks * 1.75, ks, ink('slate', 0.9), 'left'); });
      ['4\\,Γ(a_1+z_1+z_2)', '5\\,Γ(a_2+z_1+z_3)', '6\\,Γ(a_3+z_2+z_3)'].forEach(function (s, i) { drawMath(ctx, s, col2, v.y + 14 + i * ks * 1.75, ks, ink('slate', 0.9), 'left'); });
      ctx.restore();
      var ly = Math.max(v.y + 14 + ks * 6.2, v.y + v.h * 0.4);
      MC_CONES.concat([{ col: 'brassD', lab: '', at: 5.8 }]).forEach(function (K, i) {
        var k = R ? 1 : ease((t - K.at) / 0.6);
        if (k <= 0) return;
        var yy = ly + i * S * 1.75;
        ctx.save(); ctx.globalAlpha *= k;
        ctx.fillStyle = ink(K.col, i === 2 ? 0.35 : 0.22); ctx.fillRect(px, yy - 8, 12, 8);
        ctx.strokeStyle = ink(K.col, 0.9); ctx.lineWidth = 1; ctx.strokeRect(px, yy - 8, 12, 8);
        if (K.lab) drawMath(ctx, K.lab, px + 18, yy, S * 0.95, ink('green', 0.95), 'left');
        else caps(ctx, 'MASTER CONE', px + 18, yy - 0.5, ink('brassD', 1), 7.5);
        ctx.restore();
      });
      if (mk > 0) {
        ctx.save(); ctx.globalAlpha *= mk;
        drawMath(ctx, 'S_2=B_{125}+B_{126}', px, ly + 3 * S * 1.75 + S * 0.9, S * 1.05, ink('green', 0.95), 'left');
        ctx.restore();
      }
      var nk = R ? 1 : ease((t - 7.8) / 0.7);
      if (nk > 0) {
        ctx.save(); ctx.globalAlpha *= nk;
        caps(ctx, '17 BUILDING BLOCKS', px, v.y + v.h - 22, ink('slate', 0.85), 7.5);
        caps(ctx, '14 SERIES REPRESENTATIONS', px, v.y + v.h - 9, ink('slate', 0.85), 7.5);
        ctx.restore();
      }
    }
  };

  /* Multiple MB integrals with polygamma functions. First the functions themselves: psi(m, x)
     has a pole at every non-positive integer, of order m + 1, and the reflection formula of the
     paper isolates its singular part. Then the toy integral of Sec. 3, whose straight contours at
     Re z1 = -7/9 and Re z2 = -3/5 split the poles of Gamma(1 + z1 + z2) and psi(1, 1 + z1 + z2).
     The limiting approach writes the polygamma as a limit of derivatives of a ratio of Gamma
     functions, after which the straight-contour method applies. */
  function polygamma(m, x) {                        // psi(m, x) for real x: recurrence, then the asymptotic series
    var s = 0, f = m === 2 ? 2 : 1, sg = m % 2 ? 1 : -1;
    while (x < 9) { s += m === 0 ? -1 / x : sg * f / Math.pow(x, m + 1); x += 1; }
    var i1 = 1 / x, i2 = i1 * i1;
    if (m === 0) return s + Math.log(x) - 0.5 * i1 - i2 / 12 + i2 * i2 / 120 - i2 * i2 * i2 / 252;
    if (m === 1) return s + i1 + i2 / 2 + i1 * i2 / 6 - i1 * i2 * i2 / 30 + i1 * i2 * i2 * i2 / 42;
    return s - i2 - i1 * i2 - i2 * i2 / 2 + i2 * i2 * i2 / 6 - i2 * i2 * i2 * i2 / 6;
  }
  var PG_CURVES = null;
  function pgCurves() {
    if (PG_CURVES) return PG_CURVES;
    PG_CURVES = [0, 1, 2].map(function (m) {
      var pts = [];
      for (var x = -3.6; x <= 3.4; x += 0.004) {
        if (Math.abs(x - Math.round(x)) < 0.0021 && Math.round(x) <= 0) { pts.push(null); continue; }
        pts.push([x, polygamma(m, x)]);
      }
      return pts;
    });
    return PG_CURVES;
  }
  function mathRow(ctx, parts, x, y, S) {           // formula pieces side by side, each in its own colour
    parts.forEach(function (p) { var b = drawMath(ctx, p[0], x, y, S, p[1], 'left'); x += b.w; });
    return x;
  }
  var POLYGAMMA = {
    key: 'polygamma', paper: '2512.19803', dur: 14.5, cap: 'MB integrals with polygamma functions',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 44));
      v.A = { L: v.x + 8, R: v.x + v.w * (v.w > 420 ? 0.6 : 0.64), T: v.y + 6, B: v.y + v.h - 18 };
      var side = Math.min(v.h - v.S * 3.4 - 6, v.w * 0.5);
      v.Bp = { u: side / 4.4, x0: v.x + 4, y0: v.y + v.S * 3.2 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, split = 7;
      var a1 = R ? 1 : clamp01((split - t) / 0.45), a2 = R ? 0 : clamp01((t - split) / 0.45);
      if (a1 > 0) { ctx.save(); ctx.globalAlpha *= a1; this.plot(v, t, R); ctx.restore(); }
      if (a2 > 0) { ctx.save(); ctx.globalAlpha *= a2; this.plane(v, t - split, R); ctx.restore(); }
    },
    plot: function (v, t, R) {                      // psi(0, x), psi(1, x) and psi(2, x) on the real line
      var ctx = v.ctx, A = v.A, S = v.S, cols = ['green', 'brassD', 'crimson'], lim = 12;
      function X(x) { return A.L + (x + 3.6) / 7 * (A.R - A.L); }
      function Y(y) { return (A.T + A.B) / 2 - y / lim * (A.B - A.T) / 2; }
      var ak = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= ak;
      line(ctx, A.L, Y(0), A.R, Y(0), ink('green', 0.45), 1);
      line(ctx, X(0), A.T, X(0), A.B, ink('green', 0.45), 1);
      [-3, -2, -1].forEach(function (n) {
        ctx.save(); ctx.setLineDash([2, 3]); line(ctx, X(n), A.T, X(n), A.B, ink('slate', 0.35), 1); ctx.restore();
        drawMath(ctx, String(n).replace('-', '−'), X(n), A.B + 12, S * 0.85, ink('slate', 0.9), 'center');
      });
      drawMath(ctx, '0', X(0) + 6, A.B + 12, S * 0.85, ink('slate', 0.9), 'center');
      drawMath(ctx, '1', X(1), A.B + 12, S * 0.85, ink('slate', 0.9), 'center');
      line(ctx, X(1), Y(0) - 2, X(1), Y(0) + 2, ink('green', 0.45), 1);
      drawMath(ctx, 'x', A.R - 2, Y(0) + 14, S * 0.9, ink('slate', 0.9), 'right');
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(A.L, A.T, A.R - A.L, A.B - A.T); ctx.clip();
      pgCurves().forEach(function (pts, m) {
        var k = R ? 1 : easeInOut((t - 0.6 - m * 1.6) / 1.5);
        if (k <= 0) return;
        var xr = -3.6 + 7 * k, on = false;
        ctx.strokeStyle = ink(cols[m], 0.9); ctx.lineWidth = 1.5; ctx.beginPath();
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          if (!p) { on = false; continue; }
          if (p[0] > xr) break;
          var yy = Math.max(-lim * 1.6, Math.min(lim * 1.6, p[1]));
          if (on) ctx.lineTo(X(p[0]), Y(yy)); else { ctx.moveTo(X(p[0]), Y(yy)); on = true; }
        }
        ctx.stroke();
      });
      ctx.restore();
      var lx = A.R + 16, room = v.x + v.w - lx;     // the legend: the order of the poles grows with m
      ['SIMPLE POLES', 'DOUBLE POLES', 'TRIPLE POLES'].forEach(function (s, m) {
        var k = R ? 1 : ease((t - 0.8 - m * 1.6) / 0.6);
        if (k <= 0 || room < 90) return;
        var yy = v.y + 18 + m * S * 3;
        ctx.save(); ctx.globalAlpha *= k;
        line(ctx, lx, yy - 4, lx + 14, yy - 4, ink(cols[m], 0.9), 1.6);
        drawMath(ctx, 'ψ(' + m + ',x)', lx + 20, yy, S, ink('green', 0.95), 'left');
        caps(ctx, s, lx + 20, yy + S * 1.25, ink(cols[m], 0.9), 7);
        ctx.restore();
      });
      var fk = R ? 1 : ease((t - 5.2) / 0.7);
      if (fk > 0) {
        ctx.save(); ctx.globalAlpha *= fk;
        if (room >= 90) {
          caps(ctx, 'NEAR EACH POLE', lx, v.y + v.h - S * 4.6, ink('slate', 0.85), 7);
          drawMath(ctx, 'ψ(m,z−n)=', lx, v.y + v.h - S * 2.9, S * 0.92, ink('green', 0.95), 'left');
          drawMath(ctx, '\\frac{(−1)^{m+1}\\,m!}{z^{m+1}}+\\rm{regular}', lx, v.y + v.h - S * 0.55, S * 0.92, ink('green', 0.95), 'left');
        }
        ctx.restore();
      }
    },
    plane: function (v, t, R) {                     // the toy integral of Sec. 3 and its straight contours
      var ctx = v.ctx, S = v.S, B = v.Bp, u = B.u, c1 = -7 / 9, c2 = -3 / 5, lo = -2.8, hi = 1.6, span = hi - lo;
      function X(z) { return B.x0 + (z - lo) * u; }
      function Y(z) { return B.y0 + (hi - z) * u; }
      var ak = R ? 1 : ease(t / 0.6), pulse = R ? 1 : 0.5 + 0.5 * Math.sin(t * 5);
      ctx.save(); ctx.globalAlpha *= ak;
      mathRow(ctx, [['Γ(−z_1)', ink('pine', 1)], ['Γ(−z_2)', ink('plum', 1)], ['Γ(1+z_1+z_2)\\,ψ(1,1+z_1+z_2)', ink('crimson', 1)]],
        v.x + 4, v.y + S * 1.3, S * Math.min(1, (v.w - 8) / (mathBox(ctx, 'Γ(−z_1)Γ(−z_2)Γ(1+z_1+z_2)\\,ψ(1,1+z_1+z_2)', S).w)));
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(X(lo), Y(hi), span * u, span * u); ctx.clip();
      ctx.globalAlpha *= ak;
      line(ctx, X(lo), Y(0), X(hi), Y(0), ink('green', 0.3), 1); line(ctx, X(0), Y(lo), X(0), Y(hi), ink('green', 0.3), 1);
      var lk = R ? 1 : ease((t - 0.5) / 0.6);
      [0, 1].forEach(function (c) {
        ctx.save(); ctx.setLineDash([3, 3]);
        line(ctx, X(c), Y(hi), X(c), Y(lo), ink('pine', 0.55 * lk), 1);
        line(ctx, X(lo), Y(c), X(hi), Y(c), ink('plum', 0.55 * lk), 1);
        ctx.restore();
      });
      var sk = R ? 1 : ease((t - 2.4) / 0.6);
      [1, 2, 3, 4].forEach(function (n) {    // z1 + z2 = -n: poles of order three, the first one split off
        var first = n === 1, al = first && sk > 0 ? 0.5 + 0.45 * pulse * sk : 0.55;
        ctx.save(); if (!(first && sk > 0)) ctx.setLineDash([3, 3]);
        line(ctx, X(lo), Y(-n - lo), X(hi), Y(-n - hi), ink('crimson', al * lk), first && sk > 0 ? 1.8 : 1.2);
        ctx.restore();
      });
      var ck = R ? 1 : ease((t - 1.4) / 0.6);       // the straight contours
      if (ck > 0) {
        ctx.save(); ctx.setLineDash([5, 4]);
        line(ctx, X(c1), Y(hi), X(c1), Y(lo), ink('brassD', 0.75 * ck), 1.1); line(ctx, X(lo), Y(c2), X(hi), Y(c2), ink('brassD', 0.75 * ck), 1.1);
        ctx.restore();
        dot(ctx, X(c1), Y(c2), 3.8 * ck, ink('brassD', 1)); ring(ctx, X(c1), Y(c2), 7, ink('brassD', 0.6 * ck), 1);
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= ak;
      ctx.strokeStyle = ink('green', 0.4); ctx.lineWidth = 1; ctx.strokeRect(X(lo), Y(hi), span * u, span * u);
      drawMath(ctx, '\\rm{Re}\\,z_1', X(hi) - 3, Y(0) - 5, S * 0.8, ink('slate', 0.95), 'right');
      drawMath(ctx, '\\rm{Re}\\,z_2', X(0) + 5, Y(hi) + 12, S * 0.8, ink('slate', 0.95), 'left');
      ctx.restore();
      var px = X(hi) + 16, room = v.x + v.w - px, y0 = B.y0 + 6;
      if (room < 110) return;
      var k1 = R ? 1 : ease((t - 1.4) / 0.6);
      ctx.save(); ctx.globalAlpha *= k1;
      drawMath(ctx, 'c_1=−\\frac{7}{9},\\quad c_2=−\\frac{3}{5}', px, y0 + S * 0.6, S * 0.9, ink('brassD', 1), 'left');
      ctx.restore();
      var k2 = R ? 1 : ease((t - 2.4) / 0.6);
      ctx.save(); ctx.globalAlpha *= k2;
      caps(ctx, 'THE CONTOURS SPLIT THESE POLES', px, y0 + S * 3.3, ink('crimson', 0.9), 7);
      ctx.restore();
      var k3 = R ? 1 : ease((t - 3.6) / 0.7);
      if (k3 > 0) {
        ctx.save(); ctx.globalAlpha *= k3;
        caps(ctx, 'SO THE POLYGAMMA IS WRITTEN AS', px, y0 + S * 5.6, ink('slate', 0.85), 7);
        drawMath(ctx, 'ψ(m,z)=\\rm{lim}_{a,b→0}\\,∂_b^m\\,∂_a\\frac{Γ(z+a+b)}{Γ(z+b)}', px, y0 + S * 8.4, S * 0.92, ink('green', 0.95), 'left');
        ctx.restore();
      }
    }
  };

  /* Sunset integrals with up to three mass scales, as they arise in chiral perturbation theory: one mass,
     then two (m and M, as for the pion and the nucleon in the two-flavour baryon sector), then three (the
     pion, kaon and eta of three-flavour ChPT). By integration by parts every sunset reduces to four master
     integrals (abstract of the paper), and the paper solves them as single and double hypergeometric series. */
  var SUNSET_D = { n: { i: [0.1, 0.5], v1: [0.5, 0.5, 1], v2: [1.4, 0.5, 1], o: [1.8, 0.5] },
    e: [{ a: 'i', b: 'v1', t: 'p', lab: 'p', lo: [0, -10] },
        { a: 'v1', b: 'v2', t: 'p', bend: -0.36, lo: [0, -10] },
        { a: 'v1', b: 'v2', t: 'p', lo: [0, -8] },
        { a: 'v1', b: 'v2', t: 'p', bend: 0.36, lo: [0, 20] },
        { a: 'v2', b: 'o', t: 'p', lab: 'p', lo: [0, -10] }] };
  var SUNSET_ST = [                                  // the masses on the three lines, from the top one down
    { at: 0, lab: ['m', 'm', 'm'], col: ['green', 'green', 'green'], cap: 'ONE MASS SCALE' },
    { at: 4.3, lab: ['m', 'M', 'M'], col: ['brassD', 'pine', 'pine'], cap: 'TWO MASS SCALES · THE PION AND THE NUCLEON' },
    { at: 7.9, lab: ['m_1', 'm_2', 'm_3'], col: ['brassD', 'pine', 'crimson'], cap: 'THREE MASS SCALES · THE PION, KAON AND ETA' }];
  var SUNSET = {
    key: 'sunset', paper: '2512.07727', dur: 13, cap: 'Sunset integrals with up to three mass scales',
    layout: function (v) { diagramLayout(v, SUNSET_D); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, F = v.F, si = R ? 2 : (t < SUNSET_ST[1].at ? 0 : t < SUNSET_ST[2].at ? 1 : 2);
      var S1 = SUNSET_ST[si], S0 = SUNSET_ST[Math.max(0, si - 1)], sk = R || si === 0 ? 1 : ease((t - S1.at) / 0.7);
      SUNSET_D.e.forEach(function (ed, i) {
        var g = v.geo[i], k = R ? 1 : ease((t - 0.35 - i * 0.45) / 0.7);
        if (k <= 0) return;
        var lin = i >= 1 && i <= 3, q = pathAt(g, g.len * 0.5), o = ed.lo;
        if (!lin) {
          drawEdge(ctx, g, 'p', k, ink('brassD', 0.92), 1.3, t);
          if (k > 0.8) drawMath(ctx, 'p', q[0] + o[0], q[1] + o[1], 13, ink('green', 0.95 * clamp01((k - 0.8) / 0.2)), 'center');
          return;
        }
        [[S0, 1 - sk], [S1, sk]].forEach(function (P) {   // each line takes the colour and the mass of the stage, the old one fading
          if (P[1] <= 0.01) return;
          drawEdge(ctx, g, 'p', k, ink(P[0].col[i - 1], 0.92 * P[1]), 1.5, t);
          if (k > 0.8) drawMath(ctx, P[0].lab[i - 1], q[0] + o[0], q[1] + o[1], 13, ink('green', 0.95 * P[1] * clamp01((k - 0.8) / 0.2)), 'center');
        });
      });
      ['v1', 'v2'].forEach(function (id, j) {
        if (R || t > 0.35 + (j ? 1.6 : 0.6)) dot(ctx, F.x + SUNSET_D.n[id][0] * F.s, F.y + SUNSET_D.n[id][1] * F.s, 2.3, ink('green', 0.95));
      });
      var k1 = R ? 1 : ease((t - 2.6) / 0.7), mk = R ? 1 : ease((t - 10.4) / 0.7);
      if (k1 <= 0) return;
      ctx.save(); ctx.globalAlpha *= k1 * (1 - mk);
      drawMath(ctx, 'H_{a_1,a_2,a_3}(m_1,m_2,m_3;\\,p^2)', v.x + 4, v.y + 16, 12, ink('green', 0.95), 'left');
      ctx.restore();
      if (mk > 0) {                                  // what every sunset reduces to, by integration by parts
        ctx.save(); ctx.globalAlpha *= mk;
        drawMath(ctx, 'H_{1,1,1},\\quad H_{2,1,1},\\quad H_{1,2,1},\\quad H_{1,1,2}', v.x + 4, v.y + 16, 12, ink('green', 0.95), 'left');
        caps(ctx, 'THE FOUR MASTER INTEGRALS', v.x + 4, v.y + 32, ink('brassD', 0.95), 7.5);
        ctx.restore();
      }
      [[S0, 1 - sk], [S1, sk]].forEach(function (P) {  // the stage, named below the diagram
        if (P[1] <= 0.01) return;
        ctx.save(); ctx.globalAlpha *= k1 * P[1]; caps(ctx, P[0].cap, v.x + 4, v.y + v.h - 8, ink('slate', 0.85), 7.5); ctx.restore();
      });
      if (R) return;
      [1, 2, 3].forEach(function (i, j) {           // momentum flowing through the three lines
        var g = v.geo[i], ph = ((t - 3.4) * 0.42 + j * 0.31) % 1, qq = pathAt(g, g.len * (ph < 0 ? ph + 1 : ph));
        if (t > 3.4) dot(ctx, qq[0], qq[1], 2.4, ink(S1.col[j], 0.85 * k1 * Math.sin(Math.PI * ph)));
      });
    }
  };


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
    extra: function (v, t) {                       // then the result of the abstract: Br = 0.66 %, preferred by about 3 sigma
      var ctx = v.ctx, R = v.reduce, k = R ? 1 : ease((t - 4) / 0.6), k2 = R ? 1 : ease((t - 6.4) / 0.7);
      if (k > 0 && k2 < 1) drawMath(ctx, 'm_Δ≈151.5\\,\\rm{GeV}', v.x + 4, v.y + v.h - 9, 11.5, ink('slate', 0.9 * k * (1 - k2)), 'left');
      if (k2 <= 0) return;
      var src = 'm_Δ≈151.5\\,\\rm{GeV},\\quad\\rm{Br}(Δ^0\\toγγ)=0.66\\,%\\quad(≈3σ)', S = 11.5, w = mathBox(ctx, src, S).w;
      if (w > v.w - 8) S *= (v.w - 8) / w;           // (narrower on a phone)
      ctx.save(); ctx.globalAlpha *= k2;
      drawMath(ctx, src, v.x + 4, v.y + v.h - 9, S, ink('green', 0.95), 'left');
      ctx.restore();
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
      var ctx = v.ctx, R = v.reduce, k = R ? 1 : ease((t - 3.4) / 0.6), k2 = R ? 1 : ease((t - 5.6) / 0.7), F = v.F;
      if (k > 0) drawMath(ctx, 't,\\,W^±,\\,H^±', F.x + 1.2 * F.s, F.y + 0.36 * F.s, 12, ink('green', 0.9 * k), 'left');
      if (k2 <= 0) return;                         // what the paper ties together (its abstract): the photons of A and the EDMs
      var l1 = 'A\\toγγ\\quad\\rm{at}\\quad m_A=95\\,\\rm{or}\\,152\\,\\rm{GeV}', l2 = '\\rm{tied}\\,\\rm{to}\\quad d_e,\\,d_n,\\,d_p';
      var room = F.x + 0.95 * F.s - 18 - (v.x + 4), S = 11.5, wide = Math.max(mathBox(ctx, l1, S).w, mathBox(ctx, l2, S).w);
      if (wide > room) S *= Math.max(0.6, room / wide);   // kept left of the photon that leaves the loop
      ctx.save(); ctx.globalAlpha *= k2;
      drawMath(ctx, l1, v.x + 4, v.y + 16, S, ink('crimson', 0.95), 'left');
      drawMath(ctx, l2, v.x + 4, v.y + 16 + 1.6 * S, S, ink('slate', 0.95), 'left');
      ctx.restore();
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
    extra: function (v, t) {                       // the masses of the CMS excess, then what the model predicts (abstract)
      var ctx = v.ctx, R = v.reduce, k = R ? 1 : ease((t - 4) / 0.6), k2 = R ? 1 : ease((t - 6.6) / 0.7);
      var m = 'm_H≈650\\,\\rm{GeV},\\quad m_{b\\bar{b}}≈90\\,\\rm{GeV}', full = m + ',\\quad\\rm{with}\\,\\rm{a}\\,\\rm{predicted}\\,\\,Z+b\\bar{b}\\,\\rm{signal}';
      if (k > 0 && k2 < 1) drawMath(ctx, m, v.x + 4, v.y + v.h - 9, 11.5, ink('slate', 0.9 * k * (1 - k2)), 'left');
      if (k2 <= 0) return;
      var F = v.F, room = Math.min(v.w - 8, F.x + 1.56 * F.s - (v.x + 4)), S = 11.5, w = mathBox(ctx, full, S).w;   // clear of the lower photon
      if (w > room) S *= room / w;
      ctx.save(); ctx.globalAlpha *= k2; drawMath(ctx, full, v.x + 4, v.y + v.h - 9, S, ink('slate', 0.9), 'left'); ctx.restore();
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
    key: 'ttbar', paper: '2308.07953', dur: 13, cap: 'Top-quark pairs and new Higgs bosons',
    layout: function (v) { v.sm = Object.create(v); diagramLayout(v.sm, TT_SM); v.np = Object.create(v); diagramLayout(v.np, TT_NP); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, split = 5.6;
      var a1 = R ? 0 : clamp01((split - t) / 0.5), a2 = R ? 1 : clamp01((t - split) / 0.5), k2 = R ? 1 : ease((t - 9.2) / 0.7);
      if (a1 > 0) { ctx.save(); ctx.globalAlpha *= a1; drawDiagram(ctx, v.sm, TT_SM, t); caps(ctx, 'STANDARD MODEL', v.x + 4, v.y + 12, ink('slate', 0.85), 8); ctx.restore(); }
      if (a2 > 0) {
        ctx.save(); ctx.globalAlpha *= a2; drawDiagram(ctx, v.np, TT_NP, t - split);
        caps(ctx, 'NEW HIGGS BOSONS, SAME FINAL STATE', v.x + 4, v.y + 12, ink('crimson', 0.85), 8);
        if (k2 < 1) drawMath(ctx, 'm_H≈270,\\quad m_S≈152,\\quad m_{S\'}≈95\\,\\rm{GeV}', v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9 * (1 - k2)), 'left');
        if (k2 > 0) {                              // then the result of the fit to the ATLAS lepton distributions (abstract)
          var F = v.np.F, room = Math.min(v.w - 8, F.x + 1.48 * F.s - (v.x + 4)), S = 11;   // clear of the b-bar line
          var res = '\\rm{a}\\,\\rm{better}\\,\\rm{fit}\\,\\rm{than}\\,\\rm{the}\\,\\rm{SM}\\,\\rm{by}\\,5.8σ\\,\\rm{to}\\,13σ', more = res + ',\\quad Δχ^2=34\\,\\rm{to}\\,158';
          if (mathBox(ctx, more, S).w <= room) res = more;
          var w = mathBox(ctx, res, S).w;
          if (w > room) S *= room / w;
          ctx.save(); ctx.globalAlpha *= k2; drawMath(ctx, res, v.x + 4, v.y + v.h - 9, S, ink('green', 0.95), 'left'); ctx.restore();
        }
        ctx.restore();
      }
    }
  };

  /* The TOP2023 proceedings (2312.01458), Fig. 3: the cross section of pp -> H -> S S' -> W W b b-bar that
     the differential t t-bar distributions prefer (1 and 2 sigma, against m_S), and the one the 95 GeV
     di-photon excess needs if S' is SM-like (flat bands, 1 and 2 sigma), with Br(S -> W W) = 100 %.
     Edges read off the figure, as [m_S in GeV, lower, upper] in pb. The regions overlap near 11 to 12 pb. */
  var T95_R2 = [[142, 8.16, 10.9], [142.5, 8.06, 11.22], [143, 7.96, 11.54], [143.5, 7.85, 11.89], [144, 7.78, 12.17], [145, 7.78, 12.17],
                [146, 7.78, 12.06], [147, 7.82, 12.1], [148, 7.78, 12.24], [149, 7.68, 12.55], [150, 7.57, 12.87], [151, 7.57, 13.01],
                [152, 7.64, 12.97], [153, 7.68, 12.76], [154, 7.68, 12.55], [155, 7.61, 12.59], [156, 7.57, 12.48], [156.5, 7.61, 12.2],
                [157, 7.71, 11.85], [157.5, 7.78, 11.47], [158, 7.92, 11.08], [158.5, 8.06, 10.73], [159, 8.17, 10.45], [159.5, 8.31, 10.24], [160, 8.45, 10.03]];
  var T95_R1 = [[143.65, 10.0, 10.0], [143.8, 9.54, 10.34], [144, 9.29, 10.62], [144.5, 9.22, 10.73], [145, 9.26, 10.69], [145.5, 9.36, 10.55],
                [146, 9.5, 10.34], [146.5, 9.54, 10.34], [147, 9.5, 10.41], [147.5, 9.43, 10.52], [148, 9.29, 10.73], [148.5, 9.05, 11.04],
                [149, 8.84, 11.36], [149.5, 8.7, 11.61], [150, 8.63, 11.82], [150.5, 8.59, 11.92], [151, 8.63, 11.96], [151.5, 8.66, 11.96],
                [152, 8.73, 11.92], [152.5, 8.77, 11.78], [153, 8.8, 11.64], [153.5, 8.87, 11.47], [154, 8.87, 11.33], [154.5, 8.84, 11.36],
                [155, 8.77, 11.43], [155.5, 8.73, 11.43], [156, 8.73, 11.29], [156.5, 8.94, 10.8], [156.8, 9.19, 10.45], [157, 9.57, 10.03], [157.08, 9.8, 9.8]];
  var T95_G2 = [5.40, 28.61], T95_G1 = [10.97, 22.37];
  var TT95 = {
    key: 'tt95', paper: '2312.01458', dur: 12.5, cap: 'Top-quark distributions and the 95 GeV excess',
    layout: function (v) {
      v.S = Math.max(9, Math.min(11.5, v.w / 46));
      v.L = v.x + 30; v.R = v.x + v.w - 12; v.T = v.y + 22; v.B = v.y + v.h - 28;
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, L = v.L, Rr = v.R, T = v.T, B = v.B, S = v.S;
      function X(m) { return L + (m - 142) / 18 * (Rr - L); }
      function Y(s) { return B - s / 38 * (B - T); }
      function region(P) {                            // the region between the two edges, as a path
        ctx.beginPath();
        P.forEach(function (q, i) { if (i) ctx.lineTo(X(q[0]), Y(q[2])); else ctx.moveTo(X(q[0]), Y(q[2])); });
        for (var i = P.length - 1; i >= 0; i--) ctx.lineTo(X(P[i][0]), Y(P[i][1]));
        ctx.closePath();
      }
      var ak = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= ak;              // the axes, as in the figure
      line(ctx, L, T, L, B, ink('green', 0.55), 1); line(ctx, L, B, Rr, B, ink('green', 0.55), 1);
      [145, 150, 155, 160].forEach(function (m) { line(ctx, X(m), B, X(m), B + 4, ink('green', 0.55), 1); drawMath(ctx, String(m), X(m), B + 15, S * 0.9, ink('slate', 0.85), 'center'); });
      [0, 10, 20, 30].forEach(function (y) { line(ctx, L - 3, Y(y), L, Y(y), ink('green', 0.55), 1); drawMath(ctx, String(y), L - 5, Y(y) + 3.5, S * 0.8, ink('slate', 0.85), 'right'); });
      drawMath(ctx, 'm_S\\,[\\rm{GeV}]', X(152.5), B + 17, S, ink('slate', 0.95), 'center');
      drawMath(ctx, 'σ(pp\\to H\\to SS\'\\to WWb\\bar{b})\\,[\\rm{pb}]', v.x + 4, v.y + 12, S * 0.85, ink('slate', 0.95), 'left');
      ctx.restore();
      var mid = (T95_G1[0] + T95_G1[1]) / 2;          // the 95 GeV di-photon excess: two flat bands, opening up
      [[T95_G2, R ? 1 : easeInOut((t - 0.8) / 1.0), 0.08, '2σ'], [T95_G1, R ? 1 : easeInOut((t - 1.5) / 1.0), 0.17, '1σ']].forEach(function (g) {
        if (g[1] <= 0) return;
        var lo = mid - (mid - g[0][0]) * g[1], hi = mid + (g[0][1] - mid) * g[1];
        ctx.fillStyle = ink('pine', g[2]); ctx.fillRect(L + 0.5, Y(hi), Rr - L - 0.5, Y(lo) - Y(hi));
        line(ctx, L, Y(hi), Rr, Y(hi), ink('pine', 0.4), 1); line(ctx, L, Y(lo), Rr, Y(lo), ink('pine', 0.4), 1);
        if (g[1] > 0.9) drawMath(ctx, g[3], Rr - 4, Y(hi) + S * 1.05, S * 0.8, ink('pine', 0.95 * (g[1] - 0.9) * 10), 'right');
      });
      var lk = R ? 1 : ease((t - 2.4) / 0.6);
      if (lk > 0) drawMath(ctx, 'S\'\\toγγ\\,\\rm{at}\\,95\\,\\rm{GeV}', X(151), Y(17.6), S, ink('pine', lk), 'center');
      [[T95_R2, R ? 1 : easeInOut((t - 3.0) / 1.6), 0.2], [T95_R1, R ? 1 : easeInOut((t - 4.2) / 1.6), 0.55]].forEach(function (q) {
        if (q[1] <= 0) return;                        // the t t-bar fit, swept in from low to high m_S
        ctx.save(); ctx.beginPath(); ctx.rect(L, T, (Rr - L) * q[1], B - T); ctx.clip();
        region(q[0]); ctx.fillStyle = ink('crimson', q[2]); ctx.fill();
        ctx.strokeStyle = ink('crimson', 0.85); ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      });
      var rk = R ? 1 : ease((t - 3.4) / 0.6);
      if (rk > 0) drawMath(ctx, 't\\bar{t}\\,\\rm{distributions},\\quad 1σ\\,\\rm{and}\\,2σ', L + 5, Y(2.1), S * 0.9, ink('crimson', rk), 'left');
      var ok = R ? 1 : ease((t - 6.4) / 0.7);
      if (ok > 0) {                                   // where the two meet, within 1 sigma of both
        ctx.save(); ctx.globalAlpha *= ok;
        ctx.save(); ctx.beginPath(); ctx.rect(L, Y(T95_G1[1]), Rr - L, Y(T95_G1[0]) - Y(T95_G1[1])); ctx.clip();
        region(T95_R1); ctx.fillStyle = ink('brass', R ? 0.8 : 0.72 + 0.16 * Math.sin(t * 3)); ctx.fill();
        ctx.strokeStyle = ink('brassD', 1); ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();
        caps(ctx, 'ONE CROSS SECTION FITS BOTH', L + 5, Y(35.3), ink('brassD', 0.95), 7.5);
        ctx.restore();
      }
      var nk = R ? 1 : ease((t - 7.6) / 0.7);
      if (nk > 0) drawMath(ctx, '\\rm{if}\\,S\'\\,\\rm{is}\\,\\rm{SM-like},\\quad\\rm{Br}(S\\to WW)=100\\,%', L + 5, Y(31.1), S * 0.85, ink('slate', 0.95 * nk), 'left');
    }
  };

  /* FeynGKZ, with the worked example of the paper: the one-loop bubble with two masses. The five
     monomials of its Lee-Pomeransky polynomial G = U + F are points of the plane, their
     exponents. Their convex hull, the Newton polytope, has normalized volume 3, the number of
     independent solutions. Each of its three unimodular regular triangulations gives a basis of
     three Gamma-series, and the second gives two Horn H3 functions and one Horn G1 function. */
  var GKZ_P = [[2, 0], [1, 1], [1, 0], [0, 2], [0, 1]];          // columns 1 to 5 of the A-matrix
  var GKZ_LAB = [['x_1^2', 0, 17, 'center'], ['x_1x_2', 9, -6, 'left'], ['x_1', 0, 17, 'center'], ['x_2^2', -10, 4, 'right'], ['x_2', -10, 4, 'right']];
  var GKZ_T = [[[1, 2, 3], [2, 3, 4], [3, 4, 5]], [[1, 2, 3], [2, 4, 5], [2, 3, 5]], [[2, 4, 5], [1, 3, 5], [1, 2, 5]]];
  var FEYNGKZ = {
    key: 'gkz', paper: '2211.01285', dur: 14, cap: 'GKZ systems and Newton polytopes',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 44));
      var top = v.y + v.S * 2.9, side = Math.min(v.h - (top - v.y) - 26, v.w * 0.4);
      v.G = { x: v.x + 30, y: top + 8, s: side / 2 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, G = v.G, cols = ['brass', 'pine', 'crimson'];
      function P(i) { var p = GKZ_P[i - 1]; return [G.x + p[0] * G.s, G.y + (2 - p[1]) * G.s]; }
      var gsrc = 'G=x_1+x_2+m_1^2x_1^2+(s+m_1^2+m_2^2)\\,x_1x_2+m_2^2x_2^2';
      var gs = S * Math.min(1, (v.w - 8) / mathBox(ctx, gsrc, S).w);
      drawMath(ctx, gsrc, v.x + 4, v.y + S * 1.25, gs, ink('green', 0.95), 'left', R ? undefined : Math.max(0, (t - 0.2) * 42));
      var lk = R ? 1 : ease((t - 0.9) / 0.6);       // the lattice of exponents
      ctx.save(); ctx.globalAlpha *= lk;
      line(ctx, G.x, G.y + 2 * G.s, G.x + 2.45 * G.s, G.y + 2 * G.s, ink('green', 0.35), 1);
      line(ctx, G.x, G.y + 2 * G.s, G.x, G.y - 0.2 * G.s, ink('green', 0.35), 1);
      for (var i = 0; i <= 2; i++) for (var j = 0; j <= 2; j++) dot(ctx, G.x + i * G.s, G.y + (2 - j) * G.s, 1.3, ink('slate', 0.35));
      ctx.restore();
      var hk = R ? 1 : ease((t - 3.5) / 0.8), idx = R ? 1 : Math.max(0, Math.min(2, Math.floor((t - 4.7) / 2.9)));
      var into = R ? 1 : clamp01((t - 4.7 - idx * 2.9) / 0.45);
      function cells(T, a) {
        T.forEach(function (tri, j) {
          var p = tri.map(P);
          ctx.fillStyle = ink(cols[j], 0.17 * a); ctx.beginPath();
          ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.lineTo(p[2][0], p[2][1]); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = ink('green', 0.7 * a); ctx.lineWidth = 1.1; ctx.stroke();
        });
      }
      if (t > 4.7 || R) {                           // the current triangulation, faded in over the last
        if (idx > 0 && into < 1) { ctx.save(); ctx.globalAlpha *= 1 - into; cells(GKZ_T[idx - 1], 1); ctx.restore(); }
        cells(GKZ_T[idx], into);
      }
      if (hk > 0) {                                 // the Newton polytope
        var hull = [3, 1, 4, 5].map(P);
        ctx.save(); ctx.globalAlpha *= hk;
        ctx.strokeStyle = ink('brassD', 0.95); ctx.lineWidth = 1.6; ctx.beginPath();
        hull.forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
      [3, 5, 1, 2, 4].forEach(function (i, n) {     // the monomials, in the order they appear in G
        var k = R ? 1 : ease((t - 1.3 - n * 0.4) / 0.5);
        if (k <= 0) return;
        var p = P(i), L = GKZ_LAB[i - 1];
        dot(ctx, p[0], p[1], 3.6 * k, ink('paper', 1)); ring(ctx, p[0], p[1], 3.6 * k, ink('green', 0.95), 1.3);
        ctx.save(); ctx.globalAlpha *= k;
        drawMath(ctx, L[0], p[0] + L[1], p[1] + L[2], S * 0.95, ink('green', 0.95), L[3]);
        ctx.restore();
      });
      var px = G.x + 2 * G.s + 40, room = v.x + v.w - px;   // the three unimodular triangulations
      if (room < 110) return;
      var tk = R ? 1 : ease((t - 4.4) / 0.6), m = S * 0.95;
      var f = Math.min(1, (v.y + v.h - G.y) / (62 + 9.9 * m));   // on a low stage the column closes up, clear of the pager
      function cy(o) { return G.y + o * f; }
      ctx.save(); ctx.globalAlpha *= hk;
      caps(ctx, 'NEWTON POLYTOPE', px, cy(2), ink('brassD', 0.95), 7.5);
      caps(ctx, 'NORMALIZED VOLUME 3', px, cy(15), ink('slate', 0.85), 7.5);
      ctx.restore();
      if (tk <= 0) return;
      ctx.save(); ctx.globalAlpha *= tk;
      caps(ctx, 'UNIMODULAR TRIANGULATIONS', px, cy(40), ink('slate', 0.85), 7.5);
      ctx.restore();
      GKZ_T.forEach(function (T, j) {
        var shown = R || t > 4.7 + j * 2.9;
        if (!shown) return;
        var on = j === idx, yy = cy(62 + j * m * 3.3), s = m * 1.25;
        ctx.save(); ctx.globalAlpha *= on ? 1 : 0.45;
        T.forEach(function (tri, q) {               // a thumbnail of the triangulation
          var p = tri.map(function (i) { var c = GKZ_P[i - 1]; return [px + c[0] * s, yy + (1 - c[1]) * s]; });
          ctx.fillStyle = ink(cols[q], 0.3); ctx.beginPath();
          ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.lineTo(p[2][0], p[2][1]); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = ink('green', 0.8); ctx.lineWidth = 0.8; ctx.stroke();
        });
        drawMath(ctx, 'T_' + (j + 1), px + 2 * s + 12, yy + 4, m, ink(on ? 'brassD' : 'slate', 1), 'left');
        if (j === 1 && v.w > 420) drawMath(ctx, 'H_3,\\,H_3,\\,G_1', px + 2 * s + 12 + m * 2.2, yy + 4, m * 0.92, ink('slate', 0.95), 'left');
        ctx.restore();
      });
      var nk = R ? 1 : ease((t - 6) / 0.6);
      if (nk > 0) { ctx.save(); ctx.globalAlpha *= nk; caps(ctx, 'THREE SERIES EACH', px, cy(62 + 3 * m * 3.3) - 2, ink('slate', 0.85), 7.5); ctx.restore(); }
    }
  };

  /* HyperPrecision: numerical values of multivariable hypergeometric functions anywhere, to
     as many digits as asked for. The Pfaffian system is restricted to the straight ray from the
     origin, where the defining series converges, to the target point, and solved there with
     series expansions matched along the ray. The example is the Appell function
     F1(1; 1, 1; 2; x, y) at (x, y) = (-2, -3), outside the unit square where its series
     converges. Its value is ln(4/3). The digits shown come from such a chain of expansions,
     run at increasing order when the site was built (build.py). */
  var HYPERPREC = {
    key: 'hyperprecision', paper: '2605.30216', dur: 13.5, cap: 'Hypergeometric functions to high precision',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 44));
      var sc = Math.min((v.h - 14) / 5, v.w * 0.46 / 4.2);         // the plane: x from -2.6 to 1.6, y from -3.4 to 1.6
      v.P = { sc: sc, L: v.x + 6, T: v.y + 7 };
      v.D = Math.max(8.5, Math.min(13.5, (v.x + v.w - (v.P.L + 4.2 * sc) - 26) / 11.2));
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, P = v.P, sc = P.sc, hp = (v.data && v.data.hp) || null;
      if (!hp) return;
      function X(x) { return P.L + (x + 2.6) * sc; }
      function Y(y) { return P.T + (1.6 - y) * sc; }
      var ak = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= ak;
      ctx.fillStyle = ink('pine', 0.1); ctx.fillRect(X(-1), Y(1), 2 * sc, 2 * sc);   // where the series converges
      ctx.strokeStyle = ink('pine', 0.45); ctx.lineWidth = 1; ctx.strokeRect(X(-1), Y(1), 2 * sc, 2 * sc);
      line(ctx, X(-2.6), Y(0), X(1.6), Y(0), ink('green', 0.4), 1); line(ctx, X(0), Y(-3.4), X(0), Y(1.6), ink('green', 0.4), 1);
      drawMath(ctx, 'x', X(1.6) - 2, Y(0) - 5, S * 0.9, ink('slate', 0.9), 'right');
      drawMath(ctx, 'y', X(0) + 6, Y(1.6) + 9, S * 0.9, ink('slate', 0.9), 'left');
      ctx.restore();
      var lk = R ? 1 : ease((t - 0.8) / 0.7);       // the singular lines of F1 off the axes: x = 1, y = 1, x = y
      ctx.save(); ctx.setLineDash([4, 3]); ctx.globalAlpha *= lk;
      line(ctx, X(1), Y(1.6), X(1), Y(-3.4), ink('crimson', 0.6), 1.1);
      line(ctx, X(-2.6), Y(1), X(1.6), Y(1), ink('crimson', 0.6), 1.1);
      line(ctx, X(-2.6), Y(-2.6), X(1.6), Y(1.6), ink('crimson', 0.6), 1.1);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= lk;
      drawMath(ctx, 'x=1', X(1) + 4, Y(-3.4) - 3, S * 0.8, ink('crimson', 0.95), 'left');
      drawMath(ctx, 'y=1', X(-2.6) + 2, Y(1) - 4, S * 0.8, ink('crimson', 0.95), 'left');
      ctx.save(); ctx.translate(X(-2.1), Y(-2.1)); ctx.rotate(-Math.PI / 4);   // along its line
      drawMath(ctx, 'x=y', 0, -4, S * 0.8, ink('crimson', 0.95), 'center'); ctx.restore();
      ctx.restore();
      var tx = X(-2), ty = Y(-3), gk = R ? 1 : ease((t - 1.8) / 0.5);
      if (gk > 0) {                                 // the target point
        ring(ctx, tx, ty, 5.5, ink('brassD', gk), 1.3); dot(ctx, tx, ty, 2, ink('brassD', gk));
        ctx.save(); ctx.globalAlpha *= gk;
        drawMath(ctx, '(−2,−3)', tx + 9, ty + 4, S * 0.85, ink('brassD', 1), 'left');
        ctx.restore();
      }
      var rk = R ? 1 : easeInOut((t - 2.4) / 2.8), marks = [0.2, 0.32, 0.512, 0.8192];   // along the ray, expansions matched at the marks
      if (rk > 0) {
        var segs = [0].concat(marks, [1]);
        for (var s = 0; s < segs.length - 1; s++) {
          var u0 = segs[s], u1 = Math.min(segs[s + 1], rk);
          if (u1 <= u0) break;
          line(ctx, X(-2 * u0), Y(-3 * u0), X(-2 * u1), Y(-3 * u1), ink(s ? 'brassD' : 'pine', 0.95), 1.8);
        }
        marks.forEach(function (m) { if (rk >= m) { dot(ctx, X(-2 * m), Y(-3 * m), 2.6, ink('paper', 1)); ring(ctx, X(-2 * m), Y(-3 * m), 2.6, ink('brassD', 1), 1.1); } });
        if (rk < 1) dot(ctx, X(-2 * rk), Y(-3 * rk), 3.4, ink('brassD', 1));
        dot(ctx, X(0), Y(0), 2.6, ink('pine', 1));
      }
      var px = X(1.6) + 22, Dz = v.D, room = v.x + v.w - px;       // the value, digit by digit
      if (room < 120) return;
      var fk = R ? 1 : ease((t - 0.3) / 0.6);
      ctx.save(); ctx.globalAlpha *= fk;
      drawMath(ctx, 'F_1(1;1,1;2;\\,−2,−3)', px, v.y + S * 1.3, S, ink('green', 0.95), 'left');
      ctx.restore();
      var runs = hp.runs, exact = hp.exact, prog = R ? 1 : easeInOut((t - 5.4) / 5), cur = null, order = 0, good = 0;
      if (R || t > 5.3) {
        var idx = Math.min(runs.length - 1, Math.floor(prog * (runs.length - 1) + 1e-9));
        cur = runs[idx][1]; order = runs[idx][0];
        while (good < cur.length && cur[good] === exact[good]) good++;
      }
      ctx.font = font(Dz, SERIF, 400, false); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      var cw = ctx.measureText('0').width, y0 = v.y + S * 1.3 + Dz * 2.6, pre = ctx.measureText('0.').width + cw * 0.3;
      ctx.fillStyle = ink(cur ? 'brassD' : 'slate', cur ? 1 : 0.3); ctx.fillText('0.', px, y0);
      for (var i = 0; i < 30; i++) {                // two lines of fifteen decimals, in groups of five
        var ch = cur ? cur[i + 2] : '·', ok = cur && i + 2 < good, ln = Math.floor(i / 15), col = i % 15;
        ctx.fillStyle = ok ? ink('brassD', 1) : ink('slate', cur ? 0.32 : 0.2);
        ctx.fillText(ch, px + pre + col * cw + Math.floor(col / 5) * cw * 0.5, y0 + ln * Dz * 1.55);
      }
      if (cur) {
        var correct = Math.min(30, Math.max(0, good - 2));
        caps(ctx, 'ORDER ' + order + ' · ' + correct + (correct === 1 ? ' CORRECT DIGIT' : ' CORRECT DIGITS'), px, y0 + Dz * 3.4, ink('slate', 0.9), 7.5);
      }
      var ek = R ? 1 : ease((t - 10.6) / 0.7);
      if (ek > 0) { ctx.save(); ctx.globalAlpha *= ek; drawMath(ctx, '=\\rm{ln}(4/3)', px, y0 + Dz * 3.4 + S * 2.2, S * 1.05, ink('crimson', 0.95), 'left'); ctx.restore(); }
      var ky = v.y + v.h - 8 - 2 * 14;              // the key to the picture
      ctx.save(); ctx.globalAlpha *= ak;
      ctx.fillStyle = ink('pine', 0.18); ctx.fillRect(px, ky - 7, 10, 7); ctx.strokeStyle = ink('pine', 0.5); ctx.lineWidth = 1; ctx.strokeRect(px, ky - 7, 10, 7);
      caps(ctx, 'THE SERIES CONVERGES', px + 16, ky, ink('slate', 0.85), 7);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= lk; ctx.setLineDash([4, 3]); line(ctx, px, ky + 10, px + 10, ky + 10, ink('crimson', 0.7), 1.1); ctx.restore();
      ctx.save(); ctx.globalAlpha *= lk; caps(ctx, 'SINGULAR LINES', px + 16, ky + 14, ink('slate', 0.85), 7); ctx.restore();
      if (rk > 0.2) {
        ctx.save(); ctx.globalAlpha *= clamp01((rk - 0.2) / 0.2);
        dot(ctx, px + 5, ky + 24, 2.6, ink('paper', 1)); ring(ctx, px + 5, ky + 24, 2.6, ink('brassD', 1), 1.1);
        caps(ctx, 'EXPANSIONS MATCHED', px + 16, ky + 28, ink('slate', 0.85), 7);
        ctx.restore();
      }
    }
  };

  /* The method of brackets: the bracket, the bracket series of a sum (Rule 2) and the rule
     that evaluates a bracket series (Rule 4), as listed in Sec. 2.1 of the paper. */
  var BRACKETS = {
    key: 'brackets', paper: '2112.09679', dur: 14.5, cap: 'Revisiting the method of brackets',
    lines: [['BRACKET', '\\int_0^∞x^{α−1}\\,\\rm{d}x=\\langle α\\rangle'],
            ['RULE 2', '(A+B)^α=\\frac{1}{Γ(−α)}\\sum_{m,n}φ_{m,n}\\,A^mB^n\\,\\langle −α+m+n\\rangle'],
            ['RULE 4', '\\sum_nφ_n\\,f(n)\\,\\langle an+b\\rangle=\\frac{1}{|a|}\\,f(n^∗)\\,Γ(−n^∗)'],
            ['', 'φ_n=\\frac{(−1)^n}{Γ(n+1)},\\quad φ_{m,n}=φ_mφ_n,\\quad n^∗=−\\frac{b}{a}']],
    layout: function (v) {
      var lab = v.w > 430 ? 58 : 0, S = Math.max(9, Math.min(15, v.w / 30)), ctx = v.ctx, wmax = 0;
      BRACKETS.lines.forEach(function (L) { wmax = Math.max(wmax, mathBox(ctx, L[1], S).w); });
      v.S = Math.min(S, S * (v.w - lab - 8) / wmax); v.lab = lab;
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, rate = 18, sizes = [S * 1.05, S, S, S * 0.86], t0 = 0.4, total = 0, gap = S * 1.15;
      BRACKETS.lines.forEach(function (L, i) { var ex = extent(mathBox(ctx, L[1], sizes[i]).prims); total += ex[1] - ex[0] + (i ? gap : 0); });
      var y = v.y + (v.h - total - 16) / 2, x = v.x + 4 + v.lab;   // (room left below for the verdict)
      BRACKETS.lines.forEach(function (L, i) {
        var b = mathBox(ctx, L[1], sizes[i]), ex = extent(b.prims), n = b.prims.length, k = R ? n : Math.max(0, (t - t0) * rate);
        y -= ex[0];
        drawMath(ctx, L[1], x, y, sizes[i], ink(i === 3 ? 'slate' : 'green', 0.95), 'left', k);
        if (L[0] && v.lab && k > 0) caps(ctx, L[0], v.x + 4, y - 0.3 * S, ink('brassD', 0.9), 7.5);
        t0 += n / rate + 0.45;
        y += ex[1] + gap;
      });
      var rk = R ? 1 : ease((t - t0 - 0.1) / 0.6);   // then what the paper finds (its abstract): Mellin-Barnes does better on both counts
      if (rk > 0) {
        var res = '\\rm{With}\\,\\rm{Mellin-Barnes}:\\quad\\rm{no}\\,\\rm{convergence}\\,\\rm{analysis},\\,\\rm{and}\\,\\rm{logarithmic}\\,\\rm{cases}\\,\\rm{too}';
        var S2 = 11, w = mathBox(ctx, res, S2).w;
        if (w > v.w - 8) S2 *= (v.w - 8) / w;
        ctx.save(); ctx.globalAlpha *= rk; drawMath(ctx, res, v.x + 4, v.y + v.h - 9, S2, ink('crimson', 0.95), 'left'); ctx.restore();
      }
    }
  };

  /* The 152 GeV excesses in the 2HDM: Drell-Yan production pp -> W* -> H+ H, with H -> gamma gamma
     and H+ -> tau nu or t b-bar, as in Fig. 1 of the paper. The di-photon branching ratio of a
     percent or so can come from the Z2-breaking term lambda6, through a loop of charged Higgs
     bosons (Eqs. 3.2 and 3.3). */
  var HD_DY = { n: { q: [0.12, 0.1], qb: [0.12, 0.9], v1: [0.5, 0.5, 1], v2: [0.95, 0.5, 1], vc: [1.32, 0.24, 1], vn: [1.32, 0.76, 1],
                     ta: [1.8, 0.06], nu: [1.82, 0.4], g1: [1.82, 0.62], g2: [1.8, 0.96] },
                e: [{ a: 'q', b: 'v1', t: 'f', lab: 'q', lo: [-10, -4] }, { a: 'qb', b: 'v1', t: 'f', rev: 1, lab: "\\bar{q}'", lo: [-12, 8] },
                    { a: 'v1', b: 'v2', t: 'w', lab: 'W^{+∗}', lo: [0, -12] },
                    { a: 'v2', b: 'vc', t: 's', lab: 'H^+', lo: [-10, -8] }, { a: 'v2', b: 'vn', t: 's', lab: 'H', lo: [-12, 16] },
                    { a: 'vc', b: 'ta', t: 'f', rev: 1, lab: 'τ^+', lt: 0.85, lo: [0, -9] }, { a: 'vc', b: 'nu', t: 'f', lab: 'ν', lt: 0.85, lo: [4, 13] },
                    { a: 'vn', b: 'g1', t: 'ph', lab: 'γ', lt: 0.85, lo: [0, -9] }, { a: 'vn', b: 'g2', t: 'ph', lab: 'γ', lt: 0.85, lo: [4, 14] }],
                stagger: 0.36, edgeDur: 0.55 };
  var HD_LOOP = { n: { h: [0.14, 0.5], A: [0.66, 0.5, 1], B: [1.16, 0.2, 1], C: [1.16, 0.8, 1], g1: [1.8, 0.04], g2: [1.8, 0.96] },
                  e: [{ a: 'h', b: 'A', t: 's', lab: 'H', lo: [0, -10] },
                      { a: 'A', b: 'B', t: 's' }, { a: 'B', b: 'C', t: 's', lab: 'H^±', lo: [17, 4] }, { a: 'C', b: 'A', t: 's' },
                      { a: 'B', b: 'g1', t: 'ph', lab: 'γ', lt: 0.6, lo: [0, -10] }, { a: 'C', b: 'g2', t: 'ph', lab: 'γ', lt: 0.6, lo: [2, 16] }],
                  stagger: 0.42, edgeDur: 0.55 };
  var HDM152 = {
    key: 'hdm152', paper: '2407.06267', dur: 12, cap: 'Di-photon excesses at 152 GeV in the 2HDM',
    layout: function (v) { v.dy = Object.create(v); diagramLayout(v.dy, HD_DY); v.lp = Object.create(v); diagramLayout(v.lp, HD_LOOP); },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, split = 6.2;
      var a1 = R ? 1 : clamp01((split - t) / 0.5), a2 = R ? 0 : clamp01((t - split) / 0.5);
      if (a1 > 0) {
        ctx.save(); ctx.globalAlpha *= a1; drawDiagram(ctx, v.dy, HD_DY, t);
        caps(ctx, 'DRELL-YAN PRODUCTION', v.x + 4, v.y + 12, ink('slate', 0.85), 8);
        ctx.globalAlpha *= R ? 1 : ease((t - 3.9) / 0.6);
        drawMath(ctx, 'm_H=152\\,\\rm{GeV},\\quad H^+→τ^+ν,\\,t\\bar{b}', v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9), 'left');
        ctx.restore();
      }
      if (a2 > 0) {
        var tl = t - split, F = v.lp.F, A = HD_LOOP.n.A;
        ctx.save(); ctx.globalAlpha *= a2; drawDiagram(ctx, v.lp, HD_LOOP, tl);
        caps(ctx, 'H → γγ VIA A CHARGED HIGGS LOOP', v.x + 4, v.y + 12, ink('crimson', 0.85), 8);
        ctx.globalAlpha *= R ? 1 : ease((tl - 1.2) / 0.5);
        drawMath(ctx, 'λ_6', F.x + A[0] * F.s - 6, F.y + A[1] * F.s + 22, 13, ink('brassD', 1), 'center');
        drawMath(ctx, '\\rm{from}\\quad λ_6\\,H_1^†H_1\\,H_2^†H_1+\\rm{h.c.}', v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9), 'left');   // (as the abstract writes it)
        ctx.globalAlpha *= R ? 1 : ease((tl - 2.6) / 0.6);     // and what it buys: a percent-level rate to photons, at about 4 sigma
        drawMath(ctx, '≳4σ\\quad\\rm{for}\\quad\\rm{Br}(H\\toγγ)≈2\\,%', v.x + 4, v.y + v.h - 27, 11, ink('crimson', 0.95), 'left');
        ctx.restore();
      }
    }
  };

  /* Quadratic and quartic integrals with the method of brackets. First the warm-up of the paper,
     the generalized Gaussian: e^(-x^p) is expanded, the integral becomes a bracket, and the rule
     gives (1/p) Gamma(1/p), shown as the area under the curve while p grows. Then the quadratic
     integral of Gradshteyn and Ryzhik 3.252.1: its bracket series has three indices and two
     brackets, so one index stays free. With n2 free there is one series, for b^2 < ac; the
     solutions with n1 and with n3 free converge together, for b^2 > ac, and are added. */
  function gammaFn(x) {                             // Lanczos approximation
    var c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
             12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gammaFn(1 - x));
    x -= 1;
    var a = c[0], tt = x + 7.5;
    for (var i = 1; i < 9; i++) a += c[i] / (x + i);
    return Math.sqrt(TAU) * Math.pow(tt, x + 0.5) * Math.exp(-tt) * a;
  }
  var QUADRATIC = {
    key: 'quadratic', paper: '1909.00962', dur: 14, cap: 'Quadratic and quartic integrals',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12.5, v.w / 42));
      var w = Math.min(v.w * 0.5, (v.h - 30) * 1.7);
      v.G = { L: v.x + 8, R: v.x + 8 + w, T: v.y + 14, B: v.y + v.h - 22 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, split = 7;
      var a1 = R ? 1 : clamp01((split - t) / 0.45), a2 = R ? 0 : clamp01((t - split) / 0.45);
      if (a1 > 0) { ctx.save(); ctx.globalAlpha *= a1; this.gauss(v, t, R); ctx.restore(); }
      if (a2 > 0) { ctx.save(); ctx.globalAlpha *= a2; this.quad(v, t - split, R); ctx.restore(); }
    },
    gauss: function (v, t, R) {                     // the area under e^(-x^p) is (1/p) Gamma(1/p)
      var ctx = v.ctx, G = v.G, S = v.S, xm = 2.4;
      function X(x) { return G.L + x / xm * (G.R - G.L); }
      function Y(y) { return G.B - y / 1.12 * (G.B - G.T); }
      var p = R ? 2 : t < 1.6 ? 1 : t < 2.6 ? 1 + easeInOut((t - 1.6) / 1) : t < 4 ? 2 : 2 * Math.pow(4, easeInOut((t - 4) / 1.8));
      var ak = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= ak;
      line(ctx, G.L, G.B, G.R, G.B, ink('green', 0.5), 1); line(ctx, G.L, G.B, G.L, G.T, ink('green', 0.5), 1);
      ctx.save(); ctx.setLineDash([3, 3]); line(ctx, X(0), Y(1), X(1), Y(1), ink('slate', 0.35), 1); line(ctx, X(1), Y(1), X(1), G.B, ink('slate', 0.35), 1); ctx.restore();
      drawMath(ctx, '1', G.L - 5, Y(1) + 4, S * 0.85, ink('slate', 0.9), 'right');
      drawMath(ctx, '1', X(1), G.B + 13, S * 0.85, ink('slate', 0.9), 'center');
      drawMath(ctx, 'x', G.R, G.B + 13, S * 0.9, ink('slate', 0.9), 'right');
      ctx.fillStyle = ink('brass', 0.2); ctx.beginPath(); ctx.moveTo(X(0), G.B);
      for (var x = 0; x <= xm + 1e-9; x += 0.02) ctx.lineTo(X(x), Y(Math.exp(-Math.pow(x, p))));
      ctx.lineTo(X(xm), G.B); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ink('brassD', 0.95); ctx.lineWidth = 1.6; ctx.beginPath();
      for (x = 0; x <= xm + 1e-9; x += 0.02) { var yy = Y(Math.exp(-Math.pow(x, p))); if (x) ctx.lineTo(X(x), yy); else ctx.moveTo(X(x), yy); }
      ctx.stroke();
      drawMath(ctx, 'e^{−x^p}', X(Math.min(1.1, 0.25 + 0.5 / p)) + 10, Y(Math.exp(-Math.pow(Math.min(1.1, 0.25 + 0.5 / p), p))) - 6, S, ink('brassD', 1), 'left');
      ctx.restore();
      var px = G.R + 26, room = v.x + v.w - px;      // the derivation and the area, as p changes
      if (room < 120) return;
      var lines = ['\\int_0^∞e^{−x^p}\\,\\rm{d}x', '=\\sum_nφ_n\\,\\langle pn+1\\rangle', '=\\frac{1}{p}\\,Γ(1/p)'], y = v.y + S * 2;
      lines.forEach(function (src, i) {
        var k = R ? 1 : ease((t - 0.5 - i * 0.9) / 0.6);
        if (k > 0) { ctx.save(); ctx.globalAlpha *= k; drawMath(ctx, src, px + (i ? S * 1.2 : 0), y, S, ink(i === 2 ? 'crimson' : 'green', 0.95), 'left'); ctx.restore(); }
        y += S * (i === 1 ? 2.9 : 2.5);
      });
      var vk = R ? 1 : ease((t - 2.4) / 0.6);
      if (vk > 0) {
        ctx.save(); ctx.globalAlpha *= vk;
        var area = gammaFn(1 / p) / p;
        drawMath(ctx, 'p=' + p.toFixed(2), px, y + S * 0.6, S * 0.95, ink('slate', 0.95), 'left');
        drawMath(ctx, '\\rm{area}=' + area.toFixed(4), px, y + S * 2.4, S * 0.95, ink('brassD', 1), 'left');
        if (Math.abs(p - 2) < 0.005) drawMath(ctx, '=√π/2', px + S * 7.6, y + S * 2.4, S * 0.95, ink('crimson', 0.95), 'left');
        ctx.restore();
      }
    },
    quad: function (v, t, R) {                      // the quadratic integral and its two representations
      var ctx = v.ctx, S = v.S, x0 = v.x + 4;
      var k1 = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= k1;
      drawMath(ctx, 'I=\\int_0^∞\\frac{\\rm{d}x}{(ax^2+2bx+c)^n}', x0, v.y + S * 2.2, S, ink('green', 0.95), 'left');
      ctx.restore();
      var bs = '=\\sum_{n_1,n_2,n_3}φ_{1,2,3}\\,\\frac{a^{n_1}(2b)^{n_2}c^{n_3}}{Γ(n)}\\,\\langle n+n_1+n_2+n_3\\rangle\\,\\langle 2n_1+n_2+1\\rangle';
      var bsz = S * Math.min(0.95, (v.w - 8) / mathBox(ctx, bs, S).w), k2 = R ? 1 : ease((t - 0.9) / 0.6);
      ctx.save(); ctx.globalAlpha *= k2;
      drawMath(ctx, bs, x0, v.y + S * 5.3, bsz, ink('green', 0.95), 'left');
      ctx.restore();
      var k3 = R ? 1 : ease((t - 2) / 0.6);
      ctx.save(); ctx.globalAlpha *= k3;
      caps(ctx, 'THREE INDICES AND TWO BRACKETS, SO ONE INDEX STAYS FREE', x0, v.y + S * 7.6, ink('slate', 0.85), 7);
      ctx.restore();
      var bx0 = x0 + 6, bx1 = v.x + v.w - 26, bm = (bx0 + bx1) / 2, by = v.y + v.h * 0.74;   // the line of b^2/ac
      var k4 = R ? 1 : ease((t - 2.8) / 0.7), k5 = R ? 1 : ease((t - 3.8) / 0.7);
      if (k4 > 0) {
        ctx.save(); ctx.globalAlpha *= k4;
        line(ctx, bx0, by, bx0 + (bm - bx0) * k4, by, ink('pine', 0.95), 3);
        drawMath(ctx, 'n_2\\,\\rm{free}', (bx0 + bm) / 2, by - 12, S * 0.95, ink('pine', 1), 'center');
        caps(ctx, 'ONE SERIES', (bx0 + bm) / 2, by + 17, ink('pine', 0.95), 7, 'center');
        drawMath(ctx, '0', bx0, by + 30, S * 0.8, ink('slate', 0.9), 'center');
        ctx.restore();
      }
      if (k5 > 0) {
        ctx.save(); ctx.globalAlpha *= k5;
        line(ctx, bm, by, bm + (bx1 - bm) * k5, by, ink('brassD', 0.95), 3);
        arrowHead(ctx, bx1 + 8, by, 0, 7, ink('brassD', 0.95 * k5));
        drawMath(ctx, 'n_1\\,\\rm{and}\\,n_3\\,\\rm{free}', (bm + bx1) / 2, by - 12, S * 0.95, ink('brassD', 1), 'center');
        caps(ctx, 'TWO SERIES, ADDED', (bm + bx1) / 2, by + 17, ink('brassD', 0.95), 7, 'center');
        ctx.restore();
      }
      if (k4 > 0.5) {
        ctx.save(); ctx.globalAlpha *= k4;
        dot(ctx, bm, by, 4, ink('paper', 1)); ring(ctx, bm, by, 4, ink('green', 0.9), 1.3);
        drawMath(ctx, '1', bm, by + 30, S * 0.8, ink('slate', 0.9), 'center');
        drawMath(ctx, 'b^2/ac', bx1 + 14, by + 30, S * 0.85, ink('slate', 0.95), 'right');
        ctx.restore();
      }
    }
  };

  /* Anatomy of the real Higgs triplet model: the three ways the LHC makes the triplet-like Higgs
     bosons, as in Fig. 1 of the paper, and the signatures each leads to (abstract, (i) to (iii)).
     Drell-Yan through W*, Drell-Yan through a photon or Z, and gluon fusion, which only works
     through the small mixing with the Higgs boson. */
  var AN_W = { n: { q: [0.14, 0.1], qb: [0.14, 0.9], v1: [0.56, 0.5, 1], v2: [1.06, 0.5, 1], c: [1.62, 0.12], n0: [1.62, 0.88] },
               e: [{ a: 'q', b: 'v1', t: 'f', lab: 'q', lo: [-10, -4] }, { a: 'qb', b: 'v1', t: 'f', rev: 1, lab: "\\bar{q}'", lo: [-12, 8] },
                   { a: 'v1', b: 'v2', t: 'w', lab: 'W^{±∗}', lo: [0, -12] },
                   { a: 'v2', b: 'c', t: 's', lab: 'Δ^±', lt: 0.7, lo: [-12, -6] }, { a: 'v2', b: 'n0', t: 's', lab: 'Δ^0', lt: 0.7, lo: [-12, 16] }],
               stagger: 0.36, edgeDur: 0.5 };
  var AN_Z = { n: { q: [0.14, 0.1], qb: [0.14, 0.9], v1: [0.56, 0.5, 1], v2: [1.06, 0.5, 1], c: [1.62, 0.12], n0: [1.62, 0.88] },
               e: [{ a: 'q', b: 'v1', t: 'f', lab: 'q', lo: [-10, -4] }, { a: 'qb', b: 'v1', t: 'f', rev: 1, lab: '\\bar{q}', lo: [-12, 8] },
                   { a: 'v1', b: 'v2', t: 'ph', lab: 'γ^∗/Z^∗', lo: [0, -12] },
                   { a: 'v2', b: 'c', t: 's', lab: 'Δ^+', lt: 0.7, lo: [-12, -6] }, { a: 'v2', b: 'n0', t: 's', lab: 'Δ^−', lt: 0.7, lo: [-12, 16] }],
               stagger: 0.36, edgeDur: 0.5 };
  var AN_G = { n: { g1: [0.12, 0.1], g2: [0.12, 0.9], A: [0.58, 0.22, 1], B: [0.58, 0.78, 1], C: [1.06, 0.5, 1], d: [1.66, 0.5] },
               e: [{ a: 'g1', b: 'A', t: 'g', lab: 'g', lt: 0.4, lo: [10, -8] }, { a: 'g2', b: 'B', t: 'g', lab: 'g', lt: 0.4, lo: [6, -10] },
                   { a: 'A', b: 'C', t: 'f' }, { a: 'C', b: 'B', t: 'f' }, { a: 'B', b: 'A', t: 'f', lab: 't,b', lo: [-14, 4] },
                   { a: 'C', b: 'd', t: 's', lab: 'Δ^0', lo: [0, -10] }],
               stagger: 0.36, edgeDur: 0.5 };
  var AN_STEPS = [
    { D: AN_W, top: 'DRELL-YAN, CHARGED CURRENT', note: 'Δ^±Δ^0→W^±Z\\,W^+W^−\\quad\\rm{or}\\quad Δ^0→γγ', len: 6,
      res: 'Δ^0→γγ:\\quad\\rm{Br}≈0.7\\,%\\quad(≈4σ\\,\\rm{near}\\,152\\,\\rm{GeV})', rc: 'green' },     // the abstract, (iii)
    { D: AN_Z, top: 'DRELL-YAN, NEUTRAL CURRENT', note: 'Δ^+Δ^−→τ^+τ^−ν\\bar{ν}\\quad\\rm{or}\\quad W^+W^−ZZ', len: 6,
      res: 'τ^+τ^−ν\\bar{ν}:\\quad m_{Δ^±}<110\\,\\rm{GeV}\\,\\rm{excluded}\\,(95\\,%\\,\\rm{CL})', rc: 'crimson' },   // (i)
    { D: AN_G, top: 'GLUON FUSION, ONLY THROUGH MIXING', note: 'σ(gg→Δ^0)=\\rm{sin}^2α\\,σ_{\\rm{SM}}' }
  ];
  var ANATOMY = {
    key: 'anatomy', paper: '2411.18618', dur: 16.5, cap: 'Anatomy of the real Higgs triplet model',
    layout: function (v) {
      v.steps = AN_STEPS.map(function (s) { var w = Object.create(v); diagramLayout(w, s.D); return w; });
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, start = 0;
      AN_STEPS.forEach(function (s, i) {
        var len = s.len || 4.5, lt = t - start, a = R ? (i === 0 ? 1 : 0) : clamp01(Math.min(lt / 0.4, (len - lt) / 0.4));
        start += len;
        if (i === AN_STEPS.length - 1 && !R) a = clamp01(lt / 0.4);
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        drawDiagram(ctx, v.steps[i], s.D, R ? 60 : lt);
        caps(ctx, s.top, v.x + 4, v.y + 12, ink(i === 2 ? 'crimson' : 'slate', 0.85), 8);
        caps(ctx, (i + 1) + ' OF 3', v.x + v.w - 4, v.y + 12, ink('slate', 0.55), 7, 'right');
        var kn = R ? 1 : ease((lt - 2.2) / 0.5), kr = !s.res ? 0 : R ? 1 : ease((lt - 3.7) / 0.6);   // the channels, then what the paper finds in them
        if (kn * (1 - kr) > 0) { ctx.save(); ctx.globalAlpha *= kn * (1 - kr); drawMath(ctx, s.note, v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9), 'left'); ctx.restore(); }
        if (kr > 0) {
          var S = 11, w = mathBox(ctx, s.res, S).w;
          if (w > v.w - 8) S *= (v.w - 8) / w;
          ctx.save(); ctx.globalAlpha *= kr; drawMath(ctx, s.res, v.x + 4, v.y + v.h - 9, S, ink(s.rc, 0.95), 'left'); ctx.restore();
        }
        ctx.restore();
      });
    }
  };

  /* Growing evidence for a Higgs triplet: di-photons produced together with jets, leptons, top
     quarks, missing energy or a tau, in the eight ATLAS signal regions of Table 1 of the paper.
     Combined with their correlations, they prefer a di-photon decay of the neutral triplet Higgs
     at about 152 GeV with a significance of 4.3 sigma, and Br = 0.87 to 1.47 per cent at 1 sigma. */
  var EV_SR = [['≥4j', 'pine'], ['ℓb', 'brassD'], ['t_{\\rm{lep}}', 'brassD'], ['2ℓ', 'green'],
               ['1ℓ', 'green'], ['E_T^{\\rm{miss}}>100', 'slate'], ['E_T^{\\rm{miss}}>200', 'slate'], ['1τ_{\\rm{had}}', 'crimson']];
  var EVIDENCE = {
    key: 'evidence', paper: '2404.14492', dur: 12, cap: 'Growing evidence for a Higgs triplet',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 44));
      v.cols = v.w > 420 ? 4 : 2;
      var gw = v.w * (v.w > 420 ? 0.6 : 0.56), rows = 8 / v.cols;
      var th = Math.min(52, (v.h - 60) / rows), mid = v.y + 8 + (v.h - 26) / 2;
      v.T = { x: v.x + 4, y: mid - rows * th / 2, w: gw / v.cols, h: th };
      var r = Math.min((v.w - gw - 50) / 2.3, (v.h - 70) / 1.5);
      v.Gc = { x: v.x + gw + 14 + (v.w - gw - 14) / 2, y: mid + r * 0.42, r: r };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, T = v.T, Gc = v.Gc;
      var hk = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= hk;
      caps(ctx, 'γγ PLUS X, EIGHT SIGNAL REGIONS', v.x + 4, v.y + 12, ink('slate', 0.85), 8);
      ctx.restore();
      var ck = R ? 1 : ease((t - 4.4) / 1.2);
      EV_SR.forEach(function (s, i) {               // the signal regions, one after another
        var k = R ? 1 : ease((t - 0.5 - i * 0.38) / 0.45);
        if (k <= 0) return;
        var cx = T.x + (i % v.cols) * T.w, cy = T.y + Math.floor(i / v.cols) * T.h;
        ctx.save(); ctx.globalAlpha *= k;
        roundRect(ctx, cx + 2, cy + 2, T.w - 6, T.h - 8, 4);
        ctx.fillStyle = ink(s[1], 0.08 + 0.06 * ck); ctx.fill();
        ctx.strokeStyle = ink(s[1], 0.5); ctx.lineWidth = 1; ctx.stroke();
        drawMath(ctx, s[0], cx + (T.w - 4) / 2, cy + (T.h - 6) / 2 + 4, S * (v.cols === 4 ? 0.9 : 0.95), ink('green', 0.95), 'center');
        ctx.restore();
      });
      if (ck > 0) {                                 // the eight are combined, with their correlations
        var gx = T.x + v.cols * T.w + 2, gy0 = T.y + 4, gy1 = T.y + 8 / v.cols * T.h - 10, ax = Gc.x - Gc.r - 26;
        ctx.save(); ctx.globalAlpha *= ck; ctx.strokeStyle = ink('brassD', 0.7); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.quadraticCurveTo(gx + 6, gy0, gx + 6, gy0 + 8); ctx.lineTo(gx + 6, gy1 - 8); ctx.quadraticCurveTo(gx + 6, gy1, gx, gy1); ctx.stroke();
        var my = (gy0 + gy1) / 2;
        if (ax > gx + 16) { line(ctx, gx + 6, my, gx + 6 + (ax - gx - 6) * ck, my, ink('brassD', 0.7), 1.1); if (ck > 0.95) arrowHead(ctx, ax + 2, my, 0, 6, ink('brassD', 0.8)); }
        ctx.restore();
      }
      var gk = R ? 1 : ease((t - 5.4) / 0.6), fill = R ? 1 : easeInOut((t - 5.8) / 2.2), sig = 4.3 * fill;
      if (gk <= 0) return;
      ctx.save(); ctx.globalAlpha *= gk;              // the combined significance, on a dial from 0 to 5 sigma
      var a0 = Math.PI, a1 = 2 * Math.PI;
      ctx.lineCap = 'round';
      ctx.strokeStyle = ink('green', 0.15); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(Gc.x, Gc.y, Gc.r, a0, a1); ctx.stroke();
      ctx.strokeStyle = ink('brassD', 0.9); ctx.beginPath(); ctx.arc(Gc.x, Gc.y, Gc.r, a0, a0 + Math.PI * sig / 5); ctx.stroke();
      ctx.lineCap = 'butt';
      for (var s5 = 0; s5 <= 5; s5++) {
        var an = a0 + Math.PI * s5 / 5, c = Math.cos(an), sn = Math.sin(an);
        line(ctx, Gc.x + c * (Gc.r + 6), Gc.y + sn * (Gc.r + 6), Gc.x + c * (Gc.r + 10), Gc.y + sn * (Gc.r + 10), ink('slate', 0.6), 1);
        drawMath(ctx, s5 + 'σ', Gc.x + c * (Gc.r + 19), Gc.y + sn * (Gc.r + 19) + 4, S * 0.75, ink('slate', 0.85), 'center');
      }
      ctx.font = font(Math.max(15, Gc.r * 0.42), SERIF, 600, false); ctx.fillStyle = ink('brassD', 1); ctx.textAlign = 'center';
      ctx.fillText(sig.toFixed(1) + 'σ', Gc.x, Gc.y - Gc.r * 0.12);
      caps(ctx, 'COMBINED', Gc.x, Gc.y + 12, ink('slate', 0.85), 7, 'center');
      ctx.restore();
      var bk = R ? 1 : ease((t - 8.4) / 0.6);
      if (bk > 0) {
        ctx.save(); ctx.globalAlpha *= bk;
        drawMath(ctx, 'm_{Δ}≈152\\,\\rm{GeV}', Gc.x, Gc.y + 32, S * 0.95, ink('green', 0.95), 'center');
        drawMath(ctx, '\\rm{Br}(Δ^0→γγ)=0.87\\,\\rm{to}\\,1.47\\,%', v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9), 'left');
        caps(ctx, 'AT 1σ', v.x + 4 + mathBox(ctx, '\\rm{Br}(Δ^0→γγ)=0.87\\,\\rm{to}\\,1.47\\,%', 11).w + 8, v.y + v.h - 9, ink('slate', 0.7), 7);
        ctx.restore();
      }
    }
  };

  /* What is a Mellin-Barnes integral? The one-fold example of the paper, Eq. (2): the contour
     must keep the poles of Gamma(-z) (z = 0, 1, 2, ...) on its right and those of Gamma(-1/2 + z)
     (z = 1/2, -1/2, -3/2, ...) on its left, so it cannot be straight (Fig. 1). Closing it to the
     right sums the residues of the first set, Eq. (4), valid for |x| < 1; closing it to the left
     gives Eq. (5), valid for |x| > 1. Both resum to -2 sqrt(pi) (1 - x)^(1/2). */
  var MB_PATH = [[-0.25, -1.5], [-0.25, 0.3], [0.25, 0.3], [0.25, -0.3], [0.75, -0.3], [0.75, 1.5]];
  function roundedPath(P, r) {                      // a polyline with rounded corners, as points
    var out = [P[0]];
    for (var i = 1; i < P.length - 1; i++) {
      var a = P[i - 1], b = P[i], c = P[i + 1];
      var d1 = Math.hypot(b[0] - a[0], b[1] - a[1]), d2 = Math.hypot(c[0] - b[0], c[1] - b[1]), rr = Math.min(r, d1 / 2, d2 / 2);
      var p = [b[0] + (a[0] - b[0]) / d1 * rr, b[1] + (a[1] - b[1]) / d1 * rr], q = [b[0] + (c[0] - b[0]) / d2 * rr, b[1] + (c[1] - b[1]) / d2 * rr];
      out.push(p);
      for (var k = 1; k < 8; k++) { var u = k / 8, w1 = (1 - u) * (1 - u), w2 = 2 * u * (1 - u), w3 = u * u; out.push([w1 * p[0] + w2 * b[0] + w3 * q[0], w1 * p[1] + w2 * b[1] + w3 * q[1]]); }
      out.push(q);
    }
    out.push(P[P.length - 1]);
    return out;
  }
  var MB_SNAKE = roundedPath(MB_PATH, 0.14);
  var MBINTRO = {
    key: 'mbintro', paper: '2402.04174', dur: 15, cap: 'What is a Mellin-Barnes integral?',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 44));
      var top = v.y + v.S * 3, w = v.w * (v.w > 420 ? 0.62 : 0.56), h = v.h - (top - v.y) - 4, u = Math.min(w / 5.2, h / 3.1);
      v.Z = { u: u, cx: v.x + 4 + 2.3 * u, cy: top + h / 2 };
      v.px = v.x + 4 + 5.2 * u + 16;
      v.geo = pathGeo(MB_SNAKE.map(function (p) { return [v.Z.cx + p[0] * u, v.Z.cy - p[1] * u]; }));
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, Z = v.Z, u = Z.u;
      function X(x) { return Z.cx + x * u; }
      function Y(y) { return Z.cy - y * u; }
      var ak = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= ak;
      drawMath(ctx, 'I=\\int\\frac{\\rm{d}z}{2πi}\\,(−x)^z\\,Γ(−z)\\,Γ(−\\frac{1}{2}+z)', v.x + 4, v.y + S * 1.6, S, ink('green', 0.95), 'left');
      line(ctx, X(-2.3), Y(0), X(2.9), Y(0), ink('green', 0.35), 1); line(ctx, X(0), Y(-1.5), X(0), Y(1.5), ink('green', 0.35), 1);
      drawMath(ctx, '\\rm{Re}\\,z', X(2.9), Y(0) - 6, S * 0.8, ink('slate', 0.9), 'right');
      ctx.restore();
      var right = [0, 1, 2], left = [0.5, -0.5, -1.5];
      var cR = R ? 1 : ease((t - 4) / 0.7), cRout = R ? 0 : clamp01((t - 7.6) / 0.5), cL = R ? 0 : ease((t - 8.1) / 0.7);
      function poles(list, col, pulseAt, live) {
        list.forEach(function (x, i) {
          var k = R ? 1 : ease((t - 0.3 - i * 0.12 - (col === 'pine' ? 0.5 : 0)) / 0.4);
          if (k <= 0) return;
          var px = X(x), py = Y(0), hit = live > 0 && !R ? clamp01((t - pulseAt - i * 0.35) / 0.3) : (R && live > 0 ? 1 : 0);
          if (hit > 0) ring(ctx, px, py, 4 + 5 * hit, ink(col, 0.55 * live * (1 - 0.5 * hit)), 1.2);
          dot(ctx, px, py, 3.2 * k, ink(col, 0.95));
        });
      }
      poles(right, 'crimson', 4.6, cR * (1 - cRout));
      poles(left, 'pine', 8.7, cL);
      var ck = R ? 1 : clamp01((t - 1.2) / 1.8), g = v.geo;   // the contour, from below to above
      if (ck > 0) {
        ctx.strokeStyle = ink('brassD', 0.95); ctx.lineWidth = 1.6; ctx.beginPath();
        var end = g.len * ck, s0 = pathAt(g, 0); ctx.moveTo(s0[0], s0[1]);
        for (var i = 1; i < g.pts.length && g.L[i] <= end; i++) ctx.lineTo(g.pts[i][0], g.pts[i][1]);
        var e = pathAt(g, end); ctx.lineTo(e[0], e[1]); ctx.stroke();
        [0.18, 0.88].forEach(function (f) { if (ck > f + 0.04) { var q = pathAt(g, g.len * f); arrowHead(ctx, q[0] + q[2] * 4, q[1] + q[3] * 4, Math.atan2(q[3], q[2]), 6, ink('brassD', 0.95)); } });
      }
      function arc(dir, k) {                        // closing the contour at infinity, to the right or to the left
        var T = MB_PATH[MB_PATH.length - 1], B = MB_PATH[0], c = dir > 0 ? 3.3 : -2.9;
        ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = ink('brassD', 0.7 * k); ctx.lineWidth = 1.2; ctx.beginPath();
        for (var j = 0; j <= 40 * k; j++) {
          var w = j / 40, a0 = (1 - w) * (1 - w) * (1 - w), a1 = 3 * w * (1 - w) * (1 - w), a2 = 3 * w * w * (1 - w), a3 = w * w * w;
          var x = X(a0 * T[0] + (a1 + a2) * c + a3 * B[0]), y = Y((a0 + a1) * T[1] + (a2 + a3) * B[1]);
          if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.restore();
      }
      if (cR > 0 && cRout < 1) { ctx.save(); ctx.globalAlpha *= 1 - cRout; arc(1, cR); ctx.restore(); }
      if (cL > 0) arc(-1, cL);
      var px = v.px, room = v.x + v.w - px, y0 = Y(1.3);   // what each closing gives
      if (room < 110) return;
      ctx.save(); ctx.globalAlpha *= ak;
      [['Γ(−z)', 'crimson'], ['Γ(−\\frac{1}{2}+z)', 'pine']].forEach(function (L, i) {
        dot(ctx, px + 4, y0 - 4 + i * S * 2, 3, ink(L[1], 0.95));
        drawMath(ctx, L[0], px + 14, y0 + i * S * 2, S * 0.9, ink('green', 0.95), 'left');
      });
      ctx.restore();
      var yr = y0 + S * 5.2;
      if (cR > 0 && cRout < 1) {
        ctx.save(); ctx.globalAlpha *= cR * (1 - cRout);
        caps(ctx, 'CLOSING TO THE RIGHT', px, yr, ink('crimson', 0.9), 7);
        drawMath(ctx, '\\sum_nΓ(n−\\frac{1}{2})\\,\\frac{x^n}{n!}', px, yr + S * 2.3, S * 0.95, ink('green', 0.95), 'left');
        drawMath(ctx, '|x|<1', px, yr + S * 4.4, S * 0.9, ink('slate', 0.95), 'left');
        ctx.restore();
      }
      if (cL > 0) {
        var fk = R ? 0 : ease((t - 11.6) / 0.6);
        ctx.save(); ctx.globalAlpha *= cL * (1 - fk);
        caps(ctx, 'CLOSING TO THE LEFT', px, yr, ink('pine', 0.95), 7);
        drawMath(ctx, '(−x)^{1/2}\\sum_nΓ(n−\\frac{1}{2})\\,\\frac{x^{−n}}{n!}', px, yr + S * 2.3, S * 0.95, ink('green', 0.95), 'left');
        drawMath(ctx, '|x|>1', px, yr + S * 4.4, S * 0.9, ink('slate', 0.95), 'left');
        ctx.restore();
        if (fk > 0) {
          ctx.save(); ctx.globalAlpha *= fk;
          caps(ctx, 'BOTH SERIES RESUM TO', px, yr, ink('slate', 0.85), 7);
          drawMath(ctx, '−2√π\\,(1−x)^{1/2}', px, yr + S * 2.3, S * 1.05, ink('crimson', 0.95), 'left');
          ctx.restore();
        }
      }
    }
  };

  /* Multiple polylogarithms from their MB representation (Sec. 4 of the paper): for
     Li_{m1,m2}(x1, x2) the conic hull method gives five series representations whose regions of
     convergence, cut out by x1 = 1, x2 = 1 and the hyperbola x1 x2 = 1, fill the whole quadrant
     (Fig. 2). A point wanders through the plane and is always inside one of them. */
  var PL_REG = [                                     // regions of Fig. 2, in the square from 0 to 5
    { lab: 'R_1', col: 'plum', at: [1.7, 0.42] }, { lab: 'R_2', col: 'pine', at: [0.24, 2.2] }, { lab: 'R_3', col: 'crimson', at: [0.66, 3.4] },
    { lab: 'R_4', col: 'brass', at: [3.3, 0.68] }, { lab: 'R_5', col: 'brassD', at: [3, 3] }
  ];
  function plRegion(x1, x2) { return x2 < 1 ? (x1 * x2 < 1 ? 0 : 3) : (x1 > 1 ? 4 : (x1 * x2 < 1 ? 1 : 2)); }
  var PL_WAY = [[2.4, 0.3], [4.2, 0.62], [3.6, 3.1], [0.72, 3.7], [0.14, 2.4], [0.45, 0.55]];
  var POLYLOG = {
    key: 'polylog', paper: '2407.20120', dur: 14, cap: 'Multiple polylogarithms from MB integrals',
    layout: function (v) {
      v.S = Math.max(8.5, Math.min(12, v.w / 44));
      var side = Math.min(v.h - 30, v.w * 0.48);
      v.Q = { x: v.x + 22, y: v.y + 10, s: side / 5 };
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, Q = v.Q, s = Q.s;
      function X(x) { return Q.x + x * s; }
      function Y(y) { return Q.y + (5 - y) * s; }
      function hyp(a, b) { var p = []; for (var k = 0; k <= 30; k++) { var x = a + (b - a) * k / 30; p.push([X(x), Y(1 / x)]); } return p; }
      var shapes = [                                // the five regions as polygons
        [[X(0), Y(0)], [X(5), Y(0)], [X(5), Y(0.2)]].concat(hyp(5, 1), [[X(0), Y(1)]]),
        [[X(0), Y(1)], [X(1), Y(1)]].concat(hyp(1, 0.2), [[X(0), Y(5)]]),
        [[X(1), Y(1)], [X(1), Y(5)], [X(0.2), Y(5)]].concat(hyp(0.2, 1)),
        [[X(1), Y(1)]].concat(hyp(1, 5), [[X(5), Y(1)]]),
        [[X(1), Y(1)], [X(5), Y(1)], [X(5), Y(5)], [X(1), Y(5)]]
      ];
      var on = -1, probe = null;
      if (R || t > 6) {                             // a point wandering through the plane
        var n = PL_WAY.length, f = R ? 0.3 : ((t - 6) / 1.4) % n, i0 = Math.floor(f), u = f - i0;
        var p0 = PL_WAY[(i0 - 1 + n) % n], p1 = PL_WAY[i0], p2 = PL_WAY[(i0 + 1) % n], p3 = PL_WAY[(i0 + 2) % n];
        function cr(a, b, c, d) { return 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (3 * b - a - 3 * c + d) * u * u * u); }
        probe = [Math.max(0.05, cr(p0[0], p1[0], p2[0], p3[0])), Math.max(0.05, cr(p0[1], p1[1], p2[1], p3[1]))];
        on = plRegion(probe[0], probe[1]);
      }
      PL_REG.forEach(function (Rg, i) {
        var k = R ? 1 : ease((t - 1 - i * 0.55) / 0.5);
        if (k <= 0) return;
        ctx.fillStyle = ink(Rg.col, (on === i ? 0.32 : 0.15) * k); ctx.beginPath();
        shapes[i].forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
        ctx.closePath(); ctx.fill();
        ctx.save(); ctx.globalAlpha *= k;
        drawMath(ctx, Rg.lab, X(Rg.at[0]), Y(Rg.at[1]) + 4, S * (i === 1 ? 0.8 : 0.95), ink(Rg.col === 'brass' ? 'brassD' : Rg.col, on === i ? 1 : 0.85), 'center');
        ctx.restore();
      });
      var bk = R ? 1 : ease((t - 3.8) / 0.8);       // the boundaries: x1 = 1, x2 = 1 and x1 x2 = 1
      if (bk > 0) {
        ctx.save(); ctx.globalAlpha *= bk; ctx.strokeStyle = ink('green', 0.6); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(X(0), Y(1)); ctx.lineTo(X(5), Y(1)); ctx.moveTo(X(1), Y(1)); ctx.lineTo(X(1), Y(5));
        hyp(0.2, 5).forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
        ctx.stroke(); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= R ? 1 : ease(t / 0.6);
      ctx.strokeStyle = ink('green', 0.45); ctx.lineWidth = 1; ctx.strokeRect(X(0), Y(5), 5 * s, 5 * s);
      [0, 1, 5].forEach(function (k) {
        drawMath(ctx, String(k), X(k), Y(0) + 12, S * 0.75, ink('slate', 0.85), 'center');
        if (k) drawMath(ctx, String(k), X(0) - 5, Y(k) + 3, S * 0.75, ink('slate', 0.85), 'right');
      });
      drawMath(ctx, 'x_1', X(5) + 6, Y(0) + 4, S * 0.85, ink('slate', 0.95), 'left');
      drawMath(ctx, 'x_2', X(0) - 5, Y(5) + 20, S * 0.85, ink('slate', 0.95), 'right');
      ctx.restore();
      if (probe) {
        var qx = X(probe[0]), qy = Y(probe[1]);
        ring(ctx, qx, qy, 5, ink('green', 0.9), 1.3); dot(ctx, qx, qy, 1.8, ink('green', 1));
      }
      var px = X(5) + 30, room = v.x + v.w - px;    // the definition, and what the figure shows
      if (room < 120) return;
      var dk = R ? 1 : ease((t - 0.3) / 0.7);
      ctx.save(); ctx.globalAlpha *= dk;
      drawMath(ctx, '\\rm{Li}_{m_1,m_2}(x_1,x_2)', px, v.y + S * 2, S, ink('green', 0.95), 'left');
      drawMath(ctx, '=\\sum_{0<k_1<k_2}\\frac{x_1^{k_1}\\,x_2^{k_2}}{k_1^{m_1}\\,k_2^{m_2}}', px + S * 0.6, v.y + S * 5, S, ink('green', 0.95), 'left');
      ctx.restore();
      var nk = R ? 1 : ease((t - 4.6) / 0.7);
      if (nk > 0) {
        ctx.save(); ctx.globalAlpha *= nk;
        caps(ctx, 'FIVE SERIES REPRESENTATIONS', px, v.y + S * 8.6, ink('slate', 0.85), 7);
        caps(ctx, 'NO WHITE ZONES', px, v.y + S * 8.6 + 13, ink('brassD', 0.95), 7);
        ctx.restore();
      }
      if (probe && on >= 0) {
        ctx.save(); ctx.globalAlpha *= R ? 1 : clamp01((t - 6) / 0.5);
        drawMath(ctx, '(' + probe[0].toFixed(2) + ',\\,' + probe[1].toFixed(2) + ')\\,\\rm{in}\\,' + PL_REG[on].lab, px, v.y + S * 12.4, S * 0.9, ink(PL_REG[on].col === 'brass' ? 'brassD' : PL_REG[on].col, 1), 'left');
        ctx.restore();
      }
    }
  };

  /* Indications for new Higgs bosons (Corfu proceedings, Sec. 3.1 and Fig. 3, right): since the
     charged and neutral triplet Higgs bosons are nearly degenerate, a 152 GeV triplet lets the top
     quark decay as t -> Delta+ b, and Delta+ -> W+ Z then fakes a t t-bar Z signal. A recast of the
     t t-bar Z and t W Z measurements shows a preference of about 2 sigma around 150 GeV. */
  var TD_D = { n: { g1: [0.06, 0.16], g2: [0.06, 0.84], v1: [0.36, 0.5, 1], v2: [0.66, 0.5, 1], T: [1.0, 0.24, 1], Tb: [1.0, 0.76, 1],
                    b: [1.4, 0.04], D: [1.3, 0.4, 1], Wp: [1.82, 0.26], Z: [1.82, 0.54], bb: [1.4, 0.96], Wm: [1.82, 0.8] },
               e: [{ a: 'g1', b: 'v1', t: 'g', lab: 'g', lt: 0.35, lo: [12, -6] }, { a: 'g2', b: 'v1', t: 'g', lab: 'g', lt: 0.35, lo: [12, 14] },
                   { a: 'v1', b: 'v2', t: 'g' },
                   { a: 'v2', b: 'T', t: 'f', lab: 't', lo: [-6, -8] }, { a: 'v2', b: 'Tb', t: 'f', rev: 1, lab: '\\bar{t}', lo: [-6, 16] },
                   { a: 'T', b: 'b', t: 'f', lab: 'b', lt: 0.8, lo: [-8, -2] }, { a: 'T', b: 'D', t: 's', lab: 'Δ^+', lt: 0.5, lo: [-4, 14] },
                   { a: 'D', b: 'Wp', t: 'w', lab: 'W^+', lt: 0.85, lo: [0, -9] }, { a: 'D', b: 'Z', t: 'w', lab: 'Z', lt: 0.85, lo: [4, 13] },
                   { a: 'Tb', b: 'bb', t: 'f', rev: 1, lab: '\\bar{b}', lt: 0.8, lo: [-10, 10] }, { a: 'Tb', b: 'Wm', t: 'w', lab: 'W^−', lt: 0.8, lo: [0, -9] }],
               stagger: 0.24, edgeDur: 0.45, labSize: 12, pad: 22 };
  var TOPDELTA = diagramVignette({
    key: 'topdelta', paper: '2605.04233', dur: 11, cap: 'Indications for new Higgs bosons', D: TD_D,
    extra: function (v, t) {
      var ctx = v.ctx, R = v.reduce, k0 = R ? 1 : ease(t / 0.6), k = R ? 1 : ease((t - 3.4) / 0.6), k2 = R ? 1 : ease((t - 6.4) / 0.7), F = v.F, Dn = TD_D.n.D;
      ctx.save(); ctx.globalAlpha *= k0;
      caps(ctx, 'TOP DECAY TO A CHARGED TRIPLET HIGGS', v.x + 4, v.y + 12, ink('crimson', 0.85), 8);
      ctx.restore();
      if (k <= 0) return;
      ctx.save(); ctx.globalAlpha *= k;
      var x = F.x + Dn[0] * F.s, y = F.y + Dn[1] * F.s;     // the W+ Z pair looks like the Z of t t-bar Z
      ring(ctx, x + 0.32 * F.s, y - 0.0 * F.s, 0.2 * F.s, ink('brass', 0.35 + 0.15 * Math.sin(t * 3)), 1);
      if (k2 < 1) drawMath(ctx, 'm_{Δ^±}≈m_{Δ^0}≈152\\,\\rm{GeV}<m_t,\\quad\\rm{like}\\,t\\bar{t}Z', v.x + 4, v.y + v.h - 9, 11, ink('slate', 0.9 * (1 - k2)), 'left');
      ctx.restore();
      if (k2 <= 0) return;                         // then what the recast of the t t-bar Z and t W Z data shows (Sec. 3.1)
      var room = Math.min(v.w - 8, F.x + 1.32 * F.s - 18 - (v.x + 4)), S = 11;   // left of the b-bar label
      var res = '\\rm{preferred}\\,\\rm{by}\\,t\\bar{t}Z\\,\\rm{and}\\,tWZ\\,\\rm{data},\\quad≈2σ\\,\\rm{near}\\,150\\,\\rm{GeV}';
      if (mathBox(ctx, res, S).w > room) res = '≈2σ\\,\\rm{near}\\,150\\,\\rm{GeV}\\,\\rm{in}\\,t\\bar{t}Z\\,\\rm{and}\\,tWZ\\,\\rm{data}';
      var w = mathBox(ctx, res, S).w;
      if (w > room) S *= room / w;
      ctx.save(); ctx.globalAlpha *= k2; drawMath(ctx, res, v.x + 4, v.y + v.h - 9, S, ink('green', 0.95), 'left'); ctx.restore();
    }
  });

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
        var ends = [], le = Math.min(reach2, 17);
        inv.forEach(function (a0, i) {
          ctx.strokeStyle = ink(cols[i], 0.95); ctx.lineWidth = 1.7; ctx.beginPath();
          for (var l = lq; l <= reach2; l += 0.05) { var y = Y(lqv(i, l)); if (l === lq) ctx.moveTo(X(l), y); else ctx.lineTo(X(l), y); }
          ctx.stroke();
          ends.push({ i: i, y: Y(lqv(i, le)) + 4 });
        });
        if (reach2 > lq + 0.5) {                      // the line labels, kept at least 12 px apart around the line ends
          ends.sort(function (p, q) { return p.y - q.y; });
          var y0 = ends.reduce(function (a, p) { return a + p.y; }, 0) / ends.length;
          for (var j = 1; j < ends.length; j++) ends[j].y = Math.max(ends[j].y, ends[j - 1].y + 12);
          var shift = ends.reduce(function (a, p) { return a + p.y; }, 0) / ends.length - y0;
          ends.forEach(function (p) { drawMath(ctx, 'α_' + (p.i + 1) + '^{−1}', X(le) + 6, p.y - shift, 10.5, ink(cols[p.i], 0.95), 'left'); });
        }
        var uk = R ? 1 : ease((t - 9.4) / 0.6);
        if (uk > 0) { ring(ctx, X(14.3), Y(40), 9, ink('brassD', 0.8 * uk), 1.2); drawMath(ctx, '\\rm{near}\\,10^{14}\\,\\rm{GeV}', X(14.3), Y(40) - 14, 10.5, ink('brassD', 0.95 * uk), 'center'); }
        ctx.restore();
      }
    }
  };

  /* Why the 95 GeV triplet Higgs stands out: Fig. 3 of the paper, the transverse momentum of the photon
     pair over its invariant mass, normalized to unity, for gluon fusion pp -> H, associated production
     pp -> HV and Drell-Yan production of the triplet pp -> H H+-. Bins of 0.1 from 0 to 2.9, read off the
     figure (each set sums to about one). The triplet gives a much broader spectrum than gluon fusion. */
  var PT_BINS = [
    { lab: 'pp→H', col: 'pine', h: [0.118, 0.229, 0.208, 0.153, 0.100, 0.060, 0.036, 0.022, 0.014, 0.012, 0.008, 0.007, 0.006, 0.005, 0.004,
                                    0.003, 0.003, 0.002, 0.002, 0.002, 0.002, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001] },
    { lab: 'pp→HV', col: 'brassD', h: [0.015, 0.050, 0.082, 0.097, 0.099, 0.092, 0.079, 0.071, 0.066, 0.053, 0.047, 0.040, 0.034, 0.027, 0.024,
                                       0.020, 0.018, 0.016, 0.013, 0.011, 0.009, 0.008, 0.007, 0.006, 0.005, 0.005, 0.004, 0.004, 0.003] },
    { lab: 'pp→HH^±', col: 'crimson', h: [0.002, 0.007, 0.016, 0.027, 0.040, 0.049, 0.056, 0.057, 0.063, 0.065, 0.064, 0.063, 0.058, 0.054, 0.047,
                                          0.043, 0.041, 0.036, 0.034, 0.028, 0.024, 0.022, 0.019, 0.017, 0.016, 0.013, 0.013, 0.012, 0.010] }
  ];
  var PTSPEC = {
    key: 'ptspec', paper: '2306.15722', dur: 12, cap: 'Harder photons from a 95 GeV triplet Higgs',
    layout: function (v) {
      v.S = Math.max(9, Math.min(11.5, v.w / 46));
      v.L = v.x + 30; v.R = v.x + v.w - 8; v.T = v.y + 24; v.B = v.y + v.h - 28;
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, L = v.L, Rr = v.R, T = v.T, B = v.B, S = v.S;
      function X(x) { return L + x / 3 * (Rr - L); }
      function Y(y) { return B - y / 0.25 * (B - T); }
      var ak = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= ak;              // the axes, as in the paper
      line(ctx, L, T, L, B, ink('green', 0.55), 1); line(ctx, L, B, Rr, B, ink('green', 0.55), 1);
      [0, 1, 2, 3].forEach(function (x) { line(ctx, X(x), B, X(x), B + 4, ink('green', 0.55), 1); drawMath(ctx, String(x), X(x), B + 15, S * 0.9, ink('slate', 0.85), 'center'); });
      [0.1, 0.2].forEach(function (y) { line(ctx, L - 3, Y(y), L, Y(y), ink('green', 0.55), 1); drawMath(ctx, String(y), L - 5, Y(y) + 3.5, S * 0.8, ink('slate', 0.85), 'right'); });
      drawMath(ctx, 'p_T^{γγ}/m_{γγ}', X(1.5), B + 17, S, ink('slate', 0.95), 'center');   // below the axis, clear of the tails
      caps(ctx, 'EVENTS PER BIN, NORMALIZED TO ONE', L, v.y + 10, ink('slate', 0.8), 7.5);
      ctx.restore();
      PT_BINS.forEach(function (set, si) {             // gluon fusion, then associated production, then the triplet
        var t0 = 0.8 + si * 1.9, k = R ? 1 : clamp01((t - t0) / 1.6);
        if (k <= 0) return;
        var n = set.h.length, path = [];
        for (var i = 0; i < n; i++) {
          var g = R ? 1 : ease((t - t0 - i * 0.035) / 0.5), y = Y(set.h[i] * g);
          path.push([X(i * 0.1), y], [X((i + 1) * 0.1), y]);
        }
        ctx.beginPath(); ctx.moveTo(X(0), B);
        path.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
        ctx.lineTo(X(n * 0.1), B); ctx.closePath();
        ctx.fillStyle = ink(set.col, si === 2 ? 0.12 : 0.07); ctx.fill();
        ctx.beginPath(); ctx.moveTo(X(0), B);
        path.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
        ctx.lineTo(X(n * 0.1), B);
        ctx.strokeStyle = ink(set.col, 0.95); ctx.lineWidth = si === 2 ? 1.9 : 1.4; ctx.lineJoin = 'miter'; ctx.stroke();
        var lk = R ? 1 : ease((t - t0) / 0.5), ly = T + 6 + si * (S + 5), lx = Rr - 4;   // its entry in the legend
        ctx.save(); ctx.globalAlpha *= lk;
        var lw = mathBox(ctx, set.lab, S).w;
        line(ctx, lx - lw - 26, ly - S * 0.33, lx - lw - 8, ly - S * 0.33, ink(set.col, 0.95), si === 2 ? 2.2 : 1.6);
        drawMath(ctx, set.lab, lx, ly, S, ink(set.col, 1), 'right');
        ctx.restore();
      });
      var ok = R ? 1 : ease((t - 7.2) / 0.7);
      if (ok > 0) {                                   // the point of the figure
        ctx.save(); ctx.globalAlpha *= ok;
        var x0 = X(0.27), y0 = Y(0.2), x1 = X(0.95), y1 = Y(0.085), cx = X(0.75), cy = Y(0.205);
        var e = R ? 1 : easeInOut((t - 7.2) / 1.2), px = x0, py = y0;
        ctx.strokeStyle = ink('brassD', 0.9); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, y0);
        for (var j = 1; j <= 24; j++) {
          var u = e * j / 24; px = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * x1; py = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1; ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.setLineDash([]);
        if (e > 0.97) {
          var ang = Math.atan2(y1 - cy, x1 - cx);
          ctx.fillStyle = ink('brassD', 0.95); ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x1 - 7 * Math.cos(ang - 0.45), y1 - 7 * Math.sin(ang - 0.45)); ctx.lineTo(x1 - 7 * Math.cos(ang + 0.45), y1 - 7 * Math.sin(ang + 0.45)); ctx.fill();
        }
        var narrow = v.w < 420, ty = Y(narrow ? 0.135 : 0.15);       // clear of the legend on a phone
        caps(ctx, narrow ? 'BROADER THAN GLUON FUSION' : 'MUCH BROADER THAN GLUON FUSION', X(1.02), ty, ink('crimson', 0.9 * (R ? 1 : ease((t - 8.2) / 0.6))), 7.5);
        drawMath(ctx, 'm_H=95\\,\\rm{GeV}', X(1.02), ty + S + 4, S * 0.9, ink('slate', 0.9 * (R ? 1 : ease((t - 8.6) / 0.6))), 'left');
        ctx.restore();
      }
    }
  };

  /* The review in Eur. Phys. J. Spec. Top. 234 (2025) 8005, in its own five parts (a) to (e), as its
     abstract lists them: regions of Feynman integrals from Landau equations and power geometry, a two-loop
     non-planar integral through Hopf algebras, convergence and analytic continuation of multivariable
     hypergeometric functions, Feynman integrals as hypergeometric functions (MB series, GKZ systems, the
     epsilon expansion), and the summation of large logarithms. Each part gets a small drawing. */
  var RV_PARTS = [
    { l: 'Regions of Feynman integrals, from Landau equations and power geometry', s: 'Regions, from Landau equations', g: 'poly' },
    { l: 'A two-loop non-planar integral, through Hopf algebras', s: 'Non-planar two-loop, Hopf algebras', g: 'np' },
    { l: 'Hypergeometric series, where they converge and how to continue them', s: 'Convergence and continuation', g: 'conv' },
    { l: 'Feynman integrals as hypergeometric functions, MB series and GKZ systems', s: 'MB series and GKZ systems', g: 'mb' },
    { l: 'Large logarithms summed, in renormalizable and non-renormalizable theories', s: 'Large logarithms summed', g: 'log' }
  ];
  function rvGlyph(ctx, g, x, y, w, h, k, col) {    // the drawing of one part, grown by k from 0 to 1
    ctx.save(); ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function path(pts, f) {                          // a polyline in the box, drawn up to the fraction f
      var L = 0, seg = [];
      for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
      var left = L * f; ctx.beginPath(); ctx.moveTo(x + pts[0][0] * w, y + pts[0][1] * h);
      for (var j = 1; j < pts.length && left > 0; j++) {
        var u = Math.min(1, left / seg[j - 1]), a = pts[j - 1], b = pts[j];
        ctx.lineTo(x + (a[0] + (b[0] - a[0]) * u) * w, y + (a[1] + (b[1] - a[1]) * u) * h); left -= seg[j - 1];
      }
      ctx.stroke();
    }
    ctx.strokeStyle = ink(col, 0.95);
    if (g === 'poly') {                              // a Newton polygon, its lower faces picked out
      var P = [[0.05, 0.35], [0.3, 0.9], [0.75, 0.95], [0.97, 0.55], [0.6, 0.08], [0.05, 0.35]];
      ctx.strokeStyle = ink(col, 0.5); path(P, k);
      ctx.strokeStyle = ink(col, 1); ctx.lineWidth = 2.2; path([[0.05, 0.35], [0.3, 0.9], [0.75, 0.95], [0.97, 0.55]], clamp01(k * 1.6 - 0.6));
      [[0.45, 0.5], [0.62, 0.62], [0.3, 0.5]].forEach(function (q) { if (k > 0.5) dot(ctx, x + q[0] * w, y + q[1] * h, 1.3, ink(col, 0.7)); });
    } else if (g === 'np') {                         // the two-loop non-planar vertex, its inner lines crossing
      path([[0, 0.5], [0.22, 0.5]], k); path([[0.22, 0.5], [0.55, 0.12], [0.9, 0.12]], k); path([[0.22, 0.5], [0.55, 0.88], [0.9, 0.88]], k);
      path([[0.55, 0.12], [0.9, 0.88]], clamp01(k * 1.5 - 0.5)); path([[0.55, 0.88], [0.9, 0.12]], clamp01(k * 1.5 - 0.5));
      path([[0.9, 0.12], [1, 0.02]], k); path([[0.9, 0.88], [1, 0.98]], k);
    } else if (g === 'conv') {                       // a region of convergence, and the way out of it
      ctx.strokeStyle = ink(col, 0.6); path([[0.08, 0.95], [0.08, 0.02]], k); path([[0.05, 0.92], [0.98, 0.92]], k);
      ctx.fillStyle = ink(col, 0.16 * k); ctx.fillRect(x + 0.08 * w, y + 0.38 * h, 0.42 * w, 0.54 * h);
      ctx.strokeStyle = ink(col, 0.95); path([[0.08, 0.38], [0.5, 0.38], [0.5, 0.92]], k);
      ctx.setLineDash([2, 2]); path([[0.32, 0.62], [0.88, 0.18]], clamp01(k * 1.5 - 0.5)); ctx.setLineDash([]);
    } else if (g === 'mb') {                         // a straight contour between two rows of poles
      ctx.setLineDash([2.5, 2]); path([[0.5, 0.02], [0.5, 0.98]], k); ctx.setLineDash([]);
      for (var i = 0; i < 4; i++) {
        if (k > 0.2 + i * 0.15) { dot(ctx, x + (0.36 - i * 0.1) * w, y + 0.5 * h, 1.6, ink('crimson', 0.85)); dot(ctx, x + (0.64 + i * 0.1) * w, y + 0.5 * h, 1.6, ink('pine', 0.85)); }
      }
    } else if (g === 'log') {                        // a coupling that runs with the logarithm of the scale
      var pts = [];
      for (var u = 0; u <= 1.0001; u += 0.05) pts.push([0.04 + 0.92 * u, 0.12 + 0.72 * (1 - 1 / (1 + 3 * u)) ]);
      ctx.strokeStyle = ink(col, 0.5); path([[0.04, 0.95], [0.97, 0.95]], k);
      ctx.strokeStyle = ink(col, 0.95); path(pts, k);
    }
    ctx.restore();
  }
  var REVIEW = {
    key: 'review', paper: '10.1140/epjs/s11734-025-02019-7', dur: 12.5, cap: 'Feynman integrals and the renormalization group',
    layout: function (v) {
      var ctx = v.ctx; v.S = Math.max(10.5, Math.min(13.5, v.w / 36));
      ctx.font = font(v.S, SERIF, 400, false);
      var room = v.w - 64, long = RV_PARTS.every(function (p) { return ctx.measureText(p.l).width <= room; });
      v.lines = RV_PARTS.map(function (p) { return long ? p.l : p.s; });
      v.rh = Math.min(46, (v.h - 30) / 5);
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, rh = v.rh, gw = Math.min(36, rh * 1.0), gh = Math.min(24, rh * 0.6);
      var hk = R ? 1 : ease(t / 0.6);
      ctx.save(); ctx.globalAlpha *= hk;
      caps(ctx, 'A REVIEW IN FIVE PARTS', v.x + 4, v.y + 11, ink('slate', 0.85), 8);
      ctx.restore();
      RV_PARTS.forEach(function (p, i) {
        var t0 = 0.6 + i * 1.5, k = R ? 1 : clamp01((t - t0) / 0.9), tk = R ? 1 : ease((t - t0 - 0.35) / 0.6);
        if (k <= 0) return;
        var y = v.y + 24 + i * rh, col = i === 1 ? 'pine' : i === 4 ? 'crimson' : 'brassD';
        rvGlyph(ctx, p.g, v.x + 4, y + (rh - gh) / 2 - 3, gw, gh, ease(k), col);
        ctx.save(); ctx.globalAlpha *= tk;
        ctx.font = font(S * 1.05, DISPLAY, 600, true); ctx.fillStyle = ink('brassD', 1); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('(' + 'abcde'[i] + ')', v.x + gw + 14, y + rh / 2 - 3);
        ctx.font = font(S, SERIF, 400, false); ctx.fillStyle = ink('green', 0.92);
        ctx.fillText(v.lines[i], v.x + gw + 40, y + rh / 2 - 3);
        ctx.restore();
      });
    }
  };

  /* The PhD thesis (IISc 2022, INSPIRE 2614373): one method and four projects. The conic hull method turns
     N-fold MB integrals into hypergeometric series (with the package MBConicHulls.wl). It then solves the
     dual-conformal hexagon and double box, nine-fold MB integrals that were unsolved until then. It proves
     two conjectures from the Yangian bootstrap, that every one-loop N-point massive conformal integral is a
     single multi-fold hypergeometric series. And it shows where the method of brackets fails, through the
     breakdown of one of its rules. From the abstract of the thesis. */
  var TH_PARTS = [
    { a: 'N-fold MB integrals as series', sa: 'N-fold MB integrals', b: 'the package MBConicHulls.wl', sb: 'MBConicHulls.wl', g: 'mb' },
    { a: 'The hexagon and the double box', sa: 'Hexagon, double box', b: 'nine-fold MB integrals, first solved', sb: 'nine-fold, first solved', g: 'hex' },
    { a: 'Massive conformal integrals', sa: 'Massive conformal', b: 'two Yangian bootstrap conjectures proved', sb: 'two conjectures proved', g: 'gon' },
    { a: 'The method of brackets', sa: 'Method of brackets', b: 'where one of its rules breaks down', sb: 'where a rule breaks', g: 'brk' }
  ];
  function thGlyph(ctx, g, x, y, w, h, k, col) {     // the small drawing of one project, grown by k from 0 to 1
    ctx.save(); ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink(col, 0.95);
    var cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.46, i, a;
    function poly(n, rot, f) {                      // a regular n-gon, drawn up to the fraction f of its perimeter
      ctx.beginPath();
      var m = n * f;
      for (i = 0; i <= Math.ceil(m); i++) {
        var u = Math.min(i, m), j = Math.floor(u), fr = u - j;
        var a0 = rot + TAU * j / n, a1 = rot + TAU * (j + 1) / n;
        var px = cx + r * ((1 - fr) * Math.cos(a0) + fr * Math.cos(a1)), py = cy + r * ((1 - fr) * Math.sin(a0) + fr * Math.sin(a1));
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    if (g === 'mb') {                                 // a straight contour between the left and right poles
      line(ctx, cx, cy + h * 0.5, cx, cy + h * 0.5 - h * k, ink(col, 0.95), 1.3);
      for (i = 0; i < 3; i++) if (k > 0.25 + i * 0.2) { dot(ctx, cx - (5 + i * 5) * w / 30, cy, 1.5, ink('brassD', 0.9)); dot(ctx, cx + (5 + i * 5) * w / 30, cy, 1.5, ink('pine', 0.9)); }
    } else if (g === 'hex') {                         // the one-loop hexagon in dual coordinates
      poly(6, Math.PI / 6, k);
      if (k > 0.95) for (i = 0; i < 6; i++) { a = Math.PI / 6 + TAU * i / 6; dot(ctx, cx + r * Math.cos(a), cy + r * Math.sin(a), 1.3, ink(col, 0.9)); }
    } else if (g === 'gon') {                         // a one-loop polygon with massive propagators, drawn double
      poly(5, -Math.PI / 2, k);
      ctx.save(); ctx.globalAlpha *= 0.45; r *= 0.78; poly(5, -Math.PI / 2, k); ctx.restore();
    } else if (g === 'brk') {                         // a bracket, as in the method of brackets
      var kk = clamp01(k * 1.4);
      ctx.beginPath(); ctx.moveTo(cx - w * 0.12, cy - h * 0.42 * kk); ctx.lineTo(cx - w * 0.32, cy); ctx.lineTo(cx - w * 0.12, cy + h * 0.42 * kk); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + w * 0.12, cy - h * 0.42 * kk); ctx.lineTo(cx + w * 0.32, cy); ctx.lineTo(cx + w * 0.12, cy + h * 0.42 * kk); ctx.stroke();
      if (k > 0.7) dot(ctx, cx, cy, 1.6, ink('crimson', 0.9));
    }
    ctx.restore();
  }
  var THESIS = {
    key: 'thesis', paper: 'inspire:2614373', dur: 12.5, cap: 'Hypergeometric solutions of Feynman integrals',
    ref: 'PhD thesis, IISc Bengaluru, 2022',
    layout: function (v) {
      var ctx = v.ctx;
      v.S = Math.max(10, Math.min(13, v.w / 37));
      v.hw = Math.min(74, v.w * 0.19); v.top = v.y + 24; v.rh = Math.min(50, (v.h - 30) / 4);
      v.x0 = v.x + 6 + v.hw + Math.min(46, v.w * 0.1);           // where the spokes end and the rows begin
      var room = v.x + v.w - (v.x0 + 40);
      ctx.font = font(v.S, SERIF, 600, false);
      var fitA = TH_PARTS.every(function (p) { return ctx.measureText(p.a).width <= room; });
      ctx.font = font(v.S * 0.86, SERIF, 400, true);
      var fitB = TH_PARTS.every(function (p) { return ctx.measureText(p.b).width <= room; });
      v.long = fitA && fitB;
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, hw = v.hw, rh = v.rh, x0 = v.x0;
      var hx = v.x + 6, hy = v.top + 2 * rh - hw * 0.32, hh = hw * 0.62;       // the hub: a cone with its lattice points
      var hk = R ? 1 : ease(t / 0.9);
      ctx.save(); ctx.globalAlpha *= R ? 1 : ease(t / 0.5);
      caps(ctx, 'ONE METHOD, FOUR PROJECTS', v.x + 4, v.y + 11, ink('slate', 0.85), 8);
      ctx.restore();
      var ax = hx + hw * 0.06, ay = hy + hh, bx = hx + hw * 0.96, tx = hx + hw * 0.62, ty = hy;
      ctx.save(); ctx.strokeStyle = ink('brassD', 0.95); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * hk, ay); ctx.moveTo(ax, ay); ctx.lineTo(ax + (tx - ax) * hk, ay + (ty - ay) * hk); ctx.stroke();
      ctx.restore();
      [[0.3, 0.84], [0.48, 0.84], [0.66, 0.84], [0.84, 0.84], [0.42, 0.6], [0.6, 0.6], [0.78, 0.6], [0.56, 0.36], [0.72, 0.36]].forEach(function (q, j) {
        var dk = R ? 1 : clamp01((t - 0.6 - j * 0.07) / 0.3);
        if (dk > 0) dot(ctx, hx + q[0] * hw, hy + q[1] * hh, 1.4 * dk, ink('brassD', 0.85));
      });
      ctx.save(); ctx.globalAlpha *= hk;
      caps(ctx, 'CONIC HULLS', hx + hw / 2, ay + 15, ink('brassD', 0.95), 7.5, 'center');
      ctx.restore();
      var sx = hx + hw + 4, sy = hy + hh * 0.55;
      TH_PARTS.forEach(function (p, i) {
        var t0 = 1.4 + i * 1.7, sk = R ? 1 : ease((t - t0) / 0.6), gk = R ? 1 : ease((t - t0 - 0.45) / 0.7), tk = R ? 1 : ease((t - t0 - 0.8) / 0.6);
        if (sk <= 0) return;
        var yy = v.top + i * rh + rh / 2, col = i === 1 ? 'pine' : i === 3 ? 'crimson' : 'brassD';
        ctx.save(); ctx.strokeStyle = ink('brass', 0.55); ctx.lineWidth = 1; ctx.beginPath();
        for (var n = 0; n <= 24 * sk; n++) {          // a spoke from the hub to the project, curving into its row
          var u = n / 24, mx = (sx + x0) / 2, px = (1 - u) * (1 - u) * sx + 2 * u * (1 - u) * mx + u * u * (x0 - 4);
          var py = (1 - u) * (1 - u) * sy + 2 * u * (1 - u) * yy + u * u * yy;
          if (n) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke(); ctx.restore();
        if (gk > 0) thGlyph(ctx, p.g, x0, yy - rh * 0.3, 28, rh * 0.6, gk, col);
        if (tk <= 0) return;
        ctx.save(); ctx.globalAlpha *= tk; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.font = font(S, SERIF, 600, false); ctx.fillStyle = ink('green', 0.95);
        ctx.fillText(v.long ? p.a : p.sa, x0 + 38, yy - 1);
        ctx.font = font(S * 0.86, SERIF, 400, true); ctx.fillStyle = ink('slate', 0.95);
        ctx.fillText(v.long ? p.b : p.sb, x0 + 38, yy + S * 0.95);
        ctx.restore();
      });
    }
  };

  var SPECV = { key: 'excesses', paper: '2306.15722', dur: 11.5, cap: 'The di-photon excesses at 95 and 152 GeV',
                ref: 'Phys. Rev. D 2023 · JHEP 2024 · Phys. Lett. B 2025',
                init: function (v) { SPEC.init.call(SPEC, v); }, frame: function (v, t) { SPEC.frame.call(SPEC, v, t); } };

  /* How far the triangulations reach (2309.00409, Table 2): the off-shell massless scalar one-loop N-point integral
     with generic powers has an MB representation with N(N-1)/2 - 1 folds. For N = 4, 5, 10, 13 and 15 that is 5, 9,
     44, 77 and 104 folds, and one series representation made of 11, 26, 1013, 8178 and 32752 series, the last found
     in 8.9 hours. The loop is drawn as a polygon with one off-shell leg at each vertex. */
  var NPT = [[4, 5, 11], [5, 9, 26], [10, 44, 1013], [13, 77, 8178], [15, 104, 32752]];
  var NPOINT = {
    key: 'npoint', paper: '2309.00409', dur: 12.5, cap: 'Up to the one-loop 15-point integral',
    ref: 'Phys. Rev. D 110, 036002 (2024)',
    layout: function (v) {
      v.S = Math.max(9, Math.min(12, v.w / 44));
      var r = Math.max(18, Math.min((v.h - 14 - 2.6 * v.S) / 2.8, v.w * 0.12));
      v.G = { x: v.x + 8 + 1.4 * r, y: v.y + 4 + 1.4 * r, r: r };
      v.L = v.G.x + 1.4 * r + 4.2 * v.S; v.R = v.x + v.w - 10; v.T = v.y + 22; v.B = v.y + v.h - 24;
    },
    frame: function (v, t) {
      var ctx = v.ctx, R = v.reduce, S = v.S, G = v.G, L = v.L, Rr = v.R, T = v.T, B = v.B;
      var step = 2, t0 = 0.8, idx = R ? 4 : Math.max(0, Math.min(4, Math.floor((t - t0) / step)));
      var into = R ? 1 : clamp01((t - t0 - idx * step) / 0.45), ak = R ? 1 : ease(t / 0.6);
      function X(n) { return L + (n - 3) / 13 * (Rr - L); }
      function Y(lg) { return B - (lg - 0.6) / 4.2 * (B - T); }
      function polygon(n, a) {                         // the loop with n propagators and an off-shell leg at each vertex
        var pts = [];
        for (var i = 0; i < n; i++) { var th = -Math.PI / 2 + (n % 2 ? 0 : Math.PI / n) + TAU * i / n; pts.push([Math.cos(th), Math.sin(th)]); }   // the box sits square
        ctx.save(); ctx.globalAlpha *= a;
        pts.forEach(function (q) { line(ctx, G.x + q[0] * G.r, G.y + q[1] * G.r, G.x + q[0] * G.r * 1.38, G.y + q[1] * G.r * 1.38, ink('slate', 0.75), 1); });
        ctx.strokeStyle = ink('green', 0.9); ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.beginPath();
        pts.forEach(function (q, i) { var x = G.x + q[0] * G.r, y = G.y + q[1] * G.r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.closePath(); ctx.stroke();
        pts.forEach(function (q) { dot(ctx, G.x + q[0] * G.r, G.y + q[1] * G.r, n > 10 ? 1.6 : 2, ink('green', 1)); });
        ctx.restore();
      }
      if (t > t0 || R) {                               // the N-gon of this step, faded in over the last
        if (idx > 0 && into < 1) polygon(NPT[idx - 1][0], 1 - into);
        polygon(NPT[idx][0], into);
        var c = NPT[idx], yl = G.y + 1.4 * G.r + 1.05 * S;
        ctx.save(); ctx.globalAlpha *= R ? 1 : ease((t - t0 - idx * step) / 0.4);
        drawMath(ctx, 'N=' + c[0], G.x, yl, S * 1.05, ink('slate', 1), 'center');
        caps(ctx, c[1] + '-FOLD MB', G.x, yl + 1.25 * S, ink('brassD', 0.95), 7.5, 'center');
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= ak;               // the axes: N against the number of series, on a log scale
      line(ctx, L, T, L, B, ink('green', 0.55), 1); line(ctx, L, B, Rr, B, ink('green', 0.55), 1);
      [1, 2, 3, 4].forEach(function (k) {
        line(ctx, L - 3, Y(k), L, Y(k), ink('green', 0.55), 1);
        drawMath(ctx, '10^{' + k + '}', L - 5, Y(k) + 3.5, S * 0.8, ink('slate', 0.85), 'right');
      });
      NPT.forEach(function (c) {
        line(ctx, X(c[0]), B, X(c[0]), B + 3, ink('green', 0.55), 1);
        drawMath(ctx, String(c[0]), X(c[0]), B + 13, S * 0.8, ink('slate', 0.85), 'center');
      });
      drawMath(ctx, 'N', Rr, B - 5, S * 0.9, ink('slate', 0.9), 'right');
      caps(ctx, 'SERIES IN ONE REPRESENTATION', L + 6, v.y + 10, ink('slate', 0.8), 7.5);
      ctx.restore();
      var shown = R ? 5 : (t > t0 ? idx + 1 : 0), prev = null;
      for (var i = 0; i < shown; i++) {                // one point per integral, joined in order
        var c2 = NPT[i], k = R || i < idx ? 1 : into, x = X(c2[0]), y = Y(Math.log10(c2[2]));
        if (prev) { ctx.save(); ctx.setLineDash([2, 3]); line(ctx, prev[0], prev[1], prev[0] + (x - prev[0]) * k, prev[1] + (y - prev[1]) * k, ink('brass', 0.7), 1); ctx.restore(); }
        ctx.save(); ctx.globalAlpha *= k;
        dot(ctx, x, y, 2.6, ink(i === idx ? 'brassD' : 'green', 1));
        if (i === idx) ring(ctx, x, y, 5.5, ink('brassD', 0.7), 1);
        ctx.font = font(S * 0.85, SANS, 600); ctx.fillStyle = ink(i === idx ? 'brassD' : 'slate', 0.95); ctx.textAlign = i === 4 ? 'right' : 'center';
        ctx.fillText(String(c2[2]), i === 4 ? x - 7 : x, y - 8);
        ctx.restore();
        prev = [x, y];
      }
      var nk = R ? 1 : ease((t - 10.4) / 0.6);         // the last one, and how long it took
      if (nk > 0) {
        ctx.save(); ctx.globalAlpha *= nk;
        drawMath(ctx, 'N=15\\,\\rm{in}\\,8.9\\,\\rm{hours}', L + 6, T + 1.2 * S, S * 1.05, ink('brassD', 1), 'left');
        ctx.restore();
      }
    }
  };

  var TOUR = [CONIC, SPECV, TRIF, BNV, MBINTRO, CONTOUR, TRIPLET, CONFORMAL, BARRZEE, FEYNGKZ, DIHIGGS, MASSCONF, TTBAR, TT95,
              HYPERPREC, HDM152, POLYGAMMA, RUNNING, POLYLOG, SUNSET, EVIDENCE, BRACKETS, TOPDELTA, QUADRATIC, ANATOMY, NPOINT, PTSPEC, REVIEW, THESIS];

  function tourStart(e) {                           // research.html#tour-<arXiv id> opens the tour at that paper
    var m = /^#tour-(.+)$/.exec(window.location.hash || ''), id = m && decodeURIComponent(m[1]);
    for (var i = 0; id && i < e.vs.length; i++) if (e.vs[i].V.paper === id || e.vs[i].V.key === id) return i;   // by its paper, or its own name
    return 0;
  }
  SCENES.tour = {
    touchHint: 'Swipe or tap for the next paper',
    init: function (e) {
      e.refs = (e.data && e.data.refs) || {};
      e.vs = TOUR.map(function (V) { var v = Object.create(e); v.V = V; return v; });
      e.i = 0; e.t0 = 0; e.begun = false;
      var self = this;
      document.addEventListener('keydown', function (ev) {    // the arrow keys step through the papers
        if ((ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') || ev.altKey || ev.ctrlKey || ev.metaKey || !e.begun) return;
        if (document.querySelector('dialog[open]')) return;
        var tg = ev.target, r = e.stage.getBoundingClientRect();
        if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
        if (r.bottom < 60 || r.top > window.innerHeight - 60) return;
        self.begin(e, e.i + (ev.key === 'ArrowRight' ? 1 : -1), e.t);
        if (e.redraw) e.redraw();
      });
      var all = document.querySelector('.tour-all'), dlg = document.querySelector('dialog.tour-list'),
          list = dlg && dlg.querySelector('.tour-index');
      if (all && dlg && list && dlg.showModal) {              // every slide in a list, each one starting its slide
        e.vs.forEach(function (v, i) {
          var V = v.V, ref = e.refs[V.paper] || {}, li = document.createElement('li'), b = document.createElement('button');
          b.type = 'button'; b.className = 'ti-go';
          [['ti-n', String(i + 1)], ['ti-c', V.cap], ['ti-r', V.ref || ref.r || '']].forEach(function (c) {
            var sp = document.createElement('span'); sp.className = c[0]; sp.textContent = c[1]; b.appendChild(sp);
          });
          b.addEventListener('click', function () {
            dlg.close(); self.begin(e, i, e.t); if (e.redraw) e.redraw();
            var top = e.stage.getBoundingClientRect().top;
            if (top < 0 || top > window.innerHeight * 0.6) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
          });
          li.appendChild(b); list.appendChild(li);
        });
        all.addEventListener('click', function () {
          Array.prototype.forEach.call(list.children, function (li, i) { li.classList.toggle('now', i === e.i); });
          dlg.showModal();
          var now = list.children[e.i];
          if (now) { now.scrollIntoView({ block: 'center' }); now.querySelector('button').focus({ preventScroll: true }); }
        });
        dlg.querySelector('.tl-close').addEventListener('click', function () { dlg.close(); });
        dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
      } else if (all) all.hidden = true;
      window.addEventListener('hashchange', function () {   // a tour link on this very page
        if (!/^#tour-/.test(window.location.hash) || !e.begun) return;
        self.begin(e, tourStart(e), e.t);
        if (e.redraw) e.redraw();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    },
    layout: function (e) {
      var m = 24;
      e.box = { x: e.x - m, y: e.y - m, w: e.w + 2 * m, h: e.h + 2 * m };
      e.lay = layer(e.box.w, e.box.h, e.dpr);
      e.lay.ctx.setTransform(e.dpr, 0, 0, e.dpr, -e.box.x * e.dpr, -e.box.y * e.dpr);
      e.vs.forEach(function (v) { v.ctx = e.lay.ctx; v.laid = false; });
    },
    label: function (e, i) {                        // the caption names the paper and links to it
      var V = e.vs[i].V, ref = e.refs[V.paper] || {};
      e.caption(ref.u ? '<a href="' + ref.u + '" tabindex="-1"' + (/^https?:/.test(ref.u) ? ' rel="noopener" target="_blank"' : '')
                + ' title="The paper, with its abstract">' + V.cap + '</a>' : V.cap);
      e.hint(V.ref || ref.r || '');
    },
    begin: function (e, i, t) {
      e.i = (i + e.vs.length) % e.vs.length; e.t0 = t;
      var v = e.vs[e.i], V = v.V;
      if (V.init) V.init(v);
      v.laid = false; e.hov = -1;
      this.label(e, e.i);
    },
    dotAt: function (e, x, y) {                     // which dot of the pager, if any, is under the pointer
      var n = e.vs.length, gap = Math.min(9, (e.w - 20) / n), k = Math.round((x - e.x - 3) / gap);
      return Math.abs(y - (e.y + e.h + 7)) < 9 && k >= 0 && k < n ? k : -1;
    },
    move: function (e, p) {                         // hovering a dot of the pager names its paper
      e.hovering = !!p;                             // and while the pointer rests on the tour, the slide waits to be read
      var h = p ? this.dotAt(e, p.x, p.y) : -1;
      if (h === e.hov) return;
      e.hov = h;
      this.label(e, h >= 0 ? h : e.i);
    },
    frame: function (e, t) {
      if (!e.lay) return;
      if (!e.begun) { this.begin(e, tourStart(e), t); e.begun = true; }
      if (e.hovering && !e.reduce && e.lastT !== undefined) e.t0 += t - e.lastT;   // paused under the pointer
      e.lastT = t;
      var v = e.vs[e.i], V = v.V, lt = e.reduce ? 60 : t - e.t0;
      if (!e.reduce && lt > V.dur) { this.begin(e, e.i + 1, t); v = e.vs[e.i]; V = v.V; lt = 0; }
      if (!v.laid) { if (V.layout) V.layout(v); v.laid = true; }
      var c = e.lay.ctx, a = e.reduce ? 1 : Math.max(0, Math.min(1, lt / 0.45, (V.dur - lt) / 0.45));
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, e.lay.c.width, e.lay.c.height); c.restore();
      c.save(); V.frame(v, lt); c.restore();
      var ctx = e.ctx;
      var sw = e.dragging ? Math.max(-80, Math.min(80, e.swipe || 0)) * 0.5 : 0;   // the slide follows a dragging finger
      ctx.save(); ctx.globalAlpha = a * (1 - Math.abs(sw) / 90); ctx.drawImage(e.lay.c, e.box.x + sw, e.box.y, e.box.w, e.box.h); ctx.restore();
      var n = e.vs.length, gap = Math.min(9, (e.w - 20) / n), y = e.y + e.h + 7;       // where we are in the tour
      for (var i = 0; i < n; i++) {
        var x = e.x + 3 + i * gap;
        if (i === e.i) {
          dot(ctx, x, y, 2.6, ink('brass', 1));
          if (!e.reduce) { ctx.strokeStyle = ink('brassD', 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4.6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp01(lt / V.dur)); ctx.stroke(); }
        } else { dot(ctx, x, y, e.hov === i ? 2.2 : 1.5, ink(e.hov === i ? 'brassD' : 'slate', e.hov === i ? 0.9 : 0.35)); if (e.hov === i) ring(ctx, x, y, 4.2, ink('brassD', 0.6), 1); }
      }
    },
    click: function (e, x, y) { var k = this.dotAt(e, x, y); this.begin(e, k >= 0 ? k : e.i + 1, e.t); },
    drag: function (e, dx) { e.swipe = (e.swipe || 0) + dx; },
    release: function (e) {                          // swipe left for the next paper, right for the one before
      var d = e.swipe || 0; e.swipe = 0;
      if (Math.abs(d) > 40) this.begin(e, e.i + (d < 0 ? 1 : -1), e.t);
    }
  };

  /* =====================================================================
     Publications and Talks
     ===================================================================== */
  SCENES.constellation = {
    touchHint: 'Tap a star, tap again to open it',
    init: function (e) {
      e.pubs = e.data.pubs || []; e.hover = -1; e.clock = 0; e.sx = -1e9; e.fade = 0;
      e.match = null; e.dim = e.pubs.map(function () { return 1; });
      var base = e.defaultCaption;
      document.addEventListener('pubfilter', function (ev) {   // the list's filter and search light up their stars
        var d = ev.detail || {}, set = {}, n = 0;
        (d.titles || []).forEach(function (s) { set[s] = 1; });
        e.match = d.narrowed ? e.pubs.map(function (p) { var m = !!set[p.p]; if (m) n++; return m; }) : null;
        if (e.match) e.clock = Math.floor(e.clock / 14) * 14 + 9.5;
        e.defaultCaption = e.match ? n + (n === 1 ? ' publication' : ' publications') + ' of ' + e.pubs.length : base;
        if (e.hover < 0) e.caption(null);
        if (e.redraw) e.redraw();
      });
    },
    layout: function (e) {                           // years along, and the running total of papers up the side
      var d = e.pubs;
      if (!d.length) return;
      var y0 = Infinity, y1 = -Infinity, per = {}, seen = {};
      d.forEach(function (p) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); per[p.y] = (per[p.y] || 0) + 1; });
      e.y0 = y0; e.y1 = y1; e.N = d.length;
      e.L = e.x + 40; e.R = e.x + e.w - 6; e.T = e.y + 30; e.B = e.y + e.h - 26;
      var colW = (e.R - e.L) / (y1 - y0 + 1), pos = [];
      d.forEach(function (p, i) {                      // the papers of one year spread across its column
        var j = seen[p.y] = (seen[p.y] || 0) + 1, m = per[p.y];
        pos[i] = [e.L + (p.y - y0) * colW + colW * (0.14 + 0.72 * (j - 0.5) / m), e.B - (i + 1) / e.N * (e.B - e.T)];
      });
      e.pos = pos;
      e.chains = [d.map(function (p, i) { return i; })];   // one line through them all, rising with the count
    },
    frame: function (e, t) {
      var d = e.pubs;
      if (!d.length || !e.pos) return;
      if (e.hover < 0 && !e.match) e.clock += e.dt;    // the sky holds still while a star is inspected or a search is on
      e.pubs.forEach(function (p, i) {                // stars that do not match the list fade back
        var to = e.match && !e.match[i] ? 0.16 : 1;
        e.dim[i] = e.reduce ? to : e.dim[i] + (to - e.dim[i]) * Math.min(1, e.dt * 7);
      });
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
      // the running total up the side
      var step = e.N > 24 ? 10 : 5;
      ctx.strokeStyle = ink('brass', 0.5); ctx.beginPath(); ctx.moveTo(e.L - 6, e.T); ctx.lineTo(e.L - 6, e.B + 6); ctx.stroke();
      ctx.font = font(9.5, SANS, 500); ctx.textAlign = 'right';
      for (var n = 0; n <= e.N; n += step) {
        var yy = e.B - n / e.N * (e.B - e.T);
        ctx.beginPath(); ctx.moveTo(e.L - 9, yy); ctx.lineTo(e.L - 6, yy); ctx.stroke();
        ctx.fillStyle = ink('slate', 0.8); ctx.fillText(String(n), e.L - 12, yy + 3.5);
        if (n > 0) { ctx.save(); ctx.strokeStyle = ink('green', 0.06); ctx.beginPath(); ctx.moveTo(e.L - 6, yy); ctx.lineTo(e.R, yy); ctx.stroke(); ctx.restore(); }
      }
      ctx.save(); ctx.translate(e.x + 7, (e.T + e.B) / 2); ctx.rotate(-Math.PI / 2);
      caps(ctx, 'PUBLICATIONS SO FAR', 0, 3, ink('slate', 0.8), 7.5, 'center'); ctx.restore();
      // the two fields by colour, and the kinds of paper when there is room
      tracking(ctx, 1.2); ctx.font = font(8.5, SANS, 600); ctx.textAlign = 'left';
      SCENES.constellation.star(ctx, e.L + 3, e.y + 9, 'article', 'brassD', 1, 0.95);
      ctx.fillStyle = ink('brassD', 0.9); ctx.fillText('FEYNMAN INTEGRALS', e.L + 11, e.y + 12);
      var fw = ctx.measureText('FEYNMAN INTEGRALS').width;
      SCENES.constellation.star(ctx, e.L + fw + 27, e.y + 9, 'article', 'pine', 1, 0.95);
      ctx.fillStyle = ink('pine', 0.9); ctx.fillText('PHENOMENOLOGY', e.L + fw + 35, e.y + 12);
      if (e.w > 300) {                                // the kinds of paper, in the empty corner above the early years
        ctx.font = font(8, SANS, 600); ctx.textAlign = 'left'; tracking(ctx, 1);
        var kx = e.L + 6, ky = e.T + 14;
        [['ARTICLE', 'article'], ['PROCEEDINGS', 'proceedings'], ['THESIS', 'thesis']].forEach(function (K) {
          var rr = K[1] === 'thesis' ? 4 : 0;
          SCENES.constellation.star(ctx, kx + rr, ky - 3, K[1], 'slate', 1, 0.9);
          ctx.fillStyle = ink('slate', 0.85); ctx.fillText(K[0], kx + 2 * rr + 8, ky);
          kx += 2 * rr + 8 + ctx.measureText(K[0]).width + 14;
        });
      }
      tracking(ctx, 0);

      // constellation lines grow with the cursor
      e.chains.forEach(function (chain, ci) {
        ctx.lineWidth = 0.8;
        for (var j = 1; j < chain.length; j++) {
          var a = e.pos[chain[j - 1]], b = e.pos[chain[j]], dm = Math.min(e.dim[chain[j - 1]], e.dim[chain[j]]);
          if (sx <= a[0]) break;
          var k = clamp01((sx - a[0]) / Math.max(1, b[0] - a[0]));
          ctx.strokeStyle = ink('brass', 0.5 * dm);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); ctx.stroke();
        }
      });

      // the star under the pointer, joined to the papers closest to it in content (its "Related papers" below)
      var hp = e.hover >= 0 ? d[e.hover] : null;
      if (hp && hp.r && hp.r.length) {
        var hq = e.pos[e.hover], hk = e.reduce ? 1 : ease((t - (e.hoverAt || 0)) / 0.45);
        hp.r.forEach(function (j, m) {
          var rq = e.pos[j];
          if (!rq || sx < rq[0]) return;
          var kk = e.reduce ? 1 : clamp01(hk * 1.5 - m * 0.25), mx = (hq[0] + rq[0]) / 2, my = Math.min(hq[1], rq[1]) - 10 - 0.08 * Math.abs(rq[0] - hq[0]);
          if (kk <= 0) return;
          var dk = Math.max(0.35, e.dim[j]);              // fainter towards a paper that the list's filter leaves out
          ctx.strokeStyle = ink('brassD', 0.75 * dk); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hq[0], hq[1]);
          for (var s2 = 1; s2 <= 24; s2++) {             // a gentle arc, drawn out from the star
            var w = kk * s2 / 24;
            ctx.lineTo((1 - w) * (1 - w) * hq[0] + 2 * w * (1 - w) * mx + w * w * rq[0], (1 - w) * (1 - w) * hq[1] + 2 * w * (1 - w) * my + w * w * rq[1]);
          }
          ctx.stroke();
          if (kk >= 1) { ctx.strokeStyle = ink('brassD', 0.65 * dk); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(rq[0], rq[1], 6.5, 0, TAU); ctx.stroke(); }
        });
      }

      // the stars light up as the cursor passes
      d.forEach(function (p, i) {
        var q = e.pos[i], age = (sx - q[0]) / v;
        if (age < 0) return;
        var k = e.reduce ? 1 : ease(age / 0.35), tw = 0.8 + 0.2 * Math.sin(t * 1.9 + i * 2.3);
        var col = p.t === 'pheno' ? 'pine' : 'brassD';
        ctx.save(); ctx.globalAlpha *= e.dim[i];
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
        ctx.restore();
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
      e.hover = best; e.hoverAt = e.t;
      e.stage.style.cursor = best >= 0 ? 'pointer' : '';
      e.caption(best >= 0 ? e.pubs[best].y + ' · ' + e.pubs[best].n : null);
      e.hint(best >= 0 && (e.pubs[best].r || []).length ? 'Lines lead to the closest papers in content' : null);
    },
    click: function (e, x, y) {                       // on a touch screen, the first tap names the paper
      SCENES.constellation.move(e, { x: x, y: y });
      var p = e.pubs[e.hover];
      if (!p) return;
      if (e.touch && e.tapped !== e.hover) { e.tapped = e.hover; return; }
      if (!p.u) return;
      if (p.u.charAt(0) === '#') {                      // the paper, opened, in the list below
        if (window.location.hash !== p.u) { window.location.hash = p.u; return; }
        var el = document.getElementById(p.u.slice(1)), d = el && el.querySelector('details');
        if (d) d.open = true;
        if (el) el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
      else window.open(p.u, '_blank', 'noopener');
    }
  };
  SCENES.talkmap = {
    touchHint: 'Tap a city for its talks',
    init: function (e) {
      var d = e.data, talks = d.talks || [], step = 0.5;
      e.view = d.view || [0, 0, 1200, 482];
      e.land = d.land && window.Path2D ? new Path2D(d.land) : null;
      e.grat = d.grat && window.Path2D ? new Path2D(d.grat) : null;
      var ki = 0;
      talks.forEach(function (tk, i) { tk.at = 0.35 + i * step; tk.k = i + 1; if (tk.i) ki++; tk.ki = ki; });   // one talk after another, at an even pace
      e.talks = talks; e.end = talks.length ? talks[talks.length - 1].at + 1.4 : 0; e.cycle = e.end + 4.5;
      e.clock = 0; e.hoverCity = null; e.hoverKey = null; e.sel = null;
      document.addEventListener('talkcity-shown', function (ev) { e.sel = ev.detail && ev.detail.cities; });   // the list below shows these
      e.inv = false; e.baseCap = e.defaultCaption;
      document.addEventListener('talkinvited', function (ev) {   // only the invited talks are listed: the caption counts them
        e.inv = !!(ev.detail && ev.detail.on);
        var where = {}, n = 0;
        e.talks.forEach(function (tk) { if (tk.i) { n++; where[tk.c] = 1; } });
        var nc = Object.keys(where).length;
        e.defaultCaption = e.inv ? n + (n === 1 ? ' invited talk' : ' invited talks') + ' in ' + nc + (nc === 1 ? ' city' : ' cities') : e.baseCap;
        e.caption(null, true);
      });
    },
    layout: function (e) {                             // the map is drawn once per size
      var v = e.view, s = Math.min(e.w / v[2], e.h / v[3]), L = layer(e.w, e.h, e.dpr), c = L.ctx;
      e.s = s; e.ox = e.x + (e.w - v[2] * s) / 2 - v[0] * s; e.oy = e.y + (e.h - v[3] * s) / 2 - v[1] * s;
      var by = {};                                    // every city once, for the pointer: where it is and how many talks
      e.cities = [];
      e.talks.forEach(function (tk) {
        var m = by[tk.c];
        if (!m) { m = by[tk.c] = { c: tk.c, x: e.ox + tk.x * s, y: e.oy + tk.v * s, live: 0, online: 0, first: tk.at }; e.cities.push(m); }
        if (tk.o) m.online++; else m.live++;
      });
      var vx = e.ox - e.x + v[0] * s, vy = e.oy - e.y + v[1] * s, vw = v[2] * s, vh = v[3] * s;
      c.save(); c.beginPath(); c.rect(vx, vy, vw, vh); c.clip();
      c.translate(e.ox - e.x, e.oy - e.y); c.scale(s, s);
      if (e.grat) { c.lineWidth = 0.7 / s; c.strokeStyle = ink('pine', 0.14); c.stroke(e.grat); }
      if (e.land) {
        c.fillStyle = TC.land; c.fill(e.land);
        c.lineWidth = 0.8 / s; c.lineJoin = 'round'; c.strokeStyle = TC.coast; c.stroke(e.land);
      }
      c.restore();
      edgeFade(c, vx, vy, vw, vh, 0.1, 0.16);
      e.map = L.c;
    },
    frame: function (e, t) {
      var ctx = e.ctx, talks = e.talks, s = e.s, ox = e.ox, oy = e.oy;
      if (!e.hoverCity) e.clock += e.dt;              // the map holds still while a city is looked at
      var c = e.reduce ? e.end + 1 : e.clock % e.cycle, fade = e.reduce ? 1 : (c > e.cycle - 0.9 ? (e.cycle - c) / 0.9 : 1);
      var last = null;
      for (var q = 0; q < talks.length && talks[q].at <= c; q++) last = talks[q];
      if (e.map) ctx.drawImage(e.map, e.x, e.y, e.w, e.h);
      if (!e.reduce && !e.hoverCity) {                 // the caption keeps a running total
        if (last && c < e.end) {                       // a new year fades in, the count within a year just ticks
          var kk = e.inv ? last.ki : last.k, word = e.inv ? (kk === 1 ? ' invited talk' : ' invited talks') : (kk === 1 ? ' talk' : ' talks');
          e.caption(last.y + ' · ' + kk + word + ' so far', last.y === e.capYear);
          e.capYear = last.y;
        } else { e.caption(null); e.capYear = null; }
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
        if (!m) { m = cities[tk.c] = { n: 0, live: 0, inv: 0, x: ox + tk.x * s, y: oy + tk.v * s, yr: 0, at: 0 }; order.push(m); }
        m.n++; if (!tk.o) m.live = 1; if (tk.i) m.inv++; m.yr = tk.y; m.at = tk.at; newest = tk;
      });
      var curYear = last ? last.y : null;
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
        if (e.inv && !m.inv) ctx.globalAlpha = fade * 0.25;   // while only the invited talks are listed, the other cities step back
        ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, TAU);
        if (m.live) { ctx.fillStyle = ink('green', 0.9); ctx.fill(); }
        else { ctx.fillStyle = ink('paper', 0.95); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = ink('green', 0.9); ctx.stroke(); }
        ctx.globalAlpha = fade;
      });

      if (e.sel) e.sel.forEach(function (name, k) {     // the cities whose talks the list below shows: a brass ring that breathes
        var sm = cities[name]; if (!sm) return;
        var sr = 1.7 + 1.15 * Math.sqrt(sm.n) + 6.5 + (e.reduce ? 0 : 1.6 * Math.sin(e.clock * 2.6 + k));
        ctx.strokeStyle = ink('brassD', 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(sm.x, sm.y, sr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = ink('brassD', 0.25); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(sm.x, sm.y, sr, 0, TAU); ctx.stroke();
      });
      if (e.hoverCity && cities[e.hoverCity]) {        // the city under the pointer
        var hm = cities[e.hoverCity], hr = 1.7 + 1.15 * Math.sqrt(hm.n) + 4.5;
        ctx.strokeStyle = ink('brassD', 0.95); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(hm.x, hm.y, hr, 0, TAU); ctx.stroke();
      }
      // the city of the newest talk, named for a moment
      if (newest && !e.reduce && !e.hoverCity) {
        var la = c - newest.at, lk = la < 0.15 ? la / 0.15 : la < 1.1 ? 1 : 1 - (la - 1.1) / 0.3;
        if (lk > 0) {
          var m2 = cities[newest.c], tw;
          ctx.font = font(10, SANS, 600); tracking(ctx, 0.3); tw = ctx.measureText(newest.c).width;
          var cand = [[9, -10, 'left'], [-9, -10, 'right'], [9, 12, 'left'], [-9, 12, 'right']], best = null, fewest = Infinity;
          if (m2.x > e.x + e.w - 90) cand = [cand[1], cand[0], cand[3], cand[2]];
          cand.forEach(function (cd) {                   // of four places around the dot, the one that hides the fewest other cities
            var x0 = cd[2] === 'left' ? m2.x + cd[0] : m2.x + cd[0] - tw, y0 = m2.y + cd[1] - 6, hits = 0;
            if (x0 < e.x - 20 || x0 + tw > e.x + e.w + 20) hits += 10;
            order.forEach(function (o) {
              var rr = 2.7 + 1.15 * Math.sqrt(o.n);
              if (o !== m2 && o.x + rr > x0 && o.x - rr < x0 + tw && o.y + rr > y0 && o.y - rr < y0 + 12) hits++;
            });
            if (hits < fewest) { fewest = hits; best = cd; }
          });
          ctx.textAlign = best[2]; ctx.textBaseline = 'middle';
          var lx = m2.x + best[0], ly = m2.y + best[1];
          ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = ink('paper', 0.92 * lk); ctx.strokeText(newest.c, lx, ly);
          ctx.fillStyle = ink('green', lk); ctx.fillText(newest.c, lx, ly);
          tracking(ctx, 0);
        }
      }
    },
    move: function (e, p) {                            // a city under the pointer names itself and its number of talks
      var c = e.reduce ? e.end + 1 : e.clock % e.cycle, best = null, bd = 13;
      if (p && e.cities) e.cities.forEach(function (m) {
        if (m.first > c) return;
        var d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < bd) { bd = d; best = m; }
      });
      var group = best ? e.cities.filter(function (m) {   // cities that sit on top of each other are named together
        return m.first <= c && Math.hypot(m.x - best.x, m.y - best.y) < 3;
      }).sort(function (a, b) { return (b.live + b.online) - (a.live + a.online); }) : [];
      var names = group.map(function (m) { return m.c; }), key = names.join('|') || null;
      if (key === e.hoverKey) return;
      e.hoverKey = key; e.hoverCity = best ? best.c : null; e.stage.style.cursor = best ? 'pointer' : '';
      if (best) {
        var live = 0, online = 0;
        group.forEach(function (m) { live += m.live; online += m.online; });
        var n = live + online, list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
        e.caption(list + ' · ' + n + (n === 1 ? ' talk' : ' talks'));
        e.hint(!online ? 'In person' : !live ? 'Online' : live + ' in person, ' + online + ' online');
      } else { e.caption(null); e.hint(null); e.capYear = null; }
    },
    click: function (e, x, y) {                        // a tap names the city (on a touch screen), and a click shows its talks
      SCENES.talkmap.move(e, { x: x, y: y });
      if (e.hoverKey && window.CustomEvent) document.dispatchEvent(new CustomEvent('talkcity', { detail: { cities: e.hoverKey.split('|') } }));
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
    touchHint: 'Tap for the next award', pauseOnHover: true,
    init: function (e) {
      e.aw = (e.data && e.data.awards) || []; e.sel = -1; e.selAt = 0; e.nextSel = 5;
      document.addEventListener('scenepick', function (ev) {   // a card below asks for its award on the chart
        var i = e.aw.map(function (a) { return a.n; }).indexOf(ev.detail && ev.detail.name);
        if (i < 0) return;
        e.hovered = false; e.sel = i; e.selAt = e.t || 0; e.nextSel = (e.t || 0) + 8; SCENES.medals.announce(e);
        if (e.redraw) e.redraw();
      });
    },
    layout: function (e) {
      var A = e.aw, n = A.length;
      if (!n) return;
      e.L = e.x + 50; e.R = e.x + e.w - 12; e.base = e.y + e.h - 30;
      e.mr = Math.max(10, Math.min(16.5, e.w / 30, e.h / 12));
      var low = e.base - 12 - 1.9 * e.mr, high = e.y + e.mr + 22, lo = Math.log(3000), hi = Math.log(330000);
      e.Yv = function (usd) { return low - (low - high) * (Math.log(usd) - lo) / (hi - lo); };   // height: the amount, on a log scale
      e.pos = A.map(function (a, i) { return [e.L + (i + 0.5) / n * (e.R - e.L), e.Yv(a.usd || 3000)]; });
    },
    frame: function (e, t) {
      var A = e.aw, n = A.length, ctx = e.ctx, R = e.reduce;
      if (!n || !e.pos) return;
      var ax = e.L - 8, ak = R ? 1 : ease(t / 0.8);                                               // the amount axis, in US dollars
      ctx.save(); ctx.globalAlpha *= ak;
      line(ctx, ax, e.Yv(3000), ax, e.Yv(330000), ink('brass', 0.55), 1);
      ctx.font = font(8.5, SANS, 500); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      [[10000, '$10k'], [30000, '$30k'], [100000, '$100k'], [300000, '$300k']].forEach(function (T) {
        var yy = e.Yv(T[0]);
        line(ctx, ax - 3, yy, ax + 3, yy, ink('brass', 0.6), 1);
        ctx.save(); ctx.setLineDash([2, 5]); line(ctx, ax + 6, yy, e.R, yy, ink('brass', 0.16), 1); ctx.restore();
        ctx.fillStyle = ink('slate', 0.85); ctx.fillText(T[1], ax - 6, yy);
      });
      ctx.textBaseline = 'alphabetic';
      caps(ctx, 'AMOUNT IN US DOLLARS, LOG SCALE', e.x + 4, e.y + 9, ink('slate', 0.8), 7);
      ctx.restore();
      line(ctx, e.L, e.base, e.R, e.base, ink('brass', 0.55), 1);                                   // the years
      ctx.font = font(9.5, SANS, 500); ctx.textAlign = 'center';
      A.forEach(function (a, i) { var x = e.pos[i][0]; line(ctx, x, e.base - 3, x, e.base + 3, ink('brass', 0.6), 1); });
      for (var i0 = 0, i1; i0 < n; i0 = i1 + 1) {   // each year once, under all of its awards, their ticks joined
        i1 = i0; while (i1 + 1 < n && A[i1 + 1].y === A[i0].y) i1++;
        var x0 = e.pos[i0][0], x1 = e.pos[i1][0];
        if (i1 > i0) line(ctx, x0, e.base + 3, x1, e.base + 3, ink('brass', 0.6), 1);
        ctx.fillStyle = ink(e.sel >= i0 && e.sel <= i1 ? 'brassD' : 'slate', 0.9); ctx.fillText(String(A[i0].y), (x0 + x1) / 2, e.base + 15);
      }
      var split = A.filter(function (a) { return a.y < 2024; }).length;                           // doctoral years and postdoctoral years
      if (split > 0 && split < n) {
        var xm = (e.pos[split - 1][0] + e.pos[split][0]) / 2, la = 'MASTER’S AND DOCTORAL', lb = 'POSTDOCTORAL';
        ctx.font = font(7, SANS, 600); tracking(ctx, 1.1);
        var ha = ctx.measureText(la).width / 2 + 5, hb = ctx.measureText(lb).width / 2 + 5;
        tracking(ctx, 0);
        var ca = (e.pos[0][0] + e.pos[split - 1][0]) / 2, cb = (e.pos[split][0] + e.pos[n - 1][0]) / 2;
        ca = Math.max(e.x + ha - 4, Math.min(ca, xm - ha)); cb = Math.min(e.x + e.w - hb + 4, Math.max(cb, xm + hb));   // clear of the divider (narrow phones)
        caps(ctx, la, ca, e.base + 27, ink('slate', 0.7), 7, 'center');
        caps(ctx, lb, cb, e.base + 27, ink('slate', 0.7), 7, 'center');
        line(ctx, xm, e.base + 18, xm, e.base + 30, ink('brass', 0.45), 1);
      }
      ctx.save(); ctx.strokeStyle = ink('brass', 0.55); ctx.lineWidth = 1.2; ctx.setLineDash([2, 4]); ctx.beginPath();  // the path of the awards
      var shownPath = R ? n : (t - 0.3) / 0.55 + 1;
      for (var i = 0; i < n && i < shownPath; i++) { var p = e.pos[i]; if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
      ctx.stroke(); ctx.restore();
      if (!R && t > 4.4 && t > e.nextSel) { e.sel = (e.sel + 1) % n; e.selAt = t; e.nextSel = t + 3.2; this.announce(e); }
      if (R && e.sel < 0) { e.sel = n - 1; this.announce(e); }
      if (e.sel >= 0 && A[e.sel].usd) {             // a leader from the amount axis to the chosen medal, behind the medals
        var ps = e.pos[e.sel], lk = R ? 1 : ease((t - e.selAt) / 0.5);
        ctx.save(); ctx.setLineDash([2, 3]);
        line(ctx, e.L - 8, ps[1], e.L - 8 + (ps[0] - e.mr - e.L + 8) * lk, ps[1], ink('brassD', 0.45), 1);
        ctx.restore();
      }
      A.forEach(function (a, i) {
        var p = e.pos[i], age = t - 0.3 - i * 0.55, k = R ? 1 : ease(age / 0.5);
        if (k <= 0) return;
        var sel = i === e.sel, lift = sel ? (R ? 1 : ease((t - e.selAt) / 0.4)) : 0, s = (R ? 1 : 1 + 0.35 * (1 - ease(age / 0.5))) * (1 + 0.1 * lift);
        if (!R && age < 1.2) ring(ctx, p[0], p[1], e.mr * (1 + age * 1.4), ink('brass', 0.5 * (1 - age / 1.2)), 1);
        medal(ctx, p[0], p[1] - 3 * lift, e.mr * s, a.s, k * (e.sel < 0 || sel ? 1 : 0.62), lift);
        if (sel && !R) glint(ctx, p[0], p[1] - 3 * lift, e.mr * s, (t - e.selAt - 0.2) / 0.9);
        if (sel && a.usd) {                         // its value in US dollars, just above it
          var tk = R ? 1 : ease((t - e.selAt - 0.15) / 0.4);
          ctx.save(); ctx.globalAlpha *= tk; ctx.font = font(9.5, SANS, 600); ctx.textAlign = 'center'; ctx.fillStyle = ink('brassD', 1);
          ctx.fillText('≈ $' + a.usd.toLocaleString('en-US'), p[0], p[1] - 3 * lift - e.mr * 1.45);
          ctx.restore();
        }
      });
    },
    announce: function (e) {
      var a = e.aw[e.sel];
      e.caption(a.n);
      var dot = '\u00a0· ';                           // (a line may end with the dot, on a phone, but never begins with one)
      e.hint(a.s + ', ' + a.c + dot + a.y + dot + a.amt + (a.st ? dot + 'awarded, ' + a.st : ''));
    },
    click: function (e) { this.step(e, 1); },
    step: function (e, d) {                          // the next award, or the one before
      var n = e.aw.length;
      if (!n) return;
      e.sel = e.sel < 0 ? (d > 0 ? 0 : n - 1) : (e.sel + d + n) % n; e.selAt = e.t; e.nextSel = e.t + 5; this.announce(e);
    }
  };

  /* =====================================================================
     Teaching: equations from the courses, written on a blackboard
     ===================================================================== */
  /* Figures drawn in chalk, stroke by stroke, with their labels (f is the chalk of chalk() below). */
  function chalkArc(cx, cy, r, a0, a1) {
    var n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * r / 4)), pts = [];
    for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  function chevron(f, a, b, dir, s) {                 // a fermion arrow halfway along a to b, pointing along dir
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dir * dx / l, uy = dir * dy / l;
    var mx = (a[0] + b[0]) / 2 + ux * s * 0.5, my = (a[1] + b[1]) / 2 + uy * s * 0.5;
    f.stroke([[mx - ux * s - uy * s * 0.75, my - uy * s + ux * s * 0.75], [mx, my], [mx - ux * s + uy * s * 0.75, my - uy * s - ux * s * 0.75]], 160);
  }
  /* The unitarity triangle of the B system: the relation above divided by V_cd V_cb*, so that the
     base runs from (0,0) to (1,0) and the apex is rho-bar + i eta-bar. Apex at the PDG 2024 global fit,
     rho-bar = 0.159 and eta-bar = 0.352, which puts the angles at gamma 65.7, beta 22.7 and alpha 91.6
     degrees. The sides are drawn head to tail, as the three terms of the relation add up to zero. */
  function unitarityTriangle(f, bw, bh) {
    var rho = 0.159, eta = 0.352, S = Math.min(21, bh * 0.08, bw / 22), top = 44, bot = bh - 12;
    var formula = '\\bar{ρ}+i\\bar{η}=−\\frac{V_{ud}V^∗_{ub}}{V_{cd}V^∗_{cb}}', fb = f.box(formula, S * 0.92), fh = fb.ext[1] - fb.ext[0];
    var Ls = Math.min(bw - 5.6 * S, (bot - top - 3.3 * S - fh) / eta, 520);          // the formula below the triangle
    var Lr = Math.min(bw - 16 - 3.6 * S - fb.w, (bot - top - 3.3 * S) / eta, 520);   // or beside it, on a low board
    var side = Lr > Ls * 1.1, Lb = side ? Lr : Ls, H = eta * Lb;
    var y0 = top + (bot - top - 3.3 * S - H - (side ? 0 : fh)) / 2;
    var ox = side ? (bw - Lb - 3.6 * S - fb.w) / 2 + 1.3 * S : (bw - Lb) / 2;
    var O = [ox, y0 + 1.4 * S + H], P = [ox + Lb, O[1]], A = [ox + rho * Lb, y0 + 1.4 * S];
    var gam = Math.atan2(eta, rho), bet = Math.atan2(eta, 1 - rho), r = Math.max(13, Lb * 0.075);
    f.stroke([O, A, P, O], 300);
    f.label('(0,0)', O[0], O[1] + 0.9 * S, S * 0.78);
    f.label('(1,0)', P[0], P[1] + 0.9 * S, S * 0.78);
    f.label('(\\bar{ρ},\\bar{η})', A[0], A[1] - 0.85 * S, S * 0.85);
    f.stroke(chalkArc(O[0], O[1], r, 0, -gam), 120);
    f.label('γ', O[0] + (r + 0.62 * S) * Math.cos(gam / 2), O[1] - (r + 0.62 * S) * Math.sin(gam / 2), S);
    var rb = r * 1.5, db = rb + 1.9 * S;               // the narrow angle gets its label further out, where it fits
    f.stroke(chalkArc(P[0], P[1], rb, Math.PI, Math.PI + bet), 120);
    f.label('β', P[0] - db * Math.cos(bet / 2), P[1] - db * Math.sin(bet / 2), S);
    var am = (bet + Math.PI - gam) / 2;
    f.stroke(chalkArc(A[0], A[1], r, bet, Math.PI - gam), 120);
    f.label('α', A[0] + (r + 0.62 * S) * Math.cos(am), A[1] + (r + 0.62 * S) * Math.sin(am), S);
    if (side) f.glyphs(fb.prims, P[0] + 2.3 * S, (A[1] + O[1]) / 2 - (fb.ext[0] + fb.ext[1]) / 2);
    else f.glyphs(fb.prims, (bw - fb.w) / 2, P[1] + 2.1 * S - fb.ext[0]);
  }
  /* Electron-positron annihilation into a muon pair through a photon, and its total cross-section
     at lowest order in QED for energies far above the muon mass (Peskin and Schroeder, Eq. 5.13). */
  function annihilation(f, bw, bh) {
    var S = Math.min(21, bh * 0.08, bw / 22), top = 44, bot = bh - 12;
    var formula = 'σ=\\frac{4πα^2}{3s}', fb = f.box(formula, S * 1.05), fh = fb.ext[1] - fb.ext[0];
    var Hs = Math.min(bot - top - fh - 2.2 * S, 150), Ws = Math.min(bw - 5 * S, Hs * 2.4);              // formula below
    var Hr = Math.min(bot - top - 1.2 * S, 150), Wr = Math.min(bw - 16 - 3.9 * S - fb.w, Hr * 2.4);  // or beside
    var side = Wr > Ws * 1.15, Wd = side ? Wr : Ws, Hd = side ? Math.min(Hr, Wd / 1.6) : Hs, h2 = Hd / 2, cx, cy;
    if (side) { cx = (bw - Wd - 3.9 * S - fb.w) / 2 + 1.4 * S + Wd / 2; cy = (top + bot) / 2; }
    else { cx = bw / 2; cy = top + (bot - top - fh - 2.2 * S - Hd) / 2 + 0.4 * S + h2; }
    var A = [cx - 0.2 * Wd, cy], B = [cx + 0.2 * Wd, cy], s = Math.max(3.2, S * 0.26);
    var e1 = [cx - 0.5 * Wd, cy - h2], e2 = [cx - 0.5 * Wd, cy + h2], m1 = [cx + 0.5 * Wd, cy - h2], m2 = [cx + 0.5 * Wd, cy + h2];
    f.stroke([e1, A], 240); chevron(f, e1, A, 1, s); f.label('e^−', e1[0] - 0.8 * S, e1[1], S);
    f.stroke([e2, A], 240); chevron(f, e2, A, -1, s); f.label('e^+', e2[0] - 0.8 * S, e2[1], S);
    var wave = [], n = Math.max(4, Math.round((B[0] - A[0]) / (0.85 * S))), m = n * 12;
    for (var i = 0; i <= m; i++) wave.push([A[0] + (B[0] - A[0]) * i / m, cy - 0.2 * S * Math.sin(TAU * n * i / m)]);
    f.stroke(wave, 260);
    f.label('γ', cx, cy - 0.95 * S, S);
    f.stroke([B, m1], 240); chevron(f, B, m1, 1, s); f.label('μ^−', m1[0] + 0.85 * S, m1[1], S);
    f.stroke([B, m2], 240); chevron(f, B, m2, -1, s); f.label('μ^+', m2[0] + 0.85 * S, m2[1], S);
    if (side) f.glyphs(fb.prims, cx + Wd / 2 + 2.5 * S, cy - (fb.ext[0] + fb.ext[1]) / 2);
    else f.glyphs(fb.prims, (bw - fb.w) / 2, cy + h2 + 1.3 * S - fb.ext[0]);
  }
  /* The box diagram of B meson mixing. Along each quark line a b quark turns into a d quark, through a top
     quark in the loop and two W bosons, so the B-bar meson (b d-bar) becomes a B meson (d b-bar). The top
     quark dominates the loop, which makes the mass difference of the two neutral B mesons proportional to
     |V_tb V_td*|^2. Along the lower line the fermion arrows run backwards, as it carries the antiquarks. */
  function boxMixing(f, bw, bh) {
    var S = Math.min(21, bh * 0.08, bw / 22), top = 44, bot = bh - 12;
    var formula = 'Δm_d∝|V_{tb}V^∗_{td}|^2', fb = f.box(formula, S), fh = fb.ext[1] - fb.ext[0];
    var Hs = Math.min(bot - top - fh - 3.8 * S, 130), Ws = Math.min(bw - 5 * S, Hs * 2.25);              // formula below
    var Hr = Math.min(bot - top - 2.8 * S, 130), Wr = Math.min(bw - 36 - 3.6 * S - fb.w, Hr * 2.25);  // or beside
    var side = Wr > Ws * 1.15, Wd = side ? Wr : Ws, Hd = Math.min(side ? Hr : Hs, 0.44 * Wd), h2 = Hd / 2, cx, cy;
    if (side) { cx = (bw - Wd - 3.6 * S - fb.w) / 2 + 1.2 * S + Wd / 2; cy = (top + bot) / 2; }
    else { cx = bw / 2; cy = top + (bot - top - Hd - 3.6 * S - fh) / 2 + 1.3 * S + h2; }
    var a = 0.22 * Wd, s = Math.max(3.2, S * 0.26);
    var TL = [cx - a, cy - h2], TR = [cx + a, cy - h2], BL = [cx - a, cy + h2], BR = [cx + a, cy + h2];
    var l1 = [cx - 0.5 * Wd, cy - h2], r1 = [cx + 0.5 * Wd, cy - h2], l2 = [cx - 0.5 * Wd, cy + h2], r2 = [cx + 0.5 * Wd, cy + h2];
    function wavy(A, B) {                             // a W boson, as a wavy line from A to B
      var dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), n = Math.max(3, Math.round(L / (0.85 * S))), m = n * 12, pts = [];
      for (var i = 0; i <= m; i++) { var u = i / m, w = 0.2 * S * Math.sin(TAU * n * u); pts.push([A[0] + dx * u - dy / L * w, A[1] + dy * u + dx / L * w]); }
      f.stroke(pts, 260);
    }
    f.stroke([l1, TL], 240); chevron(f, l1, TL, 1, s); f.label('b', l1[0] - 0.7 * S, l1[1], S);
    f.stroke([TL, TR], 240); chevron(f, TL, TR, 1, s); f.label('t', cx, cy - h2 - 0.8 * S, S);
    f.stroke([TR, r1], 240); chevron(f, TR, r1, 1, s); f.label('d', r1[0] + 0.7 * S, r1[1], S);
    wavy(TL, BL); f.label('W', TL[0] - 0.95 * S, cy, S);
    wavy(TR, BR); f.label('W', TR[0] + 0.95 * S, cy, S);
    f.stroke([l2, BL], 240); chevron(f, l2, BL, -1, s); f.label('\\bar{d}', l2[0] - 0.7 * S, l2[1], S);
    f.stroke([BL, BR], 240); chevron(f, BL, BR, -1, s); f.label('t', cx, cy + h2 + 0.85 * S, S);
    f.stroke([BR, r2], 240); chevron(f, BR, r2, -1, s); f.label('\\bar{b}', r2[0] + 0.7 * S, r2[1], S);
    if (side) f.glyphs(fb.prims, cx + Wd / 2 + 2.4 * S, cy - (fb.ext[0] + fb.ext[1]) / 2);
    else f.glyphs(fb.prims, (bw - fb.w) / 2, cy + h2 + 2.3 * S - fb.ext[0]);
  }
  /* The same annihilation, angle by angle. In the centre-of-mass frame and far above the muon mass,
     dσ/dΩ = α²/4s (1 + cos²θ), with θ the angle between the outgoing μ- and the incoming e-
     (Peskin and Schroeder, Eq. 5.10). Drawn as a polar plot about the beam axis: twice as many muons
     go forwards and backwards as sideways. The pair leaves back to back, here at θ of about 49 degrees. */
  function angular(f, bw, bh) {
    var S = Math.min(21, bh * 0.08, bw / 22), top = 44, bot = bh - 12;
    var formula = '\\frac{\\rm{d}σ}{\\rm{d}Ω}=\\frac{α^2}{4s}\\,(1+\\rm{cos}^2θ)', fb = f.box(formula, S), fh = fb.ext[1] - fb.ext[0];
    var Rs = Math.min((bw - 5 * S) / 2.6, (bot - top - fh - 3.8 * S) / 1.34, 120);               // formula below
    var Rr = Math.min((bw - 36 - 3.6 * S - fb.w) / 2.6, (bot - top - 2 * S) / 1.34, 120);       // or beside
    var side = Rr > Rs * 1.15, R0 = side ? Rr : Rs, L = 1.3 * R0, cx, cy;
    if (side) { cx = (bw - 2.6 * R0 - 3.6 * S - fb.w) / 2 + 1.4 * S + L; cy = (top + bot) / 2; }
    else { cx = bw / 2; cy = top + (bot - top - 1.34 * R0 - 3.2 * S - fh) / 2 + 0.67 * R0 + S - 0.15 * S; }
    var s = Math.max(3.2, S * 0.26), pts = [];
    f.stroke([[cx - L, cy], [cx - 0.1 * R0, cy]], 260); chevron(f, [cx - L, cy], [cx - 0.45 * R0, cy], 1, s); f.label('e^−', cx - L - 0.8 * S, cy, S);
    f.stroke([[cx + L, cy], [cx + 0.1 * R0, cy]], 260); chevron(f, [cx + L, cy], [cx + 0.45 * R0, cy], 1, s); f.label('e^+', cx + L + 0.8 * S, cy, S);
    for (var i = 0; i <= 120; i++) { var a = TAU * i / 120, r = R0 * (1 + Math.cos(a) * Math.cos(a)) / 2; pts.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); }
    f.stroke(pts, 320);                               // 1 + cos²θ about the beam axis
    var th = 0.85, ux = Math.cos(th), uy = -Math.sin(th), rm = 1.25 * R0 * (1 + ux * ux) / 2;
    var m1 = [cx + ux * rm, cy + uy * rm], m2 = [cx - ux * rm, cy - uy * rm];
    f.stroke([[cx, cy], m1], 240); chevron(f, [cx, cy], m1, 1, s); f.label('μ^−', m1[0] + 0.75 * S * ux, m1[1] + 0.75 * S * uy, S);
    f.stroke([[cx, cy], m2], 240); chevron(f, [cx, cy], m2, 1, s); f.label('μ^+', m2[0] - 0.75 * S * ux, m2[1] - 0.75 * S * uy, S);
    f.stroke(chalkArc(cx, cy, 0.3 * R0, 0, -th), 120);
    f.label('θ', cx + (0.3 * R0 + 0.6 * S) * Math.cos(th / 2), cy - (0.3 * R0 + 0.6 * S) * Math.sin(th / 2), S);
    if (side) f.glyphs(fb.prims, cx + L + 2.2 * S, cy - (fb.ext[0] + fb.ext[1]) / 2);
    else f.glyphs(fb.prims, (bw - fb.w) / 2, cy + 0.67 * R0 + 2.2 * S - fb.ext[0]);
  }
  /* The magnetic field of a long straight wire, from Ampère's law: circles around the wire, B = μ0 I / 2πr,
     turning anticlockwise seen from where the current goes (the right-hand rule). The circles are drawn in
     perspective, seen from a little above, so their near side passes in front of the wire and their far side
     behind it, and the arrows on the near side point to the right. */
  function ampere(f, bw, bh) {
    var S = Math.min(21, bh * 0.08, bw / 22), top = 44, bot = bh - 12, k = 0.36;
    var formula = 'B=\\frac{μ_0I}{2πr}', fb = f.box(formula, S * 1.05), fh = fb.ext[1] - fb.ext[0];
    var Rs = Math.min((bw - 4 * S) / 2, (bot - top - fh - 2 * S) / 1.4, 125);                 // formula below
    var Rr = Math.min((bw - 16 - 2.2 * S - fb.w) / 2, (bot - top - 0.6 * S) / 1.4, 125);      // or beside
    var side = Rr > Rs * 1.15, R0 = side ? Rr : Rs, Hd = 1.4 * R0, cx, cy;
    if (side) { cx = (bw - 2 * R0 - 2.2 * S - fb.w) / 2 + R0; cy = (top + bot) / 2; }
    else { cx = bw / 2; cy = top + (bot - top - Hd - 2 * S - fh) / 2 + Hd / 2; }
    var s = Math.max(3.2, S * 0.26), g = 0.3 * S, rs = [0.55 * R0, R0];
    function P(r, a) { return [cx + r * Math.cos(a), cy - k * r * Math.sin(a)]; }
    function arc(r, a0, a1) { var pts = []; for (var i = 0; i <= 40; i++) pts.push(P(r, a0 + (a1 - a0) * i / 40)); return pts; }
    var yb = cy + Hd / 2, yt = cy - Hd / 2, yn = rs.map(function (r) { return cy + k * r; }), ya = cy - 0.5 * R0;
    f.stroke([[cx, yb], [cx, yn[1] + g]], 240);      // the wire, from the bottom up, hidden where the circles pass in front
    f.stroke([[cx, yn[1] - g], [cx, yn[0] + g]], 240);
    f.stroke([[cx, yn[0] - g], [cx, yt]], 240);
    chevron(f, [cx, ya + 0.1 * R0], [cx, ya - 0.1 * R0], 1, s); f.label('I', cx + 0.7 * S, ya, S);
    rs.forEach(function (r) {
      var gap = Math.asin(Math.min(1, g / r));
      f.stroke(arc(r, -Math.PI, 0), 300);            // the near side, in front of the wire
      f.stroke(arc(r, 0, Math.PI / 2 - gap), 300);   // the far side, behind it
      f.stroke(arc(r, Math.PI / 2 + gap, Math.PI), 300);
      chevron(f, P(r, -Math.PI / 3 - 0.1), P(r, -Math.PI / 3 + 0.1), 1, s);
    });
    var pb = P(R0, -Math.PI / 3);
    f.label('\\bf{B}', pb[0] + 0.6 * S, pb[1] + 0.8 * S, S);
    f.stroke([[cx + 0.08 * S, cy], [cx + R0, cy]], 240);   // the distance from the wire
    f.label('r', cx + 0.8 * R0, cy - 0.42 * S, S * 0.92);
    if (side) f.glyphs(fb.prims, cx + R0 + 2.2 * S, cy - (fb.ext[0] + fb.ext[1]) / 2);
    else f.glyphs(fb.prims, (bw - fb.w) / 2, yb + 1.6 * S - fb.ext[0]);
  }
  var EQUATIONS = [
    { name: 'The Dirac equation', course: 'Quantum Field Theory', lines: ['(iγ^μ\\,∂_μ−m)\\,ψ=0'] },
    { name: 'The Feynman propagator', course: 'Quantum Field Theory', lines: ['D_F(p)=\\frac{i}{p^2−m^2+iε}'] },
    { name: 'The Lagrangian of QED', course: 'Quantum Field Theory',          // (the covariant derivative as in Peskin and Schroeder)
      lines: ['ℒ=\\bar{ψ}\\,(iγ^μD_μ−m)\\,ψ−\\frac{1}{4}F_{μν}F^{μν}', 'D_μ=∂_μ+ieA_μ'] },
    { name: 'Electron-positron annihilation into muons', course: 'Quantum Field Theory', fig: annihilation },
    { name: 'The angular distribution of the muons', course: 'Quantum Field Theory', fig: angular },
    { name: 'Unitarity of the CKM matrix', course: 'Flavour Physics', lines: ['V_{ud}V^∗_{ub}+V_{cd}V^∗_{cb}+V_{td}V^∗_{tb}=0'] },
    { name: 'The unitarity triangle', course: 'Flavour Physics', fig: unitarityTriangle },
    { name: 'The box diagram of B meson mixing', course: 'Flavour Physics', fig: boxMixing },
    { name: 'Muon decay and the Fermi constant', course: 'Flavour Physics',   // at tree level, with the electron mass neglected
      lines: ['Γ(μ→eν\\bar{ν})=\\frac{G_F^2\\,m_μ^5}{192π^3}', '\\frac{G_F}{√2}=\\frac{g^2}{8m_W^2}'] },
    { name: 'Gauss’s law and Faraday’s law', course: 'Introductory Physics', lines: ['\\oint\\bf{E}\\cdot\\rm{d}\\bf{A}=\\frac{Q}{ε_0}', '\\oint\\bf{E}\\cdot\\rm{d}\\bf{l}=−\\frac{\\rm{d}Φ_B}{\\rm{d}t}'] },
    { name: 'The Ampère-Maxwell law', course: 'Introductory Physics',
      lines: ['\\oint\\bf{B}\\cdot\\rm{d}\\bf{l}=μ_0I+μ_0ε_0\\frac{\\rm{d}Φ_E}{\\rm{d}t}'] },
    { name: 'The magnetic field of a long straight wire', course: 'Introductory Physics', fig: ampere }
  ];
  function courseOf(e, eq) {
    var list = (e.data && e.data.courses) || [];
    for (var i = 0; i < list.length; i++) if (list[i].c.indexOf(eq.course) === 0) return list[i];
    return null;
  }
  function chalk(e, index) {                          // one equation or figure in chalk, with its writing schedule
    var eq = EQUATIONS[index], bw = e.bw, bh = e.bh, L = layer(bw, bh, e.dpr), c = L.ctx;
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
    var f = {
      box: function (src, S) { var b = typeset(c, parseTeX(src), S, false, ''); b.ext = extent(b.prims); return b; },
      glyphs: function (prims, ox, oy) {               // glyphs and rules, one after another
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        prims.forEach(function (p) {
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
      },
      label: function (src, x, y, S) {                 // a short label centred on (x, y)
        var b = f.box(src, S);
        f.glyphs(b.prims, x - b.w / 2, y - (b.ext[0] + b.ext[1]) / 2);
      },
      stroke: function (pts, speed) {                  // a chalk line through pts, revealed from the first point on
        c.lineCap = 'round'; c.lineJoin = 'round';
        [[0, 0, 1.7, 0.9], [0.5, -0.4, 1.2, 0.25]].forEach(function (k) {
          c.lineWidth = k[2]; c.strokeStyle = 'rgba(238,231,214,' + k[3] + ')'; c.beginPath();
          pts.forEach(function (p, i) { if (i) c.lineTo(p[0] + k[0], p[1] + k[1]); else c.moveTo(p[0] + k[0], p[1] + k[1]); });
          c.stroke();
        });
        for (var i = 1; i < pts.length; i++) {         // short pieces, revealed one after another
          var a = pts[i - 1], b = pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 5));
          for (var j = 0; j < n; j++) {
            var x0 = a[0] + (b[0] - a[0]) * j / n, y0 = a[1] + (b[1] - a[1]) * j / n;
            var x1 = a[0] + (b[0] - a[0]) * (j + 1) / n, y1 = a[1] + (b[1] - a[1]) * (j + 1) / n;
            var dur = len / n / (speed || 240);
            rects.push({ r: [Math.min(x0, x1) - 2, Math.min(y0, y1) - 2, Math.abs(x1 - x0) + 4, Math.abs(y1 - y0) + 4],
                         t0: T, dur: dur, p: [x0, y0, x1, y1] });
            T += dur;
          }
        }
        T += 0.1;
      }
    };
    if (eq.fig) eq.fig(f, bw, bh);
    else {
      var S = Math.min(34, bh * 0.18), lines, wmax, htot, gap;
      for (var pass = 0; pass < 3; pass++) {           // shrink until it fits the board
        lines = eq.lines.map(function (src) { return f.box(src, S); });
        gap = 0.55 * S; wmax = 0; htot = -gap;
        lines.forEach(function (ln) { wmax = Math.max(wmax, ln.w); htot += ln.ext[1] - ln.ext[0] + gap; });
        var fit = Math.min((bw - 64) / wmax, (bh - 104) / htot, 1);
        if (fit > 0.995) break;
        S *= fit;
      }
      var y = 42 + (bh - 50 - htot) / 2;
      lines.forEach(function (ln) { f.glyphs(ln.prims, (bw - wmax) / 2, y - ln.ext[0]); y += ln.ext[1] - ln.ext[0] + gap; });
    }
    var rnd = seeded(31 * index + 7);                  // chalk grain: tiny gaps in every stroke
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath();
    rects.forEach(function (q) {
      var r = q.r, n = Math.round(r[2] * r[3] / (q.p ? 14 : 5));
      for (var i = 0; i < n; i++) {
        var gx = r[0] + rnd() * r[2], gy = r[1] + rnd() * r[3], gs = 0.3 + rnd() * 0.55;
        c.moveTo(gx + gs, gy); c.arc(gx, gy, gs, 0, TAU);
      }
    });
    c.fill(); c.globalCompositeOperation = 'source-over';
    if (eq.fig) return { c: L.c, rects: rects, Tw: T, box: null };
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
      if (g.p) {                                       // a piece of a chalk line: a thin band along it, so that
        var p = g.p, dx = p[2] - p[0], dy = p[3] - p[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
        var hw = 2 + grow, ex = 1.2 + grow;             // lines that cross it are not shown before their turn
        var ax = ox + p[0] - ux * ex, ay = oy + p[1] - uy * ex, bx = ox + p[0] + dx * k + ux * ex, by = oy + p[1] + dy * k + uy * ex;
        ctx.moveTo(ax + uy * hw, ay - ux * hw); ctx.lineTo(bx + uy * hw, by - ux * hw);
        ctx.lineTo(bx - uy * hw, by + ux * hw); ctx.lineTo(ax - uy * hw, ay + ux * hw); ctx.closePath();
        if (k < 1) tip = [ox + p[0] + dx * k, oy + p[1] + dy * k];
        return;
      }
      ctx.rect(ox + g.r[0] - grow, oy + g.r[1] - grow, g.r[2] * k + 2 * grow, g.r[3] + 2 * grow);
      if (k < 1) tip = [ox + g.r[0] + g.r[2] * k, oy + g.r[1] + g.r[3] * (0.45 + 0.2 * Math.sin(tau * 37))];
    });
    return tip;
  }
  function boxStroke(ctx, q, k, ox, oy, alpha) {
    if (k <= 0 || !q.box) return;
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
    touchHint: 'Tap for the next equation', pauseOnHover: true,
    init: function (e) {
      e.idx = 0; e.t0 = 0.6; e.cur = null; e.cut = null; e.next = null;
      document.addEventListener('chalkcourse', function (ev) {   // a course card below asks for one of its own on the board
        var name = (ev.detail && ev.detail.course) || '', mine = [];
        EQUATIONS.forEach(function (q, i) { if (name.indexOf(q.course) === 0) mine.push(i); });
        if (!mine.length) return;
        var k = mine.filter(function (i) { return i > e.idx; })[0];
        e.next = k === undefined ? mine[0] : k;
        if (e.next === e.idx && mine.length > 1) e.next = mine[(mine.indexOf(e.idx) + 1) % mine.length];
        e.hovered = false; SCENES.chalkboard.click(e);
        if (e.redraw) e.redraw();
      });
    },
    layout: function (e) {
      e.bx = e.x + 8; e.by = e.y + 4; e.bw = e.w - 16; e.bh = e.h - 20;
      e.board = board(e); e.residue = layer(e.bw, e.bh, e.dpr); e.cur = null;
    },
    frame: function (e, t) {
      var ctx = e.ctx;
      ctx.drawImage(e.board, e.x - 30, e.y - 30, e.w + 60, e.h + 60);
      ctx.drawImage(e.residue.c, e.bx, e.by, e.bw, e.bh);
      if (!e.cur) e.cur = chalk(e, e.idx);
      var q = e.cur, tau = e.reduce ? q.Tw + 2 : t - e.t0, tBox = q.Tw + 0.2, tErase = q.Tw + 4.6, tEnd = tErase + 0.9;   // reduced motion: written in full
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
        e.idx = e.next !== null ? e.next : (e.idx + 1) % EQUATIONS.length; e.next = null; e.cur = null; e.cut = null; e.t0 = t + 0.35;
      }
    },
    step: function (e, d) {                          // the next equation, or the one before (the board is wiped first)
      if (d < 0) e.next = (e.idx - 1 + EQUATIONS.length) % EQUATIONS.length;
      this.click(e);
    },
    click: function (e) {                              // wipe the board and write the next one
      var q = e.cur;
      if (e.reduce) { e.idx = e.next !== null ? e.next : (e.idx + 1) % EQUATIONS.length; e.next = null; e.cur = null; return; }   // straight to the next one
      if (!q) return;
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
    touchHint: 'Tap for the next student', pauseOnHover: true,
    init: function (e) {
      e.st = (e.data && e.data.students) || []; e.sel = 0; e.selAt = 0; e.nextSel = 6;
      document.addEventListener('scenepick', function (ev) {   // a card below asks for its student's project
        var i = e.st.map(function (s) { return s.n; }).indexOf(ev.detail && ev.detail.name);
        if (i < 0) return;
        e.hovered = false; e.sel = i; e.selAt = e.t || 0; e.nextSel = (e.t || 0) + 9; SCENES.mentoring.announce(e);
        if (e.redraw) e.redraw();
      });
    },
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
        this.project[i % 3](ctx, cx, cy, u, lt, t, R, e.x + e.w);
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
      function (ctx, cx, cy, u, lt, t, R, edge) {      // a propagator, order by order in perturbation theory
        var w = 30 * u, xs = [cx - 52 * u, cx, cx + 52 * u], labels = ['+', '+'];
        for (var j = 0; j < 3; j++) {
          var k = R ? 1 : ease((lt - j * 0.9) / 0.8), x = xs[j], r = 8 * u, a = x - w / 2 - 4 * u, b = a + (w + 8 * u) * Math.min(1, k * 1.3);
          if (k <= 0) continue;
          if (j === 0) line(ctx, a, cy, b, cy, ink('green', 0.95), 1.3);      // tree level: the propagator alone
          else {                                        // the line stops at the loop, whose arcs are the propagators inside it
            line(ctx, a, cy, Math.min(b, x - r), cy, ink('green', 0.95), 1.3);
            if (b > x + r) line(ctx, x + r, cy, b, cy, ink('green', 0.95), 1.3);
            loopArc(ctx, x, cy, r, Math.PI, Math.PI * 3, k, ink('pine', 0.95), 1.3);
            if (j === 2) line(ctx, x - r, cy, x - r + 2 * r * k, cy, ink('brassD', 0.95), 1.3);   // a third propagator across: the two-loop sunset
            if (k > 0.6) { dot(ctx, x - r, cy, 1.7, ink('green', 0.95)); dot(ctx, x + r, cy, 1.7, ink('green', 0.95)); }
          }
          if (j < 2 && k > 0.9) drawMath(ctx, labels[j], x + 26 * u, cy + 5, 13, ink('slate', 0.9), 'center');
        }
        var dk = R ? 1 : ease((lt - 2.9) / 0.6);
        if (dk > 0 && cx + 76 * u + 20 <= edge) drawMath(ctx, '+\\,\\cdots', cx + 52 * u + 24 * u, cy + 5, 13, ink('slate', 0.9 * dk), 'left');   // where there is room
        ctx.font = font(7, SANS, 600); tracking(ctx, 1.1);
        var half = ctx.measureText('TREE · ONE LOOP · TWO LOOPS').width / 2; tracking(ctx, 0);
        caps(ctx, 'TREE · ONE LOOP · TWO LOOPS', Math.min(cx, edge - half), cy + 40 * u, ink('slate', 0.75), 7, 'center');   // kept inside the stage
      }
    ],
    announce: function (e) {
      var s = e.st[e.sel];
      if (!s) return;
      e.caption(s.n + ', ' + s.l.replace('’', '’'));
      e.hint(s.i + ' · ' + s.y);
    },
    click: function (e) { this.step(e, 1); },
    step: function (e, d) {                          // the next student, or the one before
      var n = e.st.length;
      if (!n) return;
      e.sel = (e.sel + d + n) % n; e.selAt = e.t; e.nextSel = e.t + 7; this.announce(e);
    }
  };

  /* =====================================================================
     CV: the path from Kolkata to Stanford, on a timeline
     ===================================================================== */
  function spreadRow(items, lo, hi, gap) {          // label centres in one row, pushed apart so that none overlap
    var n = items.length, xs = items.map(function (it) { return it.x; }), i, moved = 0;
    for (i = 0; i < n; i++) xs[i] = Math.max(xs[i], lo + items[i].w / 2);
    for (i = 1; i < n; i++) xs[i] = Math.max(xs[i], xs[i - 1] + (items[i - 1].w + items[i].w) / 2 + gap);
    if (n && xs[n - 1] + items[n - 1].w / 2 > hi) {
      xs[n - 1] = hi - items[n - 1].w / 2;
      for (i = n - 2; i >= 0; i--) xs[i] = Math.min(xs[i], xs[i + 1] - (items[i].w + items[i + 1].w) / 2 - gap);
    }
    for (i = 0; i < n; i++) moved = Math.max(moved, Math.abs(xs[i] - items[i].x));
    return { xs: xs, ok: !n || (xs[0] - items[0].w / 2 >= lo - 0.5 && moved < 40) };
  }
  function placeLabels(items, lo, hi, gap) {        // one row if it fits, otherwise only the labels that collide drop to a second row
    var one = spreadRow(items, lo, hi, gap);
    if (one.ok) return items.map(function (it, i) { return { x: one.xs[i], row: 0 }; });
    function rows(pick, force) {
      var out = [], ok = true;
      [0, 1].forEach(function (r) {
        var idx = items.map(function (it, i) { return i; }).filter(function (i) { return pick[i] === r; });
        var res = spreadRow(idx.map(function (i) { return items[i]; }), lo, hi, gap);
        ok = ok && res.ok;
        idx.forEach(function (i, j) { out[i] = { x: res.xs[j], row: r }; });
      });
      return ok || force ? out : null;
    }
    var pick = [], end = -Infinity;
    items.forEach(function (it, i) {                // a label stays up if it fits after the last one kept up
      var a = Math.min(Math.max(lo, it.x - it.w / 2), hi - it.w);
      if (a >= end + gap) { pick[i] = 0; end = a + it.w; } else pick[i] = 1;
    });
    return rows(pick) || rows(items.map(function (it, i) { return i % 2; }), true);
  }
  SCENES.timeline = {
    touchHint: 'Tap for the next stage', pauseOnHover: true,
    init: function (e) {
      e.st = (e.data && e.data.stages) || []; e.now = (e.data && e.data.now) || 2026.8; e.c0 = 0; e.cur = -2; e.hold = null; e.pick = -1;
      document.addEventListener('scenepick', function (ev) {   // a CV entry below asks for its stage: the present waits there a while
        var i = e.st.map(function (s) { return s.title + ' · ' + s.w; }).indexOf(ev.detail && ev.detail.name);
        if (i < 0 || e.y0 === undefined) return;
        var s = e.st[i], mid = (s.s + Math.min(s.e || e.now, e.now)) / 2;
        e.hovered = false; e.hold = { c: 9.5 * (mid - e.y0) / (e.now - e.y0), until: (e.t || 0) + 4.5 }; e.pick = i; e.cur = -2;
        if (e.redraw) e.redraw();
      });
    },
    layout: function (e) {
      var st = e.st, ctx = e.ctx;
      if (!st.length) return;
      e.open = !st[st.length - 1].e;                  // the present position is still going on
      e.L = e.x + 16; e.R = e.x + e.w - 12; e.ay = e.y + e.h * 0.6;
      e.y0 = Math.floor(st[0].s); e.y1 = e.now + (e.open ? 1.2 : 0.5);
      var X = e.X = function (yr) { return e.L + (yr - e.y0) / (e.y1 - e.y0) * (e.R - e.L); };
      var groups = [];                                // the cities, each bracketed above, with the institution below
      st.forEach(function (s, i) { var g = groups[groups.length - 1]; if (g && g.c === s.c) g.e = i; else groups.push({ c: s.c, s: i, e: i }); });
      groups.forEach(function (g) {
        g.a = st[g.s].s; g.open = !st[g.e].e; g.b = st[g.e].e || e.now;
        g.xa = X(g.a) + 2; g.xb = g.open ? X(e.y1) - 4 : X(g.b) - 2;
        g.name = st[g.s].os || st[g.s].o;
      });
      var lo = e.x + 2, hi = e.x + e.w - 2;
      ctx.font = font(7.5, SANS, 600); tracking(ctx, 1.1);
      var cw = groups.map(function (g) { return { x: (g.xa + (g.open ? X(e.now) : g.xb)) / 2, w: ctx.measureText(g.c.toUpperCase()).width }; });
      tracking(ctx, 0);
      ctx.font = font(12.5, DISPLAY, 500, true);
      var nw = groups.map(function (g) { return { x: (g.xa + (g.open ? X(e.now) : g.xb)) / 2, w: ctx.measureText(g.name).width }; });
      var sw = st.map(function (s) { return { x: (X(s.s) + X(s.e || e.now)) / 2, w: mathBox(ctx, '\\rm{' + s.t + '}', 13).w }; });
      e.cityAt = placeLabels(cw, lo, hi, 10);
      e.nameAt = placeLabels(nw, lo, hi, 12);
      e.stageAt = placeLabels(sw, lo, hi, 7);
      e.groups = groups;
    },
    frame: function (e, t) {
      var ctx = e.ctx, st = e.st, R = e.reduce, T = 9.5, C = 14;
      if (!st.length || !e.X) return;
      var X = e.X, c = R ? 99 : (t - e.c0) % C;
      if (!R && e.hold) { if (t < e.hold.until) c = e.hold.c; else { e.c0 = t - e.hold.c; e.hold = null; } }
      var yc = R ? e.now : e.y0 + (e.now - e.y0) * clamp01(c / T), done = c > T || R;
      line(ctx, e.L, e.ay, X(e.now), e.ay, ink('green', 0.35), 1);                                   // the years
      ctx.font = font(9, SANS, 500); ctx.textAlign = 'center'; ctx.fillStyle = ink('slate', 0.85);
      for (var yr = e.y0; yr <= Math.floor(e.now); yr += 2) { line(ctx, X(yr), e.ay + 7, X(yr), e.ay + 11, ink('green', 0.4), 1); ctx.fillText(String(yr), X(yr), e.ay + 23); }
      e.groups.forEach(function (g, gi) {
        var k = R ? 1 : clamp01((yc - g.a) / 0.8);
        if (k <= 0) return;
        var yb = e.ay - 44, cp = e.cityAt[gi], np = e.nameAt[gi];
        ctx.save(); ctx.globalAlpha *= k;
        line(ctx, g.xa, yb + 4, g.xa, yb, ink('brass', 0.8), 1);
        if (g.open) {                                 // still going on: the bracket stays open and fades to the right
          var gr = ctx.createLinearGradient(X(e.now), 0, g.xb, 0);
          gr.addColorStop(0, ink('brass', 0.8)); gr.addColorStop(1, ink('brass', 0));
          line(ctx, g.xa, yb, X(e.now), yb, ink('brass', 0.8), 1);
          ctx.strokeStyle = gr; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(e.now), yb); ctx.lineTo(g.xb, yb); ctx.stroke();
        } else { line(ctx, g.xa, yb, g.xb, yb, ink('brass', 0.8), 1); line(ctx, g.xb, yb, g.xb, yb + 4, ink('brass', 0.8), 1); }
        caps(ctx, g.c.toUpperCase(), cp.x, yb - 6 - cp.row * 12, ink('brassD', 0.95), 7.5, 'center');
        ctx.font = font(12.5, DISPLAY, 500, true); ctx.fillStyle = ink('slate', 0.9); ctx.textAlign = 'center';
        ctx.fillText(g.name, np.x, e.ay + 42 + np.row * 16);
        ctx.restore();
      });
      var active = -1;
      st.forEach(function (s, i) {                                                                   // the stages
        var end = s.e || e.now;
        if (yc < s.s) return;
        if (yc <= end + 0.001) active = i;
        var xa = X(s.s), xb = X(Math.min(end, yc)), col = s.k === 'edu' ? 'brass' : 'pine', sp = e.stageAt[i];
        ctx.strokeStyle = ink(col, 0.95); ctx.lineWidth = 6; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(xa + 1.5, e.ay); ctx.lineTo(Math.max(xa + 1.5, xb - 1.5), e.ay); ctx.stroke();
        if (!s.e && done) {                             // the present position runs on beyond today
          var ex = X(e.y1) - 6, fg = ctx.createLinearGradient(X(e.now), 0, ex, 0);
          fg.addColorStop(0, ink(col, 0.7)); fg.addColorStop(1, ink(col, 0.05));
          ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(e.now), e.ay); ctx.lineTo(ex - 4, e.ay); ctx.stroke();
          ctx.strokeStyle = ink(col, 0.35); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(ex - 6, e.ay - 4); ctx.lineTo(ex, e.ay); ctx.lineTo(ex - 6, e.ay + 4); ctx.stroke(); ctx.lineCap = 'butt';
        }
        var k = R ? 1 : clamp01((yc - s.s) / 0.6);
        ctx.save(); ctx.globalAlpha *= k;
        drawMath(ctx, '\\rm{' + s.t + '}', sp.x, e.ay - 14 - sp.row * 14, 13, ink(i === active ? 'green' : 'slate', 0.95), 'center');
        ctx.restore();
        dot(ctx, xa, e.ay, 4, ink('paper', 1)); ring(ctx, xa, e.ay, 4, ink(col === 'brass' ? 'brassD' : 'pine', 1), 1.3);
      });
      if (!R) {                                                                                       // the present, moving along
        var xc = X(yc), g = ctx.createRadialGradient(xc, e.ay, 0, xc, e.ay, 12);
        g.addColorStop(0, ink('brass', 0.5)); g.addColorStop(1, ink('brass', 0));
        ctx.fillStyle = g; ctx.fillRect(xc - 12, e.ay - 12, 24, 24); dot(ctx, xc, e.ay, 2.8, ink('brassD', 1));
      }
      if (done) {
        var pk = R ? 0.5 : ((t * 0.8) % 1);
        ring(ctx, X(e.now), e.ay, 4 + pk * 12, ink('pine', 0.6 * (1 - pk)), 1.2);
        caps(ctx, 'NOW', X(e.now) + 6, e.ay + 23, ink('pine', 0.9), 7.5, 'left');
      }
      var show = R && e.pick >= 0 ? e.pick : c > T && !R ? -1 : active;
      if (show !== e.cur) {
        e.cur = show;
        if (show < 0) { e.caption(null); e.hint(null); }
        else { e.caption(st[show].title + ', ' + st[show].o); e.hint(st[show].c + ' · ' + st[show].w); }
      }
    },
    step: function (e, d) {                          // the next stage, or back to the one before
      var st = e.st, n = st.length, T = 9.5, C = 14;
      if (!n) return;
      if (e.reduce) { e.pick = e.pick < 0 ? (d > 0 ? 0 : n - 1) : (e.pick + d + n) % n; e.cur = -2; return; }
      if (d > 0) { this.click(e); return; }
      var c = (e.t - e.c0) % C, yc = e.y0 + (e.now - e.y0) * clamp01(c / T), prev = null;
      for (var i = n - 1; i >= 0; i--) if (st[i].s < yc - 0.4) { prev = st[i].s; break; }
      e.c0 = e.t - (prev === null ? 0.01 : (prev - e.y0) / (e.now - e.y0) * T + 0.3);
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
     Software: the packages and the library in time, a lane each, every
     release a dot on its lane as the years go by (dates from GitHub and arXiv)
     ===================================================================== */
  SCENES.releases = {
    touchHint: 'Tap for the next release',
    init: function (e) {
      var d = e.data || {};
      e.lanes = d.lanes || []; e.rel = d.releases || []; e.now = d.now || 2026.8;
      e.y0 = 2020.5; e.y1 = e.now + 0.35; e.c0 = 0; e.cur = -2; e.hov = -1;
    },
    layout: function (e) {
      var ctx = e.ctx, n = Math.max(1, e.lanes.length);
      ctx.font = font(7.5, SANS, 600); tracking(ctx, 1.1);
      var lw = 0;
      e.lanes.forEach(function (l) { lw = Math.max(lw, ctx.measureText(l.toUpperCase()).width); });
      tracking(ctx, 0);
      e.L = e.x + Math.min(lw + 16, e.w * 0.36); e.R = e.x + e.w - 8;
      e.top = e.y + 8; e.bot = e.y + e.h - 30; e.lh = (e.bot - e.top) / n;
      var X = e.X = function (yr) { return e.L + (yr - e.y0) / (e.y1 - e.y0) * (e.R - e.L); };
      ctx.font = font(10, SANS, 600);
      var lastX = {};
      e.rel.forEach(function (r) {                    // a version label goes below its lane if it would touch the one before
        var x = X(r.d), w = ctx.measureText(r.v).width, p = lastX[r.l];
        r.below = !!(p && x - w / 2 < p.x + p.w / 2 + 5 && !p.below);
        lastX[r.l] = { x: x, w: w, below: r.below };
      });
    },
    frame: function (e, t) {
      var ctx = e.ctx, R = e.reduce, T = 9.5, C = 14, X = e.X;
      if (!e.X || !e.lanes.length) return;
      if (e.hov >= 0 && e.cHold !== undefined) e.c0 = t - e.cHold;                  // time stands still while a release is shown
      var c = R ? 99 : (t - e.c0) % C, yc = R ? e.y1 : e.y0 + (e.y1 - e.y0) * clamp01(c / T), done = R || c > T;
      e.cHold = c; e.yc = yc;
      var cols = ['brassD', 'pine', 'crimson', 'slate'], ay = e.bot + 8;
      line(ctx, e.L, ay, X(e.y1), ay, ink('green', 0.35), 1);                      // the years
      ctx.font = font(9, SANS, 500); ctx.textAlign = 'center'; ctx.fillStyle = ink('slate', 0.85);
      for (var yr = 2021; yr <= Math.floor(e.now); yr++) {
        line(ctx, X(yr), ay, X(yr), ay + 4, ink('green', 0.4), 1);
        ctx.fillText(String(yr), X(yr), ay + 16);
      }
      e.lanes.forEach(function (name, i) {                                            // the lanes
        var y = e.top + e.lh * (i + 0.5), first = null;
        for (var k = 0; k < e.rel.length; k++) if (e.rel[k].l === i) { first = e.rel[k]; break; }
        caps(ctx, name.toUpperCase(), e.x + 2, y + 3, ink(i === e.lanes.length - 1 ? 'slate' : cols[i], 0.95), 7.5);
        line(ctx, e.L, y, X(e.y1), y, ink('green', 0.08), 1);
        if (first && yc > first.d) line(ctx, X(first.d), y, X(Math.min(yc, e.now)), y, ink(cols[i] || 'slate', 0.7), 1.6);
      });
      var last = -1;
      e.rel.forEach(function (r, k) {                                                 // the releases
        if (yc < r.d) return;
        last = k;
        var x = X(r.d), y = e.top + e.lh * (r.l + 0.5), a = R ? 1 : clamp01((yc - r.d) / 0.18), col = cols[r.l] || 'slate';
        var on = !done && k === last;
        dot(ctx, x, y, 4.2 * a, ink('paper', 1)); ring(ctx, x, y, 4.2 * a, ink(col, 1), 1.5);
        if (k === e.hov) ring(ctx, x, y, 8.5, ink(col, 0.75), 1.2);
        if (k === e.rel.length - 1 || r.l === e.lanes.length - 1) dot(ctx, x, y, 2 * a, ink(col, 1));
        if (r.v) {
          ctx.save(); ctx.globalAlpha *= a; ctx.font = font(10, SANS, 600); ctx.textAlign = 'center'; ctx.fillStyle = ink(col, 1);
          ctx.fillText(r.v, x, r.below ? y + 17 : y - 9); ctx.restore();
        }
      });
      if (!R) {                                                                       // the present, moving along
        var xc = X(Math.min(yc, e.y1)), g = ctx.createRadialGradient(xc, ay, 0, xc, ay, 10);
        g.addColorStop(0, ink('brass', 0.5)); g.addColorStop(1, ink('brass', 0));
        ctx.fillStyle = g; ctx.fillRect(xc - 10, ay - 10, 20, 20); dot(ctx, xc, ay, 2.4, ink('brassD', 1));
      }
      if (done) caps(ctx, 'NOW', X(e.now), ay + 16, ink('pine', 0.9), 7.5, 'center');
      var show = e.hov >= 0 ? e.hov : done ? -1 : last;                              // the release pointed at, or the latest so far
      if (show !== e.cur) {
        e.cur = show;
        if (show < 0) { e.caption(null); e.hint(null); }
        else { e.caption(e.rel[show].c); e.hint(e.rel[show].h); }
      }
    },
    move: function (e, p) {                            // a release under the pointer names itself
      var best = -1, bd = 11;
      if (p && e.X) e.rel.forEach(function (r, k) {
        if (e.yc !== undefined && e.yc < r.d) return;   // only the releases already on the lanes
        var dd = Math.hypot(e.X(r.d) - p.x, e.top + e.lh * (r.l + 0.5) - p.y);
        if (dd < bd) { bd = dd; best = k; }
      });
      if (best === e.hov) return;
      e.hov = best;
      if (e.stage) e.stage.style.cursor = best >= 0 ? 'default' : '';
    },
    click: function (e, x, y) {                        // a tap on a release names it, a tap elsewhere jumps to the next
      var T = 9.5, C = 14;
      if (!e.rel.length || !e.X) return;
      SCENES.releases.move(e, { x: x, y: y });
      if (e.hov >= 0) return;
      var c = (e.t - e.c0) % C, yc = e.y0 + (e.y1 - e.y0) * clamp01(c / T), next = null;
      for (var i = 0; i < e.rel.length; i++) if (e.rel[i].d > yc + 0.02) { next = e.rel[i].d; break; }
      var target = next === null ? 0.01 : (next - e.y0) / (e.y1 - e.y0) * T + 0.25;
      e.c0 = e.t - target;
    }
  };

  /* =====================================================================
     Software: how the packages fit together, with HyperPrecision in the
     middle of the chain. A Feynman integral (the one-loop bubble with two
     masses, the worked example of FeynGKZ) becomes multiple hypergeometric
     series in two ways. MBConicHulls takes its Mellin-Barnes representation
     and sums the residues of the poles in each cone. FeynGKZ takes its GKZ
     system: the Newton polytope of the Lee-Pomeransky polynomial
     G = U + F, with the five monomials x1^2, x1x2, x1, x2^2, x2 as lattice
     points, has normalized volume 3, and a unimodular triangulation into
     three triangles gives three series. HyperPrecision then evaluates such
     functions anywhere, to any precision. Here Appell F1(1;1,1;2;-2,-3),
     whose series converges only for |x| < 1 and |y| < 1: it follows the ray
     from the origin to (-2,-3), matching expansions along the way, and
     returns 0.28768 20724 51780 92743 92190 05993 = ln(4/3).
     ===================================================================== */
  var TC_DIGITS = '0.28768 20724 51780 92743 92190 05993';
  var TC_GKZ = { pts: [[2, 0], [1, 1], [1, 0], [0, 2], [0, 1]], tri: [[0, 1, 2], [1, 3, 4], [1, 2, 4]] };
  function qp(a, c, b, u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
  SCENES.toolchain = {
    touchHint: 'Tap a package to open it',
    init: function (e) { e.pk = (e.data && e.data.pk) || []; e.c0 = 0; e.beat = -2; e.hov = -1; e.hit = []; },
    layout: function (e) { e.F = dFrame(e, 2.2, 6); e.S = Math.max(7.5, Math.min(11.5, e.F.s / 18)); },
    beats: [[0.9, 5.0], [5.1, 9.2], [9.3, 14.9]],     // MBConicHulls, FeynGKZ, HyperPrecision
    C: 16,
    frame: function (e, t) {
      var ctx = e.ctx, R = e.reduce, F = e.F, S = e.S, c = R ? 60 : (t - e.c0) % this.C;
      function P(u, v) { return [F.x + u * F.s, F.y + v * F.s]; }
      function U(px) { return px / F.s; }
      var ak = R ? 1 : ease(t / 0.7);
      var beat = -1;
      if (!R) this.beats.forEach(function (b, i) { if (c >= b[0] && c < b[1]) beat = i; });
      if (beat !== e.beat && e.hov < 0) {               // the caption names the package at work
        e.beat = beat;
        if (beat >= 0 && e.pk[beat]) { e.caption(e.pk[beat].n); e.hint(e.pk[beat].tag); } else { e.caption(null); e.hint(null); }
      }
      // the stations, sized to their names: MBConicHulls above, FeynGKZ below, HyperPrecision in the middle
      ctx.font = font(S * 0.8, SANS, 600); tracking(ctx, 1.1);
      var names = ['MBCONICHULLS', 'FEYNGKZ', 'HYPERPRECISION'], wu = names.map(function (n) { return U(ctx.measureText(n).width + S * 1.7); });
      tracking(ctx, 0);
      var hu = U(S * 2.15), mb = [0.8, 0.17], gk = [0.8, 0.83], hp = [1.4, 0.5];
      var dx = Math.min(2.18, Math.max(hp[0] + wu[2] / 2 + 0.06, 2.2 - 0.02));   // the right edge of the numbers
      var colL = hp[0] + wu[2] / 2 + 0.07, colC = (colL + 2.2) / 2;
      var st = [mb, gk, hp];
      // the Feynman integral: the bubble with two masses
      var D = P(0.2, 0.5), r = 0.11 * F.s, va = P(0.09, 0.5), vb = P(0.31, 0.5);
      ctx.save(); ctx.globalAlpha *= ak;
      line(ctx, F.x + 0.015 * F.s, D[1], va[0], va[1], ink('green', 0.9), 1.4); line(ctx, vb[0], vb[1], F.x + 0.385 * F.s, D[1], ink('green', 0.9), 1.4);
      ctx.strokeStyle = ink('green', 0.9); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(D[0], D[1], r, 0, TAU); ctx.stroke();
      dot(ctx, va[0], va[1], 2, ink('green', 1)); dot(ctx, vb[0], vb[1], 2, ink('green', 1));
      drawMath(ctx, 'm_1', D[0], D[1] - r - 0.45 * S, S * 1.05, ink('slate', 0.95), 'center');
      drawMath(ctx, 'm_2', D[0], D[1] + r + 1.25 * S, S * 1.05, ink('slate', 0.95), 'center');
      drawMath(ctx, 'p', F.x + 0.03 * F.s, D[1] - 0.5 * S, S * 0.95, ink('slate', 0.85), 'center');
      caps(ctx, 'FEYNMAN INTEGRAL', D[0], F.y + 0.98 * F.s, ink('slate', 0.8), S * 0.68, 'center');
      ctx.restore();
      // the routes: integral to series (two ways), series to numbers
      function L(q, du) { return [F.x + (q[0] + du) * F.s, F.y + q[1] * F.s]; }
      var out = P(0.395, 0.5), hpL = L(hp, -wu[2] / 2), hpR = L(hp, wu[2] / 2);
      var routes = [
        [out, P(0.47, mb[1]), L(mb, -wu[0] / 2)], [L(mb, wu[0] / 2), P(hp[0] - wu[2] / 2 - 0.05, mb[1] + 0.02), hpL],
        [out, P(0.47, gk[1]), L(gk, -wu[1] / 2)], [L(gk, wu[1] / 2), P(hp[0] - wu[2] / 2 - 0.05, gk[1] - 0.02), hpL]
      ];
      function curve(q, a, w) {
        ctx.strokeStyle = ink('brass', a); ctx.lineWidth = w; ctx.beginPath();
        for (var i = 0; i <= 28; i++) { var p = qp(q[0], q[1], q[2], i / 28); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
      routes.forEach(function (q, i) { curve(q, 0.4 * ak * (beat < 0 || beat === 2 || (i < 2) === (beat === 0) ? 1 : 0.55), 1.1); });
      ctx.save(); ctx.globalAlpha *= ak; ctx.setLineDash([2, 3]);
      line(ctx, hpR[0] + 3, hpR[1], F.x + (colL - 0.015) * F.s, hpR[1], ink('brass', 0.5), 1); ctx.restore();
      ctx.save(); ctx.globalAlpha *= ak;                 // what each route carries
      caps(ctx, 'MELLIN-BARNES', F.x + mb[0] * F.s, F.y + mb[1] * F.s - hu * F.s / 2 - 0.5 * S, ink('slate', 0.75), S * 0.64, 'center');
      caps(ctx, 'GKZ SYSTEM', F.x + gk[0] * F.s, F.y + gk[1] * F.s + hu * F.s / 2 + 1.1 * S, ink('slate', 0.75), S * 0.64, 'center');
      ctx.restore();
      // a token carries the integral (∫) to a package, and its series (Σ) on to HyperPrecision
      function token(q, u0, u1, glyph) {
        var k = clamp01((c - u0) / (u1 - u0)); if (R || k <= 0 || k >= 1) return;
        var u = easeInOut(k), a0 = Math.max(0, u - 0.22);
        ctx.strokeStyle = ink('brassD', 0.8); ctx.lineWidth = 1.8; ctx.beginPath();
        for (var i = 0; i <= 14; i++) { var p = qp(q[0], q[1], q[2], a0 + (u - a0) * i / 14); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
        var hd = qp(q[0], q[1], q[2], u), rr = S * 0.95, g = ctx.createRadialGradient(hd[0], hd[1], 0, hd[0], hd[1], rr * 2.2);
        g.addColorStop(0, ink('brass', 0.45)); g.addColorStop(1, ink('brass', 0));
        ctx.fillStyle = g; ctx.fillRect(hd[0] - rr * 2.2, hd[1] - rr * 2.2, rr * 4.4, rr * 4.4);
        dot(ctx, hd[0], hd[1], rr, ink('paper', 1)); ring(ctx, hd[0], hd[1], rr, ink('brassD', 0.95), 1.2);
        ctx.font = font(S * (glyph === '∫' ? 1.15 : 0.95), SERIF, 400, glyph === '∫'); ctx.fillStyle = ink('brassD', 1);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(glyph, hd[0], hd[1] + 0.5); ctx.textBaseline = 'alphabetic';
      }
      token(routes[0], 0.9, 1.8, '∫'); token(routes[1], 4.0, 5.0, 'Σ');
      token(routes[2], 5.1, 6.0, '∫'); token(routes[3], 8.2, 9.2, 'Σ');
      // the work of each package, drawn in the space between the routes while it runs
      var ik = function (a, b) { return R ? 0 : clamp01((c - a) / 0.4) * clamp01((b - c) / 0.4); };
      var box = { x: F.x + (mb[0] - 0.24) * F.s, y: F.y + 0.33 * F.s, w: 0.48 * F.s, h: 0.34 * F.s };
      var k1 = ik(1.8, 4.2);                             // MBConicHulls: the residues of the poles in a cone, summed into a series
      if (k1 > 0) {
        ctx.save(); ctx.globalAlpha *= k1;
        var ox = box.x + box.w * 0.18, oy = box.y + box.h * 0.86, sp = Math.min(box.w * 0.13, box.h * 0.2);
        line(ctx, ox, oy, ox + sp * 5.3, oy, ink('green', 0.85), 1.2); line(ctx, ox, oy, ox + sp * 3.6, oy - sp * 3.6, ink('green', 0.85), 1.2);
        ctx.fillStyle = ink('brass', 0.1); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + sp * 5.3, oy); ctx.lineTo(ox + sp * 5.3, oy - sp * 3.6); ctx.lineTo(ox + sp * 3.6, oy - sp * 3.6); ctx.closePath(); ctx.fill();
        var n = 0;
        for (var a = 1; a <= 5; a++) for (var b2 = 0; b2 <= Math.min(a, 3); b2++) {
          var lit = clamp01((c - 2.0 - (a + b2) * 0.22) / 0.3);
          dot(ctx, ox + a * sp, oy - b2 * sp, 1.5 + 0.9 * lit, ink(lit > 0 ? 'brassD' : 'slate', 0.35 + 0.6 * lit)); n++;
        }
        var sk = clamp01((c - 3.4) / 0.4);
        if (sk > 0) { ctx.globalAlpha *= sk; drawMath(ctx, '\\sum_{m,n}', box.x + box.w * 0.9, box.y + box.h * 0.32, S * 1.1, ink('brassD', 1), 'center'); }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= k1; caps(ctx, 'RESIDUES IN A CONE', box.x + box.w / 2, box.y + box.h + 1.25 * S, ink('slate', 0.85), S * 0.6, 'center'); ctx.restore();
      }
      var k2 = ik(6.0, 8.3);                             // FeynGKZ: the Newton polytope of U + F, cut into three triangles
      if (k2 > 0) {
        ctx.save(); ctx.globalAlpha *= k2;
        var gs = Math.min(box.w * 0.3, box.h * 0.46), gx = box.x + box.w * 0.5 - gs, gy = box.y + box.h * 0.97;
        function G(q) { return [gx + q[0] * gs, gy - q[1] * gs]; }
        var hull = [[1, 0], [2, 0], [0, 2], [0, 1]].map(G), hk = clamp01((c - 6.3) / 0.6);
        ctx.strokeStyle = ink('green', 0.85 * hk); ctx.lineWidth = 1.2; ctx.beginPath();
        hull.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke();
        var tint = ['brass', 'pine', 'crimson'];
        TC_GKZ.tri.forEach(function (tr, i) {
          var tk = clamp01((c - 6.9 - i * 0.35) / 0.35); if (tk <= 0) return;
          var q = tr.map(function (j) { return G(TC_GKZ.pts[j]); });
          ctx.fillStyle = ink(tint[i], 0.2 * tk); ctx.strokeStyle = ink('green', 0.6 * tk); ctx.lineWidth = 0.9; ctx.beginPath();
          ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        TC_GKZ.pts.forEach(function (q) { var g2 = G(q); dot(ctx, g2[0], g2[1], 2, ink('green', 1)); });
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= k2 * clamp01((c - 7.3) / 0.4);
        caps(ctx, 'THREE TRIANGLES, THREE SERIES', box.x + box.w / 2, box.y + box.h + 1.25 * S, ink('slate', 0.85), S * 0.6, 'center');
        ctx.restore();
      }
      // HyperPrecision: the plane of F1, where its series converges, and the ray out to (-2,-3)
      var k3 = R ? 1 : clamp01((c - 9.3) / 0.4) * (1 - clamp01((c - 15.2) / 0.6));
      if (k3 > 0) {
        var pw = Math.min(0.42 * F.s, wu[2] * F.s), ph = 0.29 * F.s, px0 = F.x + hp[0] * F.s - pw / 2, py0 = F.y + 0.035 * F.s;
        function X(x) { return px0 + (x + 3.2) / 4.8 * pw; }
        function Y(y) { return py0 + (1.5 - y) / 5.1 * ph; }
        ctx.save(); ctx.globalAlpha *= k3;
        ctx.fillStyle = ink('pine', 0.12); ctx.fillRect(X(-1), Y(1), X(1) - X(-1), Y(-1) - Y(1));
        line(ctx, X(-3.2), Y(0), X(1.6), Y(0), ink('slate', 0.45), 0.8); line(ctx, X(0), Y(1.5), X(0), Y(-3.6), ink('slate', 0.45), 0.8);
        ctx.save(); ctx.setLineDash([2, 2]);
        line(ctx, X(1), Y(1.5), X(1), Y(-3.6), ink('crimson', 0.5), 0.8); line(ctx, X(-3.2), Y(1), X(1.6), Y(1), ink('crimson', 0.5), 0.8);
        ctx.restore();
        var rk = R ? 1 : easeInOut((c - 9.8) / 1.6), tx = -2 * rk, ty = -3 * rk;
        if (rk > 0) {
          line(ctx, X(0), Y(0), X(tx), Y(ty), ink('brassD', 0.95), 1.4);
          [0.3, 0.55, 0.8].forEach(function (f) { if (rk >= f) ring(ctx, X(-2 * f), Y(-3 * f), 2.1, ink('brassD', 0.9), 1); });
        }
        dot(ctx, X(-2), Y(-3), 2.4, ink('crimson', 0.9)); ring(ctx, X(-2), Y(-3), 4.4, ink('crimson', 0.5), 1);
        drawMath(ctx, '(−2,−3)', X(-2) + 0.55 * S, Y(-3) + 0.35 * S, S * 0.72, ink('slate', 0.95), 'left');
        ctx.restore();
      }
      // the stations, each lit while it works, with a ring when its token arrives
      e.hit = [];
      st.forEach(function (q, i) {
        var w = wu[i] * F.s, h = hu * F.s, x = F.x + q[0] * F.s - w / 2, y = F.y + q[1] * F.s - h / 2;
        var on = R || beat === i || e.hov === i, k = R ? 1 : ease((t - 0.3 - i * 0.2) / 0.6);
        e.hit.push([x, y, w, h]);
        ctx.save(); ctx.globalAlpha *= k;
        roundRect(ctx, x, y, w, h, h / 2); ctx.fillStyle = ink(on ? 'brass' : 'paper', on ? 0.17 : 0.92); ctx.fill();
        ctx.strokeStyle = ink(on ? 'brassD' : 'green', on ? 0.9 : 0.55); ctx.lineWidth = on ? 1.4 : 1; ctx.stroke();
        ctx.font = font(S * 0.8, SANS, 600); tracking(ctx, 1.1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = ink(on ? 'brassD' : 'green', 1); ctx.fillText(names[i], x + w / 2 + 0.55, y + h / 2 + 0.5);
        tracking(ctx, 0); ctx.textBaseline = 'alphabetic';
        ([[1.8], [6.0], [5.0, 9.2]][i]).forEach(function (a0) {
          var ra = c - a0;
          if (!R && ra > 0 && ra < 0.9) {
            ctx.strokeStyle = ink('brassD', 0.6 * (1 - ra / 0.9)); ctx.lineWidth = 1;
            roundRect(ctx, x - ra * 9, y - ra * 9, w + ra * 18, h + ra * 18, h / 2 + ra * 9); ctx.stroke();
          }
        });
        ctx.restore();
      });
      // the numbers, digit by digit, to the right of HyperPrecision
      var nk = R ? 1 : clamp01((c - 11.2) / 0.4) * (1 - clamp01((c - 15.2) / 0.6));
      if (nk > 0) {
        ctx.save(); ctx.globalAlpha *= nk;
        var colW = (2.2 - colL) * F.s, cx2 = F.x + colC * F.s, lines = [TC_DIGITS.slice(0, 13), TC_DIGITS.slice(14, 25), TC_DIGITS.slice(26)];
        var fs = S * 1.02; ctx.font = font(fs, SANS, 500);
        var lw = ctx.measureText(lines[0]).width; if (lw > colW * 0.98) { fs *= colW * 0.98 / lw; ctx.font = font(fs, SANS, 500); lw = ctx.measureText(lines[0]).width; }
        var y0 = F.y + 0.5 * F.s - 2.6 * fs;
        drawMath(ctx, 'F_1(1;1,1;2;−2,−3)', cx2, y0, Math.min(S * 0.9, fs * 0.95), ink('slate', 0.95), 'center');
        var shown = R ? TC_DIGITS.length : Math.floor(clamp01((c - 11.4) / 2.6) * TC_DIGITS.length), left = shown, lx = cx2 - lw / 2;
        ctx.textAlign = 'left';
        lines.forEach(function (ln, j) {
          var m = Math.max(0, Math.min(ln.length, left)); left -= ln.length + 1;
          if (m <= 0) return;
          ctx.fillStyle = ink(j === 0 ? 'brassD' : 'green', j === 0 ? 1 : 0.85);
          if (j === 0) { ctx.textAlign = 'right'; ctx.fillText('= ', lx, y0 + 1.55 * fs); ctx.textAlign = 'left'; }
          ctx.fillText(ln.slice(0, m), lx, y0 + (1.55 + j * 1.3) * fs);
        });
        var ek = R ? 1 : ease((c - 14.1) / 0.5);
        if (ek > 0) { ctx.globalAlpha *= ek; drawMath(ctx, '=\\rm{ln}\\,(4/3)', cx2, y0 + 5.6 * fs, Math.min(S, fs * 1.02), ink('brassD', 1), 'center');
          caps(ctx, '30 DIGITS', cx2, y0 + 7.1 * fs, ink('slate', 0.75), S * 0.6, 'center'); }
        ctx.restore();
      }
    },
    move: function (e, p) {                            // a package under the pointer names itself
      var h = -1;
      if (p) e.hit.forEach(function (q, i) { if (p.x >= q[0] - 4 && p.x <= q[0] + q[2] + 4 && p.y >= q[1] - 4 && p.y <= q[1] + q[3] + 4) h = i; });
      if (h === e.hov) return;
      e.hov = h; if (e.stage) e.stage.style.cursor = h >= 0 ? 'pointer' : '';
      if (h >= 0 && e.pk[h]) { e.caption(e.pk[h].n); e.hint(e.pk[h].tag); } else { e.beat = -2; }
    },
    click: function (e, x, y) {                        // a package opens its card, anywhere else goes on to the next step
      this.move(e, { x: x, y: y });
      if (e.hov >= 0 && e.pk[e.hov]) { window.location.hash = e.pk[e.hov].slug; return; }
      var c = (e.t - e.c0) % this.C, next = this.beats[0][0];
      for (var i = 0; i < this.beats.length; i++) if (c < this.beats[i][0] - 0.05) { next = this.beats[i][0]; break; }
      e.c0 = e.t - next + 0.01;
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
      sea.addColorStop(0, TC.sea0); sea.addColorStop(1, TC.sea1);
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
      ctx.fillStyle = TC.gland; ctx.strokeStyle = TC.gcoast; ctx.lineWidth = 0.8; ctx.lineJoin = 'round';   // land
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
      shade.addColorStop(0, TC.shadeHi); shade.addColorStop(0.7, 'rgba(255,255,255,0)'); shade.addColorStop(1, TC.shadeLo);
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
