# 🌋 Événements de La Réunion

Un agenda **ouvert et collaboratif** des événements de l'île de La Réunion : toutes les données tiennent dans un seul fichier CSV que chacun peut compléter par pull request.

👉 **Consulter l'agenda :** https://axelearning.github.io/reunion-events/

## Contribuer

Les données vivent dans [`reunion_events.csv`](reunion_events.csv). Une ligne = un événement.

### Depuis le navigateur (aucun outil requis)

1. Ouvrez [`reunion_events.csv`](reunion_events.csv) sur GitHub.
2. Cliquez sur le crayon ✏️ (« Edit this file »).
3. Ajoutez votre ligne en respectant les colonnes ci-dessous.
4. « Propose changes » puis **Create pull request**.

### Format des colonnes

| Colonne      | Obligatoire | Exemple                          | Notes                                                        |
| ------------ | :---------: | -------------------------------- | ------------------------------------------------------------ |
| `date_debut` |     ✅      | `2026-10-15`                     | Format `AAAA-MM-JJ`                                          |
| `date_fin`   |             | `2026-10-18`                     | Vide si l'événement dure un seul jour                        |
| `nom`        |     ✅      | `Grand Raid`                     | Guillemets si le nom contient une virgule : `"Dipavali, fête de la lumière"` |
| `communes`   |     ✅      | `Cilaos\|Entre-Deux`             | Communes concernées, séparées par `\|` — ou `ALL` si tout l'île est touchée |
| `categorie`  |     ✅      | `Sport`                          | `Sport`, `Culture`, `Religieux`, `Jour férié`…               |
| `lien`       |             | `https://…`                      | Site officiel de l'événement (http/https uniquement)         |

Merci d'éviter les doublons et de garder les lignes triées par `date_debut`.

### Validation automatique

Chaque pull request et chaque push sur `main` déclenche le workflow
[`validate-csv.yml`](.github/workflows/validate-csv.yml), qui exécute
[`scripts/validate_csv.py`](scripts/validate_csv.py). Le script vérifie le
format des dates, la présence du `nom`, l'appartenance des `communes` aux 24
communes de La Réunion (ou `ALL`), la `categorie` (`Culture`, `Sport`,
`Religieux`, `Jour férié`), la validité du `lien` et le tri croissant des
lignes par `date_debut`. Les lignes fautives sont annotées directement dans la
pull request.

Pour valider en local :

```bash
python3 scripts/validate_csv.py
```

## Le site

[`index.html`](index.html) : une seule page statique, sans dépendance ni étape de build. Elle lit le CSV et l'affiche sous forme de tableau triable avec recherche. Hébergée par GitHub Pages ; chaque poussée sur `main` redéploie automatiquement le site via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

> ⚙️ Le déploiement passe par GitHub Actions : dans **Settings → Pages**, choisissez **Source : GitHub Actions**.

Pour tester en local :

```bash
python3 -m http.server
# puis ouvrir http://localhost:8000
```

## Fichier ICS (calendrier)

[`generate_ics.py`](generate_ics.py) lit le CSV et produit un fichier `events.ics` (fuseau **`Indian/Reunion`**, UTC+4) que l'on peut importer dans Google Agenda, Apple Calendrier, Outlook… Le workflow de déploiement le régénère à chaque mise à jour et le publie à côté du site (lien « s'abonner au calendrier » en pied de page).

Pour le générer en local :

```bash
python3 generate_ics.py            # → events.ics
# ou : python3 generate_ics.py <source.csv> <sortie.ics>
```

## Licence

Données et code placés dans le domaine public sous [CC0 1.0](LICENSE) : réutilisation, modification et redistribution libres, y compris à des fins commerciales, sans aucune condition. Vous pouvez citer la source, mais ce n'est pas obligatoire.
