#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère les pages du site (français + anglais) à la racine du dépôt.

    python3 tools/build_site.py            # écrit les .html à la racine
    python3 tools/build_site.py --preview  # idem, sans ?v=… sur les fichiers (pour l'aperçu privé)

Les textes sont dans tools/i18n.py. Les articles ne passent pas par ici : le site lit actualites/index.json
au moment où la page s'ouvre, donc un nouvel article apparaît sans rien régénérer.
"""
import hashlib, html, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from i18n import T, BASE, APP_STORE, COFFEE, MAIL, FILES  # noqa: E402

PREVIEW = "--preview" in sys.argv
ANNOUNCE = "2026-10-27-cartes-pollution-vigilance-apple-pcc"
esc = lambda s: html.escape(s, quote=True)


def ver(path):
    if PREVIEW:
        return path
    with open(os.path.join(ROOT, path), "rb") as f:
        return "%s?v=%s" % (path, hashlib.md5(f.read()).hexdigest()[:8])


# ---------------------------------------------------------------- icônes (24×24, trait)
def ico(body, extra=""):
    return ('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" '
            'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" %s>%s</svg>' % (extra, body))

CLOUD = '<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a4.25 4.25 0 0 1 .5 8.5z"/>'
ICON = {
    "apple": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M16.5 3c.1 1.2-.4 2.4-1.1 3.2-.8.9-1.9 1.5-3 1.4-.1-1.2.4-2.4 1.1-3.1.8-.9 2-1.4 3-1.5zM20 17.2c-.5 1.2-.8 1.7-1.5 2.7-1 1.4-2.3 3.1-4 3.1-1.5 0-1.9-1-3.9-1s-2.5 1-4 1c-1.7 0-2.9-1.6-3.9-3C.9 16.200.6 11.700 2.100 9.300 3.200 7.600 5 6.600 6.700 6.600c1.700 0 2.800 1 4.200 1 1.400 0 2.200-1 4.200-1 1.500 0 3.100.8 4.200 2.200-3.700 2-3.100 7.300.7 8.400z"/></svg>',
    "cup": ico('<path d="M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5v2M12 2.5v2"/>'),
    "mail": ico('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
    "auto": ico('<path d="M20 12a8 8 0 0 1-13.7 5.6"/><path d="M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18 3v4h-4M6 21v-4h4"/>'),
    "clear": ico('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.500 1.500M17.200 17.200l1.500 1.500M5.300 18.700l1.500-1.500M17.200 6.800l1.500-1.500"/>'),
    "cloudy": ico(CLOUD),
    "rain": ico('<path d="M7 15a4 4 0 0 1-.5-7.970A5.500 5.500 0 0 1 17 6.500a4.250 4.250 0 0 1 .5 8.500"/><path d="M8 18l-1 2.500M12.500 18l-1 2.500M17 18l-1 2.500"/>'),
    "storm": ico('<path d="M7 15a4 4 0 0 1-.5-7.970A5.500 5.500 0 0 1 17 6.500a4.250 4.250 0 0 1 .5 8.500"/><path d="m12.500 12-2.500 4h3.500l-2 4.500"/>'),
    "snow": ico('<path d="M12 3v18M4.200 7.500l15.600 9M19.800 7.500l-15.600 9"/><path d="m9.500 4.500 2.500 2 2.500-2M9.500 19.500l2.500-2 2.500 2"/>'),
    "night": ico('<path d="M20 14.500A8.500 8.500 0 0 1 9.500 4a8.500 8.500 0 1 0 10.500 10.500z"/>'),
    "pause": ico('<path d="M9 5v14M15 5v14"/>'),
    "play": ico('<path d="M8 5.500v13l10.500-6.500z"/>'),
    "chev": ico('<path d="m15 5-7 7 7 7"/>'),
    "down": ico('<path d="M6 9.500l6 6 6-6"/>'),
    "share": ico('<path d="M12 15V3.500M7.500 8 12 3.500 16.500 8"/><path d="M5 12v6.500A1.500 1.500 0 0 0 6.500 20h11a1.500 1.500 0 0 0 1.500-1.500V12"/>'),
    "ext": ico('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.500A1.500 1.500 0 0 1 16.500 20h-11A1.500 1.500 0 0 1 4 18.500v-11A1.500 1.500 0 0 1 5.500 6H10"/>'),
    # onglets de l'app
    "house": ico('<path d="M3.500 11 12 4l8.500 7"/><path d="M5.500 9.500V20h13V9.500"/><path d="M10 20v-5.500h4V20"/>'),
    "calendar": ico('<rect x="3.500" y="5" width="17" height="15.500" rx="3"/><path d="M3.500 10h17M8 3v4M16 3v4"/>'),
    "grid": ico('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
    "map": ico('<path d="m3.500 6.500 5.500-2 6 2.500 5.500-2v13l-5.500 2-6-2.500-5.500 2z"/><path d="M9 4.500v13M15 7v13"/>'),
    "moonstars": ico('<path d="M19.500 14A8 8 0 0 1 10 4.500 8 8 0 1 0 19.500 14z"/><path d="M17 3.500v3M15.500 5h3"/>'),
}

# ---------------------------------------------------------------- données de la visite (captures réelles)
TOUR = {
    "screen": [660, 1434],
    "hots": {"home": [5.682, 91.736, 19.318, 5.649], "forecast": [23.0, 91.736, 19.318, 5.649],
             "compare": [40.341, 91.736, 19.318, 5.649], "maps": [57.682, 91.736, 19.318, 5.649],
             "moon": [75.0, 91.736, 19.318, 5.649]},
    "tabs": [
        {"id": "home", "ratio": 6.7242, "layers": [{"img": "assets/home.webp"}], "top": "assets/home-top.webp", "bot": "assets/home-tab.webp"},
        {"id": "forecast", "ratio": 7.25, "layers": [{"img": "assets/forecast-s0.webp", "label": "Températures"}, {"img": "assets/forecast-s1.webp", "label": "Précipitations"}], "top": "assets/forecast-top.webp", "bot": "assets/forecast-tab.webp"},
        {"id": "compare", "ratio": 7.4636, "layers": [{"img": "assets/compare-s0.webp", "label": "Résumé"}, {"img": "assets/compare-s1.webp", "label": "Quelques Nuages"}, {"img": "assets/compare-s2.webp", "label": "Thermomètre"}], "top": "assets/compare-top.webp", "bot": "assets/compare-tab.webp"},
        {"id": "maps", "layers": [{"img": "assets/map-l0.webp", "label": "Température"}, {"img": "assets/map-l1.webp", "label": "Précipitations"}, {"img": "assets/map-l2.webp", "label": "Vent"}, {"img": "assets/map-l3.webp", "label": "Nuages"}, {"img": "assets/map-l4.webp", "label": "Cumul neige"}],
         "times": ["assets/map-t%d.webp" % i for i in range(8)]},
        {"id": "moon", "ratio": 6.8667, "layers": [{"img": "assets/moon.webp"}], "top": "assets/moon-top.webp", "bot": "assets/moon-tab.webp"},
    ],
}

CHAPTERS = {
    "fr": [
        ("home", "house", "Accueil", "Votre ciel, d’un coup d’œil",
         "Une carte du ciel qui vit : nuages, pluie, neige, orage, Lune. Puis tout ce qui compte, de haut en bas.",
         ["Un résumé rédigé par l’IA de l’appareil, à partir des prévisions réelles", "Lever et coucher du soleil, prévision heure par heure",
          "Température, vent, humidité, visibilité, nébulosité, écart aux normales", "Probabilité de précipitations, qualité de l’air, risques météo, pression, rose des vents, pollen",
          "Touchez une carte pour ouvrir son détail complet"]),
        ("forecast", "calendar", "Prévisions", "Jusqu’à 10 jours, heure par heure",
         "Chaque variable a son graphique : températures, précipitations, vent, UV, pression… avec un curseur pour lire la valeur exacte.",
         ["Prévisions jusqu’à 10 jours et vue heure par heure", "Graphiques à glisser du doigt, valeurs lues à l’instant", "Deux modes d’affichage pour aller à l’essentiel ou au détail"]),
        ("compare", "grid", "Comparer", "Cinq modèles, un seul regard",
         "AROME, ICON, ARPEGE, GFS et ECMWF face à face : accords, désaccords, et évolution d’un calcul à l’autre.",
         ["Chaque modèle sur le même graphique", "Un classement des modèles et un indice d’accord", "Analyse des calculs précédents : la prévision change-t-elle ?"]),
        ("maps", "map", "Cartes", "Le ciel en mouvement",
         "Température, pluie, vent, nuages, neige, orages, animés heure par heure. Le modèle le plus fin est choisi selon votre zoom : AROME HD sur la France.",
         ["Couches : température, pluie, vent, rafales, nuages, neige…", "Curseur du temps et animation fluide", "Données officielles décodées sur l’appareil, sans serveur"]),
        ("moon", "moonstars", "Lunaria", "La Lune, calculée",
         "Phases réelles, lever et coucher, éclipses : tout vient des éphémérides, avec une vraie Lune qui change de phase.",
         ["Phase et illumination du jour", "Lever, coucher et culmination", "Calendrier lunaire"]),
    ],
    "en": [
        ("home", "house", "Home", "Your sky at a glance",
         "A living sky card: clouds, rain, snow, storms, the Moon. Then everything that matters, top to bottom.",
         ["A summary written by the on-device AI from the real forecast", "Sunrise and sunset, hour-by-hour forecast",
          "Temperature, wind, humidity, visibility, cloud cover, difference from normals", "Precipitation probability, air quality, weather risks, pressure, wind compass, pollen",
          "Tap any card for its full detail"]),
        ("forecast", "calendar", "Forecast", "Up to 10 days, hour by hour",
         "Every variable has its own chart: temperature, precipitation, wind, UV, pressure… with a scrubber to read the exact value.",
         ["Forecasts up to 10 days and an hour-by-hour view", "Charts you can drag, with instant readouts", "Two display modes: essentials or full detail"]),
        ("compare", "grid", "Compare", "Five models, one glance",
         "AROME, ICON, ARPEGE, GFS and ECMWF side by side: agreement, disagreement, and how the forecast changes from one run to the next.",
         ["Every model on the same chart", "A model ranking and an agreement index", "Previous-run analysis: does the forecast change?"]),
        ("maps", "map", "Maps", "The sky in motion",
         "Temperature, rain, wind, clouds, snow, storms, animated hour by hour. The finest model is picked from your zoom: AROME HD over France.",
         ["Layers: temperature, rain, wind, gusts, clouds, snow…", "Time slider and smooth animation", "Official data decoded on-device, no server"]),
        ("moon", "moonstars", "Lunaria", "The Moon, calculated",
         "Real phases, moonrise and moonset, eclipses: everything comes from ephemerides, with a real Moon that changes phase.",
         ["Today’s phase and illumination", "Moonrise, moonset and culmination", "Lunar calendar"]),
    ],
}

MOON = {
    "fr": {"names": "Nouvelle Lune|Premier croissant|Premier quartier|Lune gibbeuse croissante|Pleine Lune|Lune gibbeuse décroissante|Dernier quartier|Dernier croissant",
           "tpl": "Aujourd’hui : {name}, environ {pct} % éclairée."},
    "en": {"names": "New Moon|Waxing crescent|First quarter|Waxing gibbous|Full Moon|Waning gibbous|Last quarter|Waning crescent",
           "tpl": "Today: {name}, about {pct}% lit."},
}


# ---------------------------------------------------------------- morceaux communs
def page_url(page, lang):
    return FILES[page][0 if lang == "fr" else 1]


def head(t, page, title, desc, ld=None, noindex=False, alt=True):
    lang = t["lang"]
    own = page_url(page, lang) if page in FILES else "404.html"
    canon = BASE if (page == "home" and lang == "fr") else BASE + own
    out = ['<!doctype html>', '<html lang="%s" class="no-js">' % lang, '<head>', '<meta charset="utf-8">',
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
           '<meta name="theme-color" content="#050a22">', '<meta name="color-scheme" content="dark">',
           '<meta name="referrer" content="strict-origin-when-cross-origin">',
           '<title>%s</title>' % esc(title), '<meta name="description" content="%s">' % esc(desc)]
    if noindex:
        out.append('<meta name="robots" content="noindex">')
    else:
        out.append('<link rel="canonical" href="%s">' % canon)
        if page in FILES and alt:
            fr, en = FILES[page]
            out.append('<link rel="alternate" hreflang="fr" href="%s">' % (BASE if page == "home" else BASE + fr))
            out.append('<link rel="alternate" hreflang="en" href="%s">' % (BASE + en))
            out.append('<link rel="alternate" hreflang="x-default" href="%s">' % (BASE if page == "home" else BASE + fr))
    og_img = BASE + "assets/og.jpg"
    out += ['<meta property="og:type" content="website">', '<meta property="og:site_name" content="Liquid Weather">',
            '<meta property="og:title" content="%s">' % esc(title), '<meta property="og:description" content="%s">' % esc(desc),
            '<meta property="og:image" content="%s">' % og_img, '<meta property="og:url" content="%s">' % canon,
            '<meta property="og:locale" content="%s">' % t["locale"],
            '<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:image" content="%s">' % og_img,
            '<link rel="icon" type="image/png" href="assets/favicon.png">', '<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">',
            '<link rel="preload" href="assets/fonts/bricolage-latin.woff2" as="font" type="font/woff2" crossorigin>',
            '<link rel="stylesheet" href="%s">' % ver("css/site.css"),
            "<script>document.documentElement.className='js'</script>"]
    if ld:
        out.append('<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False, separators=(",", ":")))
    out.append("</head>")
    return "\n".join(out)


def nav(t, page):
    lang = t["lang"]
    home = page_url("home", lang)
    other = (page_url(page, t["other_lang"]) if page in FILES else None) or page_url("home", t["other_lang"])
    cur = lambda p: ' aria-current="page"' if p == page else ""
    app = home + "#app" if page != "home" else "#app"
    return f'''<header class="nav" id="top">
<div class="nav-in glass">
<a class="brand" href="{home}" aria-label="Liquid Weather"><img src="assets/icon.png" width="34" height="34" alt=""><span>Liquid Weather</span></a>
<nav class="links" id="menu" aria-label="{esc(t['nav_label'])}">
<a href="{app}">{t['nav_app']}</a>
<a href="{page_url('news', lang)}"{cur('news')}>{t['nav_news']}</a>
<a href="{page_url('privacy', lang)}"{cur('privacy')}>{t['nav_privacy']}</a>
<a href="{page_url('support', lang)}"{cur('support')}>{t['nav_support']}</a>
<a class="lang" href="{other}" lang="{t['other_lang']}" hreflang="{t['other_lang']}">{t['other_name']}</a>
</nav>
<div class="nav-cta">
<a class="btn btn-coffee" href="{COFFEE}" target="_blank" rel="noopener" aria-label="{esc(t['coffee_aria'])}">{ICON['cup']}<span class="long">{t['coffee_long']}</span><span class="short" aria-hidden="true">{t['coffee_short']}</span></a>
<a class="btn btn-store" href="{APP_STORE}" target="_blank" rel="noopener" aria-label="{esc(t['store_aria'])}">{ICON['apple']}<span>{t['store']}</span></a>
<button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="{esc(t['nav_menu'])}"><span></span></button>
</div>
</div>
</header>'''


def dock(t):
    modes = [("auto", "sky_auto"), ("clear", "sky_clear"), ("cloudy", "sky_cloudy"), ("rain", "sky_rain"), ("storm", "sky_storm"), ("snow", "sky_snow"), ("night", "sky_night")]
    btns = "".join('<button type="button" data-sky-mode="%s" aria-pressed="%s" aria-label="%s">%s<span>%s</span></button>'
                   % (m, "true" if m == "auto" else "false", esc(t[k]), ICON[m], t[k]) for m, k in modes)
    return (f'<div class="dock glass" role="group" aria-label="{esc(t["dock_aria"])}" data-hint="{esc(t["dock_hint"])}">'
            f'<span class="dock-label">{t["dock_label"]}</span>{btns}'
            f'<button type="button" class="dock-pause" aria-pressed="false" data-label-pause="{esc(t["sky_pause"])}" data-label-play="{esc(t["sky_play"])}" aria-label="{esc(t["sky_pause"])}">'
            f'<span class="i-pause">{ICON["pause"]}</span><span class="i-play">{ICON["play"]}</span></button></div>')


def footer(t):
    lang = t["lang"]
    return f'''<footer class="foot">
<div class="wrap foot-grid">
<div class="foot-brand"><a class="brand" href="{page_url('home', lang)}"><img src="assets/icon.png" width="40" height="40" alt=""><span>Liquid Weather</span></a><p>{t['foot_tag']}</p></div>
<nav aria-label="{esc(t['foot_links'])}"><h2>{t['foot_links']}</h2><ul>
<li><a href="{page_url('home', lang)}">{t['foot_home']}</a></li>
<li><a href="{page_url('news', lang)}">{t['nav_news']}</a></li>
<li><a href="{page_url('privacy', lang)}">{t['nav_privacy']}</a></li>
<li><a href="{page_url('support', lang)}">{t['nav_support']}</a></li>
<li><a href="{page_url('home', t['other_lang'])}" lang="{t['other_lang']}" hreflang="{t['other_lang']}">{t['other_name']}</a></li>
<li><a href="{APP_STORE}" target="_blank" rel="noopener">{t['store']}</a></li>
<li><a href="{COFFEE}" target="_blank" rel="noopener">{t['coffee_long']}</a></li></ul></nav>
<div><h2>{t['foot_contact']}</h2><ul><li><a href="mailto:{MAIL}">{MAIL}</a></li><li>{t['foot_site']} : <a href="{BASE}">christopherjacquescj.github.io/liquid-weather-site</a></li></ul></div>
</div>
<p class="wrap legal">{t['legal']}</p>
</footer>'''


def shell(t, page, title, desc, body, scripts, ld=None, noindex=False, bodyclass="", with_dock=True):
    sc = "".join('<script src="%s" defer></script>\n' % ver(s) for s in scripts)
    return "\n".join([
        head(t, page, title, desc, ld, noindex),
        f'<body class="page-{page} {bodyclass}">',
        f'<a class="skip" href="#main">{t["skip"]}</a>',
        '<div class="sky" aria-hidden="true"><canvas id="sky"></canvas><canvas id="fx"></canvas><div class="moon" id="moon"><img src="%s" alt="" width="640" height="640" decoding="async"></div></div><div class="sky-scrim" aria-hidden="true"></div>' % ver("assets/moon-full.webp"),
        nav(t, page), body, footer(t), dock(t) if with_dock else "",
        sc, "</body></html>\n"])


def write(name, content):
    with open(os.path.join(ROOT, name), "w", encoding="utf-8") as f:
        f.write(content)
    print("écrit", name, len(content) // 1024, "Ko")


def sky_mark(state, top):
    return '<span class="sky-mark" data-sky="%s" style="top:%s%%" aria-hidden="true"></span>' % (state, top)


# ---------------------------------------------------------------- accueil
def home(t):
    lang = t["lang"]
    chapters = CHAPTERS[lang]
    chap_html, dots = [], []
    for i, (cid, icon, label, tag, text, bullets) in enumerate(chapters, start=1):
        chips = ""
        tab = next(x for x in TOUR["tabs"] if x["id"] == cid)
        if cid == "maps":
            chips = '<div class="chips" role="group" aria-label="%s" data-chips="maps">%s</div>' % (
                "Couches de la carte" if lang == "fr" else "Map layers",
                "".join('<button type="button" aria-pressed="%s">%s</button>' % ("true" if k == 0 else "false", esc(l["label"])) for k, l in enumerate(tab["layers"])))
        elif len(tab["layers"]) > 1:
            chips = '<div class="chips" role="group" aria-label="%s" data-chips="%s">%s</div>' % (
                "Affichage" if lang == "fr" else "View", cid,
                "".join('<button type="button" aria-pressed="%s">%s</button>' % ("true" if k == 0 else "false", esc(l["label"])) for k, l in enumerate(tab["layers"])))
        extra = ""
        if cid == "moon":
            extra = '<p class="moon-live" data-moon-names="%s" data-moon-tpl="%s" hidden></p>' % (esc(MOON[lang]["names"]), esc(MOON[lang]["tpl"]))
        chap_html.append(f'''<article class="chap panel" data-chap="{i}" data-tab="{cid}" id="c-{cid}" aria-labelledby="c-{cid}-t">
<p class="tabpill">{ICON[icon]}<span>{label}</span></p>
<h2 id="c-{cid}-t" class="h-chap">{tag}</h2>
<p class="chap-text">{text}</p>
<ul class="ticks">{"".join("<li>%s</li>" % b for b in bullets)}</ul>
{chips}{extra}
</article>''')
        dots.append(f'<li><a href="#c-{cid}" data-go="{i}" aria-label="{esc(label)}"><span></span></a></li>')
    first = TOUR["tabs"][0]

    tour = f'''<section class="tour" id="app" aria-label="{esc(t['tour_aria'])}">
{sky_mark('dawn', 6)}{sky_mark('day', 74)}
<div class="tour-stage">
<div class="tour-copy">
<article class="chap chap-hero" data-chap="0">
<h1 class="h-hero">{t['hero_title']}</h1>
<p class="lead">{t['hero_lead']}</p>
<div class="cta">
<a class="btn btn-store btn-lg" href="{APP_STORE}" target="_blank" rel="noopener">{ICON['apple']}<span>{t['store_long']}</span></a>
<a class="btn btn-glass btn-lg" href="#c-home" data-go="1">{t['hero_more']}</a>
</div>
<p class="fine">{t['hero_fine']}</p>
</article>
{"".join(chap_html)}
</div>
<div class="tour-phone">
<div class="phone" id="phone">
<div class="phone-body"><div class="screen" id="screen" role="img" aria-label="{esc(t['phone_label'])}">
<div class="layer is-on" data-tab="home"><div class="page-clip"><div class="page"><img src="{first['layers'][0]['img']}" width="660" height="4438" alt="" decoding="async" fetchpriority="high"></div></div>
<img class="ov top" src="{first['top']}" width="660" height="170" alt=""><img class="ov bot" src="{first['bot']}" width="660" height="154" alt=""></div>
</div></div>
</div>
<p class="phone-note">{t['tour_real']}</p>
</div>
<ol class="tour-dots" aria-label="{esc(t['tour_dots'])}">
<li><a href="#app" data-go="0" aria-label="{esc(t['hero_title'])}"><span></span></a></li>
{"".join(dots)}
</ol>
</div>
<script type="application/json" id="tour-data">{json.dumps(TOUR, ensure_ascii=False, separators=(",", ":"))}</script>
</section>'''

    agents = [("arome", "#ffd166"), ("arpege", "#ff8fab"), ("icon", "#6fe3c4"), ("gfs", "#8fb8ff"), ("ecmwf", "#c9a8ff")]
    legend = "".join(f'<li data-model="{i}"><i style="--c:{c}"></i><b>{t["m_" + k]}</b><span>{t["m_" + k + "_by"]}</span></li>' for i, (k, c) in enumerate(agents))
    axis = t["models_axis"].split("|")
    models = f'''<section class="models sec" id="models" aria-labelledby="models-t">
{sky_mark('rain', 16)}{sky_mark('clear', 86)}
<div class="wrap models-grid">
<div class="models-copy">
<h2 id="models-t" class="h-sec">{t['models_title']}</h2>
<p class="lead">{t['models_lead']}</p>
<ul class="legend" aria-label="Modèles">{legend}</ul>
</div>
<figure class="chart glass" id="chart" data-colors="{",".join(c for _, c in agents)}" data-in="{esc(t['models_in'])}" data-in1="{esc(t['models_in1'])}" data-now="{esc(t['models_now'])}" data-agree="{esc(t['agree_1'])}|{esc(t['agree_2'])}|{esc(t['agree_3'])}|{esc(t['agree_4'])}">
<svg class="chart-svg" viewBox="0 0 800 420" role="img" aria-label="{esc(t['models_chart_aria'])}" preserveAspectRatio="xMidYMid meet"></svg>
<div class="chart-axis" aria-hidden="true">{"".join("<span>%s</span>" % esc(a) for a in axis)}</div>
<div class="chart-ui">
<div class="ctl"><label for="horizon">{t['models_slider']}</label><output id="horizon-out" for="horizon">{t['models_now']}</output>
<input id="horizon" type="range" min="0" max="100" value="6" step="1"></div>
<div class="meter" aria-live="polite"><span class="meter-label">{t['models_agree']}</span><span class="meter-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b class="meter-val">{t['agree_4']}</b></div>
</div>
<figcaption>{t['models_note']}</figcaption>
</figure>
</div>
</section>'''

    lv = t["f2_levels"].split("|")
    levels = '<div class="levels" aria-hidden="true">%s</div>' % "".join('<span class="lv lv%d">%s</span>' % (i, esc(x)) for i, x in enumerate(lv))
    chips3 = "".join("<li>%s</li>" % esc(x) for x in t["f3_chips"].split("|"))
    chips6 = "".join("<li>%s</li>" % esc(x) for x in t["f6_chips"].split("|"))
    langs = "".join('<li lang="%s"%s>%s</li>' % (c, ' dir="rtl"' if c == "ar" else "", n) for c, n in
                    [("fr", "Français"), ("en", "English"), ("es", "Español"), ("de", "Deutsch"), ("it", "Italiano"), ("pt", "Português"), ("ar", "العربية")])
    feat = f'''<section class="feat sec" id="features" aria-labelledby="feat-t">
{sky_mark('golden', 46)}
<div class="wrap">
<header class="sec-head"><h2 id="feat-t" class="h-sec">{t['feat_title']}</h2><p class="lead">{t['feat_lead']}</p></header>
<ul class="toc">
<li class="toc-row"><h3>{t['f1_t']}</h3><div class="toc-body"><p>{t['f1_p']}</p></div></li>
<li class="toc-row"><h3>{t['f2_t']}</h3><div class="toc-body"><p>{t['f2_p']}</p>{levels}</div></li>
<li class="toc-row"><h3>{t['f3_t']}</h3><div class="toc-body"><ul class="tags">{chips3}</ul></div></li>
<li class="toc-row"><h3>{t['f4_t']}</h3><div class="toc-body"><ul class="langs">{langs}</ul><p>{t['f4_p']}</p></div></li>
<li class="toc-row"><h3>{t['f5_t']}</h3><div class="toc-body"><p>{t['f5_p']}</p></div></li>
<li class="toc-row"><h3>{t['f6_t']}</h3><div class="toc-body"><p>{t['f6_p']}</p><ul class="tags">{chips6}</ul></div></li>
</ul>
</div>
</section>'''

    news = f'''<section class="newsec sec" id="news" aria-labelledby="news-t">
{sky_mark('dusk', 40)}
<div class="wrap">
<header class="sec-head sec-head-row"><div><h2 id="news-t" class="h-sec">{t['news_title']}</h2><p class="lead">{t['news_lead']}</p></div>
<a class="btn btn-glass" href="{page_url('news', lang)}">{t['news_all']}</a></header>
<div class="rail" id="news-rail" data-lang="{lang}" data-page="{page_url('news', lang)}" data-error="{esc(t['news_error'])}"><p class="rail-msg">{t['news_loading']}</p></div>
<noscript><p class="rail-msg">{t['news_noscript']}</p></noscript>
</div>
</section>'''

    ann = "actualites/%s/images/" % ANNOUNCE
    soon = f'''<section class="soon sec" id="soon" aria-labelledby="soon-t">
{sky_mark('night', 50)}
<div class="wrap">
<header class="sec-head"><h2 id="soon-t" class="h-sec">{t['soon_title']}</h2><p class="lead">{t['soon_lead']}</p></header>
<div class="soon-grid">
<article class="soon-card soon-a glass">
<p class="when">{t['soon1_when']}</p>
<h3>{t['soon1_t']}</h3>
<div class="soon-text"><p>{t['soon1_p1']}</p><p>{t['soon1_p2']}</p></div>
<div class="soon-shots">
<figure><img src="{ann}fig1.jpg" width="900" height="1605" loading="lazy" decoding="async" alt="{esc(t['soon_fig1'])}"><figcaption>{t['soon_fig1']}</figcaption></figure>
<figure><img src="{ann}fig2.jpg" width="900" height="1635" loading="lazy" decoding="async" alt="{esc(t['soon_fig2'])}"><figcaption>{t['soon_fig2']}</figcaption></figure>
</div>
</article>
<article class="soon-card soon-b glass">
<p class="when">{t['soon2_when']}</p>
<h3>{t['soon2_t']}</h3>
<div class="soon-text"><p>{t['soon2_p1']}</p><p>{t['soon2_p2']}</p></div>
</article>
</div>
</div>
</section>'''

    steps = t["hood_steps"].split("|")
    pipe = "".join("<li>%s</li>" % esc(s) for s in steps)
    priv = f'''<section class="privsec sec" id="privacy" aria-labelledby="priv-t">
<div class="wrap">
<h2 id="priv-t" class="h-sec">{t['priv_title']}</h2>
<div class="priv-cols">
<div><h3>{t['priv1_t']}</h3><p>{t['priv1_p']}</p></div>
<div><h3>{t['priv2_t']}</h3><p>{t['priv2_p']}</p></div>
<div><h3>{t['priv3_t']}</h3><p>{t['priv3_p']}</p></div>
</div>
<p class="priv-link"><a class="btn btn-glass" href="{page_url('privacy', lang)}">{t['priv_read']}</a></p>
<div class="hood">
<div class="hood-copy"><h3 class="h-sub">{t['hood_title']}</h3><p>{t['hood_p']}</p></div>
<ol class="pipe" aria-label="{esc(t['hood_aria'])}">{pipe}</ol>
</div>
</div>
</section>'''

    faq = "".join("<details><summary>%s</summary><p>%s</p></details>" % (esc(q), a.replace(MAIL, '<a href="mailto:%s">%s</a>' % (MAIL, MAIL))) for q, a in t["faq"])
    faqs = f'''<section class="faq sec" id="faq" aria-labelledby="faq-t">
<div class="wrap faq-wrap"><h2 id="faq-t" class="h-sec">{t['faq_title']}</h2><div class="faq-list">{faq}</div></div>
</section>'''

    mail = "mailto:%s?subject=%s" % (MAIL, t["mail_subject"].replace(" ", "%20").replace("—", "%E2%80%94"))
    finale = f'''<section class="finale sec" id="soutenir" aria-labelledby="cta-t">
{sky_mark('aurora', 36)}
<div class="wrap">
<div class="finale-cta"><h2 id="cta-t" class="h-sec">{t['cta_title']}</h2>
<a class="btn btn-store btn-lg" href="{APP_STORE}" target="_blank" rel="noopener">{ICON['apple']}<span>{t['store_long']}</span></a></div>
<div class="coffee glass">
<div class="cup" aria-hidden="true"><svg viewBox="0 0 120 120"><g class="steam"><path d="M44 40c-6-8 6-12 0-22"/><path d="M60 40c-6-8 6-12 0-22"/><path d="M76 40c-6-8 6-12 0-22"/></g><path class="cup-body" d="M24 52h64v26a28 28 0 0 1-28 28h-8a28 28 0 0 1-28-28z"/><path class="cup-handle" d="M88 58h6a12 12 0 0 1 0 24h-6"/><path class="cup-saucer" d="M18 112h76"/></svg></div>
<div class="coffee-copy"><h3>{t['coffee_title']}</h3><p>{t['coffee_p']}</p>
<p class="coffee-cta"><a class="btn btn-coffee btn-lg" href="{COFFEE}" target="_blank" rel="noopener">{ICON['cup']}<span>{t['coffee_long']}</span></a></p>
<p class="fine">{t['coffee_fine']}</p></div>
</div>
<div class="contact">
<div><h3>{t['contact_title']}</h3><p>{t['contact_p']}</p></div>
<div class="contact-actions"><a class="btn btn-glass btn-lg" href="{mail}">{ICON['mail']}<span>{t['contact_btn']}</span></a>
<p class="mail"><a href="mailto:{MAIL}">{MAIL}</a></p>
<p class="fine"><a href="{page_url('support', lang)}">{t['contact_page']}</a></p></div>
</div>
</div>
</section>'''

    ld = {"@context": "https://schema.org", "@type": "MobileApplication", "name": "Liquid Weather", "operatingSystem": "iOS",
          "applicationCategory": "WeatherApplication", "description": t["home_desc"], "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
          "inLanguage": ["fr", "en", "es", "de", "it", "pt", "ar"], "url": BASE}
    body = f'<main id="main">\n{tour}\n{models}\n{feat}\n{news}\n{soon}\n{priv}\n{faqs}\n{finale}\n</main>'
    page = shell(t, "home", t["home_title"], t["home_desc"], body, ["js/sky.js", "js/fx.js", "js/site.js", "js/home.js"], ld=ld, bodyclass="")
    write(page_url("home", lang), page)


# ---------------------------------------------------------------- actualités (liste + lecteur, rempli par news.js)
def news_page(t):
    lang = t["lang"]
    cfg = {k: t[k] for k in ["np_search", "np_all", "np_count_one", "np_count_many", "np_none", "np_back", "np_read", "np_source", "np_photo", "np_share", "np_copied",
                              "np_more", "np_lang", "np_licence", "np_notfound", "np_notfound_p", "np_updated", "np_pd", "news_error", "np_title", "nav_news", "np_period", "np_p_week", "np_p_month", "np_p_quarter", "np_p_year", "np_type", "np_all_types", "np_newest", "np_oldest", "np_clear", "np_reset", "np_prev", "np_next", "np_pages", "np_page"]}
    cfg.update({"lang": lang, "page": page_url("news", lang), "other": page_url("news", t["other_lang"])})
    body = f'''<main id="main" class="np">
<div class="wrap">
<div id="np-list-view">
<header class="np-head"><h1>{t['np_h1']}</h1><p class="lead">{t['np_lead']}</p></header>
<div id="np-controls" class="np-controls"></div>
<div id="np-bar" class="np-bar"><p class="np-count" id="np-count" aria-live="polite"></p></div>
<div id="np-list" class="np-list"><p class="rail-msg">{t['news_loading']}</p></div>
<nav id="np-pages" class="np-pages" aria-label="{esc(t['np_pages'])}" hidden></nav>
</div>
<article id="np-reader" class="reader" hidden></article>
<noscript><p class="rail-msg">{t['news_noscript']}</p></noscript>
</div>
<script type="application/json" id="lw-news-cfg">{json.dumps(cfg, ensure_ascii=False, separators=(",", ":"))}</script>
</main>'''
    write(page_url("news", lang), shell(t, "news", t["np_title"], t["np_desc"], body, ["js/sky.js", "js/fx.js", "js/site.js", "js/news.js"], bodyclass="page-text"))


def privacy_page(t):
    lang = t["lang"]
    body = f'''<main id="main" class="text-page"><div class="wrap narrow">
<h1 class="h-page">{t['pv_h1']}</h1><p class="muted">{t['pv_updated']}</p>
<div class="prose glass">{t['pv_body']}</div>
</div></main>'''
    write(page_url("privacy", lang), shell(t, "privacy", t["pv_title"], t["pv_desc"], body, ["js/sky.js", "js/fx.js", "js/site.js"], bodyclass="page-text"))


def support_page(t):
    lang = t["lang"]
    mail = "mailto:%s?subject=%s" % (MAIL, t["mail_subject"].replace(" ", "%20").replace("—", "%E2%80%94"))
    checks = "".join("<li>%s</li>" % esc(x) for x in t["sp_checks"].split("|"))
    body = f'''<main id="main" class="text-page"><div class="wrap">
<h1 class="h-page">{t['sp_h1']}</h1><p class="lead">{t['sp_lead']}</p>
<div class="sp-grid">
<div class="glass sp-card"><p class="muted">{t['sp_mail_label']}</p>
<p class="sp-mail"><a href="{mail}">{MAIL}</a></p>
<p class="sp-actions"><a class="btn btn-store btn-lg" href="{mail}">{ICON['mail']}<span>{t['sp_btn']}</span></a>
<a class="btn btn-coffee btn-lg" href="{COFFEE}" target="_blank" rel="noopener">{ICON['cup']}<span>{t['coffee_long']}</span></a></p>
<p class="muted">{t['sp_coffee_p']}</p>
<p class="muted"><a href="{BASE}">christopherjacquescj.github.io/liquid-weather-site/</a></p></div>
<div class="glass sp-card"><h2 class="h-sub">{t['sp_checks_t']}</h2><ul class="ticks">{checks}</ul></div>
</div>
<div class="prose glass sp-prose"><h2>{t['sp_before_t']}</h2><p>{t['sp_before_p']}</p><h2>{t['sp_priv_t']}</h2><p>{t['sp_priv_p']}</p></div>
</div></main>'''
    write(page_url("support", lang), shell(t, "support", t["sp_title"], t["sp_desc"], body, ["js/sky.js", "js/fx.js", "js/site.js"], bodyclass="page-text"))


def not_found():
    fr, en = T["fr"], T["en"]
    body = f'''<main id="main" class="nf"><div class="wrap">
<p class="nf-code" aria-hidden="true">404</p>
<h1 class="h-page">{fr['nf_h1']}</h1><p class="lead">{fr['nf_p']}</p>
<p class="nf-en">{en['nf_h1']} {en['nf_p']}</p>
<p class="cta"><a class="btn btn-store btn-lg" href="{BASE}">{fr['nf_btn']}</a><a class="btn btn-glass btn-lg" href="{BASE}index-en.html" lang="en">{en['nf_btn']}</a></p>
</div></main>'''
    # la page 404 est servie à n'importe quelle adresse : on utilise des liens absolus pour les fichiers
    page = shell(fr, "404", fr["nf_title"], fr["nf_h1"], body, ["js/sky.js", "js/fx.js", "js/site.js"], noindex=True, bodyclass="page-nf", with_dock=False)
    page = page.replace('href="css/', 'href="%scss/' % BASE).replace('src="js/', 'src="%sjs/' % BASE).replace('src="assets/', 'src="%sassets/' % BASE)
    page = page.replace('href="assets/', 'href="%sassets/' % BASE)
    for key in ("index.html", "actualites.html", "privacy.html", "support.html", "index-en.html"):
        page = page.replace('href="%s"' % key, 'href="%s%s"' % (BASE, key)).replace('href="%s#app"' % key, 'href="%s%s#app"' % (BASE, key))
    page = page.replace('href="#app"', 'href="%s#app"' % BASE)
    write("404.html", page)


def sitemap():
    urls = [BASE] + [BASE + FILES[p][i] for p in ("home", "news", "support", "privacy") for i in (0, 1) if not (p == "home" and i == 0)]
    xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s</urlset>\n' % "".join("<url><loc>%s</loc></url>" % u for u in urls)
    write("sitemap.xml", xml)


if __name__ == "__main__":
    for code in ("fr", "en"):
        t = T[code]
        home(t); news_page(t); privacy_page(t); support_page(t)
    not_found(); sitemap()
