#!/usr/bin/env python3
"""Generates the Liquid Weather site (FR + EN) into ./out. Run: python3 build.py"""
import os, re, shutil
from string import Template

BASE = "https://christopherjacquescj.github.io/liquid-weather-site/"
MAIL = "supportliquidweatherapp@gmail.com"
APP_STORE = "https://apps.apple.com/us/app/liquid-weather/id6807434223"
BMC = "https://buymeacoffee.com/liquidweatherapp"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

# ---------- icons (stroke style) ----------
def ic(path): return f'<svg viewBox="0 0 24 24" aria-hidden="true">{path}</svg>'
ICON = {
    "clock": ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    "bell": ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
    "mountain": ic('<path d="M3 20 9 9l4 6 2-3 6 8z"/>'),
    "globe": ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/>'),
    "hand": ic('<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 14.5a1.5 1.5 0 0 1 2.4-1.8L9 15.5"/>'),
    "devices": ic('<rect x="7" y="3" width="10" height="18" rx="3"/><path d="M11 18h2"/>'),
    "lock": ic('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    "eye": ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>'),
    "pin": ic('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    "mail": ic('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
    "arrow": ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    "apple": ic('<path d="M16.5 3c.1 1.2-.4 2.4-1.1 3.2-.8.9-1.9 1.5-3 1.4-.1-1.2.4-2.4 1.1-3.1.8-.9 2-1.4 3-1.5zM20 17.2c-.5 1.2-.8 1.7-1.5 2.7-1 1.4-2.3 3.1-4 3.1-1.5 0-1.9-1-3.9-1s-2.5 1-4 1c-1.7 0-2.9-1.6-3.9-3C.9 16.200.6 11.700 2.100 9.300 3.200 7.600 5 6.600 6.700 6.600c1.700 0 2.800 1 4.200 1 1.400 0 2.200-1 4.200-1 1.500 0 3.100.8 4.200 2.200-3.700 2-3.100 7.300.7 8.400z"/>'),
    "cup": ic('<path d="M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5v2M12 2.5v2"/>'),
    "link": ic('<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>'),
}

SPRITE = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.500" fill="#ffd25a"/><g stroke="#ffd25a" stroke-width="1.800" stroke-linecap="round"><path d="M12 2v2.500M12 19.500V22M2 12h2.500M19.500 12H22M4.900 4.900l1.800 1.800M17.300 17.300l1.800 1.800M4.900 19.100l1.800-1.800M17.300 6.700l1.800-1.800"/></g></symbol>
<symbol id="i-cloud" viewBox="0 0 24 24"><path d="M7 18a4.500 4.500 0 0 1-.6-8.960A6 6 0 0 1 17.900 10 4 4 0 0 1 17.500 18z" fill="#fff"/></symbol>
<symbol id="i-sc" viewBox="0 0 24 24"><circle cx="16" cy="8" r="3.400" fill="#ffd25a"/><path d="M6.500 19a4 4 0 0 1-.4-7.980A5.300 5.300 0 0 1 16.300 12.600 3.200 3.200 0 0 1 16 19z" fill="#fff"/></symbol>
<symbol id="i-rain" viewBox="0 0 24 24"><path d="M7 15a4.200 4.200 0 0 1-.5-8.370A5.600 5.600 0 0 1 17.100 7.800 3.600 3.600 0 0 1 17 15z" fill="#e8f2ff"/><g stroke="#8fd3ff" stroke-width="1.800" stroke-linecap="round"><path d="M8 18l-1 3M12.500 18l-1 3M17 18l-1 3"/></g></symbol>
</defs></svg>'''

# ---------- copy ----------
FR = dict(
    lang="fr", hreflang_other="en", other_file="index-en.html",
    nav=dict(home="Accueil", features="Fonctionnalités", privacy="Confidentialité", support="Assistance", other="English"),
    title="Liquid Weather — La météo en verre liquide pour iPhone, iPad et Apple Watch",
    desc="Liquid Weather réunit AROME, ICON, ARPEGE, GFS et ECMWF : prévisions heure par heure, cartes météo HD animées, comparaison des modèles, alertes officielles, Lune et assistant IA. Gratuit, sans pub.",
    eyebrow="Météo pour iPhone, iPad et Apple Watch",
    h1='Voyez le <span class="grad">ciel</span> venir.',
    lead="Liquid Weather fusionne les meilleurs modèles météo du monde — AROME, ICON, ARPEGE, GFS, ECMWF — dans une interface en verre liquide, fluide et d’une précision rare.",
    cta1="Découvrir", cta2="Nous contacter", soon="Application iOS gratuite", dl="Télécharger sur l’App Store", coffee="Offrez-moi un café",
    stats=[("7", "langues"), ("0", "publicité"), ("0", "abonnement"), ("10 j", "heure par heure")],
    phone=dict(place="Ma position", cond="Éclaircies", sub="Ressenti 17° · Rafales 31 km/h", next="Prochaines heures", day="Température · 24 h", now="Maint.", h=["14 h", "15 h", "16 h", "17 h"]),
    chips=[("☀", "UV 6", "Élevé"), ("➚", "Vent 18 km/h", "Nord-ouest"), ("◎", "AROME HD · 0,01°", "Modèle le plus fin"), ("☂", "Averse à 16 h", "jusqu’à 2,8 mm/h")],
    strip="Sources officielles",
    f_eyebrow="Fonctionnalités", f_h2='Tout ce qu’il faut. <span class="grad">Rien de superflu.</span>',
    f_p="Une seule app pour comprendre le temps qu’il fait, celui qui arrive, et la confiance qu’on peut lui accorder.",
    tiles=[
        ("clock", "#6fe0ff", "#3d7bff", "Prévisions d’expert", "Heure par heure et jusqu’à 10 jours : température, ressenti, vent, rafales, humidité, pression, UV, précipitations. Touchez une donnée pour plonger dans le détail."),
        ("bell", "#ffb84a", "#ff6fa8", "Alertes et risques", "Vigilances officielles MeteoAlarm de votre zone, notifications utiles et indicateurs de risque lisibles d’un coup d’œil."),
        ("mountain", "#45e0b0", "#19a4c9", "Du ciel à la montagne", None),
        ("globe", "#b58cff", "#6f6bff", "Dans votre langue", None),
        ("hand", "#6fe0ff", "#8b6bff", "Fluide sous le doigt", "Une interface en verre liquide pensée pour iOS : tout répond, tout s’anime, rien ne surcharge."),
        ("devices", "#ff9a6f", "#ff5f9e", "Partout où vous êtes", "iPhone, iPad, Apple Watch. Widgets d’écran d’accueil et d’écran verrouillé, complications, tableau de risques sur iPad."),
    ],
    tags_sky=["Montagne et neige", "Mer", "Indice UV", "Qualité de l’air", "Pollen", "Soleil", "Pression", "Prévisions saisonnières", "Feux de forêt (EFFIS)", "Foudre (satellite)"],
    tags_lang=["Français", "English", "Español", "Deutsch", "Italiano", "Português", "العربية"],
    m_eyebrow="Cartes météo", m_h2='Le ciel en mouvement, <span class="grad">au pixel près.</span>',
    m_p="Température, pluie, vent, rafales, nuages, orages, neige : animés heure par heure jusqu’à cinq jours. Liquid Weather choisit automatiquement le modèle le plus fin selon votre zoom — AROME HD à 0,01° sur la France.",
    m_h3="Des prévisions, jamais du faux radar",
    m_side="Les cartes montrent des champs de modèles météorologiques, pas des observations radar. La foudre, elle, vient du satellite EUMETSAT.",
    m_layers=["temp", "rain", "wind", "cloud"], m_play="Lecture / pause", m_slider="Heure de la prévision", m_alt="Carte météo animée de la France",
    illus="Illustration : données fictives.",
    c_eyebrow="Comparaison des modèles", c_h2='Cinq modèles. <span class="grad">Un coup d’œil.</span>',
    c_p="Mettez AROME, ICON, ARPEGE, GFS et ECMWF face à face. Voyez où ils s’accordent, où ils divergent, et comment leurs prévisions évoluent d’un run à l’autre.",
    c_h3="Faites-vous votre propre idée", c_t="Déplacez le curseur : plus l’échéance est lointaine, plus les modèles s’écartent. C’est exactement ce que Liquid Weather vous montre — pour décider en connaissance de cause.",
    c_agree="Accord", c_spread="Écart entre modèles", c_at="à", c_hz="Échéance", c_alt="Courbes de température de cinq modèles météo",
    l_eyebrow="La Lune", l_h2='La Lune, calculée. <span class="grad">Pas dessinée.</span>',
    l_p="Phases réelles, lever et coucher, éclipses : tout est calculé à partir des éphémérides, avec une vraie photo de la Lune qui change de phase sous vos yeux.",
    l_illum="Illuminée", l_age="Âge", l_alt="La Lune et sa phase",
    a_eyebrow="Demander à Liquid", a_h2='Posez la question. <span class="grad">Liquid répond.</span>',
    a_p="Écrivez comme vous parlez. Un modèle d’intelligence artificielle exécuté sur l’appareil (Apple Intelligence, là où il est disponible) répond à partir des prévisions déjà chargées et dessine les graphiques qui illustrent sa réponse. Chaque valeur affichée est réelle.",
    a_ex="Exemple illustratif.", a_bars=["9 h", "20 h"],
    w_eyebrow="Widgets et Apple Watch", w_h2='La météo, partout <span class="grad">où vous regardez.</span>',
    w_p="Écran d’accueil, écran verrouillé, poignet : des widgets et complications taillés dans le même verre.",
    w_caps=["Prévisions", "Indice UV", "Lunaria · la Lune", "Apple Watch"], w_wid=("Lyon", "19°", "Éclaircies", "Max 22° · Min 11°"),
    h_eyebrow="Sous le capot", h_h2='Directement <span class="grad">à la source.</span>',
    h_p="Les cartes lisent les fichiers ouverts de Météo-France, du DWD et de la NOAA puis les décodent sur votre appareil. Aucun serveur Liquid Weather ne s’interpose entre vous et les données officielles.",
    h_steps=[("1", "Météo-France · DWD · NOAA"), ("2", "Fichiers GRIB2 ouverts"), ("3", "Décodés sur votre iPhone"), ("4", "Votre carte, instantanée")],
    p_eyebrow="Vie privée", p_h2='Votre météo, <span class="grad">votre affaire.</span>',
    pillars=[("lock", "Sans compte", "Aucune inscription, aucun identifiant : ouvrez l’app et c’est parti."), ("eye", "Sans publicité ni pistage", "Pas de publicité, pas de système de suivi publicitaire propre à l’application."), ("pin", "Position facultative", "Autorisez-la pour la météo locale, ou choisissez simplement une ville. Vous gardez la main.")],
    p_link="Lire la politique de confidentialité",
    q_eyebrow="Questions fréquentes", q_h2="On répond.",
    faq=[
        ("Liquid Weather est-elle gratuite ?", "Oui. L’application est gratuite, sans publicité ni abonnement."),
        ("D’où viennent les données ?", "Les prévisions viennent d’Open-Meteo. Les cartes lisent directement les données ouvertes de Météo-France (AROME, ARPEGE), du DWD (ICON) et de la NOAA (GFS). La Lune est calculée sur l’appareil ; la foudre vient du satellite EUMETSAT ; les vigilances de MeteoAlarm ; le risque feux de Copernicus EFFIS."),
        ("Les cartes sont-elles du radar ?", "Non, et c’est dit clairement dans l’app : ce sont des prévisions de modèles, jamais des observations radar. Seule la couche foudre est une observation satellite."),
        ("Quels appareils sont compatibles ?", "iPhone, iPad et Apple Watch. Les résumés et l’assistant IA fonctionnent sur les appareils compatibles Apple Intelligence."),
        ("Dois-je activer la localisation ?", "Non. Elle est facultative : vous pouvez choisir une ville à la main et modifier l’autorisation à tout moment dans les réglages iOS."),
        ("Comment vous contacter ?", f"Par e-mail à {MAIL}, ou depuis la page Assistance. Nous lisons tout."),
    ],
    fin_h2="Prêt à voir le ciel autrement ?", fin_p="Une question, une idée, un souci ? Écrivez-nous : nous lisons tout.",
    fin_mail="Écrire au support", fin_priv="Confidentialité",
    foot_tag="La météo en verre liquide.", foot_links="Liens", foot_contact="Contact", site="Site",
    legal=f"© 2026 Liquid Weather. Données : Open-Meteo, Météo-France (Licence Ouverte 2.0), DWD, NOAA, ECMWF, EUMETSAT, MeteoAlarm, Copernicus. Ces organismes ne soutiennent ni n’approuvent Liquid Weather. Les visuels de ce site sont des illustrations ; les valeurs affichées sont des exemples.",
)

EN = dict(
    lang="en", hreflang_other="fr", other_file="index.html",
    nav=dict(home="Home", features="Features", privacy="Privacy", support="Support", other="Français"),
    title="Liquid Weather — Weather in liquid glass for iPhone, iPad and Apple Watch",
    desc="Liquid Weather brings AROME, ICON, ARPEGE, GFS and ECMWF together: hourly forecasts, animated HD weather maps, model comparison, official alerts, the Moon and an AI assistant. Free, no ads.",
    eyebrow="Weather for iPhone, iPad and Apple Watch",
    h1='See the <span class="grad">sky</span> coming.',
    lead="Liquid Weather fuses the world’s best weather models — AROME, ICON, ARPEGE, GFS, ECMWF — into a fluid liquid-glass interface of rare precision.",
    cta1="Discover", cta2="Get in touch", soon="Free iOS app", dl="Download on the App Store", coffee="Buy me a coffee",
    stats=[("7", "languages"), ("0", "ads"), ("0", "subscriptions"), ("10 d", "hour by hour")],
    phone=dict(place="My location", cond="Partly sunny", sub="Feels like 17° · Gusts 31 km/h", next="Next hours", day="Temperature · 24 h", now="Now", h=["2 PM", "3 PM", "4 PM", "5 PM"]),
    chips=[("☀", "UV 6", "High"), ("➚", "Wind 18 km/h", "North-west"), ("◎", "AROME HD · 0.01°", "Finest model"), ("☂", "Shower at 4 PM", "up to 2.8 mm/h")],
    strip="Official sources",
    f_eyebrow="Features", f_h2='Everything you need. <span class="grad">Nothing you don’t.</span>',
    f_p="One app to understand the weather now, the weather coming, and how far to trust it.",
    tiles=[
        ("clock", "#6fe0ff", "#3d7bff", "Expert forecasts", "Hourly and up to 10 days: temperature, feels-like, wind, gusts, humidity, pressure, UV, precipitation. Tap any value to dive into the detail."),
        ("bell", "#ffb84a", "#ff6fa8", "Alerts and risks", "Official MeteoAlarm warnings for your area, useful notifications and risk indicators you can read at a glance."),
        ("mountain", "#45e0b0", "#19a4c9", "From sky to summit", None),
        ("globe", "#b58cff", "#6f6bff", "In your language", None),
        ("hand", "#6fe0ff", "#8b6bff", "Fluid under your finger", "A liquid-glass interface made for iOS: everything responds, everything animates, nothing clutters."),
        ("devices", "#ff9a6f", "#ff5f9e", "Wherever you are", "iPhone, iPad, Apple Watch. Home and Lock Screen widgets, complications, a risk dashboard on iPad."),
    ],
    tags_sky=["Mountain and snow", "Sea", "UV index", "Air quality", "Pollen", "Sun", "Pressure", "Seasonal outlook", "Wildfire risk (EFFIS)", "Lightning (satellite)"],
    tags_lang=["Français", "English", "Español", "Deutsch", "Italiano", "Português", "العربية"],
    m_eyebrow="Weather maps", m_h2='The sky in motion, <span class="grad">pixel-perfect.</span>',
    m_p="Temperature, rain, wind, gusts, clouds, storms, snow: animated hour by hour up to five days. Liquid Weather automatically picks the finest model for your zoom — AROME HD at 0.01° over France.",
    m_h3="Forecasts, never fake radar",
    m_side="The maps show weather-model fields, not radar observations. Lightning, on the other hand, comes from the EUMETSAT satellite.",
    m_layers=["temp", "rain", "wind", "cloud"], m_play="Play / pause", m_slider="Forecast hour", m_alt="Animated weather map of France",
    illus="Illustration: sample data.",
    c_eyebrow="Model comparison", c_h2='Five models. <span class="grad">One glance.</span>',
    c_p="Put AROME, ICON, ARPEGE, GFS and ECMWF side by side. See where they agree, where they diverge, and how their forecasts shift from one run to the next.",
    c_h3="Make up your own mind", c_t="Drag the slider: the further out you look, the more the models drift apart. That is exactly what Liquid Weather shows you — so you can decide with confidence.",
    c_agree="Agreement", c_spread="Model spread", c_at="at", c_hz="Lead time", c_alt="Temperature curves of five weather models",
    l_eyebrow="The Moon", l_h2='The Moon, computed. <span class="grad">Not drawn.</span>',
    l_p="Real phases, moonrise and moonset, eclipses: everything is computed from ephemerides, with a real photograph of the Moon changing phase before your eyes.",
    l_illum="Illuminated", l_age="Age", l_alt="The Moon and its phase",
    a_eyebrow="Ask Liquid", a_h2='Ask the question. <span class="grad">Liquid answers.</span>',
    a_p="Write the way you talk. An AI model running on the device (Apple Intelligence, where available) answers from the forecast already loaded and draws the charts that illustrate its answer. Every value shown is real.",
    a_ex="Illustrative example.", a_bars=["9 am", "8 pm"],
    w_eyebrow="Widgets and Apple Watch", w_h2='Weather everywhere <span class="grad">you look.</span>',
    w_p="Home Screen, Lock Screen, wrist: widgets and complications cut from the same glass.",
    w_caps=["Forecast", "UV index", "Lunaria · the Moon", "Apple Watch"], w_wid=("Lyon", "19°", "Partly sunny", "High 22° · Low 11°"),
    h_eyebrow="Under the hood", h_h2='Straight <span class="grad">from the source.</span>',
    h_p="The maps read the open files from Météo-France, DWD and NOAA and decode them on your device. No Liquid Weather server sits between you and the official data.",
    h_steps=[("1", "Météo-France · DWD · NOAA"), ("2", "Open GRIB2 files"), ("3", "Decoded on your iPhone"), ("4", "Your map, instantly")],
    p_eyebrow="Privacy", p_h2='Your weather, <span class="grad">your business.</span>',
    pillars=[("lock", "No account", "No sign-up, no login: open the app and go."), ("eye", "No ads, no tracking", "No advertising, and no advertising tracking system of its own."), ("pin", "Optional location", "Allow it for local weather, or simply pick a city. You stay in control.")],
    p_link="Read the privacy policy",
    q_eyebrow="FAQ", q_h2="Questions, answered.",
    faq=[
        ("Is Liquid Weather free?", "Yes. The app is free, with no ads and no subscription."),
        ("Where does the data come from?", "Forecasts come from Open-Meteo. The maps read open data directly from Météo-France (AROME, ARPEGE), DWD (ICON) and NOAA (GFS). The Moon is computed on the device; lightning comes from the EUMETSAT satellite; warnings from MeteoAlarm; wildfire risk from Copernicus EFFIS."),
        ("Are the maps radar?", "No, and the app says so plainly: they are model forecasts, never radar observations. Only the lightning layer is a satellite observation."),
        ("Which devices are supported?", "iPhone, iPad and Apple Watch. Summaries and the AI assistant work on devices that support Apple Intelligence."),
        ("Do I have to enable location?", "No. It is optional: you can pick a city by hand and change the permission any time in iOS Settings."),
        ("How do I contact you?", f"By email at {MAIL}, or from the Support page. We read everything."),
    ],
    fin_h2="Ready to see the sky differently?", fin_p="A question, an idea, an issue? Write to us — we read everything.",
    fin_mail="Email support", fin_priv="Privacy",
    foot_tag="Weather in liquid glass.", foot_links="Links", foot_contact="Contact", site="Website",
    legal=f"© 2026 Liquid Weather. Data: Open-Meteo, Météo-France (Licence Ouverte 2.0), DWD, NOAA, ECMWF, EUMETSAT, MeteoAlarm, Copernicus. These organisations do not sponsor or endorse Liquid Weather. The visuals on this site are illustrations; the values shown are samples.",
)

# ---------- French typography: narrow no-break space before ; : ! ? and inside « » ----------
def typo(s):
    s = re.sub(r"(?<=\S) ([?!;:»])", "\u202f\\1", s)
    s = s.replace("« ", "«\u202f")
    s = re.sub(r"(\d) (%|°|km|mm|h\b|j\b)", "\\1\u00a0\\2", s)
    return s

# ---------- shared page frame ----------
def page_urls(L, name):
    fr = L["lang"] == "fr"
    own = {"index": "index.html", "support": "support.html", "privacy": "privacy.html"}
    en = {"index": "index-en.html", "support": "support-en.html", "privacy": "privacy-en.html"}
    mine = own if fr else en
    other = en if fr else own
    return mine, other

def head(L, name, title, desc):
    mine, other = page_urls(L, name)
    ico = "assets/"
    return f'''<!doctype html>
<html lang="{L["lang"]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#04091a">
<meta name="color-scheme" content="dark">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{BASE}{mine[name] if mine[name] != 'index.html' else ''}">
<link rel="alternate" hreflang="{L["lang"]}" href="{BASE}{mine[name] if mine[name] != 'index.html' else ''}">
<link rel="alternate" hreflang="{L["hreflang_other"]}" href="{BASE}{other[name]}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Liquid Weather">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{BASE}{ico}icon.png">
<meta property="og:url" content="{BASE}{mine[name] if mine[name] != 'index.html' else ''}">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="{ico}favicon.png">
<link rel="apple-touch-icon" href="{ico}apple-touch-icon.png">
<link rel="stylesheet" href="style.css">
<noscript><style>.reveal{{opacity:1;transform:none;filter:none}}</style></noscript>
</head>'''

def header(L, name):
    mine, other = page_urls(L, name)
    n = L["nav"]
    cur = lambda k: ' aria-current="page"' if name == k else ""
    feat = f'{mine["index"]}#features' if name != "index" else "#features"
    return f'''<header class="nav"><div class="wrap bar">
<a class="brand" href="{mine["index"]}"><img src="assets/icon.png" width="40" height="40" alt="">Liquid Weather</a>
<button class="burger" aria-label="Menu" aria-expanded="false"><span></span></button>
<nav class="links">
<a href="{mine["index"]}"{cur("index")}>{n["home"]}</a>
<a href="{feat}">{n["features"]}</a>
<a href="{mine["privacy"]}"{cur("privacy")}>{n["privacy"]}</a>
<a href="{mine["support"]}"{cur("support")}>{n["support"]}</a>
<a class="lang" href="{other[name]}" lang="{L["hreflang_other"]}" hreflang="{L["hreflang_other"]}">{n["other"]}</a>
</nav>
<a class="btn nav-dl" href="{APP_STORE}" target="_blank" rel="noopener" aria-label="{L["dl"]}">{ICON["apple"]}<span>App Store</span></a></div></header>'''

def footer(L, name):
    mine, other = page_urls(L, name)
    n = L["nav"]
    return f'''<footer><div class="wrap">
<div class="foot">
<div><a class="brand" href="{mine["index"]}"><img src="assets/icon.png" width="40" height="40" alt="">Liquid Weather</a>
<p>{L["foot_tag"]}</p></div>
<div><h5>{L["foot_links"]}</h5><ul>
<li><a href="{mine["index"]}">{n["home"]}</a></li>
<li><a href="{mine["privacy"]}">{n["privacy"]}</a></li>
<li><a href="{mine["support"]}">{n["support"]}</a></li>
<li><a href="{other[name]}" lang="{L["hreflang_other"]}">{n["other"]}</a></li>
<li><a href="{APP_STORE}" target="_blank" rel="noopener">App Store</a></li>
<li><a href="{BMC}" target="_blank" rel="noopener">{L["coffee"]} ☕</a></li></ul></div>
<div><h5>{L["foot_contact"]}</h5><ul>
<li><a href="mailto:{MAIL}">{MAIL}</a></li>
<li><a href="{BASE}">{L["site"]} · christopherjacquescj.github.io/liquid-weather-site</a></li></ul></div>
</div>
<p class="legal">{L["legal"]}</p>
</div></footer>
<script src="site.js" defer></script>
</body></html>'''

def sky():
    return '<div class="sky"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><canvas id="stars" aria-hidden="true"></canvas></div><div class="grain"></div>' + SPRITE

# ---------- index ----------
def index(L):
    fr = L["lang"] == "fr"
    T = typo if fr else (lambda s: s)
    mine, other = page_urls(L, "index")
    P = L["phone"]
    stats = "".join(f'<div class="stat"><b>{a}</b><span>{T(b)}</span></div>' for a, b in L["stats"])
    chips = "".join(f'<div class="chip c{i+1}"><i>{c[0]}</i><div>{T(c[1])}<small>{T(c[2])}</small></div></div>' for i, c in enumerate(L["chips"]))
    hours = "".join(f'<div><span>{h}</span><svg><use href="#{ic_}"/></svg><span>{t}°</span></div>' for h, ic_, t in
                    zip([P["now"]] + P["h"], ["i-sun", "i-sc", "i-cloud", "i-rain", "i-rain"], [19, 20, 20, 18, 17]))
    sources = ["Météo-France · AROME", "AROME HD 0,01°" if fr else "AROME HD 0.01°", "ARPEGE", "DWD · ICON-D2", "ICON-EU", "NOAA · GFS", "ECMWF", "EUMETSAT", "Copernicus EFFIS", "MeteoAlarm", "Open-Meteo"]
    strip = "".join(f"<span><b>{s.split(' · ')[0]}</b>{' · ' + s.split(' · ')[1] if ' · ' in s else ''}</span>" for s in sources)
    strip = strip + strip
    tiles = ""
    spans = ["s4", "s4", "s4", "s4", "s4", "s4"]
    for i, (icon, c1, c2, title, text) in enumerate(L["tiles"]):
        if text is None:
            tags = L["tags_sky"] if icon == "mountain" else L["tags_lang"]
            body = '<div class="tags">' + "".join(f"<span>{T(t)}</span>" for t in tags) + "</div>"
        else:
            body = f"<p>{T(text)}</p>"
        tiles += f'''<article class="glass tile {spans[i]} reveal" style="--d:{i*.07:.2f}s;--c1:{c1};--c2:{c2};--c:{c2}">
<div class="ic">{ICON[icon]}</div><h3>{T(title)}</h3>{body}</article>'''
    layers = "".join(f'<button data-layer="{k}" aria-pressed="{"true" if k=="temp" else "false"}"></button>' for k in L["m_layers"])
    legend_btns = "".join(f'<button aria-pressed="true" style="--c:{c}"><i></i>{n}</button>' for n, c in
                          [("AROME", "#5ccbff"), ("ICON", "#45e0b0"), ("ARPEGE", "#ffb84a"), ("GFS", "#ff6fa8"), ("ECMWF", "#b58cff")])
    steps = ""
    for i, (n, t) in enumerate(L["h_steps"]):
        steps += f'<div><i>{n}</i>{T(t)}</div>'
        if i < len(L["h_steps"]) - 1: steps += '<div class="arrow" aria-hidden="true">↓</div>'
    pillars = "".join(f'''<article class="glass tile s4 reveal" style="--d:{i*.08:.2f}s;--c1:#6fe0ff;--c2:#8b6bff;--c:#8b6bff;min-height:0"><div class="ic">{ICON[a]}</div><h3>{T(b)}</h3><p>{T(c)}</p></article>''' for i, (a, b, c) in enumerate(L["pillars"]))
    faq = "".join(f"<details><summary>{T(q)}</summary><p>{T(a)}</p></details>" for q, a in L["faq"])
    wid = L["w_wid"]
    jsonld = f'''<script type="application/ld+json">{{"@context":"https://schema.org","@type":"MobileApplication","name":"Liquid Weather","operatingSystem":"iOS","applicationCategory":"WeatherApplication","description":"{L["desc"]}","offers":{{"@type":"Offer","price":"0","priceCurrency":"EUR"}},"inLanguage":["fr","en","es","de","it","pt","ar"]}}</script>'''
    subject = "Liquid%20Weather"
    html = head(L, "index", L["title"], L["desc"]).replace("</head>", jsonld + "\n</head>") + "\n<body>\n" + sky() + header(L, "index") + f'''
<main>
<section class="hero"><div class="wrap hero-grid">
<div>
<p class="eyebrow reveal">{T(L["eyebrow"])}</p>
<h1 class="reveal" style="--d:.05s">{L["h1"]}</h1>
<p class="lead reveal" style="--d:.12s">{T(L["lead"])}</p>
<div class="cta reveal" style="--d:.2s">
<a class="btn" href="#features">{L["cta1"]}{ICON["arrow"]}</a>
<a class="btn ghost" href="{mine["support"]}">{L["cta2"]}</a>
<a class="btn" href="{APP_STORE}" target="_blank" rel="noopener" data-appstore>{ICON["apple"]}{L["dl"]}</a>
<span class="pill" data-soon><span class="dot"></span>{L["soon"]}</span>
</div>
<div class="stats reveal" style="--d:.28s">{stats}</div>
</div>
<div class="stage reveal" style="--d:.15s"><div class="float"><div class="phone" aria-hidden="true"><div class="screen">
<div class="island"></div><div class="status"><span>9:41</span><span>●●●● 5G</span></div>
<div class="rain"></div>
<div class="ui">
<div class="city"><small>{P["place"]}</small><strong>Lyon</strong></div>
<svg viewBox="0 0 120 64" width="100%" height="62" aria-hidden="true"><g class="sun" style="transform-origin:78px 26px"><circle cx="78" cy="26" r="13" fill="#ffd25a"/><g stroke="#ffd25a" stroke-width="3" stroke-linecap="round"><path d="M78 4v5M78 43v5M56 26h5M95 26h5M62 10l3.500 3.500M91 39l3.500 3.500M62 42l3.500-3.500M91 13l3.500-3.500"/></g></g><g class="cloud"><path d="M32 54a12 12 0 0 1-1.600-23.900A16 16 0 0 1 62 33a10.500 10.500 0 0 1-1 21z" fill="#fff" opacity=".96"/></g></svg>
<div class="temp"><span data-count="19">0</span><sup>°</sup></div>
<div class="cond">{P["cond"]}<small>{T(P["sub"])}</small></div>
<div class="mini"><h4>{P["next"]}</h4><div class="hours">{hours}</div></div>
<div class="mini"><h4>{P["day"]}</h4><svg class="spark" viewBox="0 0 260 56" preserveAspectRatio="none"><defs><linearGradient id="sa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path class="area" d="M0,40 C30,38 50,20 80,18 C110,16 130,32 160,28 C190,24 210,12 260,16 L260,56 L0,56Z"/><path class="line" d="M0,40 C30,38 50,20 80,18 C110,16 130,32 160,28 C190,24 210,12 260,16"/></svg></div>
<div class="tabbar"><i class="on"></i><i></i><i></i><i></i><i></i></div>
</div></div></div></div>
{chips}
</div>
</div></section>

<div class="strip" aria-label="{L["strip"]}"><div class="track">{strip}</div></div>

<section class="block" id="features"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["f_eyebrow"]}</p><h2>{T(L["f_h2"])}</h2><p>{T(L["f_p"])}</p></div>
<div class="bento">{tiles}</div>
</div></section>

