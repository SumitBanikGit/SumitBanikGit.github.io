/* Page scenes for the inner pages.
   Each page header has its own animation, drawn on the header canvas inside the
   stage on the right, in the brass and green palette of the site:
     Research       triangulations of a point configuration
     Publications   a constellation of the papers, by year and field
     Talks          the talks around the world, one year at a time
     Funding        a toy di-photon spectrum with excesses near 95 and 152 GeV
     Teaching       equations written on a blackboard
     CV             tracks in a bubble chamber
     Contact        two-source interference
   The home page keeps its collider event display, which lives in the page itself. */
(function () {
  'use strict';
  var host = document.querySelector('.hero[data-scene]');
  if (!host || !window.requestAnimationFrame) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2;
  var RGB = { green: '28,53,47', pine: '46,92,78', brass: '168,137,79', brassD: '122,95,42', slate: '74,90,102',
              crimson: '110,44,52', cream: '238,231,214', paper: '251,248,241' };
  var SANS = 'Inter, system-ui, sans-serif', SERIF = '"Source Serif 4", Georgia, serif',
      DISPLAY = '"Cormorant Garamond", Georgia, serif';

  /* ---------- small helpers ---------- */
  function ink(c, a) { return 'rgba(' + RGB[c] + ',' + (a <= 0 ? 0 : a >= 1 ? 1 : Math.round(a * 1000) / 1000) + ')'; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp01(x); return 1 - (1 - x) * (1 - x) * (1 - x); }
  function easeInOut(x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(2 - 2 * x, 3) / 2; }
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function sign() { return Math.random() < 0.5 ? -1 : 1; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(TAU * r()); }
  function font(size, family, weight, italic) {
    return (italic ? 'italic ' : '') + (weight || 400) + ' ' + (Math.round(size * 100) / 100) + 'px ' + family;
  }
  function tracking(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
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
  function ellipseFade(ctx, cx, cy, rx, ry, inner) {  // keep the middle, fade out towards an ellipse
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.translate(cx, cy); ctx.scale(rx, ry);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, '#000'); g.addColorStop(inner, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-1000, -1000, 2000, 2000);
    ctx.restore();
  }

  /* ---------- the engine: sizing, clock, pointer, captions ---------- */
  function run(scene) {
    var cv = host.querySelector('.field'), stage = host.querySelector('.hero-stage');
    if (!cv || !cv.getContext || !stage) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var meta = stage.querySelector('.scene-meta'), cap = stage.querySelector('.scene-cap');
    var touch = window.matchMedia('(hover: none)').matches, hint = stage.querySelector('.scene-hint');
    var env = { ctx: ctx, dpr: dpr, stage: stage, data: readData(), t: 0, dt: 0, active: false, reduce: reduce, touch: touch };
    if (touch && hint && scene.touchHint) hint.textContent = scene.touchHint;
    var raf = null, last = 0, visible = true, capHTML = cap ? cap.innerHTML : '', capTimer = null;
    env.defaultCaption = capHTML;
    env.caption = function (html) {
      if (!cap) return;
      html = html || env.defaultCaption;
      if (html === capHTML) return;
      capHTML = html;
      if (reduce) { cap.innerHTML = html; return; }
      cap.classList.add('swap');
      clearTimeout(capTimer);
      capTimer = setTimeout(function () { cap.innerHTML = capHTML; cap.classList.remove('swap'); }, 190);
    };
    function size() {
      var r = host.getBoundingClientRect(), s = stage.getBoundingClientRect();
      env.W = r.width; env.H = r.height;
      cv.width = Math.round(env.W * dpr); cv.height = Math.round(env.H * dpr);
      var gap = meta ? meta.offsetHeight + 16 : 0;
      env.x = s.left - r.left; env.y = s.top - r.top; env.w = s.width; env.h = s.height - gap;
      env.active = env.w > 60 && env.h > 60;
      if (env.active && scene.layout) scene.layout(env);
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, env.W, env.H);
      ctx.save(); scene.frame(env, env.t); ctx.restore();
      if (scene.soft) ellipseFade(ctx, env.x + env.w / 2, env.y + env.h / 2, env.w / 2, env.h / 2, scene.soft);
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
    function local(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    function inside(p) { return p.x >= env.x && p.x <= env.x + env.w && p.y >= env.y && p.y <= env.y + env.h; }

    if (scene.init) scene.init(env);
    if (reduce) env.t = scene.still || 0;
    size();
    start();
    if (scene.click) stage.addEventListener('click', function (ev) {
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
    window.addEventListener('resize', function () { size(); start(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(host);
    }
    if (document.fonts && document.fonts.load) {       // re-lay out once the web fonts have arrived
      var sample = 'Γγλμνψεπ∂∫∞ 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      Promise.all(['500 10px Inter', '600 10px Inter', '400 24px "Source Serif 4"', 'italic 400 24px "Source Serif 4"',
                   'italic 600 14px "Cormorant Garamond"'].map(function (f) { return document.fonts.load(f, sample); }))
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
     Research: triangulations of a point configuration
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

  /* =====================================================================
     Publications: a constellation of the papers, by year and by field
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

  /* =====================================================================
     Talks: the talks around the world, one year at a time
     ===================================================================== */
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
     Funding: a toy di-photon spectrum with excesses near 95 and 152 GeV
     ===================================================================== */
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

  /* =====================================================================
     Teaching: equations written on a blackboard
     A tiny typesetter reads a TeX-like line: ^ and _ for scripts,
     \frac{}{}, \int, \rm{} and \, for a thin space.
     ===================================================================== */
  var EQUATIONS = [
    ['The Dirac equation', ['(iγ^μ\\,∂_μ−m)\\,ψ=0']],
    ['The Feynman propagator', ['D_F(p)=\\frac{i}{p^2−m^2+iε}']],
    ['Euler’s Gamma function', ['Γ(z)=\\int_0^∞\\,t^{z−1}\\,e^{−t}\\,\\rm{d}t']],
    ['A Mellin-Barnes representation', ['\\frac{1}{(X+Y)^λ}=\\frac{1}{2πi}\\int_{−i∞}^{+i∞}\\rm{d}z\\,\\frac{Γ(−z)\\,Γ(λ+z)}{Γ(λ)}\\,\\frac{Y^z}{X^{λ+z}}']],
    ['Unitarity of the CKM matrix', ['V_{ud}V^∗_{ub}+V_{cd}V^∗_{cb}+V_{td}V^∗_{tb}=0']],
    ['Maxwell’s equations', ['∂_μF^{μν}=J^ν', '∂_{[λ}F_{μν]}=0']]
  ];

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
        var m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i));
        i += m[0].length;
        if (m[1] === 'frac') { var n = arg(); out.push({ k: 'frac', n: n, d: arg() }); }
        else if (m[1] === 'int') out.push({ k: 'big', s: '∫' });
        else if (m[1] === ',') out.push({ k: 'sp', w: 0.18 });
        else if (m[1] === 'rm') out.push({ k: 'grp', b: arg(), rm: true });
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
  function typeset(ctx, nodes, S, script, rm) {      // returns glyphs and rules in writing order
    var x = 0, asc = 0.72 * S, desc = 0.24 * S, prims = [], prev = 'start';
    function place(box, dx, dy) {
      box.prims.forEach(function (p) { p.x += dx; p.y += dy; prims.push(p); });
      asc = Math.max(asc, box.asc - dy); desc = Math.max(desc, box.desc + dy);
    }
    for (var n = 0; n < nodes.length; n++) {
      var nd = nodes[n];
      if (nd.k === 'sp') { x += nd.w * S; continue; }
      if (nd.k === 'g' || nd.k === 'big') {
        var big = nd.k === 'big', sz = big ? S * 1.85 : S, it = !big && !rm && ITALIC.test(nd.s);
        var op = !script && !big && '=+−'.indexOf(nd.s) >= 0 && prev === 'x';
        var pad = nd.s === '=' ? 0.3 * S : 0.22 * S;
        if (op) x += pad;
        var f = font(sz, SERIF, 400, it), m = measure(ctx, nd.s, f, sz), y = 0;
        if (big) y = -0.27 * S + (m.a - m.d) / 2;     // centre the integral sign on the maths axis
        prims.push({ t: 'txt', s: nd.s, f: f, x: x, y: y, w: m.w, a: m.a, d: m.d, big: big });
        x += m.w + (it ? 0.04 * S : 0);
        if (op) x += pad;
        asc = Math.max(asc, m.a - y); desc = Math.max(desc, m.d + y);
        prev = op ? 'op' : (nd.s === '(' || nd.s === '[') ? 'open' : 'x';
        continue;
      }
      if (nd.k === 'grp') {
        var g = typeset(ctx, nd.b, S, script, nd.rm || rm);
        place(g, x, 0); x += g.w; prev = 'x';
        continue;
      }
      if (nd.k === 'sup' || nd.k === 'sub') {
        var sup = nd.k === 'sup' ? nd.b : null, sub = nd.k === 'sub' ? nd.b : null, nx = nodes[n + 1];
        if (nx && (nx.k === 'sup' || nx.k === 'sub') && nx.k !== nd.k) { if (nx.k === 'sup') sup = nx.b; else sub = nx.b; n++; }
        var base = prims[prims.length - 1], onBig = base && base.big && base.x + base.w >= x - 0.5;
        var up = sup && typeset(ctx, sup, S * 0.7, true, rm), dn = sub && typeset(ctx, sub, S * 0.7, true, rm);
        var right = x;
        if (up) {
          var upY = onBig ? base.y - base.a + up.asc * 0.9 : -0.42 * S;
          place(up, x, upY); right = Math.max(right, x + up.w);
        }
        if (dn) {
          var dnX = onBig ? x - 0.36 * S : x, dnY = onBig ? base.y + base.d : 0.2 * S + (up ? 0.06 * S : 0);
          place(dn, dnX, dnY); right = Math.max(right, dnX + dn.w);
        }
        x = right + 0.05 * S; prev = 'x';
        continue;
      }
      if (nd.k === 'frac') {
        var fs = S * 0.92, nu = typeset(ctx, nd.n, fs, script, rm), de = typeset(ctx, nd.d, fs, script, rm);
        var fw = Math.max(nu.w, de.w) + 0.35 * S, axis = -0.27 * S, gap = 0.16 * S;
        x += 0.08 * S;
        place(nu, x + (fw - nu.w) / 2, axis - gap - nu.desc);
        prims.push({ t: 'rule', x: x, y: axis - 0.03 * S, w: fw, h: Math.max(1.1, 0.055 * S) });
        place(de, x + (fw - de.w) / 2, axis + gap + de.asc);
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
  function chalk(e, index) {                          // render one equation in chalk, with its writing schedule
    var eq = EQUATIONS[index], bw = e.bw, bh = e.bh, L = layer(bw, bh, e.dpr), c = L.ctx;
    var S = Math.min(36, bh * 0.19), lines, wmax, htot, gap;
    for (var pass = 0; pass < 3; pass++) {             // shrink until it fits the board
      lines = eq[1].map(function (src) { var b = typeset(c, parseTeX(src), S, false, false); b.ext = extent(b.prims); return b; });
      gap = 0.55 * S; wmax = 0; htot = -gap;
      lines.forEach(function (ln) { wmax = Math.max(wmax, ln.w); htot += ln.ext[1] - ln.ext[0] + gap; });
      var fit = Math.min((bw - 64) / wmax, (bh - 56) / htot, 1);
      if (fit > 0.995) break;
      S *= fit;
    }
    var y = (bh - htot) / 2, rects = [], T = 0.35;
    lines.forEach(function (ln) {
      var ox = (bw - wmax) / 2, oy = y - ln.ext[0];          // lines share a left edge
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
    // a hand-drawn box around the result, closing with a small overshoot
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    rects.forEach(function (q) { x0 = Math.min(x0, q.r[0]); y0 = Math.min(y0, q.r[1]); x1 = Math.max(x1, q.r[0] + q.r[2]); y1 = Math.max(y1, q.r[1] + q.r[3]); });
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
      e.caption(EQUATIONS[e.idx][0]);
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
     CV: tracks in a bubble chamber
     Beam particles enter from the left. One interacts and throws out
     charged tracks that curl in the magnetic field, often with a neutral
     that decays into a V, a photon that converts into a spiralling
     electron and positron, and delta rays kicked off the beam tracks.
     ===================================================================== */
  function trail(x, y, dir, R, q, len, loss, dens, size) {
    var pts = [], s = 0, step = 2.5;
    while (s < len) {
      var r = R * Math.exp(-s * loss);                 // losing energy, the track curls tighter
      if (r < 3) break;
      dir += q * step / r; x += Math.cos(dir) * step; y += Math.sin(dir) * step; s += step;
      pts.push([x + (Math.random() - 0.5) * 0.7, y + (Math.random() - 0.5) * 0.7,
                Math.random() < dens ? size * (0.55 + Math.random() * 0.6) : 0]);
    }
    return pts;
  }
  function picture(e, t0, vx, vy) {
    var V = 340, end = e.reduce ? 1e9 : t0 + 5.8, X0 = e.x - 12, list = [];
    function add(pts, delay, col, alpha) { list.push({ pts: pts, t0: t0 + delay, end: end, col: col, alpha: alpha }); }
    var ix = vx !== undefined ? vx : e.x + e.w * rand(0.3, 0.6), iy = vy !== undefined ? vy : e.y + e.h * rand(0.28, 0.72);
    var nb = 2 + Math.floor(Math.random() * 3);
    for (var b = 0; b < nb; b++) {                     // beam particles passing straight through
      var by = e.y + e.h * rand(0.1, 0.9);
      if (Math.abs(by - iy) < 14) continue;
      var d0 = rand(0, 0.25), bt = trail(X0, by, rand(-0.015, 0.015), 5000, 1, e.w + 24, 0, 0.55, 0.95);
      add(bt, d0, 'brassD', 0.72);
      if (Math.random() < 0.55 && bt.length > 40) {    // a delta ray
        var kk = Math.floor(rand(0.2, 0.8) * bt.length), p = bt[kk];
        add(trail(p[0], p[1], rand(0, TAU), rand(9, 16), sign(), 70, 0.03, 0.8, 0.75), d0 + kk * 2.5 / V, 'crimson', 0.6);
      }
    }
    add(trail(X0, iy, 0, 1e5, 1, ix - X0, 0, 0.55, 0.95), 0, 'brassD', 0.8);
    var tv = (ix - X0) / V, n = 3 + Math.floor(Math.random() * 4);
    for (var k = 0; k < n; k++) {                      // the products of the interaction
      var heavy = k === 0 && Math.random() < 0.6;
      var dir = heavy ? rand(-1.1, 1.1) : rand(-0.85, 0.85) + (Math.random() < 0.12 ? Math.PI : 0);
      add(heavy ? trail(ix, iy, dir, rand(160, 300), sign(), rand(40, 80), 0, 0.95, 1.45)
                : trail(ix, iy, dir, rand(70, 520), sign(), rand(140, 360), rand(0.0015, 0.006), 0.62, 1),
          tv, k % 2 ? 'green' : 'brassD', heavy ? 0.92 : 0.82);
    }
    if (Math.random() < 0.55) {                        // a neutral decays into a V
      var vd = rand(-0.5, 0.5), vl = rand(45, 95), dx = ix + Math.cos(vd) * vl, dy = iy + Math.sin(vd) * vl, o = rand(0.18, 0.35);
      add(trail(dx, dy, vd - o, rand(120, 260), 1, rand(120, 220), 0.002, 0.62, 1), tv + vl / V, 'pine', 0.85);
      add(trail(dx, dy, vd + o, rand(120, 260), -1, rand(120, 220), 0.002, 0.62, 1), tv + vl / V, 'pine', 0.85);
    }
    if (Math.random() < 0.5) {                         // a photon converts into an electron and a positron
      var gd = rand(-0.7, 0.7), gl = rand(60, 120), gx = ix + Math.cos(gd) * gl, gy = iy + Math.sin(gd) * gl;
      add(trail(gx, gy, gd, rand(35, 70), 1, 380, 0.008, 0.7, 0.85), tv + gl / V, 'crimson', 0.7);
      add(trail(gx, gy, gd, rand(35, 70), -1, 380, 0.008, 0.7, 0.85), tv + gl / V, 'crimson', 0.7);
    }
    e.tracks = e.tracks.concat(list);
  }
  SCENES.bubbles = {
    touchHint: 'Tap to make a collision',
    soft: 0.6,
    init: function (e) { e.tracks = []; e.next = 0.4; },
    frame: function (e, t) {
      var ctx = e.ctx;
      ctx.strokeStyle = ink('slate', 0.4); ctx.lineWidth = 1;          // fiducial marks on the chamber window
      for (var i = 1; i <= 3; i++) for (var j = 1; j <= 2; j++) {
        var fx = e.x + e.w * i / 4, fy = e.y + e.h * j / 3;
        ctx.beginPath(); ctx.moveTo(fx - 4, fy); ctx.lineTo(fx + 4, fy); ctx.moveTo(fx, fy - 4); ctx.lineTo(fx, fy + 4); ctx.stroke();
      }
      if (e.reduce) { if (!e.tracks.length) { picture(e, -20); picture(e, -20); } }
      else if (t >= e.next) { picture(e, t); e.next = t + 3.1; }
      e.tracks = e.tracks.filter(function (tr) { return t < tr.end; });
      e.tracks.forEach(function (tr) {
        var age = t - tr.t0;
        if (age <= 0) return;
        var n = Math.min(tr.pts.length, Math.floor(age * 136)), fade = clamp01((tr.end - t) / 1.8);
        ctx.fillStyle = ink(tr.col, tr.alpha * fade);
        ctx.beginPath();
        for (var k = 0; k < n; k++) { var p = tr.pts[k]; if (p[2]) { ctx.moveTo(p[0] + p[2], p[1]); ctx.arc(p[0], p[1], p[2], 0, TAU); } }
        ctx.fill();
      });
    },
    click: function (e, x, y) { picture(e, e.t, x, y); e.next = e.t + 3.4; }
  };

  /* =====================================================================
     Contact: two-source interference
     ===================================================================== */
  SCENES.waves = {
    touchHint: 'Tap to move a source',
    soft: 0.55,
    still: 2.5,
    init: function (e) { e.s2 = null; e.aim = null; },
    frame: function (e, t) {
      var ctx = e.ctx, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      var s1 = [cx - e.w * 0.19 + Math.cos(t * 0.31) * 6, cy + Math.sin(t * 0.23) * 8];
      var home = [cx + e.w * 0.19 - Math.cos(t * 0.29) * 6, cy - Math.sin(t * 0.21) * 8], aim = e.aim || home;
      if (!e.s2) e.s2 = home.slice();
      var f = e.reduce ? 1 : 1 - Math.pow(0.02, e.dt);   // the second source follows the pointer smoothly
      e.s2[0] += (aim[0] - e.s2[0]) * f; e.s2[1] += (aim[1] - e.s2[1]) * f;
      var s2 = e.s2, step = 7, kw = TAU / 34, w = 3.2, buckets = {};
      for (var y = e.y + step / 2; y < e.y + e.h; y += step) {
        for (var x = e.x + step / 2; x < e.x + e.w; x += step) {
          var r1 = Math.hypot(x - s1[0], y - s1[1]), r2 = Math.hypot(x - s2[0], y - s2[1]);
          var f1 = 1 / Math.sqrt(1 + r1 / 80), f2 = 1 / Math.sqrt(1 + r2 / 80);
          var re = f1 * Math.cos(kw * r1) + f2 * Math.cos(kw * r2), im = f1 * Math.sin(kw * r1) + f2 * Math.sin(kw * r2);
          var E = Math.min(1, 0.5 * Math.sqrt(re * re + im * im)), ph = Math.cos(Math.atan2(im, re) - w * t);
          var lvl = Math.round(E * (0.62 + 0.38 * ph) * 12);
          var key = (ph > 0 ? 'b' : 'p') + lvl;
          (buckets[key] = buckets[key] || []).push(x, y);
        }
      }
      Object.keys(buckets).forEach(function (key) {    // one path per shade keeps this cheap
        var I = +key.slice(1) / 12, pts = buckets[key], r = 0.4 + 2.5 * I;
        ctx.fillStyle = key[0] === 'b' ? ink('brassD', 0.18 + 0.72 * I) : ink('pine', 0.18 + 0.72 * I);
        ctx.beginPath();
        for (var i = 0; i < pts.length; i += 2) { ctx.moveTo(pts[i] + r, pts[i + 1]); ctx.arc(pts[i], pts[i + 1], r, 0, TAU); }
        ctx.fill();
      });
      [s1, s2].forEach(function (s) {
        ctx.fillStyle = ink('paper', 0.95); ctx.beginPath(); ctx.arc(s[0], s[1], 4.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = ink('green', 0.85); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = ink('green', 0.95); ctx.beginPath(); ctx.arc(s[0], s[1], 1.7, 0, TAU); ctx.fill();
      });
    },
    move: function (e, p) { if (!e.touch) e.aim = p ? [p.x, p.y] : null; },
    click: function (e, x, y) { if (e.touch) e.aim = [x, y]; }
  };

  var scene = SCENES[host.getAttribute('data-scene')];
  if (scene) run(scene);
})();
