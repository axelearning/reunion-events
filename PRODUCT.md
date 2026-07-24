# Product

## Register

product

## Users

Deux publics : (1) les habitants et curieux de La Réunion qui consultent le calendrier pour savoir ce qui se passe sur l'île (contexte : consultation rapide, souvent mobile) ; (2) des réutilisateurs de la donnée qui utilise le CSV comme source de vérité d'événements. Les contributeurs sont des francophones pas forcément techniques qui ajoutent des événements via GitHub.

## Product Purpose

Un agenda ouvert et collaboratif des événements de La Réunion : un seul CSV versionné sur GitHub, un minisite statique (GitHub Pages) qui l'affiche en calendrier mensuel filtrable. Succès = données fiables et à jour, contributions faciles pour des non-techniciens, données réutilisables par des tiers.

## Brand Personality

Sobre, fiable, utilitaire. La couleur est un signal (une catégorie = une couleur), jamais une décoration. Le site inspire confiance dans la donnée, comme un outil de référence public.

## Anti-references

- Site touristique criard : photos stock, dégradés tropicaux, carrousels.
- Dashboard SaaS générique : grilles de cards identiques, gros chiffres, look startup B2B.
- Site administratif austère : gris dense façon formulaire préfecture, sans aucune chaleur.

## Design Principles

1. La donnée d'abord : le calendrier EST la page ; tout élément qui ne sert pas la lecture des événements est superflu.
2. Une catégorie, une couleur : le code couleur est sémantique et cohérent partout (chips, badges, filtres).
3. Zéro dépendance : une page statique, pas de build, pas de framework — la contribution et l'hébergement restent triviaux.
4. Contenu hostile par défaut : le CSV est éditable par n'importe qui, tout affichage est échappé.

## Accessibility & Inclusion

WCAG AA : contrastes texte ≥ 4.5:1 (≥ 3:1 pour texte large), `prefers-reduced-motion` respecté, navigation clavier (jours = boutons, dialog natif), labels ARIA en français.
