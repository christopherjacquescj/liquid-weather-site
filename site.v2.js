/* Liquid Weather — site interactions. Vanilla JS, no dependencies, no network calls. */
(() => {
  'use strict';

  /* ===== Configuration ===== */
  // Paste the App Store link here when the app is live: the "Télécharger" buttons then appear.
  const APP_STORE_URL = 'https://apps.apple.com/us/app/liquid-weather/id6807434223';

  const lang = (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const T = {
    fr: {
      layers: { temp: 'Température', rain: 'Pluie', wind: 'Vent', cloud: 'Nuages' },
      units: { temp: '°', rain: ' mm/h', wind: ' km/h', cloud: ' %' },
      legend: { temp: ['5°', '17°', '30°'], rain: ['0', '3', '15+ mm/h'], wind: ['0', '50', '100 km/h'], cloud: ['0 %', '50 %', '100 %'] },
      now: 'maintenant', inH: n => `dans ${n} h`, badge: 'AROME HD · 0,01°', forecast: 'Prévision',
      phases: ['Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Gibbeuse croissante', 'Pleine lune', 'Gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'],
      spread: 'Écart entre modèles', agree: 'Accord', horizon: n => `+${n} h`,
      q: 'Faut-il un parapluie demain à Lyon ?',
      a: 'Oui, garde-le pour l’après-midi : une averse passagère est attendue entre 15 h et 18 h, jusqu’à 3 mm/h. Les modèles s’accordent à 84 %. En soirée, le ciel se dégage.',
      barsLabel: ['9 h', '20 h']
    },
    en: {
      layers: { temp: 'Temperature', rain: 'Rain', wind: 'Wind', cloud: 'Clouds' },
      units: { temp: '°', rain: ' mm/h', wind: ' km/h', cloud: '%' },
      legend: { temp: ['5°', '17°', '30°'], rain: ['0', '3', '15+ mm/h'], wind: ['0', '50', '100 km/h'], cloud: ['0%', '50%', '100%'] },
      now: 'now', inH: n => `in ${n} h`, badge: 'AROME HD · 0.01°', forecast: 'Forecast',
      phases: ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'],
      spread: 'Model spread', agree: 'Agreement', horizon: n => `+${n} h`,
      q: 'Do I need an umbrella tomorrow in Lyon?',
      a: 'Yes — keep it for the afternoon: a passing shower is expected between 3 and 6 pm, up to 3 mm/h. The models agree at 84%. The sky clears in the evening.',
      barsLabel: ['9 am', '8 pm']
    }
  }[lang];

  /* ===== App Store button ===== */
  if (APP_STORE_URL) {
    $$('[data-appstore]').forEach(a => { a.href = APP_STORE_URL; a.hidden = false; });
    $$('[data-soon]').forEach(e => { e.hidden = true; });
  }

  /* ===== Header ===== */
  const nav = $('header.nav');
  const onScroll = () => nav && nav.classList.toggle('stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), links = $('nav.links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  }

  /* ===== Reveal on scroll (+ "in" hook for children that animate when seen) ===== */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* Runs `fn` while `el` is on screen (for animation loops). */
  const whileVisible = (el, start, stop) => {
    let on = false;
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !on) { on = true; start(); }
      else if (!en.isIntersecting && on) { on = false; stop(); }
    }, { threshold: .08 }).observe(el);
  };

  /* ===== Stars ===== */
  const stars = $('#stars');
  if (stars) {
    const ctx = stars.getContext('2d');
    let W = 0, H = 0, S = [];
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = stars.width = innerWidth * d; H = stars.height = innerHeight * d;
      S = Array.from({ length: Math.round(innerWidth * innerHeight / 9000) }, () => ({
        x: Math.random() * W, y: Math.random() * H * .9, r: (Math.random() * 1.2 + .3) * d, p: Math.random() * 6.28, s: Math.random() * 1.4 + .4
      }));
    };
    const draw = t => {
      ctx.clearRect(0, 0, W, H);
      for (const s of S) {
        const a = reduce ? .6 : .25 + .75 * (.5 + .5 * Math.sin(t / 1000 * s.s + s.p));
        ctx.globalAlpha = a; ctx.fillStyle = '#dcebff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
    };
    size(); addEventListener('resize', size);
    if (reduce) draw(0); else {
      let last = 0;
      const loop = t => { if (t - last > 50) { draw(t); last = t; } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  /* ===== Rain inside the phone ===== */
  const rain = $('.rain');
  if (rain && !reduce) {
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = (.8 + Math.random() * .9) + 's';
      d.style.animationDelay = (-Math.random() * 2) + 's';
      d.style.opacity = (.25 + Math.random() * .6).toFixed(2);
      rain.appendChild(d);
    }
  }

  /* ===== Phone tilt ===== */
  const stage = $('.stage'), phone = $('.phone');
  if (stage && phone && fine && !reduce) {
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      phone.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 16}deg)`;
    });
    stage.addEventListener('pointerleave', () => { phone.style.transform = ''; });
  }

  /* ===== Liquid-glass highlight following the pointer ===== */
  if (fine) {
    $$('.glass').forEach(g => g.addEventListener('pointermove', e => {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  /* ===== Count-up numbers ===== */
  $$('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
    const run = () => {
      if (reduce) { el.textContent = target + suffix; return; }
      const t0 = performance.now(), dur = 1500;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(target * e) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { run(); o.disconnect(); } }, { threshold: .5 }).observe(el);
  });

  /* ===== Noise helpers ===== */
  const hash = (x, y, z) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const fade = t => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const noise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
    return mix(
      mix(mix(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), mix(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
      mix(mix(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), mix(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
  };
  const fbm = (x, y, z) => { let a = .5, f = 1, s = 0; for (let o = 0; o < 4; o++) { s += a * noise(x * f, y * f, z * f); f *= 2; a *= .5; } return s; };

  /* ===== Weather map ===== */
  const mapCanvas = $('#map');
  if (mapCanvas) {
    const ctx = mapCanvas.getContext('2d');
    const B = { lon0: -9, lon1: 13, lat0: 40, lat1: 53 };
    const FRANCE = [[2.37,51.05],[3.1,50.78],[4.2,50.0],[4.85,50.15],[5.8,49.55],[6.4,49.45],[7.0,49.15],[8.2,48.95],[7.6,47.6],[6.9,47.2],[6.1,46.2],[6.9,45.9],[7.0,45.3],[7.6,44.15],[7.5,43.78],[6.9,43.5],[6.1,43.1],[5.4,43.3],[4.5,43.4],[3.2,43.3],[3.1,42.45],[1.7,42.5],[0.7,42.8],[-0.7,43.0],[-1.5,43.4],[-1.2,44.6],[-1.1,45.6],[-1.15,46.15],[-2.2,47.2],[-2.9,47.5],[-4.4,47.8],[-4.7,48.0],[-4.8,48.5],[-3.5,48.8],[-2.0,48.7],[-1.5,48.6],[-1.6,49.7],[-0.2,49.3],[0.1,49.5],[1.5,50.2],[1.85,50.95]];
    const CORSICA = [[8.6,42.6],[9.4,42.95],[9.5,41.9],[9.0,41.4],[8.6,41.9]];
    const CITIES = [['Paris', 2.35, 48.85], ['Lyon', 4.83, 45.76], ['Marseille', 5.37, 43.3], ['Lille', 3.06, 50.63], ['Bordeaux', -.58, 44.84], ['Strasbourg', 7.75, 48.58], ['Nantes', -1.55, 47.22], ['Toulouse', 1.44, 43.6]];

    // Same colour language as the app's legends.
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const lut = stops => {
      const out = new Uint8ClampedArray(256 * 4);
      for (let i = 0; i < 256; i++) {
        const v = i / 255; let k = 1; while (k < stops.length - 1 && v > stops[k][0]) k++;
        const a = stops[k - 1], b = stops[k], t = Math.min(1, Math.max(0, (v - a[0]) / (b[0] - a[0] || 1)));
        const ca = hex(a[1]), cb = hex(b[1]);
        out[i * 4] = mix(ca[0], cb[0], t); out[i * 4 + 1] = mix(ca[1], cb[1], t); out[i * 4 + 2] = mix(ca[2], cb[2], t);
        out[i * 4 + 3] = mix(a[2], b[2], t) * 255;
      }
      return out;
    };
    const PAL = {
      temp: lut([[0, '#af52de', .9], [.18, '#007aff', .9], [.36, '#32ade6', .9], [.55, '#34c759', .9], [.72, '#ffcc00', .92], [.86, '#ff9500', .94], [1, '#ff3b30', .96]]),
      rain: lut([[0, '#32ade6', 0], [.04, '#32ade6', 0], [.12, '#32ade6', .6], [.3, '#007aff', .88], [.5, '#34c759', .93], [.72, '#ffcc00', .96], [1, '#ff3b30', 1]]),
      wind: lut([[0, '#34c759', .5], [.12, '#34c759', .7], [.35, '#ffcc00', .9], [.6, '#ff9500', .95], [.8, '#ff3b30', 1], [1, '#af52de', 1]]),
      cloud: lut([[0, '#ffffff', 0], [.2, '#ffffff', 0], [.5, '#8c8c92', .5], [1, '#ffffff', .95]])
    };
    const LEG = {
      temp: 'linear-gradient(90deg,#af52de,#007aff,#32ade6,#34c759,#ffcc00,#ff9500,#ff3b30)',
      rain: 'linear-gradient(90deg,rgba(50,173,230,.4),#007aff,#34c759,#ffcc00,#ff3b30)',
      wind: 'linear-gradient(90deg,#34c759,#ffcc00,#ff9500,#ff3b30,#af52de)',
      cloud: 'linear-gradient(90deg,rgba(255,255,255,.05),#8c8c92,#fff)'
    };
    // value → 0..1 for each layer, plus the real-unit value for labels
    const startHour = new Date().getHours();
    const field = {
      temp: (x, y, t) => {
        const hr = (startHour + t) % 24, diurnal = Math.cos((hr - 15) / 24 * 6.283) * 3.4;
        const c = 7 + Math.min(1.25, Math.max(-.25, y)) * 16 + (fbm(x * 3 - t * .05, y * 3, t * .04) - .5) * 11 + diurnal;
        return [Math.min(1, Math.max(0, (c - 0) / 32)), c];
      },
      rain: (x, y, t) => {
        const n = fbm(x * 4.2 - t * .09, y * 4.2 + t * .012, t * .035), r = Math.max(0, n - .5) * 60;
        return [Math.min(1, r / 15), r];
      },
      wind: (x, y, t) => {
        const s = 12 + 62 * Math.pow(fbm(x * 2.4 - t * .035, y * 2.4, t * .028), 1.3);
        return [Math.min(1, s / 100), s];
      },
      cloud: (x, y, t) => {
        const c = Math.min(1, Math.max(0, (fbm(x * 3.3 - t * .06, y * 3.3, t * .05) - .36) * 3.4)) * 100;
        return [c / 100, c];
      }
    };

    let layer = 'temp', t = 0, playing = !reduce, W = 0, H = 0;
    // True proportions: 15° of latitude fill the height, longitude is scaled by cos(latitude),
    // France sits a little above the centre (the player bar covers the bottom).
    const LON_C = 2.5, LAT_C = 45.2, LAT_SPAN = 15, COS = Math.cos(46.5 * Math.PI / 180);
    const FW = 190; let FH = 160;
    let off = document.createElement('canvas'), octx = off.getContext('2d'), img = null;
    let sy = 1, sx = 1;
    const proj = (lon, lat) => [W / 2 + (lon - LON_C) * sx, H / 2 - (lat - LAT_C) * sy];
    const lonlat = (px, py) => [LON_C + (px - W / 2) / sx, LAT_C - (py - H / 2) / sy];
    // fixed "weather space" so the fields stay put whatever the canvas size
    const norm = (lon, lat) => [(lon - B.lon0) / (B.lon1 - B.lon0), (B.lat1 - lat) / (B.lat1 - B.lat0)];

    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2), r = mapCanvas.getBoundingClientRect();
      W = mapCanvas.width = Math.max(300, Math.round(r.width * d)); H = mapCanvas.height = Math.max(300, Math.round(r.height * d));
      sy = H / LAT_SPAN; sx = sy * COS;
      FH = Math.max(60, Math.round(FW * H / W));
      off.width = FW; off.height = FH; img = octx.createImageData(FW, FH);
    };

    const draw = () => {
      const f = field[layer], pal = PAL[layer], data = img.data;
      for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) {
        const [lo, la] = lonlat((i + .5) / FW * W, (j + .5) / FH * H), [xn, yn] = norm(lo, la);
        const v = f(xn, yn, t)[0], k = Math.max(0, Math.min(255, v * 255 | 0)) * 4, p = (j * FW + i) * 4;
        data[p] = pal[k]; data[p + 1] = pal[k + 1]; data[p + 2] = pal[k + 2]; data[p + 3] = pal[k + 3];
      }
      octx.putImageData(img, 0, 0);

      // base: deep sea
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a1a3a'); g.addColorStop(1, '#06102a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // land (France) lightly lifted
      const path = poly => { ctx.beginPath(); poly.forEach(([lo, la], n) => { const [x, y] = proj(lo, la); n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
      ctx.fillStyle = 'rgba(120,160,230,.16)'; path(FRANCE); ctx.fill(); path(CORSICA); ctx.fill();
      // weather raster, smooth like the GPU upscaling in the app
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = .9; ctx.drawImage(off, 0, 0, W, H); ctx.globalAlpha = 1;

      // wind arrows
      if (layer === 'wind') {
        ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, W / 520);
        const cols = 19, rows = 16;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const cx = (i + .5) / cols * W, cy = (j + .5) / rows * H;
          const [lo, la] = lonlat(cx, cy), [x, y] = norm(lo, la), s = field.wind(x, y, t)[1];
          const a = (fbm(x * 1.7 + 5, y * 1.7, t * .02) - .5) * 5.2 + .35, L = W / cols * (.28 + s / 260);
          const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
          ctx.strokeStyle = 'rgba(255,255,255,.9)';
          ctx.beginPath(); ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy);
          const hx = Math.cos(a + 2.7) * L * .32, hy = Math.sin(a + 2.7) * L * .32, ix = Math.cos(a - 2.7) * L * .32, iy = Math.sin(a - 2.7) * L * .32;
          ctx.moveTo(cx + dx + hx, cy + dy + hy); ctx.lineTo(cx + dx, cy + dy); ctx.lineTo(cx + dx + ix, cy + dy + iy); ctx.stroke();
        }
      }
      // outline
      ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(140,210,255,.9)'; ctx.shadowBlur = W / 70;
      ctx.strokeStyle = 'rgba(230,245,255,.85)'; ctx.lineWidth = Math.max(1.4, W / 700);
      path(FRANCE); ctx.stroke(); path(CORSICA); ctx.stroke(); ctx.shadowBlur = 0;

      // cities with the value of the layer
      ctx.font = `700 ${Math.max(11, W / 78)}px -apple-system, system-ui, sans-serif`; ctx.textBaseline = 'middle';
      for (const [name, lo, la] of CITIES) {
        const [x, y] = proj(lo, la);
        const v = f(...norm(lo, la), t)[1];
        const txt = `${name} ${Math.round(layer === 'rain' ? Math.round(v * 10) / 10 : v)}${T.units[layer]}`;
        const w = ctx.measureText(txt).width + 16, h = Math.max(22, W / 52);
        ctx.fillStyle = 'rgba(6,14,34,.72)'; ctx.beginPath(); ctx.roundRect(x - 4, y - h / 2, w + 10, h, h / 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 6, y, 3.2, 0, 6.283); ctx.fill();
        ctx.fillText(txt, x + 15, y + .5);
      }
    };

    const label = () => {
      const hr = Math.round(t), d = new Date(); d.setHours(startHour + hr, 0, 0, 0);
      const clock = d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      $('#tlLabel').textContent = `${clock} · ${hr === 0 ? T.now : T.inH(hr)}`;
      $('#tlRange').value = t;
    };
    const setLayer = k => {
      layer = k;
      $$('.layers button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.layer === k)));
      mapCanvas.closest('.glass').style.setProperty('--lg', LEG[k]);
      const [a, b, c] = T.legend[k]; $('#lgA').textContent = a; $('#lgB').textContent = b; $('#lgC').textContent = c;
      if (!playing) draw();
    };
    $$('.layers button').forEach(b => b.textContent = T.layers[b.dataset.layer]);
    $$('.layers button').forEach(b => b.addEventListener('click', () => setLayer(b.dataset.layer)));
    $('#tlRange').addEventListener('input', e => { t = parseFloat(e.target.value); setPlay(false); label(); draw(); });
    const playBtn = $('#tlPlay');
    const ICON_PLAY = '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z"/></svg>', ICON_PAUSE = '<svg viewBox="0 0 16 16"><path d="M3.5 2h3.4v12H3.5zM9.1 2h3.4v12H9.1z"/></svg>';
    const setPlay = on => { playing = on; playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY; };
    playBtn.addEventListener('click', () => setPlay(!playing));

    let raf = 0, last = 0, visible = false;
    const loop = ts => {
      if (!visible) return;
      if (playing && ts - last > 33) {
        t += (ts - last) / 1000 * 2.2; if (t > 24) t = 0; last = ts; label(); draw();
      } else if (!playing) last = ts;
      raf = requestAnimationFrame(loop);
    };
    resize(); addEventListener('resize', () => { resize(); draw(); });
    $('#mapBadge').textContent = `${T.forecast} · ${T.badge}`;
    setLayer('temp'); setPlay(playing); label(); draw();
    whileVisible(mapCanvas, () => { visible = true; last = performance.now(); raf = requestAnimationFrame(loop); }, () => { visible = false; cancelAnimationFrame(raf); });
  }

  /* ===== Models chart ===== */
  const chart = $('#chart');
  if (chart) {
    const M = [
      { id: 'AROME', c: '#5ccbff', d: 1.0, p: .3 }, { id: 'ICON', c: '#45e0b0', d: -1.3, p: 1.4 }, { id: 'ARPEGE', c: '#ffb84a', d: 1.9, p: 2.5 },
      { id: 'GFS', c: '#ff6fa8', d: -2.4, p: 3.6 }, { id: 'ECMWF', c: '#b58cff', d: .4, p: 4.7 }
    ];
    const X0 = 40, X1 = 620, Y0 = 20, Y1 = 250, TMIN = 4, TMAX = 26, HZ = 72;
    const base = h => 15 + 6.2 * Math.sin((h - 9) / 24 * 6.283);
    const val = (m, h) => base(h) + m.d * Math.pow(h / HZ, 1.15) * 3.4 + Math.sin(h / 8 + m.p) * (h / HZ) * 1.7;
    const px = h => X0 + (X1 - X0) * h / HZ, py = v => Y1 - (Y1 - Y0) * (v - TMIN) / (TMAX - TMIN);
    const ns = 'http://www.w3.org/2000/svg';
    const mk = (n, a) => { const e = document.createElementNS(ns, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const grid = mk('g', { class: 'grid' });
    for (let v = 5; v <= 25; v += 5) { grid.append(mk('line', { x1: X0, x2: X1, y1: py(v), y2: py(v) })); const tx = mk('text', { x: 6, y: py(v) + 4 }); tx.textContent = v + '°'; grid.append(tx); }
    for (let h = 0; h <= HZ; h += 12) { const tx = mk('text', { x: px(h), y: Y1 + 22, 'text-anchor': 'middle' }); tx.textContent = h === 0 ? (lang === 'fr' ? 'Maint.' : 'Now') : `+${h} h`; grid.append(tx); }
    chart.append(grid);
    const pts = h => Array.from({ length: HZ + 1 }, (_, i) => i).filter(i => i % 1 === 0);
    const band = mk('path', { class: 'band', fill: 'url(#bandg)' });
    let top = '', bot = [];
    for (let h = 0; h <= HZ; h += 2) {
      const vs = M.map(m => val(m, h)), hi = Math.max(...vs), lo = Math.min(...vs);
      top += `${h ? 'L' : 'M'}${px(h).toFixed(1)},${py(hi).toFixed(1)} `; bot.unshift(`L${px(h).toFixed(1)},${py(lo).toFixed(1)} `);
    }
    band.setAttribute('d', top + bot.join('') + 'Z'); chart.append(band);
    const lines = M.map((m, i) => {
      let d = ''; for (let h = 0; h <= HZ; h += 2) d += `${h ? 'L' : 'M'}${px(h).toFixed(1)},${py(val(m, h)).toFixed(1)} `;
      const p = mk('path', { class: 'm', d, stroke: m.c, style: `--dl:${i * .18}s` }); chart.append(p); return p;
    });
    const cursor = mk('line', { y1: Y0 - 6, y2: Y1, stroke: 'rgba(255,255,255,.5)', 'stroke-dasharray': '4 5' }); chart.append(cursor);
    const dots = M.map(m => { const c = mk('circle', { r: 5.5, fill: m.c, stroke: '#fff', 'stroke-width': 1.6 }); chart.append(c); return c; });
    const range = $('#hzRange'), spreadEl = $('#spread'), agreeEl = $('#agreeNum'), meter = $('#meterFill'), hzLabel = $('#hzLabel');
    const update = () => {
      const h = parseFloat(range.value), vs = M.map(m => val(m, h)), sp = Math.max(...vs) - Math.min(...vs);
      cursor.setAttribute('x1', px(h)); cursor.setAttribute('x2', px(h));
      dots.forEach((c, i) => { c.setAttribute('cx', px(h)); c.setAttribute('cy', py(vs[i])); c.style.display = M[i].on === false ? 'none' : ''; });
      const agree = Math.max(6, Math.min(99, Math.round(100 - sp * 7.5)));
      spreadEl.textContent = sp.toFixed(1).replace('.', lang === 'fr' ? ',' : '.') + ' °C';
      agreeEl.textContent = agree + ' %'; meter.style.width = agree + '%'; hzLabel.textContent = T.horizon(Math.round(h));
    };
    range.addEventListener('input', update);
    $$('.legend-m button').forEach((b, i) => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); M[i].on = on;
      lines[i].style.opacity = on ? 1 : .08; update();
    }));
    update();
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { chart.classList.add('go'); o.disconnect(); } }, { threshold: .3 }).observe(chart);
  }

  /* ===== Moon ===== */
  const lit = $('#moonLit');
  if (lit) {
    const r = 200, cx = 200, cy = 200;
    let p = .12, last = 0, visible = false, raf = 0;
    const render = () => {
      const c = Math.cos(p * 6.283), rx = Math.abs(c) * r, sweep = c > 0 ? 0 : 1;
      lit.setAttribute('d', `M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} A${rx.toFixed(2)},${r} 0 0 ${sweep} ${cx},${cy - r}Z`);
      $('#moonFlip').setAttribute('transform', p > .5 ? `translate(${cx * 2},0) scale(-1,1)` : '');
      const k = (1 - c) / 2;
      const idx = p < .03 || p >= .97 ? 0 : p < .22 ? 1 : p < .28 ? 2 : p < .47 ? 3 : p < .53 ? 4 : p < .72 ? 5 : p < .78 ? 6 : 7;
      $('#moonPct').textContent = Math.round(k * 100) + ' %';
      $('#moonName').textContent = T.phases[idx];
      $('#moonAge').textContent = (p * 29.53).toFixed(1).replace('.', lang === 'fr' ? ',' : '.') + (lang === 'fr' ? ' j' : ' d');
    };
    const loop = ts => { if (!visible) return; p = (p + (ts - last) / 1000 / 26) % 1; last = ts; render(); raf = requestAnimationFrame(loop); };
    render();
    if (!reduce) whileVisible(lit.closest('svg'), () => { visible = true; last = performance.now(); raf = requestAnimationFrame(loop); }, () => { visible = false; cancelAnimationFrame(raf); });
  }

  /* ===== Ask Liquid: typing demo ===== */
  const q = $('#askQ');
  if (q) {
    const ans = $('#askA'), bubble = $('#askBubble'), bars = $$('#askBars i');
    const data = [0, 0, 0, .1, .3, 1.2, 2.8, 3.1, 1.4, .4, 0, 0];
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let running = false, token = 0;
    const type = async (el, txt, speed, my) => { el.textContent = ''; for (const ch of txt) { if (my !== token) return false; el.textContent += ch; await wait(speed); } return true; };
    const run = async () => {
      if (running) return; running = true; const my = ++token;
      while (my === token) {
        bubble.classList.remove('show'); bars.forEach(b => { b.style.height = '6%'; });
        ans.textContent = ''; q.textContent = '';
        await wait(500); if (!(await type(q, T.q, reduce ? 0 : 38, my))) break;
        await wait(700); bubble.classList.add('show');
        if (!(await type(ans, T.a, reduce ? 0 : 16, my))) break;
        bars.forEach((b, i) => { b.style.height = (6 + data[i] / 3.2 * 94) + '%'; b.classList.toggle('hot', data[i] > 2); });
        await wait(7000);
      }
      running = false;
    };
    if (reduce) { q.textContent = T.q; ans.textContent = T.a; bubble.classList.add('show'); bars.forEach((b, i) => { b.style.height = (6 + data[i] / 3.2 * 94) + '%'; b.classList.toggle('hot', data[i] > 2); }); }
    else whileVisible(q.closest('.ask'), run, () => { token++; running = false; });
  }

  /* ===== Watch ring ===== */
  $$('.ring-fg').forEach(el => new IntersectionObserver(([en], o) => { if (en.isIntersecting) { el.classList.add('go'); o.disconnect(); } }, { threshold: .5 }).observe(el));
})();