<section class="block" id="maps"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["m_eyebrow"]}</p><h2>{T(L["m_h2"])}</h2><p>{T(L["m_p"])}</p></div>
<div class="glass maps reveal">
<div class="view"><canvas id="map" role="img" aria-label="{L["m_alt"]}"></canvas>
<div class="overlay"><button class="play" id="tlPlay" aria-label="{L["m_play"]}"></button>
<div class="tl"><b id="tlLabel"></b><small id="mapBadge"></small><input type="range" id="tlRange" min="0" max="24" step="0.01" value="0" aria-label="{L["m_slider"]}"></div></div></div>
<div class="side"><span class="pill badge"><span class="dot"></span>AROME HD</span>
<h3>{T(L["m_h3"])}</h3><p>{T(L["m_side"])}</p>
<div class="layers">{layers}</div>
<div class="legend"></div><div class="legend-l"><span id="lgA"></span><span id="lgB"></span><span id="lgC"></span></div>
<p class="muted">{L["illus"]}</p></div>
</div></div></section>

<section class="block" id="models"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["c_eyebrow"]}</p><h2>{T(L["c_h2"])}</h2><p>{T(L["c_p"])}</p></div>
<div class="glass models reveal">
<div><h3>{T(L["c_h3"])}</h3><p style="margin-top:12px">{T(L["c_t"])}</p>
<div class="agree"><span>{L["c_agree"]}</span><div class="meter"><i id="meterFill"></i></div><b id="agreeNum">–</b></div>
<p class="muted">{L["c_spread"]} <b id="spread" style="color:#fff"></b> {L["c_at"]} <b id="hzLabel" style="color:#fff"></b></p>
<input type="range" id="hzRange" min="0" max="72" step="1" value="36" aria-label="{L["c_hz"]}">
<div class="legend-m">{legend_btns}</div><p class="muted">{L["illus"]}</p></div>
<svg id="chart" class="chart" viewBox="0 0 640 280" role="img" aria-label="{L["c_alt"]}"><defs><linearGradient id="bandg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ee6ff"/><stop offset="1" stop-color="#b58cff"/></linearGradient></defs></svg>
</div></div></section>

