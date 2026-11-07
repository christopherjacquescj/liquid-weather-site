/* Liquid Weather — pluie, neige et éclairs.
   Portage fidèle de l'appli (StormOverlay.swift et SnowfallOverlay.swift) : mêmes formules, mêmes réglages.
   - pluie : traînées sans mémoire (la place de chaque goutte vient de son numéro et du temps), en profondeur,
     gouttes proches floues, reflets, rideaux de vent, éclairées par l'éclair ;
   - éclair : canal fractal (déplacement du point milieu) avec branches, traceur qui descend par paliers,
     arc en retour éblouissant, 0 à 4 arcs suivants (le scintillement), parfois un courant continu ;
   - neige : flocons semés une fois pour toutes, plus ou moins loin, qui se balancent dans le vent.
   Un canevas 2D posé sur le ciel WebGL ; rien n'est chargé depuis l'extérieur. */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  var mixf = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* ---------- nombres au hasard « sans mémoire » (même mélange d'entiers que l'appli) ---------- */
  function hash(v) {
    var x = v >>> 0;
    x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7feb352d) >>> 0;
    x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846ca68b) >>> 0;
    x = (x ^ (x >>> 16)) >>> 0;
    return x / 4294967295;
  }
  function cellHash(x, y, seed) { return hash((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ seed) >>> 0); }
  function valueNoise(x, y, seed) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = cellHash(ix, iy, seed), b = cellHash(ix + 1, iy, seed), c = cellHash(ix, iy + 1, seed), d = cellHash(ix + 1, iy + 1, seed);
    return mixf(mixf(a, b, fx), mixf(c, d, fx), fy);
  }
  /* des nappes de pluie plus forte qui dérivent avec le vent : l'averse n'est jamais uniforme */
  function rainCurtain(x, y, time, slope) {
    var qx = x - y * slope - time * 0.08, qy = y * 0.35 - time * 0.25;
    var n = valueNoise(qx * 1.6, qy * 1.6, 17) * 0.65 + valueNoise(qx * 3.7 + 11, qy * 3.7 + 11, 29) * 0.35;
    return mixf(0.3, 1.6, n);
  }
  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- l'éclair : géométrie ---------- */
  function gaussian() {
    var u1 = Math.max(Math.random(), 2.2e-16), u2 = Math.random();
    return clamp(Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2), -2.5, 2.5);
  }
  function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function unit(x, y) { var l = Math.hypot(x, y); return l > 1e-6 ? [x / l, y / l] : [0, 1]; }
  function turn(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
  function pathLength(pts) { var l = 0, i; for (i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]); return l; }

  /* déplacement récursif du point milieu (dimension fractale ≈ 1,3) */
  function fractalPath(start, end, levels, roughness) {
    var pts = [start, end], disp = roughness * dist(start, end), l, i;
    for (l = 0; l < levels; l++) {
      var next = [];
      for (i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i], p1 = pts[i + 1];
        var n = unit(-(p1[1] - p0[1]), p1[0] - p0[0]);
        var g = gaussian() * disp;
        next.push(p0);
        next.push([(p0[0] + p1[0]) / 2 + n[0] * g, (p0[1] + p1[1]) / 2 + n[1] * g]);
      }
      next.push(end);
      pts = next; disp *= 0.55;
    }
    return pts;
  }

  function polyline(points, startArrival, intensity, width, isMain) {
    var cum = [0], l = 0, i;
    for (i = 1; i < points.length; i++) { l += dist(points[i - 1], points[i]); cum.push(l); }
    return { points: points, cum: cum, len: Math.max(l, 0.001), startArrival: startArrival, intensity: intensity, width: width, isMain: isMain };
  }

  /* les branches partent surtout près du nuage, comme sur un vrai traceur */
  function spawnBranches(parent, startArrival, mainLength, intensity, width, depth, branchiness, lines) {
    if (depth >= 3 || parent.length <= 12) return;
    var baseChance = (depth === 0 ? 0.06 : 0.09) * branchiness;
    var lastIndex = Math.min(Math.floor(parent.length * 0.85), parent.length - 5);
    if (lastIndex <= 4) return;
    var traveled = 0, index;
    for (index = 1; index < lastIndex; index++) {
      traveled += dist(parent[index], parent[index - 1]);
      if (index < 4) continue;
      var along = index / parent.length;
      if (Math.random() >= baseChance * (1.2 - along)) continue;
      var from = parent[index];
      var d = unit(parent[index + 4][0] - from[0], parent[index + 4][1] - from[1]);
      d = turn(d, rnd(0.3, 0.9) * (Math.random() < 0.5 ? 1 : -1));
      if (d[1] < 0.15) d = unit(d[0], 0.15);                       // on continue de descendre
      var reach = rnd(0.05, 0.25) * (depth === 0 ? 1 : 0.6);
      var branch = fractalPath(from, [from[0] + d[0] * reach, from[1] + d[1] * reach], depth === 0 ? 6 : 5, rnd(0.18, 0.28));
      var arrival = startArrival + traveled / mainLength;
      var bi = intensity * rnd(0.3, 0.6);
      lines.push(polyline(branch, arrival, bi, width * 0.6, false));
      spawnBranches(branch, arrival, mainLength, bi, width * 0.6, depth + 1, branchiness, lines);
    }
  }

  /* points normalisés : hauteur = 1, largeur = rapport l/h, y vers le bas */
  function makeBolt(aspect) {
    var start = [aspect * rnd(0.25, 0.75), -0.04];
    var end = [start[0] + aspect * rnd(-0.3, 0.3), 1.03];
    var main = fractalPath(start, end, 8, rnd(0.16, 0.24));
    var lines = [polyline(main, 0, 1, 1.3, true)];
    spawnBranches(main, 0, Math.max(pathLength(main), 0.001), 1, 1.3, 0, rnd(0.5, 1.4), lines);
    return { lines: lines, origin: [start[0] / Math.max(aspect, 0.01), 0] };
  }

  var DARK = { leaderFront: 0, leaderGlow: 0, main: 0, branch: 0 };

  /* ---------- l'éclair : le temps (traceur, arc en retour, arcs suivants, courant continu) ---------- */
  function Engine() { this.strike = null; this.nextStrike = null; this.lines = []; this.origin = [0.5, 0]; }

  Engine.prototype.make = function (time, aspect) {
    var leader = rnd(0.12, 0.22);
    var strokes = [{ start: leader, peak: rnd(0.9, 1.2), decay: rnd(0.05, 0.08), bf: 1 }];
    var cursor = leader, n = Math.floor(Math.random() * 5), i;
    for (i = 0; i < n; i++) {
      cursor += rnd(0.05, 0.14);
      strokes.push({ start: cursor, peak: rnd(0.45, 0.95), decay: rnd(0.03, 0.06), bf: rnd(0.05, 0.2) });
    }
    if (Math.random() < 0.5) strokes.push({ start: cursor + 0.02, peak: rnd(0.2, 0.3), decay: rnd(0.12, 0.2), bf: 0.05 });
    var b = makeBolt(aspect);
    return { lines: b.lines, origin: b.origin, begin: time, leaderDuration: leader, strokes: strokes, end: time + cursor + 1.2 };
  };

  Engine.prototype.update = function (time, aspect) {
    if (this.nextStrike == null) this.nextStrike = time + rnd(0.6, 2.0);
    if (this.strike && time > this.strike.end) {
      this.strike = null;
      /* parfois deux coups de suite */
      this.nextStrike = time + (Math.random() < 0.25 ? rnd(0.2, 0.7) : rnd(2.5, 6.0));
    }
    if (!this.strike && time >= this.nextStrike) {
      this.strike = this.make(time, aspect);
      this.lines = this.strike.lines; this.origin = this.strike.origin;
    }
    var st = this.strike;
    if (!st) return DARK;
    var t = time - st.begin, f = { leaderFront: 0, leaderGlow: 0, main: 0, branch: 0 }, i;
    if (t < st.leaderDuration) { f.leaderFront = t / st.leaderDuration; f.leaderGlow = rnd(0.7, 1.0); }
    else f.leaderFront = 100;
    for (i = 0; i < st.strokes.length; i++) {
      var s = st.strokes[i];
      if (t < s.start) continue;
      var dt = t - s.start;
      /* chute rapide de l'arc, plus une lueur lente du canal encore chaud */
      var energy = s.peak * (0.85 * Math.exp(-dt / s.decay) + 0.15 * Math.exp(-dt / (s.decay * 6)));
      f.main += energy; f.branch += energy * s.bf;
    }
    var flicker = rnd(0.88, 1.0);
    f.main *= flicker; f.branch *= flicker;
    return f;
  };

  /* ---------- couleurs ---------- */
  var CORE = '235,242,255', GLOW = '115,128,255', RAIN = '191,209,242';
  var rgba = function (c, a) { return 'rgba(' + c + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; };

  /* les flocons : semés une fois, pour que la neige ne se remélange jamais */
  var MAX_FLAKES = 1700;
  var FLAKES = (function () {
    var r = seeded(0x5107FA11), out = [], i;
    for (i = 0; i < MAX_FLAKES; i++) {
      var depth = 0.12 + 0.88 * Math.pow(r(), 2);
      out.push({
        x: r(), y: r(), depth: depth, size: 0.72 + 0.56 * r(), phase: r() * TAU, sway: 0.5 + 1.1 * r(),
        fall: (0.055 + 0.30 * depth) * (0.82 + 0.36 * r())
      });
    }
    return out;
  })();

  function flakeSprite() {
    var c = root.document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d');
    x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(32, 32, 24, 0, TAU); x.fill();   // halo
    x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(32, 32, 16, 0, TAU); x.fill();   // cœur du cristal
    return c;
  }

  /* mount(canvas, { reduced, onFlash(intensité, x) }) → { set, pause, play, strike, preview } ou null */
  function mount(canvas, opts) {
    opts = opts || {};
    var reduced = !!opts.reduced;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return null;
    var small = Math.min(root.innerWidth || 1024, root.innerHeight || 768) < 700 || /Android|iPhone|iPad|Mobi/i.test(root.navigator.userAgent || '');
    var sprite = flakeSprite();
    var engine = new Engine();
    var cur = { rain: 0, snow: 0, dark: 0 }, target = { rain: 0, snow: 0, dark: 0 };
    var W = 0, H = 0, dpr = 1, clock = reduced ? 14.2 : 3.1, last = 0, running = false, hidden = false;
    var paused = reduced, settle = 0, lastFlash = 0, frozen = null;
    var quality = 1, slow = 0, frames = 0, prevNow = 0;      // qualité adaptative : moins de gouttes si l'appareil peine
    var stepMs = 1000 / (small ? 30 : 60);
    var tails = [], heads = [], li, wi;
    for (li = 0; li < 6; li++) { tails.push([[], [], []]); heads.push([[], [], []]); }
    var WIDTHS = [0.7, 1.3, 3.2];

    function fit() {
      var w = canvas.clientWidth || root.innerWidth, h = canvas.clientHeight || root.innerHeight;
      var d = Math.min(root.devicePixelRatio || 1, small ? 1.5 : 2);
      var cw = Math.max(2, Math.round(w * d)), ch = Math.max(2, Math.round(h * d));
      if (cw !== canvas.width || ch !== canvas.height) { canvas.width = cw; canvas.height = ch; }
      W = w; H = h; dpr = d;
    }

    /* ----- pluie ----- */
    function drawRain(frame, density, t) {
      var h = H, aspect = W / H;
      var count = Math.floor(density * quality * Math.min(W * H / 240, small ? 1600 : 4200));
      var gust = 0.04 * Math.sin(t * 0.23) + 0.025 * Math.sin(t * 0.61 + 1.3);
      var windSlope = 0.08 + gust;
      var flash = frame.main + frame.leaderGlow * 0.05;
      var flashX = engine.origin[0] * aspect;
      var i, l, w;
      for (l = 0; l < 6; l++) for (w = 0; w < 3; w++) { tails[l][w].length = 0; heads[l][w].length = 0; }
      var margin = 0.35, range = aspect + 2 * margin;

      for (i = 0; i < count; i++) {
        var seed = (i * 8) >>> 0;
        var z = hash(seed); z *= z;                                                  // la plupart des gouttes sont loin
        var speed = mixf(0.7, 3.0, z) * mixf(0.9, 1.1, hash(seed + 1));              // plus près = plus vite
        var streak = speed * 0.025;
        var slope = windSlope * mixf(0.85, 1.15, hash(seed + 2));
        var span = 1 + streak;
        var headY = ((hash(seed + 3) + t * speed / span) % 1) * span;
        var headX = hash(seed + 4) * range + headY * slope;
        headX = (headX / range - Math.floor(headX / range)) * range - margin;

        /* les gouttes proches sont floues : plus larges, plus pâles (l'énergie se conserve) */
        var defocus = Math.pow(clamp((z - 0.75) / 0.25, 0, 1), 2) * 7;
        var energy = 1 / (1 + defocus);
        var width = mixf(0.3, 1.2, z) * (1 + defocus);
        if (width < 0.8) energy *= width / 0.8;

        var curtain = rainCurtain(headX, headY, t, windSlope);
        var glint = hash(seed + 6) < 0.04 ? mixf(2.0, 3.5, hash(seed + 7)) : 1;
        var dx = headX - flashX;
        var light = 0.45 + flash * (0.6 + 0.6 * Math.exp(-dx * dx * 1.5));
        var brightness = mixf(0.15, 1.0, z) * mixf(0.5, 1.0, hash(seed + 5)) * energy * curtain * glint * light;

        var level = Math.min(Math.floor(brightness * 4), 5);
        if (!(level > 0 || brightness > 0.08)) continue;
        var wb = width < 1 ? 0 : (width < 2.5 ? 1 : 2);
        var nrm = 1 / Math.sqrt(1 + slope * slope);
        var hx = headX * h, hy = headY * h;
        var tx = hx - slope * nrm * streak * h, ty = hy - nrm * streak * h;
        var tl = tails[level][wb], hd = heads[level][wb];
        tl.push(tx, ty, hx, hy);
        hd.push((hx + tx) / 2, (hy + ty) / 2, hx, hy);
      }

      ctx.lineCap = 'round';
      var ws = clamp(H / 800, 1, 1.5);
      for (l = 0; l < 6; l++) {
        var alpha = Math.min(0.14 + l * 0.13, 0.85);
        for (w = 0; w < 3; w++) {
          var a = (w === 2 ? alpha * 0.4 : alpha) * 0.5 * 2.1;   // 2,1 : le ciel du site est bien plus clair que le fond sombre de la carte de l'appli
          ctx.lineWidth = WIDTHS[w] * ws;
          ctx.strokeStyle = rgba(RAIN, a);
          strokeSegments(tails[l][w]); strokeSegments(heads[l][w]);
        }
      }
    }
    function strokeSegments(s) {
      if (!s.length) return;
      ctx.beginPath();
      for (var k = 0; k < s.length; k += 4) { ctx.moveTo(s[k], s[k + 1]); ctx.lineTo(s[k + 2], s[k + 3]); }
      ctx.stroke();
    }

    /* ----- éclair ----- */
    function drawFlash(frame) {
      if (frame.main <= 0.01) return;
      var e = Math.min(frame.main, 2), cx = engine.origin[0] * W;
      var g = ctx.createRadialGradient(cx, 0, 0, cx, 0, Math.max(W, H) * 0.9);
      g.addColorStop(0, rgba(GLOW, 0.32 * e)); g.addColorStop(1, rgba(GLOW, 0.06 * e));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    /* trace la ligne jusqu'à la fraction donnée de sa longueur ; renvoie la pointe */
    function trace(line, scale, fraction) {
      var pts = line.points, n = pts.length, i;
      ctx.beginPath(); ctx.moveTo(pts[0][0] * scale, pts[0][1] * scale);
      if (fraction >= 1) { for (i = 1; i < n; i++) ctx.lineTo(pts[i][0] * scale, pts[i][1] * scale); return null; }
      var goal = Math.max(fraction, 0) * line.len, tip = [pts[0][0] * scale, pts[0][1] * scale];
      for (i = 1; i < n; i++) {
        if (line.cum[i] <= goal) { tip = [pts[i][0] * scale, pts[i][1] * scale]; ctx.lineTo(tip[0], tip[1]); }
        else {
          var k = (goal - line.cum[i - 1]) / Math.max(line.cum[i] - line.cum[i - 1], 1e-9);
          tip = [(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k) * scale, (pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k) * scale];
          ctx.lineTo(tip[0], tip[1]); break;
        }
      }
      return tip;
    }

    function drawBolt(frame) {
      var lit = frame.leaderGlow > 0.001 || frame.main > 0.001 || frame.branch > 0.001;
      if (!lit || !engine.lines.length) return;
      var scale = H, ws = clamp(H / 700, 1, 1.7), leading = frame.leaderFront < 1, main = engine.lines[0], i;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (i = 0; i < engine.lines.length; i++) {
        var line = engine.lines[i];
        var span = Math.max(line.len / main.len, 0.001);
        var reached = leading ? (frame.leaderFront - line.startArrival) / span : 1;
        if (reached <= 0) continue;
        var stroke = line.isMain ? frame.main : frame.branch;
        var leader = leading ? frame.leaderGlow * 0.12 : 0;
        var energy = Math.min(line.intensity * (stroke + leader), 2.2);
        if (energy <= 0.01) continue;
        trace(line, scale, reached);
        var core = line.width * (line.isMain ? 1.2 : 0.9) * ws;
        /* lueur violet-bleu d'air ionisé (trois couches de plus en plus fines, à la place d'un flou), puis lueur chaude, puis cœur blanc */
        ctx.lineWidth = core * 19; ctx.strokeStyle = rgba(GLOW, Math.min(0.10 * energy, 0.9)); ctx.stroke();
        ctx.lineWidth = core * 12; ctx.strokeStyle = rgba(GLOW, Math.min(0.15 * energy, 0.9)); ctx.stroke();
        ctx.lineWidth = core * 7;  ctx.strokeStyle = rgba(GLOW, Math.min(0.22 * energy, 0.9)); ctx.stroke();
        ctx.lineWidth = core * 2.6; ctx.strokeStyle = rgba(GLOW, Math.min(0.6 * energy, 1)); ctx.stroke();
        ctx.lineWidth = core;       ctx.strokeStyle = rgba(CORE, Math.min(energy, 1)); ctx.stroke();
      }
      /* la pointe lumineuse du traceur qui descend */
      if (leading) {
        var tip = trace(main, scale, frame.leaderFront);
        if (tip) {
          var r = 5 * ws, g = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], r);
          g.addColorStop(0, rgba(CORE, 0.9 * frame.leaderGlow)); g.addColorStop(1, rgba(CORE, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tip[0], tip[1], r, 0, TAU); ctx.fill();
        }
        ctx.beginPath();
      }
    }

    /* ----- neige ----- */
    function drawSnow(density, t) {
      var area = clamp(W * H / (390 * 400), 1, 6.5);
      var count = Math.min(Math.round((45 + 215 * Math.pow(density, 0.75)) * area * quality), MAX_FLAKES);
      var wind = 20, turbulence = 13;                                    // vent d'ouest léger : 2,5 m/s
      var baseRadius = 4.5 * clamp(H / 700, 1, 1.6);                     // près de 0 °C : gros flocons mouillés
      var i, wrap = W * 1.3;
      for (i = 0; i < count; i++) {
        var f = FLAKES[i];
        var y = ((f.y + t * f.fall) % 1.12) * H - H * 0.06;
        var response = 0.5 + 0.7 * f.depth;
        var sway = Math.sin(t * f.sway + f.phase) * turbulence * (0.3 + f.depth);
        var x = (f.x * W + t * wind * response + sway) % wrap;
        if (x < -W * 0.15) x += wrap;
        var r = baseRadius * f.size * (0.42 + 1.05 * f.depth);
        ctx.globalAlpha = (0.30 + 0.62 * f.depth) * Math.min(density * 1.4, 1);
        ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    }

    function draw() {
      fit();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      var t = clock % 1000, bolt = !reduced && cur.dark >= 0.5 && cur.rain > 0.2;
      var frame = frozen || (bolt ? engine.update(clock, W / H) : DARK);
      if (opts.onFlash) {
        var fe = bolt || frozen ? Math.min(frame.main, 1.4) : 0;
        if (Math.abs(fe - lastFlash) > 0.002) { lastFlash = fe; opts.onFlash(fe, engine.origin[0]); }
      }
      ctx.globalCompositeOperation = 'lighter';
      drawFlash(frame);
      if (cur.rain > 0.01) drawRain(frame, cur.rain, t);
      drawBolt(frame);
      ctx.globalCompositeOperation = 'source-over';
      if (cur.snow > 0.01) drawSnow(cur.snow, t);
    }

    function approach(dt) {
      var k = 1 - Math.exp(-dt * (reduced ? 40 : 2.4)), moving = false;
      ['rain', 'snow', 'dark'].forEach(function (key) {
        var d = target[key] - cur[key];
        if (Math.abs(d) > 0.0005) { cur[key] += d * k; moving = true; } else cur[key] = target[key];
      });
      return moving;
    }

    function frame(now) {
      running = false;
      if (hidden) return;
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
      if (last && now - last < stepMs - 1) { loop(); return; }
      last = now;
      var moving = approach(dt);
      if (!paused) clock += dt;
      draw();
      if (!reduced && !paused && (cur.rain > 0.01 || cur.snow > 0.01)) {
        if (++frames > 20 && prevNow) {
          if (now - prevNow > 1000 / 22) slow++; else slow = Math.max(0, slow - 1);
          if (slow > 30 && quality > 0.4) { quality = Math.max(0.4, quality * 0.8); slow = 0; }
        }
        prevNow = now;
      } else prevNow = 0;
      var live = cur.rain > 0.004 || cur.snow > 0.004;
      if ((!paused && live) || moving || settle-- > 0) loop();
    }
    function loop() { if (running || hidden) return; running = true; root.requestAnimationFrame(frame); }
    function wake() { last = 0; settle = 3; loop(); }

    root.document.addEventListener('visibilitychange', function () { hidden = root.document.hidden; if (!hidden) wake(); });
    root.addEventListener('resize', wake);

    return {
      /* l'état du ciel (seuls rain, snow et dark comptent) ; instant:true = sans transition */
      set: function (s, o) {
        if (!s) return;
        target.rain = s.rain || 0; target.snow = s.snow || 0; target.dark = s.dark || 0;
        if (o && o.instant) { cur.rain = target.rain; cur.snow = target.snow; cur.dark = target.dark; }
        wake();
      },
      pause: function () { paused = true; },
      play: function () { if (!reduced) { paused = false; wake(); } },
      /* fixe la qualité (1 = toutes les gouttes) et coupe l'ajustement automatique : pour les essais */
      setQuality: function (q) { quality = q; frames = -1e9; },
      /* déclenche un éclair tout de suite (essais) */
      strike: function () { engine.nextStrike = clock; engine.strike = null; wake(); },
      /* image figée d'un éclair juste après son premier arc en retour (captures d'essai) */
      preview: function () {
        fit(); var b = makeBolt(W / H);
        engine.lines = b.lines; engine.origin = b.origin; engine.strike = null;
        frozen = { leaderFront: 100, leaderGlow: 0, main: 1.0, branch: 0.9 };
        paused = true; wake();
      }
    };
  }

  root.LWFx = { mount: mount };
})(window);
