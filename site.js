/* Liquid Weather — site v3. Vanilla JS. The app explorer runs on REAL screenshots of the app. */
(() => {
  'use strict';
  // Paste the App Store link here when the app is live: the "Télécharger" buttons then appear.
  const APP_STORE_URL = 'https://apps.apple.com/us/app/liquid-weather/id6807434223';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (APP_STORE_URL) {
    $$('[data-appstore]').forEach(a => { a.href = APP_STORE_URL; a.hidden = false; });
    $$('[data-soon]').forEach(e => { e.hidden = true; });
  }
  const nav = $('header.nav');
  const onScroll = () => nav && nav.classList.toggle('stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), links = $('nav.links');
  if (burger && links) {
    burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); });
    links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* Stars */
  const stars = $('#stars');
  if (stars) {
    const ctx = stars.getContext('2d'); let W = 0, H = 0, S = [];
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2); W = stars.width = innerWidth * d; H = stars.height = innerHeight * d;
      S = Array.from({ length: Math.round(innerWidth * innerHeight / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H * .9, r: (Math.random() * 1.2 + .3) * d, p: Math.random() * 6.28, s: Math.random() * 1.4 + .4 }));
    };
    const draw = t => { ctx.clearRect(0, 0, W, H); for (const s of S) { ctx.globalAlpha = reduce ? .6 : .25 + .75 * (.5 + .5 * Math.sin(t / 1000 * s.s + s.p)); ctx.fillStyle = '#dcebff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); } };
    size(); addEventListener('resize', size);
    if (reduce) draw(0); else { let last = 0; const loop = t => { if (t - last > 50) { draw(t); last = t; } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
  if (fine) $$('.glass').forEach(g => g.addEventListener('pointermove', e => { const r = g.getBoundingClientRect(); g.style.setProperty('--mx', (e.clientX - r.left) + 'px'); g.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

  /* Hero tilt */
  const trio = $('.trio'), tilt = $('.trio .tilt');
  if (trio && tilt && fine && !reduce) {
    trio.addEventListener('pointermove', e => { const r = trio.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; tilt.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 10}deg)`; });
    trio.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ===== App explorer ===== */
  const data = window.LW_DATA; const ex = $('#explorer');
  if (data && ex) {
    const stage = $('.ex-stage', ex), list = $('.ex-tabs', ex);
    const state = {}; let cur = 0;
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const dev = el('div', 'dev dev-iphone'); dev.style.setProperty('--w', 'min(340px, 78vw)');
    const scr = el('div', 'scr'); dev.append(scr);
    const island = el('div', 'island'); const glare = el('div', 'glare'); dev.append(island, glare);
    stage.append(dev);
    const layers = data.tabs.map((t, i) => {
      const layer = el('div', 'layer' + (i === 0 ? '' : ' out'));
      const sc = el('div', 'scroller'); const pg = el('div', 'page');
      if (t.map) {
        pg.style.height = '100%';
        t.map.layers.forEach((l, k) => { const im = el('img', 'long'); im.src = l.img; im.alt = ''; im.loading = 'lazy'; im.style.cssText = 'position:absolute;inset:0;height:100%;object-fit:cover;transition:opacity .35s;opacity:' + (k === 0 ? 1 : 0); pg.append(im); });
        sc.style.overflow = 'hidden';
      } else {
        pg.style.height = (t.ratio * 100) + 'cqw';
        t.states.forEach((s, k) => { const im = el('img', 'long'); im.src = s.img; im.alt = t.label; im.loading = i === 0 ? 'eager' : 'lazy'; im.draggable = false; im.style.cssText = 'position:absolute;left:0;top:0;transition:opacity .3s;opacity:' + (k === 0 ? 1 : 0); pg.append(im); });
      }
      sc.append(pg); layer.append(sc);
      if (!t.map) {
        const top = el('img', 'ov top'); top.src = t.topImg; top.alt = ''; const bot = el('img', 'ov bot'); bot.src = t.botImg; bot.alt = '';
        layer.append(top, bot);
      }
      scr.append(layer);
      return layer;
    });
    // tab-bar hotspots (positions come from the app's own accessibility tree)
    const fixed = el('div', 'fixedhots'); scr.append(fixed);
    const bar = data.tabs[0].hots;
    bar.forEach(h => {
      const idx = data.tabs.findIndex(t => t.tabIdent === h.id); if (idx < 0) return;
      const b = el('button', 'hot hint'); b.type = 'button'; b.setAttribute('aria-label', data.tabs[idx].label);
      b.style.cssText = `left:${h.r[0]}%;top:${h.r[1]}%;width:${h.r[2]}%;height:${h.r[3]}%`; b.addEventListener('click', () => select(idx, true)); fixed.append(b);
    });
    // map extras: layer chips (real chip positions) over the map screenshot
    const mapTab = data.tabs.findIndex(t => t.map);
    let mapLayer = 0;
    const setMapLayer = (k) => { mapLayer = k; $$('img', layers[mapTab]).forEach((im, j) => im.style.opacity = j === k ? 1 : 0); $$('.mapchip', ex).forEach((c, j) => c.setAttribute('aria-pressed', String(j === k))); };

    const chips = {};
    data.tabs.forEach((t, i) => {
      const tab = el('button', 'ex-tab'); tab.type = 'button'; tab.setAttribute('role', 'tab');
      tab.innerHTML = `<div class="row"><span class="ic">${t.icon}</span><span><b>${t.label}</b><small>${t.tag}</small></span></div><div class="more"><div><p>${t.text}</p><ul>${t.bullets.map(b => `<li>${b}</li>`).join('')}</ul></div></div>`;
      const more = $('.more > div', tab);
      if (t.states && t.states.length > 1) {
        const c = el('div', 'ex-chips'); c.setAttribute('role', 'group');
        t.states.forEach((s, k) => { const b = el('button', null, s.label); b.type = 'button'; b.setAttribute('aria-pressed', String(k === 0)); b.addEventListener('click', e => { e.stopPropagation(); setState(i, k); }); c.append(b); });
        more.append(c); chips[i] = c;
      }
      if (t.map) {
        const c = el('div', 'ex-chips');
        t.map.layers.forEach((l, k) => { const b = el('button', 'mapchip', l.label); b.type = 'button'; b.setAttribute('aria-pressed', String(k === 0)); b.addEventListener('click', e => { e.stopPropagation(); setMapLayer(k); }); c.append(b); });
        const slider = el('input'); slider.type = 'range'; slider.min = 0; slider.max = t.map.times.length - 1; slider.value = 0; slider.setAttribute('aria-label', t.map.sliderLabel);
        const lab = el('small', null, t.map.times[0].label); lab.style.cssText = 'display:block;margin-top:10px;color:#a8bcd6';
        slider.addEventListener('click', e => e.stopPropagation()); slider.addEventListener('input', () => {
          const tm = t.map.times[+slider.value]; lab.textContent = tm.label;
          const im = $$('img', layers[i])[0]; im.src = tm.img; setMapLayer(0);
        });
        more.append(c, slider, lab);
      }
      tab.addEventListener('click', () => select(i, false));
      list.append(tab); t.el = tab;
    });
    function setState(i, k) {
      state[i] = k; $$('img.long', layers[i]).forEach((im, j) => im.style.opacity = j === k ? 1 : 0);
      if (chips[i]) $$('button', chips[i]).forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
    }
    function select(i, fromDevice) {
      ex.classList.remove('fresh');
      layers.forEach((l, j) => l.classList.toggle('out', j !== i));
      data.tabs.forEach((t, j) => t.el.setAttribute('aria-selected', String(j === i)));
      const sc = $('.scroller', layers[i]); if (sc) sc.scrollTop = 0;
      cur = i;
      if (fromDevice && innerWidth > 1040) { /* keep the page where it is */ }
    }
    select(0, false); ex.classList.add('fresh');
    // the screenshot tells the story: a slow auto-scroll on the first visit, stopped by any touch
    let auto = null;
    const sc0 = $('.scroller', layers[0]);
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !auto && !reduce && cur === 0 && sc0.scrollTop === 0) {
        let y = 0, dir = 1; const stop = () => { clearInterval(auto); auto = 1; };
        ['pointerdown', 'wheel', 'touchstart'].forEach(ev => sc0.addEventListener(ev, stop, { once: true }));
        auto = setInterval(() => { if (cur !== 0) return; y += dir * 1.6; sc0.scrollTop = y; if (y >= sc0.scrollHeight * .12) { clearInterval(auto); auto = 1; sc0.scrollTo({ top: 0, behavior: 'smooth' }); } }, 16);
      }
    }, { threshold: .6 }).observe(stage);
  }
})();