<section class="block" id="moon"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["l_eyebrow"]}</p><h2>{T(L["l_h2"])}</h2></div>
<div class="glass moonbox reveal">
<div class="moon-stage"><svg viewBox="0 0 400 400" role="img" aria-label="{L["l_alt"]}"><defs><mask id="mm" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><rect width="400" height="400" fill="#000"/><g id="moonFlip"><path id="moonLit" fill="#fff"/></g></mask></defs>
<image href="assets/moon.png" x="-12" y="-12" width="424" height="424" opacity=".13"/>
<image href="assets/moon.png" x="-12" y="-12" width="424" height="424" mask="url(#mm)"/></svg></div>
<div><p style="font-size:19px">{T(L["l_p"])}</p>
<div class="phase"><div><b id="moonName">–</b><small>{L["l_eyebrow"]}</small></div><div><b id="moonPct">–</b><small>{L["l_illum"]}</small></div><div><b id="moonAge">–</b><small>{L["l_age"]}</small></div></div></div>
</div></div></section>

<section class="block" id="ask"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["a_eyebrow"]}</p><h2>{T(L["a_h2"])}</h2></div>
<div class="glass ask reveal">
<div><p style="font-size:18px">{T(L["a_p"])}</p><p class="muted" style="margin-top:14px">{L["a_ex"]}</p></div>
<div class="chat" aria-live="off">
<div class="rim"><div>{ic('<path d="M12 3l1.900 5.100L19 10l-5.100 1.900L12 17l-1.900-5.100L5 10l5.100-1.900z"/><path d="M19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z"/>')}<span class="q" id="askQ"></span></div></div>
<div class="answer" id="askBubble"><p id="askA"></p><div class="bars" id="askBars">{"<i></i>"*12}</div><div class="bars-l"><span>{L["a_bars"][0]}</span><span>{L["a_bars"][1]}</span></div></div>
</div></div></div></section>

