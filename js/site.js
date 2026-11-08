/* Liquid Weather — le socle commun : menu, ciel (il suit la section affichée), actualités. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var LW = window.LW = { $: $, $$: $$, clamp: clamp, reduce: reduce };

  /* ---------- menu (petits écrans) ---------- */
  var burger = $('.burger'), links = $('.links');
  if (burger && links) {
    var close = function () { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      var o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o));
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    doc.addEventListener('click', function (e) { if (!e.target.closest('.nav')) close(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- le ciel ---------- */
  var canvas = $('#sky');
  var sky = canvas && window.LWSky ? window.LWSky.mount(canvas, { reduced: reduce }) : null;
  LW.sky = sky;
  if (!sky) root.classList.add('no-gl');
  /* pluie, neige et éclairs (comme dans l'appli) : un second canevas posé sur le ciel */
  var fxCanvas = $('#fx');
  var fx = fxCanvas && window.LWFx ? window.LWFx.mount(fxCanvas, {
    reduced: reduce,
    onFlash: function (v, x) { if (sky && sky.setFlash) sky.setFlash(v, x); }
  }) : null;
  LW.fx = fx;
  var P = window.LWSky ? window.LWSky.PRESETS : {};
  var KEYS = ['sun', 'sunX', 'cloud', 'rain', 'snow', 'dark', 'aurora', 'cirrus', 'fog'];
  var PAGE_SKY = { news: 'dusk', privacy: 'cirrus', support: 'golden', '404': 'storm' };

  /* Le ciel du moment : calculé avec l'heure du visiteur (aucun réseau). Le Soleil se lève vers 6 h, culmine à midi, se couche vers 18 h. */
  function nowSky() {
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60, sun, sunX = 0.3, a = (h - 6) / 12;
    if (a >= 0 && a <= 1) { sun = 0.62 * Math.sin(Math.PI * a); sunX = 0.8 - 0.56 * a; }
    else { var n = h >= 18 ? (h - 18) / 12 : (h + 6) / 12; sun = -0.5 * Math.sin(Math.PI * n); }
    return { sun: sun, sunX: sunX, cloud: 0.28, rain: 0, snow: 0, dark: 0, aurora: 0, cirrus: 0.2, fog: 0 };
  }
  if (P) P.now = nowSky();
  var page = (doc.body.className.match(/page-(\w+)/) || [])[1];
  var marks = [], lastScrim = -1;

  function collectMarks() {
    marks = $$('.sky-mark').map(function (el) {
      return { y: el.getBoundingClientRect().top + window.pageYOffset, name: el.getAttribute('data-sky') };
    }).sort(function (a, b) { return a.y - b.y; });
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function blend(a, b, t) { var o = {}; KEYS.forEach(function (k) { var x = a[k] || 0, y = b[k] || 0; o[k] = x + (y - x) * t; }); return o; }
  function scrollState() {
    if (!marks.length) return P[PAGE_SKY[page] || 'day'];
    var y = window.pageYOffset + window.innerHeight * 0.5, i;
    if (y <= marks[0].y) return P[marks[0].name];
    for (i = 0; i < marks.length - 1; i++) {
      if (y < marks[i + 1].y) {
        var a = marks[i], b = marks[i + 1];
        return blend(P[a.name], P[b.name], smooth(clamp((y - a.y) / Math.max(1, b.y - a.y), 0, 1)));
      }
    }
    return P[marks[marks.length - 1].name];
  }
  function scrimFor(s) {
    var day = smooth(clamp((s.sun + 0.02) / 0.52, 0, 1));
    return 0.12 + 0.26 * day + 0.08 * s.cloud * day + 0.1 * (s.fog || 0) * day + 0.06 * s.snow * day + 0.05 * (s.cirrus || 0) * day;
  }
  var moonEl = $('#moon'), lastMoon = -1, tourEl = $('.tour');
  function moonVisibility(s) {
    var t = clamp((s.sun - 0.02) / -0.34, 0, 1), night = t * t * (3 - 2 * t);
    return night * (1 - clamp(s.cloud * 0.8 + s.dark * 0.5 + (s.fog || 0) * 0.8, 0, 1) * 0.85);
  }
  function apply() {
    var s = scrollState();
    if (!s) return;
    if (moonEl) {
      var mv = moonVisibility(s);
      if (Math.abs(mv - lastMoon) > 0.004) { lastMoon = mv; moonEl.style.opacity = mv.toFixed(3); }
    }
    /* pendant la visite, la Lune se pose entre le texte et le téléphone (sinon elle passerait derrière lui) */
    if (tourEl) { var tr = tourEl.getBoundingClientRect(), mid = window.innerHeight / 2; root.classList.toggle('in-tour', tr.top < mid && tr.bottom > mid); }
    if (fx) fx.set(s, reduce ? { instant: true } : undefined);
    if (sky) sky.set(s, reduce ? { instant: true } : undefined);
    else if (window.LWSky) {
      var g = window.LWSky.gradient(s), el = $('.sky');
      if (el) el.style.background = 'linear-gradient(180deg,' + g.top + ',' + g.bottom + ')';
    }
    var sc = scrimFor(s);
    if (Math.abs(sc - lastScrim) > 0.005) { lastScrim = sc; root.style.setProperty('--scrim', sc.toFixed(3)); }
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; apply(); }); } }
  LW.refreshSky = function () { collectMarks(); apply(); };
  collectMarks(); apply();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { collectMarks(); apply(); });
  window.addEventListener('load', function () { collectMarks(); apply(); });
  if (window.ResizeObserver) new ResizeObserver(function () { collectMarks(); apply(); }).observe(doc.body);

  /* ---------- pause du ciel animé ---------- */
  var pause = $('.sky-pause');
  if (pause) {
    if ((!sky && !fx) || reduce) pause.hidden = true;
    pause.addEventListener('click', function () {
      var on = pause.getAttribute('aria-pressed') !== 'true';
      pause.setAttribute('aria-pressed', String(on));
      pause.setAttribute('aria-label', pause.getAttribute(on ? 'data-label-play' : 'data-label-pause'));
      if (sky) { if (on) sky.pause(); else sky.play(); }
      if (fx) { if (on) fx.pause(); else fx.play(); }
    });
  }

  /* ---------- la Lune du moment (calculée ici, sans réseau) ---------- */
  var ml = $('.moon-live');
  if (ml && window.LWSky) {
    var ph = window.LWSky.moonPhase(), names = ml.getAttribute('data-moon-names').split('|');
    var pct = Math.round((1 - Math.cos(ph * 2 * Math.PI)) / 2 * 100);
    ml.textContent = ml.getAttribute('data-moon-tpl').replace('{name}', names[Math.floor(ph * 8 + 0.5) % 8].toLowerCase()).replace('{pct}', String(pct));
    ml.hidden = false;
  }

  /* ---------- actualités : lecture de actualites/index.json, utilisée par l'accueil et la page Actualités ---------- */
  var cache = null, uid = 0;
  LW.news = {
    base: 'actualites/',
    load: function () {
      if (!cache) cache = fetch('actualites/index.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) {
        var a = (j.articles || j.items || []).slice();
        a.sort(function (x, y) { return new Date(y.date) - new Date(x.date); });
        return a;
      });
      return cache;
    },
    pick: function (o, lang) { return (o && (o[lang] || o.fr || o.en)) || ''; },
    date: function (iso, lang) {
      try { return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)); }
      catch (e) { return String(iso).slice(0, 10); }
    },
    href: function (page, id, lang, pageLang) { return page + '?a=' + encodeURIComponent(id) + (lang && lang !== pageLang ? '&l=' + lang : ''); },
    /* kind : 'lead' | 'side' | '' */
    card: function (a, o) {
      var lang = o.lang, kind = o.kind || '';
      var el = doc.createElement('a');
      el.className = 'card' + (kind ? ' card-' + kind : '');
      /* pageLang : la langue de la page, quand l'article est présenté dans une autre langue (l'adresse garde alors ?l=) */
      el.href = this.href(o.page, a.id, lang, o.pageLang || lang);
      if (lang) { el.lang = lang; el.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
      var img = doc.createElement('div'); img.className = 'card-img';
      var im = new Image(); im.alt = ''; im.loading = kind === 'lead' ? 'eager' : 'lazy'; im.decoding = 'async'; im.width = 1600; im.height = 900;
      im.src = 'actualites/' + a.folder + '/' + a.cover; img.appendChild(im);
      var txt = doc.createElement('div'); txt.className = 'card-txt';
      var meta = doc.createElement('div'); meta.className = 'card-meta';
      var cat = doc.createElement('span'); cat.className = 'cat'; cat.textContent = this.pick(a.category, lang);
      var t = doc.createElement('time'); t.setAttribute('datetime', a.date); t.textContent = this.date(a.date, lang);
      meta.appendChild(cat); meta.appendChild(t);
      var h = doc.createElement('h3'); h.textContent = this.pick(a.title, lang);
      h.id = 'nt' + (++uid); el.setAttribute('aria-labelledby', h.id);
      var p = doc.createElement('p'); p.textContent = this.pick(a.summary, lang);
      txt.appendChild(meta); txt.appendChild(h); txt.appendChild(p);
      el.appendChild(img); el.appendChild(txt);
      return el;
    }
  };
})();
