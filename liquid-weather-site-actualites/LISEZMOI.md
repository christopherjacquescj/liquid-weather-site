# Actualités de Liquid Weather

Ce dossier contient les articles affichés dans l'application (carte « À la une » de l'accueil et écran « Actualités »).

- `actualités.json` : la liste des articles.
- `assets/` : les photos (une par article).

## Ajouter un article

Ajoutez un bloc dans la liste `articles` de `actualités.json`, avec sa photo dans `assets/` :

- `id` : identifiant unique (ex. `2026-11-02-sujet`).
- `date` : au format `2026-11-02T09:00:00+01:00`. L'application trie par date.
- `category` : `{ "fr": "Climat", "en": "Climate" }`. Les catégories existantes : Vigilance, Climat, Cyclones, Saisons (une autre catégorie reçoit une couleur par défaut).
- `title`, `summary`, `body` : en `fr` (obligatoire) et `en`. Les autres langues sont traduites sur l'appareil par Apple.
- `body` : une liste de paragraphes. Un paragraphe qui commence par `## ` est un intertitre ; `• ` pour une puce.
- `image` : `assets/nom-de-la-photo.jpg` (chemin relatif à ce dossier). `imageCredit` : le crédit affiché sur la photo.
- `sourceName`, `sourceURL` : la source, affichée en bas de l'article.

Photos : n'utilisez que des images dont vous avez les droits (les images de la NASA et de la NOAA sont dans le domaine public ; gardez le crédit).