<section class="block" id="widgets"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["w_eyebrow"]}</p><h2>{T(L["w_h2"])}</h2><p>{T(L["w_p"])}</p></div>
<div class="glass devices reveal">
<div><div class="w sky1"><small>{wid[0]}</small><div class="big" style="margin-top:10px">{wid[1]}</div><svg width="46" height="46" style="margin:8px 0 4px"><use href="#i-sc"/></svg><br><small>{T(wid[2])}</small><br><small style="opacity:.8">{T(wid[3])}</small></div><p class="cap">{T(L["w_caps"][0])}</p></div>
<div><div class="w uv"><div><svg viewBox="0 0 100 100" width="92" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="40" fill="none" stroke-width="9"/><circle class="ring-fg" cx="50" cy="50" r="40" fill="none" stroke="#ffd25a" stroke-width="9" stroke-linecap="round" transform="rotate(-90 50 50)" pathLength="251"/><text x="50" y="58" text-anchor="middle" fill="#fff" font-size="28" font-weight="700" font-family="-apple-system,sans-serif">6</text></svg><small>UV</small></div></div><p class="cap">{T(L["w_caps"][1])}</p></div>
<div><div class="w moon"><img src="assets/moon.png" alt="" width="200" height="200" loading="lazy"></div><p class="cap">{T(L["w_caps"][2])}</p></div>
<div><div class="watch"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="40" fill="none" stroke-width="9"/><circle class="ring-fg" cx="50" cy="50" r="40" fill="none" stroke="#5ccbff" stroke-width="9" stroke-linecap="round" transform="rotate(-90 50 50)" pathLength="251"/><text x="50" y="47" text-anchor="middle" fill="#fff" font-size="26" font-weight="700" font-family="-apple-system,sans-serif">19°</text><text x="50" y="64" text-anchor="middle" fill="#9fc8ff" font-size="11" font-weight="600" font-family="-apple-system,sans-serif">Lyon</text></svg></div><p class="cap">{T(L["w_caps"][3])}</p></div>
</div></div></section>

