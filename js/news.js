/* Liquid Weather — page Actualités : la liste, les filtres, la recherche et la lecture d'un article.
   Tout se lit dans actualites/ (le même dossier que celui de l'app). Le texte est toujours posé avec textContent. */
(function () {
  'use strict';
  var LW = window.LW, cfgEl = document.getElementById('lw-news-cfg');
  if (!LW || !LW.news || !cfgEl) return;
  var doc = document, $ = LW.$, $$ = LW.$$, N = LW.news;
  var C = JSON.parse(cfgEl.textContent);
  var OTHER = C.lang === 'fr' ? 'en' : 'fr';
  var LANGS = [['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'], ['ar', 'العربية']];
  var listView = $('#np-list-view'), reader = $('#np-reader'), list = $('#np-list'), filters = $('#np-filters'), qIn = $('#np-q'), count = $('#np-count');
  var langLink = $('.nav .lang');
  var baseTitle = doc.title, descMeta = $('meta[name="description"]'), baseDesc = descMeta ? descMeta.getAttribute('content') : '';
  var all = [], cat = '', query = '', listY = 0, seq = 0, ready = false, cache = {};

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  /* un morceau d'interface : toujours dans la langue du site, même quand l'article est lu dans une autre langue */
  function ui(tag, cls) { var e = el(tag, cls); e.lang = C.lang; e.dir = 'ltr'; return e; }
  var colon = function () { return C.lang === 'fr' ? ' : ' : ': '; };
  var fold = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var catKey = function (a) { return (a.category && (a.category.fr || a.category.en)) || ''; };
  function svg(d) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    var p = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.appendChild(p); return s;
  }

  /* ---------- la liste ---------- */
  function filtered() {
    var toks = fold(query).split(/\s+/).filter(Boolean);
    return all.filter(function (a) {
      if (cat && catKey(a) !== cat) return false;
      if (!toks.length) return true;
      if (!a._h) a._h = fold(N.pick(a.title, C.lang) + ' ' + N.pick(a.summary, C.lang) + ' ' + N.pick(a.category, C.lang));
      return toks.every(function (t) { return a._h.indexOf(t) >= 0; });
    });
  }
  function renderList() {
    var items = filtered(), plain = !!(cat || query.trim());
    list.textContent = '';
    items.forEach(function (a, i) { list.appendChild(N.card(a, { lang: C.lang, page: C.page, kind: !plain && i === 0 ? 'lead' : '' })); });
    if (!items.length) list.appendChild(el('p', 'rail-msg', C.np_none));
    count.textContent = items.length ? (items.length === 1 ? C.np_count_one : C.np_count_many).replace('{n}', items.length) : '';
    if (LW.refreshSky) LW.refreshSky();
  }
  function buildFilters() {
    var keys = [], n = {}, label = {};
    all.forEach(function (a) { var k = catKey(a); if (!(k in n)) { n[k] = 0; keys.push(k); label[k] = N.pick(a.category, C.lang); } n[k]++; });
    filters.textContent = '';
    [''].concat(keys).forEach(function (k) {
      var b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(k === cat));
      b.appendChild(doc.createTextNode(k ? label[k] : C.np_all)); b.appendChild(el('b', null, String(k ? n[k] : all.length)));
      b.addEventListener('click', function () {
        cat = k; $$('button', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderList();
      });
      filters.appendChild(b);
    });
  }
  var t0 = 0;
  qIn.addEventListener('input', function () { clearTimeout(t0); t0 = setTimeout(function () { query = qIn.value; renderList(); }, 120); });
  qIn.addEventListener('keydown', function (e) { if (e.key === 'Escape' && qIn.value) { qIn.value = ''; query = ''; renderList(); } });

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
  function more(a, lang) {
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

  function renderReader(a, art, lang, keepFocus) {
    var rtl = lang === 'ar', title = N.pick(a.title, lang);
    reader.textContent = '';
    reader.lang = lang; reader.dir = rtl ? 'rtl' : 'ltr';

    var navRow = ui('div', 'reader-nav'), back = el('a', 'reader-back');
    back.href = C.page; back.appendChild(svg('M15 6l-6 6 6 6')); back.appendChild(doc.createTextNode(C.np_back));
    navRow.appendChild(back); reader.appendChild(navRow);

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
    sh.appendChild(svg('M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7')); sh.appendChild(el('span', null, C.np_share));
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

    var rel = more(a, lang);
    if (rel.length) {
      var sec = el('section', 'more'), h2 = ui('h2', null, C.np_more), grid = el('div', 'np-list');
      h2.textContent = C.np_more;
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
    var navRow = ui('div', 'reader-nav'), back = el('a', 'reader-back');
    back.href = C.page; back.appendChild(svg('M15 6l-6 6 6 6')); back.appendChild(doc.createTextNode(C.np_back));
    navRow.appendChild(back); reader.appendChild(navRow);
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
    buildFilters(); renderList(); show();
  }).catch(function () {
    list.textContent = ''; list.appendChild(el('p', 'rail-msg', C.news_error));
    ready = true;
    if (new URLSearchParams(location.search).get('a')) swap(renderMessage(C.news_error, '', false));
  });
})();
