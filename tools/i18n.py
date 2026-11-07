# -*- coding: utf-8 -*-
"""Textes du site, en français et en anglais. Le script build_site.py les insère dans les pages."""

BASE = "https://christopherjacquescj.github.io/liquid-weather-site/"
APP_STORE = "https://apps.apple.com/us/app/liquid-weather/id6807434223"
COFFEE = "https://buymeacoffee.com/liquidweatherapp"
MAIL = "supportliquidweatherapp@gmail.com"

# Pages : nom -> (fichier FR, fichier EN)
FILES = {
    "home": ("index.html", "index-en.html"),
    "news": ("actualites.html", "actualites-en.html"),
    "privacy": ("privacy.html", "privacy-en.html"),
    "support": ("support.html", "support-en.html"),
}

T = {
"fr": {
    "lang": "fr", "locale": "fr_FR", "other_lang": "en", "other_name": "English",
    "skip": "Aller au contenu",
    "nav_app": "L’app", "nav_news": "Actualités", "nav_privacy": "Confidentialité", "nav_support": "Assistance",
    "nav_menu": "Menu", "nav_label": "Navigation principale",
    "coffee_long": "Offrez-moi un café", "coffee_short": "Café", "coffee_aria": "Offrez-moi un café (Buy Me a Coffee, nouvel onglet)",
    "store": "App Store", "store_aria": "Télécharger Liquid Weather sur l’App Store (nouvel onglet)",
    "store_long": "Télécharger sur l’App Store",

    # --- le ciel
    "dock_label": "Le ciel", "dock_aria": "Choisir le ciel", "dock_hint": "Changez le ciel",
    "sky_auto": "Auto", "sky_clear": "Soleil", "sky_cloudy": "Nuageux", "sky_rain": "Pluie", "sky_storm": "Orage", "sky_snow": "Neige", "sky_night": "Nuit",
    "sky_pause": "Mettre le ciel en pause", "sky_play": "Relancer le ciel animé",

    # --- accueil : méta
    "home_title": "Liquid Weather — La météo en verre liquide pour iPhone, iPad et Apple Watch",
    "home_desc": "Liquid Weather réunit AROME, ICON, ARPEGE, GFS et ECMWF : prévisions heure par heure, cartes météo HD animées, comparaison des modèles, alertes officielles, Lune et assistant IA. Gratuit, sans pub.",

    # --- accueil : héros
    "hero_title": "Voyez le ciel venir.",
    "hero_lead": "Liquid Weather réunit les meilleurs modèles météo du monde dans une interface en verre liquide. Gratuite, sans publicité, sans abonnement, en 7 langues, avec 10 jours de prévisions heure par heure.",
    "hero_more": "Découvrir l’app",
    "hero_fine": "Application gratuite pour iPhone, iPad et Apple Watch.",
    "tour_aria": "Visite de l’app",
    "tour_real": "Vraies captures de l’app, affichée en français (7 langues disponibles). Données du jour de la capture.",
    "tour_dots": "Chapitres de la visite",
    "phone_tabbar": "Barre d’onglets de l’app",
    "phone_label": "Écran de Liquid Weather",

    # --- modèles
    "models_title": "Les modèles ne sont pas toujours d’accord.",
    "models_lead": "Chaque centre météo calcule sa propre prévision. Pour demain, elles se ressemblent. Pour dans huit jours, beaucoup moins. Liquid Weather les met sur le même graphique, vous dit si elles s’accordent, et vous montre si la prévision change d’un calcul à l’autre.",
    "models_chart_aria": "Illustration : cinq courbes de prévision qui s’écartent avec le temps",
    "models_slider": "Dans combien de temps ?",
    "models_now": "Maintenant", "models_in": "dans {n} j", "models_in1": "dans 1 jour",
    "models_agree": "Accord des modèles",
    "agree_4": "Très bon", "agree_3": "Bon", "agree_2": "Moyen", "agree_1": "Faible",
    "models_note": "Illustration : ces courbes sont un exemple, pas une prévision.",
    "models_axis": "Maintenant|+3 j|+6 j|+10 j",
    "m_arome": "AROME", "m_arome_by": "Météo-France",
    "m_arpege": "ARPEGE", "m_arpege_by": "Météo-France",
    "m_icon": "ICON", "m_icon_by": "DWD, Allemagne",
    "m_gfs": "GFS", "m_gfs_by": "NOAA, États-Unis",
    "m_ecmwf": "ECMWF", "m_ecmwf_by": "Centre européen",

    # --- sommaire (fonctionnalités)
    "feat_title": "Tout ce qu’il faut. Rien de superflu.",
    "feat_lead": "Une seule app pour comprendre le temps qu’il fait, celui qui arrive, et la confiance qu’on peut lui accorder.",
    "f1_t": "Prévisions d’expert", "f1_p": "Heure par heure et jusqu’à 10 jours : température, ressenti, vent, rafales, humidité, pression, UV, précipitations. Touchez une donnée pour plonger dans le détail.",
    "f2_t": "Alertes et risques", "f2_p": "Vigilances officielles MeteoAlarm de votre zone, notifications utiles et indicateurs de risque lisibles d’un coup d’œil.",
    "f2_levels": "Vert|Jaune|Orange|Rouge",
    "f3_t": "Du ciel à la montagne", "f3_chips": "Montagne et neige|Mer|Indice UV|Qualité de l’air|Pollen|Soleil|Pression|Prévisions saisonnières|Feux de forêt (EFFIS)|Foudre (satellite)",
    "f4_t": "Dans votre langue", "f4_p": "Toute l’app est disponible en 7 langues.",
    "f5_t": "Fluide sous le doigt", "f5_p": "Une interface en verre liquide pensée pour iOS : tout répond, tout s’anime, rien ne surcharge.",
    "f6_t": "Partout où vous êtes", "f6_p": "iPhone, iPad, Apple Watch. Widgets d’écran d’accueil et d’écran verrouillé, complications, tableau de risques sur iPad.",
    "f6_chips": "iPhone|iPad|Apple Watch|Widgets|Complications",

    # --- actualités (accueil)
    "news_title": "Les actualités météo",
    "news_lead": "Ce que fait le ciel, expliqué simplement.",
    "news_all": "Toutes les actualités",
    "news_loading": "Chargement des articles…",
    "news_error": "Les articles ne se chargent pas pour le moment. Réessayez dans un instant.",
    "news_noscript": "Les actualités s’affichent avec JavaScript. Vous pouvez aussi les lire sur la page Actualités.",

    # --- en préparation
    "soon_title": "En préparation",
    "soon_lead": "Deux nouveautés arrivent. Pas en même temps : voici le programme.",
    "soon1_when": "Bientôt", "soon1_t": "Cartes de pollution et de vigilance",
    "soon1_p1": "La carte des vigilances MeteoAlarm affiche les alertes météo officielles zone par zone, sur toute l’Europe, du vert au rouge.",
    "soon1_p2": "La carte de la pollution montre la qualité de l’air avec l’indice européen, à partir des données Copernicus CAMS. Elle devient plus précise quand vous zoomez.",
    "soon2_when": "Plus tard cette année", "soon2_t": "Ask Liquid avec Apple Private Cloud Compute",
    "soon2_p1": "Avec une connexion internet, Ask Liquid s’appuiera sur un modèle plus puissant : plus d’informations à la fois, des réponses meilleures et plus précises. Sans connexion, il continue de fonctionner avec le modèle de votre iPhone.",
    "soon2_p2": "Selon Apple, ce service est conçu pour protéger la vie privée : les données de votre demande ne sont ni stockées ni conservées une fois la réponse donnée.",
    "soon_fine": "Ces fonctions sont en cours de développement.",
    "soon_read": "Lire l’annonce",
    "soon_fig1": "La carte des vigilances dans l’onglet Cartes.", "soon_fig2": "La carte de la pollution : l’indice européen de qualité de l’air.", "soon_fig3": "Ask Liquid : sur votre iPhone, ou avec le cloud sécurisé d’Apple quand vous êtes connecté.",

    # --- vie privée
    "priv_title": "Votre météo, votre affaire.",
    "priv1_t": "Sans compte", "priv1_p": "Aucune inscription, aucun identifiant : ouvrez l’app et c’est parti.",
    "priv2_t": "Sans publicité ni pistage", "priv2_p": "Pas de publicité, pas de système de suivi publicitaire propre à l’application.",
    "priv3_t": "Position facultative", "priv3_p": "Autorisez-la pour la météo locale, ou choisissez simplement une ville. Vous gardez la main.",
    "priv_read": "Lire la politique de confidentialité",
    "hood_title": "Directement à la source.",
    "hood_p": "Les cartes lisent les fichiers ouverts de Météo-France, du DWD et de la NOAA puis les décodent sur votre appareil. Aucun serveur Liquid Weather ne s’interpose entre vous et les données officielles.",
    "hood_steps": "Météo-France, DWD, NOAA|Fichiers GRIB2 ouverts|Décodés sur votre iPhone|Votre carte, instantanée",
    "hood_aria": "Du fichier officiel à votre carte, sans serveur Liquid Weather",

    # --- FAQ
    "faq_title": "Questions fréquentes",
    "faq": [
        ("Liquid Weather est-elle gratuite ?", "Oui. L’application est gratuite, sans publicité ni abonnement."),
        ("D’où viennent les données ?", "Les prévisions viennent d’Open-Meteo. Les cartes lisent directement les données ouvertes de Météo-France (AROME, ARPEGE), du DWD (ICON) et de la NOAA (GFS). La Lune est calculée sur l’appareil ; la foudre vient du satellite EUMETSAT ; les vigilances de MeteoAlarm ; le risque feux de Copernicus EFFIS."),
        ("Les cartes sont-elles du radar ?", "Non, et c’est dit clairement dans l’app : ce sont des prévisions de modèles, jamais des observations radar. Seule la couche foudre est une observation satellite."),
        ("Quels appareils sont compatibles ?", "iPhone, iPad et Apple Watch. Les résumés et l’assistant IA fonctionnent sur les appareils compatibles Apple Intelligence."),
        ("Dois-je activer la localisation ?", "Non. Elle est facultative : vous pouvez choisir une ville à la main et modifier l’autorisation à tout moment dans les réglages iOS."),
        ("Comment vous contacter ?", "Par e-mail à " + MAIL + ", ou depuis la page Assistance. Nous lisons tout."),
    ],

    # --- café + contact
    "cta_title": "Prêt à voir le ciel autrement ?",
    "coffee_title": "Liquid Weather est gratuite, sans publicité et sans abonnement.",
    "coffee_p": "Si elle vous plaît, vous pouvez m’offrir un café. C’est ce qui m’aide à continuer à la faire grandir.",
    "coffee_fine": "Le lien s’ouvre sur Buy Me a Coffee.",
    "contact_title": "Une question, une idée, un souci ?",
    "contact_p": "Écrivez-nous : nous lisons tout.",
    "contact_btn": "Écrire au support", "contact_page": "Page d’assistance",
    "mail_subject": "Liquid Weather — Assistance",

    # --- pied de page
    "foot_tag": "La météo en verre liquide.",
    "foot_links": "Liens", "foot_contact": "Contact", "foot_site": "Site",
    "foot_home": "Accueil",
    "legal": "© 2026 Liquid Weather. Données : Open-Meteo, Météo-France (Licence Ouverte 2.0), DWD, NOAA, ECMWF, EUMETSAT, MeteoAlarm, Copernicus. Ces organismes ne soutiennent ni n’approuvent Liquid Weather. Les écrans présentés sont de vraies captures de l’app (données du jour de la capture).",

    # --- page actualités
    "np_title": "Actualités météo — Liquid Weather",
    "np_desc": "Les actualités météo de Liquid Weather : saisons, climat, vigilance, cyclones. Des explications simples, en 7 langues.",
    "np_h1": "Actualités", "np_lead": "Ce que fait le ciel, expliqué simplement. Chaque article est disponible en 7 langues.",
    "np_search": "Chercher un article", "np_all": "Tout", "np_count_one": "{n} article", "np_count_many": "{n} articles", "np_none": "Aucun article ne correspond.",
    "np_back": "Toutes les actualités", "np_read": "Lire l’article", "np_source": "Source", "np_photo": "Image", "np_share": "Partager", "np_copied": "Lien copié",
    "np_more": "À lire aussi", "np_lang": "Langue de l’article", "np_licence": "Licence", "np_notfound": "Cet article n’existe pas.", "np_notfound_p": "Il a peut-être été déplacé. Voici les dernières actualités.",
    "np_updated": "Publié le", "np_pd": "domaine public", "np_period": "Période", "np_p_week": "7 jours", "np_p_month": "30 jours", "np_p_quarter": "3 mois", "np_p_year": "Cette année", "np_type": "Type", "np_all_types": "Tous les types", "np_newest": "Plus récents", "np_oldest": "Plus anciens", "np_clear": "Effacer la recherche", "np_prev": "Page précédente", "np_next": "Page suivante", "np_pages": "Pages", "np_page": "Page {n}",

    # --- confidentialité
    "pv_title": "Politique de confidentialité — Liquid Weather",
    "pv_desc": "Politique de confidentialité de Liquid Weather : pas de compte, pas de publicité, localisation facultative.",
    "pv_h1": "Politique de confidentialité", "pv_updated": "Mise à jour : 18 octobre 2026",
    "pv_body": """<h2>1. Principes généraux</h2><p>Liquid Weather est une application météo gratuite. Elle ne demande pas de création de compte, n'affiche pas de publicité et n'intègre pas de système de suivi publicitaire propre à l'application.</p><h2>2. Données météorologiques et recherches</h2><p>Pour afficher les prévisions ou rechercher une ville, l'application transmet le nom de la ville ou des coordonnées géographiques à des services météorologiques, notamment Open-Meteo. Certaines cartes peuvent récupérer des données auprès de producteurs météorologiques comme NOAA, DWD ou Météo-France et utiliser des services cartographiques tiers.</p><p>Lors de ces communications, les fournisseurs peuvent techniquement recevoir des informations de connexion, telles que l'adresse IP. Leurs pratiques sont régies par leurs propres politiques de confidentialité.</p><h2>3. Localisation</h2><p>Avec votre autorisation, Liquid Weather utilise la position précise de votre appareil pour présenter la météo locale. Les coordonnées nécessaires peuvent être transmises aux services de prévisions. Cette autorisation est facultative : vous pouvez choisir une ville manuellement et modifier votre autorisation dans les réglages iOS. L'application peut également utiliser les services de géocodage d'Apple.</p><h2>4. Données enregistrées sur l'appareil</h2><p>Les villes enregistrées, unités, langue et choix de modèle météo sont conservés localement sur l'appareil. Des données météorologiques peuvent également être mises en cache pour améliorer l'affichage.</p><h2>5. Résumés météo et Apple Intelligence</h2><p>Si Apple Intelligence est disponible et activé, l'application peut utiliser les modèles Foundation Models d'Apple sur l'appareil pour formuler un résumé à partir des faits météo affichés. En cas d'indisponibilité, elle utilise un résumé local.</p><h2>6. Vos choix</h2><p>Vous pouvez désactiver la localisation dans les réglages iOS. Vous pouvez supprimer les données locales de l'application en supprimant l'application de l'appareil, sous réserve des éventuelles sauvegardes gérées par iOS.</p><h2>7. Contact</h2><p>Pour toute question relative à la confidentialité, écrivez à <a href="mailto:supportliquidweatherapp@gmail.com">supportliquidweatherapp@gmail.com</a> ou consultez la <a href="support.html">page d'assistance</a>.</p>""",

    # --- assistance
    "sp_title": "Assistance — Liquid Weather",
    "sp_desc": "Contactez le support de Liquid Weather : une question, une idée, un problème ? Écrivez à supportliquidweatherapp@gmail.com.",
    "sp_h1": "On vous répond.", "sp_lead": "Une question, une idée, un souci avec Liquid Weather ? Écrivez-nous : nous lisons tout.",
    "sp_mail_label": "E-mail", "sp_btn": "Écrire au support", "sp_site": "Site de contact",
    "sp_checks_t": "Pour que nous puissions vous répondre vite",
    "sp_checks": "Votre modèle d’iPhone ou d’iPad et la version d’iOS|La version de Liquid Weather|La ville et le modèle météo choisis|Ce que vous avez fait juste avant, et une capture d’écran si possible",
    "sp_before_t": "Avant de nous écrire", "sp_before_p": "Vérifiez votre connexion, essayez le modèle Automatique et appuyez sur Actualiser. Certains modèles régionaux ne couvrent pas toutes les villes.",
    "sp_priv_t": "Confidentialité", "sp_priv_p": "Consultez notre <a href=\"privacy.html\">politique de confidentialité</a>.",
    "sp_coffee_t": "Soutenir Liquid Weather", "sp_coffee_p": "L’app est gratuite et sans publicité. Si elle vous plaît, vous pouvez m’offrir un café.",

    # --- 404
    "nf_title": "404 — Liquid Weather", "nf_h1": "Cette page s’est évaporée.", "nf_p": "Le lien est peut-être ancien. Repartez de l’accueil.", "nf_btn": "Retour à l’accueil",
},

"en": {
    "lang": "en", "locale": "en_US", "other_lang": "fr", "other_name": "Français",
    "skip": "Skip to content",
    "nav_app": "The app", "nav_news": "News", "nav_privacy": "Privacy", "nav_support": "Support",
    "nav_menu": "Menu", "nav_label": "Main navigation",
    "coffee_long": "Buy me a coffee", "coffee_short": "Coffee", "coffee_aria": "Buy me a coffee (Buy Me a Coffee, new tab)",
    "store": "App Store", "store_aria": "Download Liquid Weather on the App Store (new tab)",
    "store_long": "Download on the App Store",

    "dock_label": "The sky", "dock_aria": "Choose the sky", "dock_hint": "Change the sky",
    "sky_auto": "Auto", "sky_clear": "Sun", "sky_cloudy": "Cloudy", "sky_rain": "Rain", "sky_storm": "Storm", "sky_snow": "Snow", "sky_night": "Night",
    "sky_pause": "Pause the animated sky", "sky_play": "Play the animated sky",

    "home_title": "Liquid Weather — Weather in liquid glass for iPhone, iPad and Apple Watch",
    "home_desc": "Liquid Weather brings together AROME, ICON, ARPEGE, GFS and ECMWF: hourly forecasts, animated HD weather maps, model comparison, official warnings, the Moon and an AI assistant. Free, no ads.",

    "hero_title": "See the sky coming.",
    "hero_lead": "Liquid Weather brings together the world’s best weather models in a liquid-glass interface. Free, no ads, no subscription, in 7 languages, with 10 days of hour-by-hour forecasts.",
    "hero_more": "Discover the app",
    "hero_fine": "Free app for iPhone, iPad and Apple Watch.",
    "tour_aria": "App tour",
    "tour_real": "Real screenshots of the app, shown in French (7 languages available). Data as of the capture day.",
    "tour_dots": "Tour chapters",
    "phone_tabbar": "The app’s tab bar",
    "phone_label": "Liquid Weather screen",

    "models_title": "Weather models don’t always agree.",
    "models_lead": "Each weather centre computes its own forecast. For tomorrow they look alike. For eight days from now, much less. Liquid Weather puts them on the same chart, tells you whether they agree, and shows you whether the forecast changes from one run to the next.",
    "models_chart_aria": "Illustration: five forecast curves that drift apart over time",
    "models_slider": "How far ahead?",
    "models_now": "Now", "models_in": "in {n} days", "models_in1": "in 1 day",
    "models_agree": "Model agreement",
    "agree_4": "Very good", "agree_3": "Good", "agree_2": "Fair", "agree_1": "Low",
    "models_note": "Illustration: these curves are an example, not a forecast.",
    "models_axis": "Now|+3 d|+6 d|+10 d",
    "m_arome": "AROME", "m_arome_by": "Météo-France",
    "m_arpege": "ARPEGE", "m_arpege_by": "Météo-France",
    "m_icon": "ICON", "m_icon_by": "DWD, Germany",
    "m_gfs": "GFS", "m_gfs_by": "NOAA, United States",
    "m_ecmwf": "ECMWF", "m_ecmwf_by": "European centre",

    "feat_title": "Everything you need. Nothing you don’t.",
    "feat_lead": "One app to understand the weather now, the weather coming, and how far to trust it.",
    "f1_t": "Expert forecasts", "f1_p": "Hourly and up to 10 days: temperature, feels-like, wind, gusts, humidity, pressure, UV, precipitation. Tap any value to dive into the detail.",
    "f2_t": "Alerts and risks", "f2_p": "Official MeteoAlarm warnings for your area, useful notifications and risk indicators you can read at a glance.",
    "f2_levels": "Green|Yellow|Orange|Red",
    "f3_t": "From sky to summit", "f3_chips": "Mountain and snow|Sea|UV index|Air quality|Pollen|Sun|Pressure|Seasonal outlook|Wildfire risk (EFFIS)|Lightning (satellite)",
    "f4_t": "In your language", "f4_p": "The whole app is available in 7 languages.",
    "f5_t": "Fluid under your finger", "f5_p": "A liquid-glass interface made for iOS: everything responds, everything animates, nothing clutters.",
    "f6_t": "Wherever you are", "f6_p": "iPhone, iPad, Apple Watch. Home and Lock Screen widgets, complications, a risk dashboard on iPad.",
    "f6_chips": "iPhone|iPad|Apple Watch|Widgets|Complications",

    "news_title": "Weather news",
    "news_lead": "What the sky is doing, explained simply.",
    "news_all": "All news",
    "news_loading": "Loading articles…",
    "news_error": "The articles can’t load right now. Please try again in a moment.",
    "news_noscript": "The news needs JavaScript here. You can also read it on the News page.",

    "soon_title": "In the works",
    "soon_lead": "Two new things are coming. Not at the same time: here is the plan.",
    "soon1_when": "Soon", "soon1_t": "Pollution and warnings maps",
    "soon1_p1": "The MeteoAlarm warnings map shows the official weather alerts area by area, across Europe, from green to red.",
    "soon1_p2": "The pollution map shows air quality with the European index, from Copernicus CAMS data. It gets more precise as you zoom in.",
    "soon2_when": "Later this year", "soon2_t": "Ask Liquid with Apple Private Cloud Compute",
    "soon2_p1": "With an internet connection, Ask Liquid will rely on a more powerful model: more information at once, better and more precise answers. Without a connection, it keeps working with the model on your iPhone.",
    "soon2_p2": "According to Apple, this service is designed to protect privacy: the data in your request is neither stored nor retained once the answer is given.",
    "soon_fine": "These features are in development.",
    "soon_read": "Read the announcement",
    "soon_fig1": "The warnings map in the Maps tab.", "soon_fig2": "The pollution map: the European air quality index.", "soon_fig3": "Ask Liquid: on your iPhone, or with Apple’s secure cloud when you are online.",

    "priv_title": "Your weather, your business.",
    "priv1_t": "No account", "priv1_p": "No sign-up, no login: open the app and go.",
    "priv2_t": "No ads, no tracking", "priv2_p": "No advertising, and no advertising tracking system of its own.",
    "priv3_t": "Optional location", "priv3_p": "Allow it for local weather, or simply pick a city. You stay in control.",
    "priv_read": "Read the privacy policy",
    "hood_title": "Straight from the source.",
    "hood_p": "The maps read the open files from Météo-France, DWD and NOAA and decode them on your device. No Liquid Weather server sits between you and the official data.",
    "hood_steps": "Météo-France, DWD, NOAA|Open GRIB2 files|Decoded on your iPhone|Your map, instantly",
    "hood_aria": "From the official file to your map, with no Liquid Weather server",

    "faq_title": "Questions, answered.",
    "faq": [
        ("Is Liquid Weather free?", "Yes. The app is free, with no ads and no subscription."),
        ("Where does the data come from?", "Forecasts come from Open-Meteo. The maps read open data directly from Météo-France (AROME, ARPEGE), DWD (ICON) and NOAA (GFS). The Moon is computed on the device; lightning comes from the EUMETSAT satellite; warnings from MeteoAlarm; wildfire risk from Copernicus EFFIS."),
        ("Are the maps radar?", "No, and the app says so plainly: they are model forecasts, never radar observations. Only the lightning layer is a satellite observation."),
        ("Which devices are supported?", "iPhone, iPad and Apple Watch. Summaries and the AI assistant work on devices that support Apple Intelligence."),
        ("Do I have to enable location?", "No. It is optional: you can pick a city by hand and change the permission any time in iOS Settings."),
        ("How do I contact you?", "By email at " + MAIL + ", or from the Support page. We read everything."),
    ],

    "cta_title": "Ready to see the sky differently?",
    "coffee_title": "Liquid Weather is free, with no ads and no subscription.",
    "coffee_p": "If you like it, you can buy me a coffee. It helps me keep making the app better.",
    "coffee_fine": "The link opens Buy Me a Coffee.",
    "contact_title": "A question, an idea, an issue?",
    "contact_p": "Write to us. We read everything.",
    "contact_btn": "Email support", "contact_page": "Support page",
    "mail_subject": "Liquid Weather — Support",

    "foot_tag": "Weather in liquid glass.",
    "foot_links": "Links", "foot_contact": "Contact", "foot_site": "Website",
    "foot_home": "Home",
    "legal": "© 2026 Liquid Weather. Data: Open-Meteo, Météo-France (Licence Ouverte 2.0), DWD, NOAA, ECMWF, EUMETSAT, MeteoAlarm, Copernicus. These organisations do not sponsor or endorse Liquid Weather. The screens shown are real screenshots of the app (data as of the capture day).",

    "np_title": "Weather news — Liquid Weather",
    "np_desc": "Liquid Weather weather news: seasons, climate, warnings, cyclones. Simple explanations, in 7 languages.",
    "np_h1": "News", "np_lead": "What the sky is doing, explained simply. Every article is available in 7 languages.",
    "np_search": "Search articles", "np_all": "All", "np_count_one": "{n} article", "np_count_many": "{n} articles", "np_none": "No article matches.",
    "np_back": "All news", "np_read": "Read the article", "np_source": "Source", "np_photo": "Image", "np_share": "Share", "np_copied": "Link copied",
    "np_more": "Keep reading", "np_lang": "Article language", "np_licence": "Licence", "np_notfound": "This article doesn’t exist.", "np_notfound_p": "It may have been moved. Here is the latest news.",
    "np_updated": "Published", "np_pd": "public domain", "np_period": "Period", "np_p_week": "7 days", "np_p_month": "30 days", "np_p_quarter": "3 months", "np_p_year": "This year", "np_type": "Type", "np_all_types": "All types", "np_newest": "Newest", "np_oldest": "Oldest", "np_clear": "Clear search", "np_prev": "Previous page", "np_next": "Next page", "np_pages": "Pages", "np_page": "Page {n}",

    "pv_title": "Privacy policy — Liquid Weather",
    "pv_desc": "Liquid Weather privacy policy: no account, no ads, optional location.",
    "pv_h1": "Privacy policy", "pv_updated": "Updated: October 18, 2026",
    "pv_body": """<h2>1. Overview</h2><p>Liquid Weather is a free weather app. It does not require user accounts, display advertisements or integrate its own advertising tracking system.</p><h2>2. Weather data and searches</h2><p>To provide forecasts or search for a location, the app sends the location name or geographic coordinates to weather services, including Open-Meteo. Some maps may retrieve data from weather agencies such as NOAA, DWD and Météo-France and use third-party mapping services.</p><p>When accessing these services, providers may technically receive connection information such as your IP address. Their handling of that information is subject to their respective privacy policies.</p><h2>3. Location</h2><p>With your permission, Liquid Weather uses your device's precise location to show local forecasts. Required coordinates may be sent to weather providers. Location access is optional: you can manually select a city and change permissions in iOS Settings. The app may also use Apple geocoding services.</p><h2>4. On-device data</h2><p>Saved cities, units, language and selected weather model are stored locally on the device. Weather data may also be cached for improved display.</p><h2>5. Weather summaries and Apple Intelligence</h2><p>Where available and enabled, the app may use Apple's on-device Foundation Models to generate summaries from weather facts already shown in the app. A local summary is used when the model is unavailable.</p><h2>6. Your choices</h2><p>You can disable location access in iOS Settings. You can delete local app data by uninstalling the app, subject to any backups managed by iOS.</p><h2>7. Contact</h2><p>For privacy questions, please email <a href="mailto:supportliquidweatherapp@gmail.com">supportliquidweatherapp@gmail.com</a> or see the <a href="support-en.html">support page</a>.</p>""",

    "sp_title": "Support — Liquid Weather",
    "sp_desc": "Contact Liquid Weather support: a question, an idea, a problem? Write to supportliquidweatherapp@gmail.com.",
    "sp_h1": "We’re here.", "sp_lead": "A question, an idea, an issue with Liquid Weather? Write to us — we read everything.",
    "sp_mail_label": "Email", "sp_btn": "Email support", "sp_site": "Contact website",
    "sp_checks_t": "So we can get back to you quickly",
    "sp_checks": "Your iPhone or iPad model and iOS version|Your Liquid Weather version|The city and weather model you selected|What you did just before, and a screenshot if possible",
    "sp_before_t": "Before you write", "sp_before_p": "Check your connection, try the Automatic model and tap Refresh. Some regional models do not cover every city.",
    "sp_priv_t": "Privacy", "sp_priv_p": "Read our <a href=\"privacy-en.html\">privacy policy</a>.",
    "sp_coffee_t": "Support Liquid Weather", "sp_coffee_p": "The app is free and ad-free. If you like it, you can buy me a coffee.",

    "nf_title": "404 — Liquid Weather", "nf_h1": "This page has evaporated.", "nf_p": "The link may be old. Start again from the home page.", "nf_btn": "Back to home",
},
}