<section class="block" id="hood"><div class="wrap">
<div class="glass hood reveal">
<div><p class="eyebrow">{L["h_eyebrow"]}</p><h2 style="font-size:clamp(32px,4.4vw,56px)">{T(L["h_h2"])}</h2><p style="margin-top:20px;font-size:18px">{T(L["h_p"])}</p></div>
<div class="pipe">{steps}</div>
</div></div></section>

<section class="block" id="privacy"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["p_eyebrow"]}</p><h2>{T(L["p_h2"])}</h2></div>
<div class="bento">{pillars}</div>
<p class="reveal" style="margin-top:28px"><a class="btn ghost" href="{mine["privacy"]}">{L["p_link"]}{ICON["arrow"]}</a></p>
</div></section>

<section class="block" id="faq"><div class="wrap">
<div class="head reveal"><p class="eyebrow">{L["q_eyebrow"]}</p><h2>{T(L["q_h2"])}</h2></div>
<div class="faq reveal">{faq}</div>
</div></section>

<section class="block"><div class="wrap">
<div class="glass final reveal">
<img class="icon" src="assets/icon.png" width="96" height="96" alt="Liquid Weather">
<h2>{T(L["fin_h2"])}</h2><p>{T(L["fin_p"])}</p>
<div class="cta"><a class="btn" href="mailto:{MAIL}?subject={subject}">{ICON["mail"]}{L["fin_mail"]}</a><a class="btn ghost" href="{mine["privacy"]}">{L["fin_priv"]}</a><a class="btn" href="{APP_STORE}" target="_blank" rel="noopener" data-appstore>{ICON["apple"]}{L["dl"]}</a><a class="btn ghost" href="{BMC}" target="_blank" rel="noopener">{ICON["cup"]}{L["coffee"]}</a></div>
</div></div></section>
</main>
''' + footer(L, "index")
    return html

# ---------- support ----------
SUP = dict(
    fr=dict(
        title="Assistance — Liquid Weather", desc="Contactez le support de Liquid Weather : une question, une idée, un problème ? Écrivez à supportliquidweatherapp@gmail.com.",
        eyebrow="Aide et contact", h1="On vous répond.", lead="Une question, une idée, un souci avec Liquid Weather ? Écrivez-nous : nous lisons tout.",
        mail_label="E-mail", mail_btn="Écrire au support", site_btn="Site de contact",
        subject="Liquid Weather — Assistance",
        help_h="Pour que nous puissions vous répondre vite",
        help=["Votre modèle d’iPhone ou d’iPad et la version d’iOS", "La version de Liquid Weather", "La ville et le modèle météo choisis", "Ce que vous avez fait juste avant, et une capture d’écran si possible"],
        fix_h="Avant de nous écrire", fix="Vérifiez votre connexion, essayez le modèle Automatique et appuyez sur Actualiser. Certains modèles régionaux ne couvrent pas toutes les villes.",
        priv_h="Confidentialité", priv='Consultez notre <a href="privacy.html">politique de confidentialité</a>.',
        site_h="Site", site_t="Retrouvez-nous aussi sur"),
    en=dict(
        title="Support — Liquid Weather", desc="Contact Liquid Weather support: a question, an idea, a problem? Write to supportliquidweatherapp@gmail.com.",
        eyebrow="Help and contact", h1="We’re here.", lead="A question, an idea, an issue with Liquid Weather? Write to us — we read everything.",
        mail_label="Email", mail_btn="Email support", site_btn="Contact website",
        subject="Liquid Weather — Support",
        help_h="So we can get back to you quickly",
        help=["Your iPhone or iPad model and iOS version", "Your Liquid Weather version", "The city and weather model you selected", "What you did just before, and a screenshot if possible"],
        fix_h="Before you write", fix="Check your connection, try the Automatic model and tap Refresh. Some regional models do not cover every city.",
        priv_h="Privacy", priv='Read our <a href="privacy-en.html">privacy policy</a>.',
        site_h="Website", site_t="You can also find us on"),
)

def support(L):
    S = SUP[L["lang"]]
    T = typo if L["lang"] == "fr" else (lambda s: s)
    mine, other = page_urls(L, "support")
    subj = S["subject"].replace(" ", "%20").replace("—", "%E2%80%94")
    checks = "".join(f"<li>{T(c)}</li>" for c in S["help"])
    return head(L, "support", S["title"], S["desc"]) + "\n<body>\n" + sky() + header(L, "support") + f'''
