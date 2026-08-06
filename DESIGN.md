---
name: Réunion Events
description: Agenda ouvert des événements de La Réunion — la couleur est un signal, jamais une décoration.
colors:
  primary: "#4a6fa5"
  primary-strong: "#3b5d92"
  primary-fg: "#ffffff"
  background: "#f7f8fa"
  foreground: "#141c2e"
  card: "#ffffff"
  card-elevated: "#f0f3f8"
  cell: "#f4f6fa"
  muted: "#eef0f4"
  muted-fg: "#5f7089"
  text-secondary: "#3a4e6e"
  border: "#d8dce5"
  border-strong: "#c5cbd8"
  culture-bg: "#e6eef8"
  culture-fg: "#2c5490"
  sport-bg: "#e8f3ec"
  sport-fg: "#276b44"
  religieux-bg: "#f6efe2"
  religieux-fg: "#7a5d20"
  ferie-bg: "#dc4a4a1a"
  ferie-fg: "#991b1b"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    letterSpacing: "0.06em"
rounded:
  badge: "3px"
  sm: "5px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  "2xl": "16px"
components:
  filter-select:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.625rem"
  filter-select-active:
    textColor: "{colors.primary-strong}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.625rem"
  badge:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  chip:
    rounded: "{rounded.sm}"
    padding: "1px 4px"
  row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.6rem 0.75rem"
  day-cell:
    backgroundColor: "{colors.cell}"
    rounded: "{rounded.sm}"
    padding: "0.375rem"
  dialog:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
---

# Design System: Réunion Events

## 1. Overview

**Creative North Star : « L'agenda de référence »**

Un instrument public, pas un site. Réunion Events est la source publique et fiable des événements de l'île : neutre, précise, réutilisable. Le calendrier **est** la page. Tout ce qui n'aide pas à lire un événement — une date, un lieu, une catégorie — est superflu et doit disparaître. La densité est assumée : on vient savoir « qu'est-ce qu'il se passe ce week-end » en un coup d'œil, pas défiler dans des cartes aérées.

La couleur n'existe ici que comme **signal**. Une catégorie = une teinte, toujours la même, des chips du calendrier aux badges du dialog en passant par les filtres. Le bleu primaire (`#4a6fa5`) est réservé à un seul rôle : l'état (sélection active, jour courant, focus, liens). Il ne décore jamais. Le fond est un blanc-gris froid quasi neutre (`#f7f8fa`) qui laisse toute la saturation aux quatre catégories.

Ce système rejette explicitement trois dérives : le **site touristique criard** (photos stock, dégradés tropicaux, carrousels), le **dashboard SaaS générique** (grilles de cards identiques, gros chiffres, look startup B2B), et le **site administratif austère** (gris dense façon formulaire de préfecture, sans aucune chaleur). L'agenda de référence tient la ligne de crête entre les trois : sobre sans être froid, dense sans être illisible.

**Key Characteristics :**
- La donnée d'abord : la vue occupe toute la hauteur d'écran, les commandes s'effacent.
- Le bleu = état, jamais décoration ; la couleur de catégorie = sémantique, partout cohérente.
- Deux vues d'une même donnée : **Liste (agenda) par défaut**, Calendrier en option, choix persisté.
- Zéro dépendance : polices système, pas de build, contraste et clavier AA de base.

## 2. Colors

Palette froide et retenue : un fond quasi neutre, un seul accent bleu pour l'état, et quatre teintes de catégorie qui portent tout le sens.

### Primary
- **Bleu Vigie** (`#4a6fa5`) : l'unique accent. Sélection active, jour courant (pastille pleine sur le numéro, façon Apple Calendar), liens, contour de focus. Sur fond teinté clair on passe à **Bleu Vigie Encre** (`#3b5d92`) pour tenir l'AA à petite taille (texte de filtre actif, libellés à 11px).

### Secondary — Les quatre signaux
Une catégorie, une paire (fond + texte), contrastée AA. Jamais interchangées, jamais réattribuées.
- **Culture** — fond `#e6eef8`, texte `#2c5490` (bleu).
- **Sport** — fond `#e8f3ec`, texte `#276b44` (vert).
- **Religieux** — fond `#f6efe2`, texte `#7a5d20` (ocre).
- **Jour férié** — fond `#dc4a4a1a` (rouge à 10 %), texte `#991b1b`. Le seul signal « alerte » de la palette : rouge transparent, réservé aux fériés.

