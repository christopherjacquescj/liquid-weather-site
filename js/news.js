/* Liquid Weather — page Actualités : recherche, filtres Période / Type, tri, pages, et lecture d'un article.
   Les filtres reprennent ceux de l'archive de l'appli. Tout se lit dans actualites/ (le même dossier que l'appli),
   et le texte est toujours posé avec textContent. */
(function () {
  'use strict';
  var LW = window.LW, cfgEl = document.getElementById('lw-news-cfg');
  if (!LW || !LW.news || !cfgEl) return;
  var doc = document, $ = LW.$, $$ = LW.$$, N = LW.news;
  var C = JSON.parse(cfgEl.textContent);
  var OTHER = C.lang === 'fr' ? 'en' : 'fr';
  var LANGS = [['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'], ['ar', 'العربية']];
  var PAGE_SIZE = 6;
  var listView = $('#np-list-view'), reader = $('#np-reader'), list = $('#np-list'), controls = $('#np-controls'), bar = $('#np-bar'), count = $('#np-count'), pager = $('#np-pages');
  var langLink = $('.nav .lang');
  var baseTitle = doc.title, descMeta = $('meta[name="description"]'), baseDesc = descMeta ? descMeta.getAttribute('content') : '';
  var all = [], query = '', period = 'all', cat = '', newest = true, page = 0, listY = 0, seq = 0, ready = false, cache = {};
  var qIn, clearBtn, sortBtn, periodMenu, typeMenu;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  /* un morceau d'interface : toujours dans la langue du site, même quand l'article est lu dans une autre langue */
  function ui(tag, cls) { var e = el(tag, cls); e.lang = C.lang; e.dir = 'ltr'; return e; }
  var colon = function () { return C.lang === 'fr' ? ' : ' : ': '; };
  var fold = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var catKey = function (a) { return (a.category && (a.category.fr || a.category.en)) || ''; };
  var ICONS = {
    search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3',
    calendar: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 10h16M8 3v3M16 3v3',
    tag: 'M3 3h8.2a2 2 0 0 1 1.4.6l8 8a2 2 0 0 1 0 2.8l-6.2 6.2a2 2 0 0 1-2.8 0l-8-8A2 2 0 0 1 3 11.2zM7.5 7.5h.01',
    down: 'M6 9l6 6 6-6',
    sort: 'M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4',
    clear: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    share: 'M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7'
  };
  function svg(name, cls) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    var p = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', ICONS[name]); s.appendChild(p); return s;
  }

  /* ---------- les filtres (comme dans l'appli : Période, Type, tri, pages) ---------- */
  var PERIODS = [['all', 'np_all'], ['week', 'np_p_week'], ['month', 'np_p_month'], ['quarter', 'np_p_quarter'], ['year', 'np_p_year']];
  function inPeriod(a) {
    if (period === 'all') return true;
    var d = new Date(a.date), now = new Date();
    if (period === 'week') return d >= new Date(now.getTime() - 7 * 864e5);
    if (period === 'month') return d >= new Date(now.getTime() - 30 * 864e5);
    if (period === 'quarter') { var q = new Date(now.getTime()); q.setMonth(q.getMonth() - 3); return d >= q; }
    return d.getFullYear() === now.getFullYear();
  }
  function filtered() {
    var toks = fold(query).split(/\s+/).filter(Boolean);
    return all.filter(function (a) {
      if (!inPeriod(a)) return false;
      if (cat && catKey(a) !== cat) return false;
      if (!toks.length) return true;
      if (!a._h) a._h = fold(N.pick(a.title, C.lang) + ' ' + N.pick(a.summary, C.lang));
      return toks.every(function (t) { return a._h.indexOf(t) >= 0; });
    }).sort(function (x, y) { return newest ? new Date(y.date) - new Date(x.date) : new Date(x.date) - new Date(y.date); });
  }

  /* un menu déroulant en forme de puce : icône, texte, chevron (comme dans l'appli) */
  function makeMenu(icon, getLabel, getActive, getItems, onPick) {
    var root = el('div', 'menu'), chip = el('button', 'chip'), pop = el('div', 'menu-pop');
    chip.type = 'button'; chip.setAttribute('aria-haspopup', 'true'); chip.setAttribute('aria-expanded', 'false');
    var txt = el('span'); chip.appendChild(svg(icon)); chip.appendChild(txt); chip.appendChild(svg('down', 'chev'));
    pop.setAttribute('role', 'menu'); pop.hidden = true;
    root.appendChild(chip); root.appendChild(pop);
    function items() { return $$('button', pop); }
    function close(back) { pop.hidden = true; chip.setAttribute('aria-expanded', 'false'); if (back) chip.focus(); }
    function open() {
      closeAll();
      pop.textContent = '';
      getItems().forEach(function (it) {
        var b = el('button', null, it.label); b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', String(!!it.on));
        b.addEventListener('click', function () { close(true); onPick(it.value); });
        pop.appendChild(b);
      });
      pop.hidden = false; chip.setAttribute('aria-expanded', 'true');
      var cur = $('[aria-checked="true"]', pop) || items()[0]; if (cur) cur.focus({ preventScroll: true });
    }
    chip.addEventListener('click', function () { if (pop.hidden) open(); else close(false); });
    chip.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' && pop.hidden) { e.preventDefault(); open(); } });
    pop.addEventListener('keydown', function (e) {
      var b = items(), i = b.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); b[(i + 1) % b.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); b[(i - 1 + b.length) % b.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); b[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); b[b.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    var m = { root: root, close: close, refresh: function () { txt.textContent = getLabel(); chip.classList.toggle('on', !!getActive()); } };
    return m;
  }
  function closeAll() { [periodMenu, typeMenu].forEach(function (m) { if (m) m.close(false); }); }
  doc.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.menu')) closeAll(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  function buildControls() {
    controls.textContent = '';
    var box = el('label', 'np-search'); box.appendChild(svg('search'));
    var hid = el('span', 'sr', C.np_search); box.appendChild(hid);
    qIn = el('input'); qIn.id = 'np-q'; qIn.type = 'search'; qIn.placeholder = C.np_search; qIn.autocomplete = 'off'; qIn.setAttribute('enterkeyhint', 'search'); qIn.setAttribute('autocapitalize', 'off'); qIn.spellcheck = false;
    clearBtn = el('button', 'np-clear'); clearBtn.type = 'button'; clearBtn.hidden = true; clearBtn.setAttribute('aria-label', C.np_clear); clearBtn.appendChild(svg('clear'));
    box.appendChild(qIn); box.appendChild(clearBtn); controls.appendChild(box);
    var t = 0;
    function setQuery(v) { query = v; clearBtn.hidden = !v; page = 0; renderList(); }
    qIn.addEventListener('input', function () { clearBtn.hidden = !qIn.value; clearTimeout(t); t = setTimeout(function () { setQuery(qIn.value); }, 120); });
    qIn.addEventListener('keydown', function (e) { if (e.key === 'Escape' && qIn.value) { e.stopPropagation(); qIn.value = ''; setQuery(''); } });
    clearBtn.addEventListener('click', function () { qIn.value = ''; setQuery(''); qIn.focus(); });

    periodMenu = makeMenu('calendar',
      function () { return period === 'all' ? C.np_period : C[PERIODS.filter(function (p) { return p[0] === period; })[0][1]]; },
      function () { return period !== 'all'; },
      function () { return PERIODS.map(function (p) { return { value: p[0], label: C[p[1]], on: p[0] === period }; }); },
      function (v) { period = v; page = 0; refresh(); });
    controls.appendChild(periodMenu.root);

    var keys = [], label = {};
    all.forEach(function (a) { var k = catKey(a); if (k && !(k in label)) { label[k] = N.pick(a.category, C.lang); keys.push(k); } });
    if (keys.length > 1) {
      typeMenu = makeMenu('tag',
        function () { return cat ? label[cat] : C.np_type; },
        function () { return !!cat; },
        function () { return [{ value: '', label: C.np_all_types, on: !cat }].concat(keys.map(function (k) { return { value: k, label: label[k], on: k === cat }; })); },
        function (v) { cat = v; page = 0; refresh(); });
      controls.appendChild(typeMenu.root);
    }
    sortBtn = el('button', 'np-sort'); sortBtn.type = 'button';
    sortBtn.addEventListener('click', function () { newest = !newest; page = 0; refresh(); });
    bar.appendChild(sortBtn);
  }
  function refresh() {
    periodMenu.refresh(); if (typeMenu) typeMenu.refresh();
    sortBtn.textContent = ''; sortBtn.appendChild(svg('sort')); sortBtn.appendChild(doc.createTextNode(newest ? C.np_newest : C.np_oldest));
    renderList();
  }

  /* ---------- la liste et les pages ---------- */
  function pageNumbers(n, cur) {
    if (n <= 7) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
    var out = [0], from = Math.max(1, cur - 1), to = Math.min(n - 2, cur + 1);
    if (from > 1) out.push(null);
    for (var j = from; j <= to; j++) out.push(j);
    if (to < n - 2) out.push(null);
    out.push(n - 1); return out;
  }
  function renderList() {
    var items = filtered(), n = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    page = Math.min(page, n - 1);
    var slice = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    var plain = !!(period !== 'all' || cat || query.trim() || !newest || page > 0);
    list.textContent = '';
    slice.forEach(function (a, i) { list.appendChild(N.card(a, { lang: C.lang, page: C.page, kind: !plain && i === 0 ? 'lead' : '' })); });
    if (!items.length) {
      var empty = el('div', 'np-empty'); empty.appendChild(el('p', 'rail-msg', C.np_none));
      var reset = el('button', 'chip', C.np_reset); reset.type = 'button';
      reset.addEventListener('click', function () {
        query = ''; period = 'all'; cat = ''; page = 0;
        if (qIn) qIn.value = ''; if (clearBtn) clearBtn.hidden = true;
        refresh();
      });
      empty.appendChild(reset); list.appendChild(empty);
    }
    count.textContent = (items.length === 1 ? C.np_count_one : C.np_count_many).replace('{n}', items.length);
    pager.textContent = ''; pager.hidden = n < 2;
    if (n > 1) {
      var step = function (target, name, label) {
        var b = el('button'); b.type = 'button'; b.appendChild(svg(name)); b.setAttribute('aria-label', label);
        b.disabled = target < 0 || target >= n; b.addEventListener('click', function () { goPage(target); }); return b;
      };
      pager.appendChild(step(page - 1, 'left', C.np_prev));
      pageNumbers(n, page).forEach(function (p) {
        if (p === null) { pager.appendChild(el('span', 'gap', '…')); return; }
        var b = el('button', null, String(p + 1)); b.type = 'button'; b.setAttribute('aria-label', C.np_page.replace('{n}', p + 1));
        if (p === page) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', function () { goPage(p); }); pager.appendChild(b);
      });
      pager.appendChild(step(page + 1, 'right', C.np_next));
    }
    if (LW.refreshSky) LW.refreshSky();
  }
  function goPage(p) {
    page = p; renderList();
    var top = controls.getBoundingClientRect().top + window.pageYOffset - 96;
    window.scrollTo({ top: Math.max(0, top), behavior: LW.reduce ? 'auto' : 'smooth' });
  }

  /* ---------- la lecture ---------- */
  function find(id) { return all.filter(function (a) { return a.id === id; })[0]; }
  function loadArticle(a) {
    if (!cache[a.id]) cache[a.id] = fetch('actualites/' + a.folder + '/article.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function (e) { delete cache[a.id]; throw e; });
    return cache[a.id];
  }
  function pickLang(art, want) {
    var ok = function (l) { return !!(l && art.body && art.body[l] && LANGS.some(function (x) { return x[0] === l; })); };
    return ok(want) ? want : ok(C.lang) ? C.lang : ok('fr') ? 'fr' : 'en';
  }
  function creditLine(o) {
    if (!o || !o.credit) return null;
    var lic = o.license ? (o.license === 'pd' ? C.np_pd : String(o.license).toUpperCase()) : '';
    var p = ui('p', 'credit');
    p.textContent = C.np_photo + colon() + o.credit + (lic ? ' (' + lic + ')' : '');
    return p;
  }
  function figure(a, art, id, lang) {
    var f = art.figures && art.figures[id]; if (!f || !f.file) return null;
    var fig = el('figure'), im = new Image(), cap = N.pick(f.caption, lang);
    im.src = 'actualites/' + a.folder + '/' + f.file; im.alt = cap; im.decoding = 'async';
    fig.appendChild(im);
    if (cap) fig.appendChild(el('figcaption', null, cap));
    var cr = creditLine(f); if (cr) fig.appendChild(cr);
    return fig;
  }
  function renderBody(box, a, art, lang) {
    var paras = (art.body && (art.body[lang] || art.body.fr || art.body.en)) || [], ul = null;
    paras.forEach(function (raw) {
      var s = String(raw), m = /^\[\[figure:([\w-]+)\]\]$/.exec(s.trim());
      if (m) { ul = null; var f = figure(a, art, m[1], lang); if (f) box.appendChild(f); return; }
      if (s.slice(0, 2) === '• ') { if (!ul) { ul = el('ul'); box.appendChild(ul); } ul.appendChild(el('li', null, s.slice(2))); return; }
      ul = null;
      if (s.slice(0, 3) === '## ') box.appendChild(el('h2', null, s.slice(3)));
      else if (s.trim()) box.appendChild(el('p', null, s));
    });
  }
  function urlFor(id, lang) { return N.href(C.page, id, lang, C.lang); }
  function otherPageUrl(id, lang) { return N.href(C.other, id, lang, OTHER); }
  function setLangLink(id, lang) {
    if (!langLink) return;
    langLink.setAttribute('href', id ? otherPageUrl(id, lang) : C.other);
  }
  function more(a) {
    var key = catKey(a), others = all.filter(function (x) { return x.id !== a.id; });
    var same = others.filter(function (x) { return catKey(x) === key; }), rest = others.filter(function (x) { return catKey(x) !== key; });
    return same.concat(rest).slice(0, 4);
  }
  function toast(msg) {
    var t = el('div', 'toast', msg); t.setAttribute('role', 'status'); doc.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2300);
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, ko) {
      var ta = el('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy') ? ok() : ko(); } catch (e) { ko(e); } finally { doc.body.removeChild(ta); }
    });
  }
  function share(title) {
    var url = location.href;
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () { /* annulé par le visiteur */ }); return; }
    copy(url).then(function () { toast(C.np_copied); }, function () { /* pas de presse-papiers : rien à faire */ });
  }
  function backLink() {
    var navRow = ui('div', 'reader-nav'), back = el('a', 'reader-back');
    back.href = C.page; back.appendChild(svg('left')); back.appendChild(doc.createTextNode(C.np_back));
    navRow.appendChild(back); return navRow;
  }

  function renderReader(a, art, lang, keepFocus) {
    var rtl = lang === 'ar', title = N.pick(a.title, lang);
    reader.textContent = '';
    reader.lang = lang; reader.dir = rtl ? 'rtl' : 'ltr';
    reader.appendChild(backLink());

    var head = el('header', 'reader-head'), meta = el('div', 'card-meta');
    meta.appendChild(el('span', 'cat', N.pick(a.category, lang)));
    var time = el('time', null, N.date(a.date, lang)); time.setAttribute('datetime', a.date); meta.appendChild(time);
    var h1 = el('h1', null, title); h1.tabIndex = -1;
    head.appendChild(meta); head.appendChild(h1); head.appendChild(el('p', 'stand', N.pick(a.summary, lang)));
    reader.appendChild(head);

    var cov = el('figure', 'reader-cover'), im = new Image();
    im.src = 'actualites/' + a.folder + '/' + a.cover; im.alt = ''; im.width = 1600; im.height = 900; im.decoding = 'async';
    cov.appendChild(im); var cc = creditLine(art.cover); if (cc) cov.appendChild(cc);
    reader.appendChild(cov);

    var tools = ui('div', 'reader-tools'), chips = ui('div', 'lang-chips');
    chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', C.np_lang);
    LANGS.forEach(function (L) {
      if (!art.body || !art.body[L[0]]) return;
      var b = el('button', null, L[1]); b.type = 'button'; b.lang = L[0]; b.dir = L[0] === 'ar' ? 'rtl' : 'ltr';
      b.setAttribute('aria-pressed', String(L[0] === lang));
      b.addEventListener('click', function () {
        if (L[0] === lang) return;
        history.replaceState(history.state, '', urlFor(a.id, L[0]));
        renderReader(a, art, L[0], true);
      });
      chips.appendChild(b);
    });
    var sh = el('button', 'btn btn-glass'); sh.type = 'button';
    sh.appendChild(svg('share')); sh.appendChild(el('span', null, C.np_share));
    sh.addEventListener('click', function () { share(title); });
    tools.appendChild(chips); tools.appendChild(sh); reader.appendChild(tools);

    var body = el('div', 'reader-body glass'); renderBody(body, a, art, lang); reader.appendChild(body);

    if (art.source && art.source.name) {
      var foot = el('footer', 'reader-foot'), src = ui('p', 'source');
      src.appendChild(doc.createTextNode(C.np_source + colon()));
      if (/^https?:\/\//i.test(art.source.url || '')) {
        var l = el('a', null, art.source.name); l.href = art.source.url; l.target = '_blank'; l.rel = 'noopener'; src.appendChild(l);
      } else src.appendChild(doc.createTextNode(art.source.name));
      foot.appendChild(src); reader.appendChild(foot);
    }

    var rel = more(a);
    if (rel.length) {
      var sec = el('section', 'more'), h2 = ui('h2', null, C.np_more), grid = el('div', 'np-list');
      rel.forEach(function (m) { grid.appendChild(N.card(m, { lang: lang, pageLang: C.lang, page: C.page, kind: '' })); });
      sec.appendChild(h2); sec.appendChild(grid); reader.appendChild(sec);
    }

    doc.title = title + ' — Liquid Weather';
    if (descMeta) descMeta.setAttribute('content', N.pick(a.summary, lang));
    setLangLink(a.id, lang);
    if (keepFocus) { var cur = $('.lang-chips button[aria-pressed="true"]', reader); if (cur) cur.focus({ preventScroll: true }); }
    if (LW.refreshSky) LW.refreshSky();
    return h1;
  }
  function renderMessage(title, text, withLatest) {
    reader.textContent = ''; reader.lang = C.lang; reader.dir = 'ltr';
    reader.appendChild(backLink());
    var head = el('header', 'reader-head'), h1 = el('h1', null, title); h1.tabIndex = -1;
    head.appendChild(h1); if (text) head.appendChild(el('p', 'stand', text)); reader.appendChild(head);
    if (withLatest && all.length) {
      var sec = el('section', 'more'), grid = el('div', 'np-list');
      all.slice(0, 4).forEach(function (m) { grid.appendChild(N.card(m, { lang: C.lang, page: C.page, kind: '' })); });
      sec.appendChild(grid); reader.appendChild(sec);
    }
    doc.title = title + ' — Liquid Weather';
    setLangLink(null);
    if (LW.refreshSky) LW.refreshSky();
    return h1;
  }
  function swap(h1) {
    listView.hidden = true; reader.hidden = false; window.scrollTo(0, 0);
    if (h1) h1.focus({ preventScroll: true });
  }

  /* ---------- l'adresse décide de ce qui s'affiche ---------- */
  function showList() {
    seq++;
    reader.hidden = true; listView.hidden = false;
    doc.title = baseTitle; if (descMeta) descMeta.setAttribute('content', baseDesc);
    setLangLink(null);
    if (LW.refreshSky) LW.refreshSky();
    window.scrollTo(0, listY);
  }
  function showArticle(id, want) {
    var my = ++seq, a = find(id);
    if (!a) { swap(renderMessage(C.np_notfound, C.np_notfound_p, true)); return; }
    loadArticle(a).then(function (art) {
      if (my !== seq) return;
      swap(renderReader(a, art, pickLang(art, want)));
    }, function () {
      if (my !== seq) return;
      swap(renderMessage(C.news_error, '', true));
    });
  }
  function show() {
    if (!ready) return;
    var p = new URLSearchParams(location.search), id = p.get('a');
    if (id) showArticle(id, p.get('l')); else showList();
  }
  function navigate(url) {
    if (!listView.hidden) listY = window.pageYOffset;
    history.pushState({ lw: 1 }, '', url); show();
  }
  window.addEventListener('popstate', show);
  doc.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a.card, a.reader-back') : null;
    if (!a || !a.closest('#np-list-view, #np-reader')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname !== location.pathname) return;
    e.preventDefault(); navigate(u.pathname.replace(/^.*\//, '') + u.search);
  });

  N.load().then(function (items) {
    all = items; ready = true;
    buildControls(); refresh(); show();
  }).catch(function () {
    list.textContent = ''; list.appendChild(el('p', 'rail-msg', C.news_error));
    ready = true;
    if (new URLSearchParams(location.search).get('a')) swap(renderMessage(C.news_error, '', false));
  });
})();