<main><section class="page"><div class="wrap">
<p class="eyebrow reveal">{S["eyebrow"]}</p>
<h1 class="reveal" style="--d:.05s"><span class="grad">{S["h1"]}</span></h1>
<p class="lead reveal" style="--d:.1s">{T(S["lead"])}</p>
<div class="contact-grid">
<div class="glass contact-card reveal" style="--d:.12s">
<p class="eyebrow" style="margin:0">{S["mail_label"]}</p>
<div class="big"><a href="mailto:{MAIL}?subject={subj}">{MAIL}</a></div>
<div class="cta" style="margin:8px 0 0"><a class="btn" href="mailto:{MAIL}?subject={subj}">{ICON["mail"]}{S["mail_btn"]}</a><a class="btn ghost" href="{BASE}">{ICON["link"]}{S["site_btn"]}</a><a class="btn ghost" href="{BMC}" target="_blank" rel="noopener">{ICON["cup"]}{L["coffee"]}</a></div>
<p class="muted">{BASE.replace("https://", "")}</p>
</div>
<div class="glass contact-card reveal" style="--d:.2s">
<h3>{T(S["help_h"])}</h3><ul class="checks">{checks}</ul>
</div></div>
<div class="glass article reveal" style="margin-top:20px;max-width:none">
<h2>{T(S["fix_h"])}</h2><p>{T(S["fix"])}</p>
<h2>{T(S["priv_h"])}</h2><p>{S["priv"]}</p>
</div>
</div></section></main>
''' + footer(L, "support")

# ---------- privacy (legal text kept as it was; only restyled) ----------
PRIV = dict(
    fr=dict(title="Politique de confidentialité — Liquid Weather", desc="Politique de confidentialité de Liquid Weather : pas de compte, pas de publicité, localisation facultative.",
        eyebrow="Liquid Weather", h1="Politique de confidentialité", upd="Mise à jour : 18 octobre 2026",
        body='''<h2>1. Principes généraux</h2><p>Liquid Weather est une application météo gratuite. Elle ne demande pas de création de compte, n'affiche pas de publicité et n'intègre pas de système de suivi publicitaire propre à l'application.</p><h2>2. Données météorologiques et recherches</h2><p>Pour afficher les prévisions ou rechercher une ville, l'application transmet le nom de la ville ou des coordonnées géographiques à des services météorologiques, notamment Open-Meteo. Certaines cartes peuvent récupérer des données auprès de producteurs météorologiques comme NOAA, DWD ou Météo-France et utiliser des services cartographiques tiers.</p><p>Lors de ces communications, les fournisseurs peuvent techniquement recevoir des informations de connexion, telles que l'adresse IP. Leurs pratiques sont régies par leurs propres politiques de confidentialité.</p><h2>3. Localisation</h2><p>Avec votre autorisation, Liquid Weather utilise la position précise de votre appareil pour présenter la météo locale. Les coordonnées nécessaires peuvent être transmises aux services de prévisions. Cette autorisation est facultative : vous pouvez choisir une ville manuellement et modifier votre autorisation dans les réglages iOS. L'application peut également utiliser les services de géocodage d'Apple.</p><h2>4. Données enregistrées sur l'appareil</h2><p>Les villes enregistrées, unités, langue et choix de modèle météo sont conservés localement sur l'appareil. Des données météorologiques peuvent également être mises en cache pour améliorer l'affichage.</p><h2>5. Résumés météo et Apple Intelligence</h2><p>Si Apple Intelligence est disponible et activé, l'application peut utiliser les modèles Foundation Models d'Apple sur l'appareil pour formuler un résumé à partir des faits météo affichés. En cas d'indisponibilité, elle utilise un résumé local.</p><h2>6. Vos choix</h2><p>Vous pouvez désactiver la localisation dans les réglages iOS. Vous pouvez supprimer les données locales de l'application en supprimant l'application de l'appareil, sous réserve des éventuelles sauvegardes gérées par iOS.</p><h2>7. Contact</h2><p>Pour toute question relative à la confidentialité, écrivez à <a href="mailto:%(mail)s">%(mail)s</a> ou consultez la <a href="support.html">page d'assistance</a>.</p>'''),
    en=dict(title="Privacy policy — Liquid Weather", desc="Liquid Weather privacy policy: no account, no ads, optional location.",
        eyebrow="Liquid Weather", h1="Privacy policy", upd="Updated: October 18, 2026",
        body='''<h2>1. Overview</h2><p>Liquid Weather is a free weather app. It does not require user accounts, display advertisements or integrate its own advertising tracking system.</p><h2>2. Weather data and searches</h2><p>To provide forecasts or search for a location, the app sends the location name or geographic coordinates to weather services, including Open-Meteo. Some maps may retrieve data from weather agencies such as NOAA, DWD and Météo-France and use third-party mapping services.</p><p>When accessing these services, providers may technically receive connection information such as your IP address. Their handling of that information is subject to their respective privacy policies.</p><h2>3. Location</h2><p>With your permission, Liquid Weather uses your device's precise location to show local forecasts. Required coordinates may be sent to weather providers. Location access is optional: you can manually select a city and change permissions in iOS Settings. The app may also use Apple geocoding services.</p><h2>4. On-device data</h2><p>Saved cities, units, language and selected weather model are stored locally on the device. Weather data may also be cached for improved display.</p><h2>5. Weather summaries and Apple Intelligence</h2><p>Where available and enabled, the app may use Apple's on-device Foundation Models to generate summaries from weather facts already shown in the app. A local summary is used when the model is unavailable.</p><h2>6. Your choices</h2><p>You can disable location access in iOS Settings. You can delete local app data by uninstalling the app, subject to any backups managed by iOS.</p><h2>7. Contact</h2><p>For privacy questions, please email <a href="mailto:%(mail)s">%(mail)s</a> or see the <a href="support-en.html">support page</a>.</p>'''),
)

def privacy(L):
    S = PRIV[L["lang"]]
    return head(L, "privacy", S["title"], S["desc"]) + "\n<body>\n" + sky() + header(L, "privacy") + f'''
