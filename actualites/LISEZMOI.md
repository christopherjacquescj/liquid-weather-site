# Dossier actualités

À mettre à la racine du dépôt `liquid-weather-site` : `actualites/`.

- `index.json` : la liste légère (id, date, catégorie, titre, résumé, image de couverture), dans les 7 langues fr/en/es/de/it/pt/ar.
- `<date>-<nom>/article.json` : le texte complet, les figures (légende, crédit, licence) et la source.
- `<date>-<nom>/images/` : `cover.jpg` et les figures.

Publier un article : créer son dossier, puis ajouter une ligne dans `index.json`. Aucune mise à jour de l'app.
Dans le texte : `## Titre` = intertitre, `• ` = puce, `[[figure:fig1]]` = image (légende et crédit s'affichent dessous).
