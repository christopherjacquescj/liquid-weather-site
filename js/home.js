/* Liquid Weather — accueil : la visite du téléphone, le graphique des modèles, les actualités. */
(function () {
  'use strict';
  var LW = window.LW; if (!LW) return;
  var $ = LW.$, $$ = LW.$$, clamp = LW.clamp, reduce = LW.reduce;
  var doc = document;
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var band = function (a, b, x) { return smooth(clamp((x - a) / (b - a), 0, 1)); };

  /* ================= la visite ================= */
  (function tourInit() {
    var tour = $('.tour'), dataEl = $('#tour-data');
    if (!tour || !dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var stage = $('.tour-stage', tour), screen = $('#screen'), body = $('.phone-body');
    var chaps = $$('.chap', stage), N = chaps.length;
    var dots = $$('.tour-dots a', tour);
    var tabs = {}; data.tabs.forEach(function (t) { tabs[t.id] = t; });
    var chapTab = chaps.map(function (c) { return c.getAttribute('data-tab') || 'home'; });
    var layers = {}, state = {}, mapLayer = 0;

    function el(tag, cls) { var e = doc.createElement(tag); if (cls) e.className = cls; return e; }
    function img(src, extra) {
      var im = new Image(); im.src = src; im.alt = ''; im.decoding = 'async'; im.draggable = false; im.loading = 'lazy';
      if (extra) Object.keys(extra).forEach(function (k) { im[k] = extra[k]; });
      return im;
    }

    // 1) les couches : une par onglet, construites avec les vraies captures
    data.tabs.forEach(function (tab) {
      var layer;
      if (tab.id === 'home') { layer = $('.layer[data-tab="home"]', screen); layers.home = { el: layer, page: $('.page', layer), imgs: [$('.page img', layer)], tab: tab }; return; }
      layer = el('div', 'layer' + (tab.times ? ' map' : '')); layer.setAttribute('data-tab', tab.id);
      var page = el('div', 'page'), imgs = [], times = [];
      if (tab.times) {
        tab.layers.forEach(function (l, k) { var im = img(l.img, { width: 660, height: 1434 }); if (k === 0) im.className = 'on'; page.appendChild(im); imgs.push(im); });
        tab.times.forEach(function (u) { var im = img(u, { width: 660, height: 1434 }); page.appendChild(im); times.push(im); });
      } else {
        page.style.aspectRatio = '660 / ' + Math.round(660 * tab.ratio);
        tab.layers.forEach(function (l, k) {
          var im = img(l.img, { width: 660, height: Math.round(660 * tab.ratio) });
          im.style.cssText = 'position:absolute;left:0;top:0;transition:opacity .3s;opacity:' + (k === 0 ? 1 : 0);
          page.appendChild(im); imgs.push(im);
        });
      }
      var clip = el('div', 'page-clip'); clip.appendChild(page); layer.appendChild(clip);
      if (tab.top) {
        var top = img(tab.top, { width: 660, height: 170 }); top.className = 'ov top'; top.loading = 'eager';
        var bot = img(tab.bot, { width: 660, height: 154 }); bot.className = 'ov bot'; bot.loading = 'eager';
        layer.appendChild(top); layer.appendChild(bot);
      }
      screen.appendChild(layer);
      layers[tab.id] = { el: layer, page: page, imgs: imgs, times: times, tab: tab };
    });

    // 2) les zones cliquables sur la barre d'onglets du téléphone : elles mènent au chapitre
    var hots = el('div', 'hots'); screen.appendChild(hots);
    Object.keys(data.hots).forEach(function (id) {
      var i = chapTab.indexOf(id); if (i < 0) return;
      var r = data.hots[id], b = el('button', 'hot'); b.type = 'button';
      b.setAttribute('aria-label', ($('.tabpill span', chaps[i]) || {}).textContent || id);
      b.style.cssText = 'left:' + r[0] + '%;top:' + r[1] + '%;width:' + r[2] + '%;height:' + r[3] + '%';
      b.addEventListener('click', function () { goTo(i); });
      hots.appendChild(b);
    });

    // 3) les puces (Températures / Précipitations, couches de la carte…)
    $$('.chips', stage).forEach(function (c) {
      var id = c.getAttribute('data-chips'), btns = $$('button', c);
      btns.forEach(function (b, k) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          if (id === 'maps') { mapLayer = k; } else { state[id] = k; }
          showState(id); schedule();
        });
      });
    });
    function showState(id) {
      var L = layers[id]; if (!L) return;
      if (id === 'maps') {
        var tf = mapLayer === 0 ? frame : -1;
        L.imgs.forEach(function (im, k) { im.classList.toggle('on', tf < 0 && k === mapLayer); });
        L.times.forEach(function (im, k) { im.classList.toggle('on', k === tf); });
      } else {
        var cur = state[id] || 0;
        L.imgs.forEach(function (im, k) { im.style.opacity = k === cur ? 1 : 0; });
      }
    }

    // 4) le défilement pilote le téléphone
    var tourTop = 0, tourH = 0, vh = 0, sw = 0, sh = 0, idx = -1, frame = 0;
    var px = 0, py = 0, tx = 0, ty = 0, raf = 0, wasActive = '';
    /* petit écran : le téléphone prend la place que laisse le chapitre actif (voir le CSS, --copy-h) */
    function setCopyH() {
      var c = chaps[idx < 0 ? 0 : idx]; if (!c) return;
      var h = c.offsetHeight, safe = parseFloat(getComputedStyle(stage).getPropertyValue('--safe-b')) || 0;
      stage.style.setProperty('--copy-h', h + 'px');
      /* vraiment trop peu de place pour un téléphone lisible : on le cache, le texte garde toute la hauteur */
      stage.classList.toggle('no-room', window.innerHeight - h - 156 - safe < 235);
    }
    function measure() {
      var r = tour.getBoundingClientRect();
      tourTop = r.top + window.pageYOffset; tourH = r.height; vh = window.innerHeight;
      sw = screen.clientWidth; sh = screen.clientHeight;
      setCopyH();
    }
    var stacked = function () { return getComputedStyle(stage).position !== 'sticky'; };
    function render() {
      raf = 0;
      var total = Math.max(1, tourH - vh);
      var p = stacked() ? 0 : clamp((window.pageYOffset - tourTop) / total, 0, 1);
      var f = p * N, i = Math.min(N - 1, Math.floor(f)), local = f - i;
      if (i !== idx) {
        idx = i;
        chaps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
        setCopyH();
        dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
        var id = chapTab[i];
        if (id !== wasActive) {
          Object.keys(layers).forEach(function (k) { layers[k].el.classList.toggle('is-on', k === id); });
          wasActive = id; showState(id);
        }
      }
      var id2 = chapTab[i], L = layers[id2];
      if (L && !L.tab.times) {
        var pageH = sw * L.tab.ratio, y = i === 0 ? 0 : band(0.08, 0.92, local) * Math.max(0, pageH - sh);
        L.page.style.transform = 'translate3d(0,' + (-y).toFixed(1) + 'px,0)';
      } else if (L && L.tab.times) {
        var nf = Math.round(band(0.06, 0.94, local) * (L.times.length - 1));
        if (nf !== frame) { frame = nf; showState('maps'); }
      }
      // un léger balancement : le téléphone vit pendant qu'on défile (désactivé en mouvement réduit)
      if (!reduce) {
        px += (tx - px) * 0.12; py += (ty - py) * 0.12;
        var sway = stacked() ? 0 : Math.sin(f * Math.PI) * 4.5;
        body.style.setProperty('--ry', (sway + px * 9).toFixed(2) + 'deg');
        body.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
        if (Math.abs(tx - px) > 0.002 || Math.abs(ty - py) > 0.002) schedule();
      }
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(render); }
    function goTo(i) {
      var top = tourTop + (i + 0.1) / N * Math.max(1, tourH - vh);
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    }
    $$('[data-go]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); goTo(parseInt(a.getAttribute('data-go'), 10) || 0); });
    });
    if (!reduce && window.matchMedia && matchMedia('(pointer:fine)').matches) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        tx = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5); ty = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5);
        schedule();
      }, { passive: true });
      stage.addEventListener('pointerleave', function () { tx = 0; ty = 0; schedule(); });
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { measure(); idx = -1; schedule(); });
    window.addEventListener('load', function () { measure(); schedule(); LW.refreshSky && LW.refreshSky(); });
    measure(); schedule();
  })();

  /* ================= le graphique des modèles (illustration) ================= */
  (function chartInit() {
    var fig = $('#chart'); if (!fig) return;
    var svg = $('.chart-svg', fig), range = $('#horizon'), out = $('#horizon-out'), meter = $('.meter', fig), mv = $('.meter-val', fig);
    var colors = fig.getAttribute('data-colors').split(',');
    var agree = fig.getAttribute('data-agree').split('|');
    var NS = 'http://www.w3.org/2000/svg';
    var W = 800, H = 420, PX = 14, PT = 30, PB = 22;
    var M = [{ a: .05, b: .000, p: .20, k: 1.1 }, { a: .09, b: .070, p: 1.10, k: 1.7 }, { a: .07, b: -.080, p: 2.00, k: .9 }, { a: .11, b: .040, p: 3.30, k: 1.4 }, { a: .08, b: -.050, p: 4.20, k: 2.0 }];
    function base(x) { return .50 + .19 * Math.sin(2 * Math.PI * (x * 10 + .15)) + .11 * Math.sin(2 * Math.PI * (x * 1.4 + .3)); }
    function val(i, x) { var m = M[i], g = Math.pow(x, 1.35); return base(x + .012 * g * (i - 2)) + g * (m.a * Math.sin(2 * Math.PI * (x * m.k + m.p)) + m.b); }
    var X = function (x) { return PX + x * (W - 2 * PX); }, Y = function (v) { return PT + (1 - v) * (H - PT - PB); };
    function spread(x) { var lo = 9, hi = -9; for (var i = 0; i < 5; i++) { var v = val(i, x); lo = Math.min(lo, v); hi = Math.max(hi, v); } return [lo, hi]; }
    var sMax = (function () { var m = 0; for (var x = 0; x <= 1.001; x += .01) { var s = spread(x); m = Math.max(m, s[1] - s[0]); } return m; })();
    function mk(tag, attrs) { var e = doc.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }

    [.25, .5, .75].forEach(function (g) { svg.appendChild(mk('line', { 'class': 'gl', x1: PX, x2: W - PX, y1: Y(g), y2: Y(g) })); });
    var curves = [];
    for (var i = 0; i < 5; i++) {
      var d = '';
      for (var s = 0; s <= 200; s++) { var x = s / 200; d += (s ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(val(i, x)).toFixed(1); }
      var g = mk('g', { 'class': 'c', 'data-i': i });
      g.appendChild(mk('path', { d: d, stroke: colors[i], 'stroke-width': 10, opacity: .14 }));
      g.appendChild(mk('path', { d: d, stroke: colors[i], 'stroke-width': 2.8 }));
      svg.appendChild(g); curves.push(g);
    }
    var cur = mk('g', { 'class': 'cur' }), vl = mk('line', { y1: PT - 8, y2: H - PB + 4 }), br = mk('line', { 'class': 'br' });
    cur.appendChild(vl); cur.appendChild(br);
    var dots = colors.map(function (c) { var d = mk('circle', { 'class': 'dot', r: 6, fill: c }); cur.appendChild(d); return d; });
    svg.appendChild(cur);

    var tIn = fig.getAttribute('data-in'), tIn1 = fig.getAttribute('data-in1'), tNow = fig.getAttribute('data-now');
    function setAt(x) {
      var xs = X(x); vl.setAttribute('x1', xs); vl.setAttribute('x2', xs);
      var lo = 9, hi = -9;
      for (var i = 0; i < 5; i++) { var v = val(i, x); lo = Math.min(lo, v); hi = Math.max(hi, v); dots[i].setAttribute('cx', xs); dots[i].setAttribute('cy', Y(v)); }
      br.setAttribute('x1', xs + 16); br.setAttribute('x2', xs + 16); br.setAttribute('y1', Y(hi)); br.setAttribute('y2', Y(lo));
      var days = Math.round(x * 10);
      out.textContent = days < 1 ? tNow : days === 1 ? tIn1 : tIn.replace('{n}', days);
      var r = (hi - lo) / sMax, lvl = r < .22 ? 4 : r < .48 ? 3 : r < .74 ? 2 : 1;
      meter.setAttribute('data-level', lvl); mv.textContent = agree[lvl - 1];
    }
    var touched = false;
    function set(v) { range.value = v; setAt(v / 100); }
    range.addEventListener('input', function () { touched = true; setAt(range.value / 100); });
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { range.addEventListener(ev, function () { touched = true; }, { passive: true }); });
    set(+range.value);

    $$('.legend li').forEach(function (li) {
      var k = +li.getAttribute('data-model');
      function on() { curves.forEach(function (c, j) { c.classList.toggle('dim', j !== k); }); $$('.legend li').forEach(function (o) { o.classList.toggle('dim', o !== li); }); }
      function off() { curves.forEach(function (c) { c.classList.remove('dim'); }); $$('.legend li').forEach(function (o) { o.classList.remove('dim'); }); }
      li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
    });

    // une seule balade automatique quand le graphique apparaît : de « maintenant » à « dans 10 jours »
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var t0 = performance.now(), from = +range.value, to = 100, dur = 5200;
        (function step(now) {
          if (touched) return;
          var t = clamp((now - t0) / dur, 0, 1);
          set(Math.round(from + (to - from) * smooth(t)));
          if (t < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: .6 });
      io.observe(fig);
    }
  })();

  /* ================= les actualités ================= */
  (function newsRail() {
    var rail = $('#news-rail'); if (!rail || !LW.news) return;
    var lang = rail.getAttribute('data-lang'), page = rail.getAttribute('data-page');
    LW.news.load().then(function (list) {
      rail.textContent = '';
      list.slice(0, 3).forEach(function (a, i) { rail.appendChild(LW.news.card(a, { lang: lang, page: page, kind: i === 0 ? 'lead' : 'side' })); });
      LW.refreshSky && LW.refreshSky();
    }).catch(function () { rail.innerHTML = '<p class="rail-msg"></p>'; $('.rail-msg', rail).textContent = rail.getAttribute('data-error'); });
  })();
})();