<main><section class="page"><div class="wrap">
<p class="eyebrow reveal">{S["eyebrow"]}</p>
<h1 class="reveal" style="--d:.05s"><span class="grad">{S["h1"]}</span></h1>
<p class="muted reveal">{S["upd"]}</p>
<div class="glass article reveal" style="--d:.1s">{S["body"] % dict(mail=MAIL)}</div>
</div></section></main>
''' + footer(L, "privacy")

# ---------- 404 ----------
def absolutize(html):
    """The 404 page is served from any path: every relative link must be absolute."""
    return re.sub(r'(href|src)="(?!https?:|mailto:|#|data:)([^"]+)"', lambda m: f'{m.group(1)}="{BASE}{m.group(2)}"', html)

def notfound(L):
    mine, _ = page_urls(L, "index")
    page = head(L, "index", "404 — Liquid Weather", "").replace(f'<link rel="canonical" href="{BASE}">', "") + "\n<body>\n" + sky() + header(L, "index") + f'''
<main><section class="page"><div class="wrap" style="text-align:center;padding:12vh 0">
<h1><span class="grad">404</span></h1><p class="lead" style="margin:18px auto 30px">{"Cette page s’est évaporée." if L["lang"]=="fr" else "This page evaporated."}</p>
<a class="btn" href="{mine["index"]}">{"Retour à l’accueil" if L["lang"]=="fr" else "Back home"}</a></div></section></main>
''' + footer(L, "index")
    return absolutize(page).replace('href="#features"', f'href="{BASE}#features"')

def main():
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "assets"))
    here = os.path.dirname(os.path.abspath(__file__))
    for f in ["style.css", "site.js"]: shutil.copy(os.path.join(here, f), OUT)
    for f in os.listdir(os.path.join(here, "assets")): shutil.copy(os.path.join(here, "assets", f), os.path.join(OUT, "assets", f))
    pages = {"index.html": index(FR), "index-en.html": index(EN), "support.html": support(FR), "support-en.html": support(EN),
             "privacy.html": privacy(FR), "privacy-en.html": privacy(EN), "404.html": notfound(FR)}
    for name, html in pages.items():
        html = html.replace("\u200b", "")
        open(os.path.join(OUT, name), "w", encoding="utf-8").write(html)
    open(os.path.join(OUT, ".nojekyll"), "w").write("")
    open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n")
    urls = "".join(f"<url><loc>{BASE}{p}</loc></url>" for p in ["", "index-en.html", "support.html", "support-en.html", "privacy.html", "privacy-en.html"])
    open(os.path.join(OUT, "sitemap.xml"), "w").write(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>')
    print("built", sorted(os.listdir(OUT)))

main()