### Neutral
- **Encre** (`#141c2e`) : texte principal, quasi-noir bleuté.
- **Encre secondaire** (`#3a4e6e`) : faits du dialog, texte de moindre priorité.
- **Atténué** (`#5f7089`) : méta, libellés, jours désactivés. **Contraste AA garanti** — c'est ce qui « éteint » un événement passé, jamais l'`opacity`.
- **Surfaces** : fond `#f7f8fa`, carte `#ffffff`, carte élevée `#f0f3f8`, cellule de calendrier `#f4f6fa`, atténué `#eef0f4`.
- **Bordures** : `#d8dce5` (standard), `#c5cbd8` (forte, séparateurs).

### Named Rules
**La règle du Signal.** Le bleu primaire ne sert qu'à l'état (sélection, aujourd'hui, focus, lien). Il ne remplit jamais une surface pour « faire joli ». Sa rareté est ce qui le rend lisible comme signal.

**La règle du Passé désaturé.** Un événement passé n'est jamais atténué par `opacity` (qui casse le contraste). Le texte passe à la couleur atténuée AA-safe (`#5f7089`) ; les chips et badges reçoivent `filter: saturate(.35)`, qui préserve la luminance donc le contraste.

## 3. Typography

**Police unique :** pile système (`system-ui, -apple-system, sans-serif`). Aucune police embarquée — la contribution et l'hébergement restent triviaux, et la police du système est déjà celle que l'utilisateur lit le mieux.

**Character :** neutre, dense, sans personnalité affichée. Une seule famille porte titres, données, libellés et corps ; la hiérarchie se fait au poids et à la taille, jamais par un contraste de fontes. Les chiffres sont partout en `tabular-nums` — dates, compteurs, numéros de jour s'alignent en colonne.

### Hierarchy
- **Headline** (700, 1.5rem, `letter-spacing: -0.02em`) : titre de page. Le seul « gros » titre du site.
- **Title** (700, 1.125rem / 1rem, `letter-spacing: -0.01em`) : navigation du mois, en-têtes de section (liste), titre du dialog. Capitalisé pour les noms de mois.
- **Body** (400–600, 0.95–1rem, 1.5) : titre d'événement à 0.95rem/600, coupé à 2 lignes (`-webkit-line-clamp: 2`) ; corps à 16px.
- **Label** (500, 0.625rem, `letter-spacing: 1.5px`, MAJUSCULES) : libellés de section et badges de catégorie. `tabular-nums` pour les compteurs.

### Named Rules
**La règle d'une seule famille.** Pas d'appariement display/corps. Un produit utilitaire n'en a pas besoin ; la fonte système bien réglée suffit, du titre à la donnée.

## 4. Elevation

Système **plat par défaut, à échelle froide**. La profondeur vient d'abord du calque tonal (fond → cellule → carte), pas de l'ombre. Les ombres sont rares et fonctionnelles : elles répondent à un état (survol) ou détachent le seul vrai calque flottant (le dialog).

### Shadow Vocabulary
- **`--shadow-sm`** (`0 1px 3px rgba(0,0,0,.06)`) : élévation minimale, discrète.
- **`--shadow-md`** (`0 2px 8px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)`) : apparaît **au survol d'une cellule** de calendrier, qui se soulève de 1px. Feedback d'état, pas décor.
- **`--shadow-2xl`** (`0 12px 32px rgba(0,0,0,.12)`) : réservé au `dialog`, seul élément qui flotte réellement au-dessus de la page (backdrop `#00000080`).

### Named Rules
**La règle du Plat par défaut.** Les surfaces sont plates au repos. Une ombre n'apparaît qu'en réponse à un état (survol qui soulève, dialog qui flotte). Une carte qui porte une ombre sans raison est un bug.

## 5. Components

Vocabulaire d'état unifié : toute commande partage la même grammaire — fond `muted` au survol, teinte primaire à 8 % quand elle est active, `outline` primaire 2px au focus, `scale(.98)` à l'appui.

### Buttons
- **Shape :** rayon `--r-md` (6px). Jamais de coins ronds > 16px, jamais de pastille sauf sur le numéro du jour courant (999px, volontaire).
- **Commandes de filtre (`select`) :** fond blanc, bordure `#d8dce5`. Survol → fond `muted`. **Actif → bordure primaire + fond primaire à 8 % + texte `primary-strong`** : l'état est visible sans rouvrir le menu.
- **Action discrète (`#today`) :** sans bordure ni fond, texte `primary-strong`. Se lit comme un « saut vers aujourd'hui », pas comme un filtre de plus.
- **Navigation mois :** boutons carrés 2.75rem, glyphe atténué, fond `muted` au survol.

### Chips (calendrier)
- **Style :** bloc pleine largeur dans la cellule, fond = teinte de catégorie, texte = couleur de catégorie, rayon `--r-sm` (5px). Titre tronqué (`text-overflow: ellipsis`, une ligne).
- **Débordement :** au-delà de la place disponible, une ligne « +X » atténuée plutôt que d'entasser.

### Badges (dialog & ligne)
- **Style :** tag MAJUSCULES `--r-sm`, fond + texte de catégorie (via `--tint` / `--fg` posés en JS). En ligne : variante plus fine `--r-badge` (3px) en fin de rangée.

### Cards / Containers
- **Style :** un mois = une `section` blanche, bordure `muted`, rayon `--r-xl` (12px). En vue liste, l'en-tête de mois est `sticky`. En vue calendrier, une seule carte contient toute la grille.
- **Padding interne :** discret (`.25rem`–`.5rem`) ; la densité prime.

### Rows (agenda)
- **Style :** grille `3.75rem | 1fr | auto` (date | titre+méta | badge), fond transparent, rayon `--r-lg` (8px). Survol → fond `cell`. Aujourd'hui → fond primaire à 7 %.
- **Colonne date :** jour de semaine en haut, « 25 » ou plage compacte « 25–26 » en dessous, toujours centrés et alignés.

### Day cells (calendrier)
- **Style :** grille `repeat(7, minmax(0, 1fr))`, cellule fond `--cell`, rayon `--r-sm`. Survol → soulèvement 1px + `--shadow-md`. Jours hors-mois masqués (`visibility: hidden`), pas supprimés, pour garder la grille.
- **Aujourd'hui :** pastille primaire pleine sur le numéro (style Apple Calendar) ; la cellule reste identique aux autres.

### Dialog (détail d'événement)
- **Style :** `<dialog>` natif, max 28rem, rayon `--r-2xl` (16px), `--shadow-2xl`, backdrop `#00000080`. Ouverture : `slide-up` 12px + fondu, 240ms `ease-expo`. **Coupée sous `prefers-reduced-motion`.**
- **Le modal est justifié ici :** détail ponctuel d'un item de liste, affordance standard, `<dialog>` natif (focus trap et Échap gratuits).

### Navigation / Vues
- **Segmented control** (Liste / Calendrier) : même vocabulaire que `select.active`. Onglet actif → fond primaire 8 % + texte `primary-strong` + 600. **Liste (agenda) est la vue par défaut** ; le choix est persisté en `localStorage`.

## 6. Do's and Don'ts

### Do :
- **Do** garder le bleu primaire (`#4a6fa5`) pour le seul état : sélection, aujourd'hui, focus, lien. Rien d'autre.
- **Do** attribuer à chaque catégorie sa paire fond+texte AA et la réutiliser à l'identique partout (chip, badge, filtre).
- **Do** atténuer le passé par couleur AA-safe + `saturate(.35)`, jamais par `opacity`.
- **Do** garder les surfaces plates au repos ; une ombre ne répond qu'à un état (survol, dialog).
- **Do** rester en polices système et en `tabular-nums` sur toute donnée chiffrée.
- **Do** respecter `prefers-reduced-motion`, le focus visible 2px, et les cibles 44px sur pointeur grossier.

### Don't :
- **Don't** faire du **touristique criard** : pas de photos stock, pas de dégradés tropicaux, pas de carrousels.
- **Don't** faire du **dashboard SaaS générique** : pas de grilles de cards identiques, pas de gros chiffres-héros, pas de look startup B2B.
- **Don't** tomber dans le **site administratif austère** : pas de gris dense façon formulaire de préfecture, sans chaleur.
- **Don't** utiliser la couleur comme décor. Une surface remplie de bleu « pour faire joli » est une faute.
- **Don't** sur-arrondir : les cartes plafonnent à 16px ; la pastille 999px est réservée au numéro du jour courant.
- **Don't** ajouter une dépendance, une police embarquée ou une étape de build : le zéro-dépendance n'est pas négociable.
- **Don't** réintroduire le modal par réflexe : hors détail d'événement, épuiser d'abord les alternatives en ligne.
