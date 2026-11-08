/* Liquid Weather — le ciel vivant.
   Un seul programme (WebGL, aucune bibliothèque) dessine tout le ciel : dégradé, soleil, nuages,
   étoiles, aurore et nuages (la Lune est une vraie photo posée par la page ; pluie, neige et éclairs viennent de fx.js).
   Il ne contacte aucun serveur. Sans WebGL, le site garde un dégradé CSS. */
(function (root) {
  'use strict';

  var VERT = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';

  var FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 uRes;uniform float uTime;uniform float uSun;uniform float uSunX;',
    'uniform float uCloud;uniform float uRain;uniform float uSnow;uniform float uDark;',
    'uniform float uAurora;uniform float uFlash;uniform float uFlashX;',
    'uniform float uCirrus;uniform float uFog;',
    'uniform float uDrift;uniform vec2 uPtr;',

    'float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' float a=hash21(i),b=hash21(i+vec2(1.,0.)),c=hash21(i+vec2(0.,1.)),d=hash21(i+vec2(1.,1.));',
    ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);',
    ' for(int i=0;i<OCT;i++){v+=a*vnoise(p);p=m*p+vec2(3.1,1.7);a*=.5;}return v;}',
    'float fbm3(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);',
    ' for(int i=0;i<3;i++){v+=a*vnoise(p);p=m*p+vec2(3.1,1.7);a*=.5;}return v;}',

    'void main(){',
    ' vec2 uv=vUv;float asp=uRes.x/uRes.y;float s=uSun;',

    // --- moment de la journée
    ' float day=smoothstep(-.02,.5,s);float night=smoothstep(.02,-.32,s);float tw=max(1.-day-night,0.);',
    ' float over=clamp(uCloud*.8+uDark*.5,0.,1.);',

    // --- dégradé du ciel
    ' float g=pow(1.-uv.y,1.5);',
    ' vec3 cDay=mix(vec3(.05,.25,.70),vec3(.38,.66,.95),g);',
    ' vec3 cNight=mix(vec3(.010,.020,.085),vec3(.045,.075,.205),g);',
    ' vec3 cDusk=mix(vec3(.11,.14,.42),vec3(.52,.29,.57),smoothstep(0.,.55,g));',
    ' cDusk=mix(cDusk,vec3(1.,.55,.33),smoothstep(.45,1.,g));',
    ' vec3 sky=(cDay*day+cNight*night+cDusk*tw)/max(day+night+tw,.001);',

    // --- soleil
    ' vec2 sunPos=vec2(uSunX,mix(.03,.80,clamp((s+.08)/.95,0.,1.)));',
    ' vec2 sd=(uv-sunPos)*vec2(asp,1.);float sr=length(sd);',
    ' float sunVis=smoothstep(-.14,-.02,s)*(1.-over*.82)*(1.-uFog*.85);',
    ' vec3 sunCol=mix(vec3(1.,.50,.22),vec3(1.,.96,.86),smoothstep(0.,.5,s));',
    ' float halo=exp(-sr*3.2)*.34+exp(-sr*9.)*.5;',
    ' sky+=sunCol*halo*sunVis*(.5+.5*(1.-night));',

    // --- ciel couvert / orage : on éteint les couleurs
    ' float lum=dot(sky,vec3(.299,.587,.114));',
    ' sky=mix(sky,vec3(lum)*vec3(.90,.98,1.08),over*.6);',
    ' sky*=1.-uDark*.5;',
    ' sky=mix(sky,vec3(.62,.69,.80)*(.42+.58*day),uSnow*.55);',

    // --- nuages : bruit en 2D, plus petits vers l'horizon (le bas de l'écran)
    // « deck » : quand le ciel est couvert, les nuages forment une nappe continue (pas des îlots sur fond bleu)
    ' float deck=smoothstep(.55,.95,uCloud);',
    ' float dp=mix(1.5,1.0,uv.y);',
    ' vec2 cp=vec2((uv.x-.5)*asp,uv.y*.85)*dp*1.5+vec2(uDrift*.05+uPtr.x*.03,uDrift*.012+uPtr.y*.02);',
    ' float f=fbm(cp);',
    ' float cover=mix(mix(.66,.30,uCloud),.10,deck);float soft=mix(.22-.10*uCloud,.32,deck);',
    ' float dens=smoothstep(cover,cover+soft,f);dens*=1.-uFog*.8;',
    ' vec2 toSun=normalize(sunPos-uv+vec2(1e-4));',
    ' float f2=fbm(cp+vec2(toSun.x*asp,toSun.y)*.12);',
    ' float light=clamp(.58+(f-f2)*7.,0.,1.);light=mix(light,.4,uCloud*.35);',
    // ciel couvert : des plaques un peu plus claires ou plus sombres, sans lumière qui vient d'un côté
    ' float ctex=fbm3(cp*2.4+vec2(7.3,2.1));',
    ' light=mix(light,clamp(.10+ctex*1.05,0.,1.),deck*.78);',
    ' vec3 lit=mix(vec3(.78,.84,.95),vec3(1.,.995,.98),day);',
    ' lit=mix(lit,vec3(1.,.74,.58),tw*.85);lit=mix(lit,vec3(.30,.36,.58),night);',
    ' vec3 shade=mix(vec3(.42,.50,.68),vec3(.50,.62,.82),day);',
    ' shade=mix(shade,vec3(.38,.26,.50),tw*.8);shade=mix(shade,vec3(.03,.05,.13),night);',
    // couvert = gris clair ; neige = plus pâle, un peu bleuté ; puis on assombrit pour la pluie et l'orage
    ' lit=mix(lit,vec3(.84,.86,.91),deck*.80*day);shade=mix(shade,vec3(.54,.58,.66),deck*.85*day);',
    ' lit=mix(lit,vec3(.88,.91,.96),uSnow*.55*day);shade=mix(shade,vec3(.62,.68,.78),uSnow*.55*day);',
    ' lit=mix(lit,vec3(.50,.54,.62),uDark*.85);shade=mix(shade,vec3(.07,.09,.14),uDark);',
    ' vec3 cc=mix(shade,lit,light);',
    ' vec3 col=mix(sky,cc,dens*mix(.96,1.,uCloud));',
    ' col+=sunCol*halo*.22*sunVis*dens*(1.-uDark);',

    // --- disque du soleil, vu à travers les trous
    // un cœur très clair avec un bord doux, puis l'éblouissement autour : le Soleil ne doit pas ressembler à une pièce posée sur le ciel
    ' float disc=smoothstep(.040,.022,sr);',
    ' float sv=smoothstep(-.14,-.02,s)*(1.-uFog*.85);',
    ' col=mix(col,vec3(1.,.97,.9),disc*sv*(1.-dens*.9)*(1.-over*.55));',
    ' col+=sunCol*(exp(-sr*24.)*.30+exp(-sr*80.)*.55)*sv*(1.-dens*.75)*(1.-over*.5);',

    // --- cirrus : filaments étirés, qui suivent une courbe douce ; plus nombreux et plus brillants quand uCirrus monte
    ' vec2 cp0=vec2((uv.x-.5)*asp,uv.y);',
    ' cp0.y+=.16*sin(cp0.x*1.5+.7)+.10*cp0.x;',
    ' float cn=fbm3(vec2(cp0.x*.95+uDrift*.016,cp0.y*5.2));',
    ' float cm=fbm3(vec2(cp0.x*2.6-uDrift*.03,cp0.y*13.)+cn*1.8);',
    ' float clo=.54-.17*uCirrus;',
    ' float ci=smoothstep(clo,clo+.26,cn)*smoothstep(.26-.10*uCirrus,.72,cm);',
    ' ci*=smoothstep(.04,.55,uv.y);',
    ' vec3 cirC=mix(lit,sunCol,(.45*exp(-sr*2.2)*day+.25*tw)*(.4+.6*uCirrus));',
    ' col=mix(col,cirC,ci*(.20+.66*uCirrus)*(1.-dens*(.85-.35*uCirrus))*(1.-uDark)*(1.-night*.8)*(1.-uFog*.6));',

    // --- visibilité de nuit (étoiles, Lune, aurore) : cachées par les nuages
    ' float nv=night*(1.-dens)*(1.-over*.85)*(1.-uFog*.9);',

    // --- étoiles
    ' float cells=clamp(uRes.y/9.,60.,130.);',
    ' vec2 sg=uv*vec2(asp,1.)*cells;vec2 sid=floor(sg);vec2 sf=fract(sg)-.5;',
    ' float sh=hash21(sid);vec2 so=vec2(hash21(sid+7.3),hash21(sid+19.1))-.5;',
    ' float star=step(.965,sh)*smoothstep(.12,0.,length(sf-so*.7));',
    ' float tws=.65+.35*sin(uTime*(.8+sh*3.)+sh*60.);',
    ' star*=tws*(.4+.9*hash21(sid+3.3))*smoothstep(.05,.55,uv.y);',
    ' col+=vec3(.85,.92,1.)*star*nv;',

    // --- aurore : rideaux plissés, rayons verticaux, zones qui s'éclairent puis s'éteignent
    ' if(uAurora>.01&&nv>.01){',
    '  float au=0.;',
    '  for(int i=0;i<3;i++){float fi=float(i);',
    '   float x=(uv.x-.5)*asp*1.6+fi*2.3;',
    '   float wav=sin(x*1.3+uTime*.10+fi*1.9)*.09+sin(x*2.9-uTime*.13+fi*3.1)*.04+(vnoise(vec2(x*5.,fi*4.+uTime*.05))-.5)*.05;',
    '   float yb=.55+fi*.07+wav;',
    '   float low=smoothstep(yb-.022,yb,uv.y);float up=exp(-max(uv.y-yb,0.)*(4.2+fi));',
    '   float rays=pow(vnoise(vec2(x*16.+fi*5.,fi*2.)),2.2)*1.7+.25;',
    '   float patch=smoothstep(.25,.75,vnoise(vec2(x*.9+fi*3.,uTime*.06+fi)));',
    '   au+=low*up*rays*patch*(.78-fi*.18);}',
    '  vec3 ac=mix(vec3(.18,1.,.58),vec3(.66,.36,1.),smoothstep(.55,.95,uv.y));',
    '  col+=ac*au*.55*uAurora*nv;',
    ' }',

    // --- brouillard : nappes laiteuses qui dérivent, plus épaisses près de l'horizon
    ' if(uFog>.01){',
    '  float fn=fbm3(vec2((uv.x-.5)*asp*1.3+uDrift*.035,uv.y*2.2+uDrift*.008));',
    '  float fn2=fbm3(vec2((uv.x-.5)*asp*2.6-uDrift*.05,uv.y*4.+3.7));',
    '  float lowf=pow(1.-uv.y,.9);',
    '  float fa=clamp(uFog*(.52+.50*lowf)*(.50+.85*fn)+uFog*.20*(fn2-.4),0.,.95);',
    '  vec3 fc=mix(vec3(.10,.13,.22),vec3(.78,.82,.89),day);fc=mix(fc,vec3(.80,.68,.64),tw*.55);',
    '  col=mix(col,fc,fa);',
    ' }',

    // --- pluie et neige : gouttes et flocons sont dessinés par fx.js (comme dans l'appli) ; ici, seulement l'air qui s'alourdit
    ' col*=1.-uRain*.16;',
    ' col=mix(col,vec3(dot(col,vec3(.34)))+vec3(.03,.04,.06),uRain*.22*(1.-uv.y*.6));',
    ' col=mix(col,vec3(.80,.84,.92),uSnow*.16*pow(1.-uv.y,2.));',

    // --- éclair : on éclaire surtout les nuages
    ' float fl=exp(-pow((uv.x-uFlashX)*asp,2.)*1.5);',
    ' col+=vec3(.62,.70,1.)*(.06+.42*dens)*uFlash*(.45+.75*fl);',

    // --- vignette légère + grain (évite les bandes dans les dégradés)
    ' vec2 vp=(uv-.5)*vec2(1.,.9);col*=1.-.26*dot(vp,vp);',
    ' col+=(hash21(gl_FragCoord.xy+fract(uTime))-.5)/255.*1.6;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  /* États du ciel (le site les mélange selon la section affichée, ou selon le choix du visiteur). */
  var PRESETS = {
    dawn:    { sun: 0.05, sunX: 0.74, cloud: 0.34, rain: 0, snow: 0, dark: 0, aurora: 0 },
    day:     { sun: 0.58, sunX: 0.80, cloud: 0.30, rain: 0, snow: 0, dark: 0, aurora: 0 },
    clear:   { sun: 0.60, sunX: 0.78, cloud: 0.10, rain: 0, snow: 0, dark: 0, aurora: 0 },
    fair:    { sun: 0.62, sunX: 0.78, cloud: 0.54, rain: 0, snow: 0, dark: 0, aurora: 0, cirrus: 0.45 },
    cloudy:  { sun: 0.42, sunX: 0.70, cloud: 0.92, rain: 0, snow: 0, dark: 0.12, aurora: 0 },
    rain:    { sun: 0.28, sunX: 0.60, cloud: 1.00, rain: 0.85, snow: 0, dark: 0.40, aurora: 0 },
    drizzle: { sun: 0.30, sunX: 0.55, cloud: 0.90, rain: 0.42, snow: 0, dark: 0.18, aurora: 0 },
    storm:   { sun: 0.20, sunX: 0.50, cloud: 1.00, rain: 1.00, snow: 0, dark: 0.85, aurora: 0 },
    snow:    { sun: 0.32, sunX: 0.65, cloud: 1.00, rain: 0, snow: 0.90, dark: 0.04, aurora: 0 },
    fog:     { sun: 0.34, sunX: 0.56, cloud: 0.50, rain: 0, snow: 0, dark: 0.02, aurora: 0, fog: 1 },
    cirrus:  { sun: 0.42, sunX: 0.70, cloud: 0.72, rain: 0, snow: 0, dark: 0, aurora: 0, cirrus: 1 },
    golden:  { sun: 0.13, sunX: 0.30, cloud: 0.42, rain: 0, snow: 0, dark: 0, aurora: 0, cirrus: 0.55 },
    dusk:    { sun: -0.04, sunX: 0.22, cloud: 0.38, rain: 0, snow: 0, dark: 0, aurora: 0 },
    night:   { sun: -0.46, sunX: 0.30, cloud: 0.22, rain: 0, snow: 0, dark: 0, aurora: 0 },
    aurora:  { sun: -0.50, sunX: 0.30, cloud: 0.10, rain: 0, snow: 0, dark: 0, aurora: 1 }
  };
  var KEYS = ['sun', 'sunX', 'cloud', 'rain', 'snow', 'dark', 'aurora', 'cirrus', 'fog'];
  Object.keys(PRESETS).forEach(function (n) { KEYS.forEach(function (k) { if (PRESETS[n][k] == null) PRESETS[n][k] = 0; }); });

  /* Phase de la Lune (0 = nouvelle, 0,5 = pleine), calcul simple et sans réseau. */
  function moonPhase(date) {
    var days = ((date || new Date()).getTime() / 86400000) + 2440587.5 - 2451550.1; // depuis la nouvelle Lune du 6 janv. 2000
    var p = (days / 29.530588853) % 1;
    return p < 0 ? p + 1 : p;
  }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (root.console) console.error('[ciel] shader : ' + gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function copy(o) { var r = {}; KEYS.forEach(function (k) { r[k] = o[k] || 0; }); return r; }

  /* mount(canvas, options) → { set, setDrift, render, pause, play, paused, state, destroy } ou null si WebGL est absent. */
  function mount(canvas, opts) {
    opts = opts || {};
    var reduced = !!opts.reduced;
    var small = Math.min(root.innerWidth || 1024, root.innerHeight || 768) < 700 || /Android|iPhone|iPad|Mobi/i.test(root.navigator.userAgent || '');
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'default' }) ||
           canvas.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) return null;
    var hp = gl.getShaderPrecisionFormat && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || hp.precision < 16) return null;

    var frag = '#define OCT ' + (small ? 4 : 5) + '\n' + FRAG;
    var vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes', 'uTime', 'uSun', 'uSunX', 'uCloud', 'uRain', 'uSnow', 'uDark', 'uAurora', 'uFlash', 'uFlashX', 'uDrift', 'uPtr', 'uCirrus', 'uFog']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var cur = copy(PRESETS.day), target = copy(PRESETS.day);
    var time = 3.7, drift = 0, flash = 0, flashX = 0.5, flashAt = 0, nextFlash = 5 + Math.random() * 6, extFlash = false;
    var ptr = [0, 0], ptrT = [0, 0];
    var scale = opts.scale || (small ? 0.55 : 0.85), minScale = 0.34;
    var fpsCap = small ? 30 : 60;
    var paused = reduced, hidden = false, running = false, last = 0, acc = 0;
    var W = 0, H = 0, frames = 0, slow = 0;
    var settleLeft = 0;

    function size() {
      var w = canvas.clientWidth || root.innerWidth, h = canvas.clientHeight || root.innerHeight;
      var cw = Math.max(2, Math.round(w * scale)), ch = Math.max(2, Math.round(h * scale));
      if (cw !== W || ch !== H) { W = canvas.width = cw; H = canvas.height = ch; gl.viewport(0, 0, W, H); }
    }

    function render() {
      size();
      gl.uniform2f(U.uRes, W, H);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uSun, cur.sun); gl.uniform1f(U.uSunX, cur.sunX);
      gl.uniform1f(U.uCloud, cur.cloud); gl.uniform1f(U.uRain, cur.rain); gl.uniform1f(U.uSnow, cur.snow);
      gl.uniform1f(U.uDark, cur.dark); gl.uniform1f(U.uAurora, cur.aurora);
      gl.uniform1f(U.uCirrus, cur.cirrus); gl.uniform1f(U.uFog, cur.fog);
      gl.uniform1f(U.uFlash, flash); gl.uniform1f(U.uFlashX, flashX);
      gl.uniform1f(U.uDrift, drift); gl.uniform2f(U.uPtr, ptr[0], ptr[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function approach(dt, rate) {
      var k = 1 - Math.exp(-dt * rate), moving = false;
      KEYS.forEach(function (key) {
        var d = target[key] - cur[key];
        if (Math.abs(d) > 0.0005) { cur[key] += d * k; moving = true; } else cur[key] = target[key];
      });
      return moving;
    }

    function lightning(dt) {
      if (extFlash) return;
      if (reduced || cur.dark < 0.5) { flash = 0; return; }
      if (flashAt > 0) {
        flashAt += dt;
        // deux éclats doux, jamais de stroboscope
        var t = flashAt;
        flash = t < 0.05 ? t / 0.05 : t < 0.14 ? 1 - (t - 0.05) / 0.09 * 0.7 : t < 0.22 ? 0.3 + (t - 0.14) / 0.08 * 0.6 : t < 0.8 ? 0.9 * Math.exp(-(t - 0.22) * 5) : 0;
        if (t > 0.8) { flashAt = 0; flash = 0; nextFlash = 6 + Math.random() * 8; }
      } else {
        nextFlash -= dt;
        if (nextFlash <= 0) flashAt = 0.0001;
      }
    }

    function frame(now) {
      running = false;
      if (hidden) return;
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0.016;
      var step = 1000 / fpsCap;
      if (last && now - last < step - 1) { loop(); return; }
      last = now;
      var moving = approach(dt, reduced ? 40 : 3.4);
      ptr[0] += (ptrT[0] - ptr[0]) * Math.min(1, dt * 3); ptr[1] += (ptrT[1] - ptr[1]) * Math.min(1, dt * 3);
      if (!paused) { time += dt; drift += dt * (0.35 + cur.dark * 0.9 + cur.rain * 0.4); lightning(dt); }
      var t0 = root.performance.now();
      render();
      // qualité adaptative : si l'appareil peine, on baisse la définition (le ciel reste doux)
      if (!reduced && ++frames > 20) {
        var spent = (now - (frame.prev || now));
        frame.prev = now;
        if (spent > 1000 / 26) slow++; else slow = Math.max(0, slow - 1);
        if (slow > 25 && scale > minScale) { scale = Math.max(minScale, scale * 0.8); slow = 0; size(); render(); }   // redessiner tout de suite : changer la taille efface le canevas
      } else frame.prev = now;
      if (!paused || moving || settleLeft-- > 0) loop();
    }

    function loop() {
      if (running || hidden) return;
      running = true; root.requestAnimationFrame(frame);
    }

    function wake() { last = 0; settleLeft = 3; loop(); }

    function onVis() { hidden = root.document.hidden; if (!hidden) wake(); }
    root.document.addEventListener('visibilitychange', onVis);
    root.addEventListener('resize', wake);
    if (!reduced && opts.pointer !== false && root.matchMedia && root.matchMedia('(pointer:fine)').matches) {
      root.addEventListener('pointermove', function (e) { ptrT[0] = e.clientX / root.innerWidth * 2 - 1; ptrT[1] = 1 - e.clientY / root.innerHeight * 2; }, { passive: true });
    }

    wake();

    return {
      PRESETS: PRESETS,
      /* Choisit le ciel visé : un nom ('rain') ou un objet {sun, cloud…}. instant:true = sans transition. */
      set: function (state, o) {
        var s = typeof state === 'string' ? PRESETS[state] : state;
        if (!s) return;
        KEYS.forEach(function (k) { target[k] = s[k] != null ? s[k] : 0; });
        if (o && o.instant) KEYS.forEach(function (k) { cur[k] = target[k]; });
        wake();
      },
      setDrift: function (d) { drift = d; },
      /* l'éclair dessiné par fx.js éclaire aussi les nuages : intensité, et position horizontale (0 à 1) */
      setFlash: function (v, x) { extFlash = true; flash = v; if (x != null) flashX = x; },
      render: function (t) { if (t != null) time = t; render(); },
      pause: function () { paused = true; },
      play: function () { if (!reduced) { paused = false; wake(); } },
      paused: function () { return paused; },
      state: function () { return copy(cur); },
      nudge: wake
    };
  }

  /* Couleurs de secours (dégradé CSS) pour un état donné — sert quand WebGL manque. */
  function gradient(st) {
    function mix(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
    function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    var s = st.sun, day = sm(-.02, .5, s), night = sm(.02, -.32, s), tw = Math.max(1 - day - night, 0), n = Math.max(day + night + tw, .001);
    function pal(dt, nt, wt) { return [0, 1, 2].map(function (i) { return (dt[i] * day + nt[i] * night + wt[i] * tw) / n; }); }
    var top = pal([.05, .25, .70], [.01, .02, .085], [.11, .14, .42]);
    var bot = pal([.38, .66, .95], [.045, .075, .205], [1, .55, .33]);
    var over = Math.min(1, st.cloud * .8 + st.dark * .5 + (st.fog || 0) * .7);
    var grey = function (c) { var l = .3 * c[0] + .59 * c[1] + .11 * c[2]; return mix(c, [l * .9, l * .98, l * 1.08], over * .6).map(function (v) { return v * (1 - st.dark * .5); }); };
    function css(c) { return 'rgb(' + c.map(function (v) { return Math.round(Math.max(0, Math.min(1, v)) * 255); }).join(',') + ')'; }
    return { top: css(grey(top)), bottom: css(grey(bot)) };
  }

  root.LWSky = { mount: mount, PRESETS: PRESETS, moonPhase: moonPhase, gradient: gradient };
})(window);
