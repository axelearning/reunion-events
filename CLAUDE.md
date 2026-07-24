# Réunion Events

Open, collaborative agenda of events in La Réunion. A single versioned CSV is the source of truth; a static page renders it as a monthly calendar; a script generates an ICS feed. Everything user-facing (UI, commit messages, comments, README) is in **French**.

## Architecture

```
Data:    reunion_events.csv (edited by the public via GitHub PRs)
Site:    site/ — index.html + styles.css + app.js (static, vanilla JS, reads the CSV client-side)
ICS:     scripts/generate_ics.py → events.ics (icalendar lib, Indian/Reunion tz)
CI:      validate-csv.yml (runs on every PR) / deploy.yml (Pages deploy on push to main)
```

- `reunion_events.csv`: one row = one event. Columns `date_debut,date_fin,nom,communes,categorie,lien`. Sorted by `date_debut` ascending. `communes` = `|`-separated list among the 24 communes, or `ALL`. `categorie` ∈ {Sport, Culture, Religieux, Jour férié}.
- `site/`: zero dependencies, zero build — non-negotiable. Hand-rolled CSV parser, two views (Liste and Calendrier, persisted in `localStorage`), commune/category filters. The CSV is hostile content: every render goes through `esc()` / `safeUrl()`. `site/reunion_events.csv` is a symlink to the root CSV (for local serving).
- `scripts/validate_csv.py`: stdlib only. Emits `::error` annotations under GitHub Actions so bad lines are flagged directly in the PR.
- `deploy.yml` regenerates `events.ics` and publishes the `site/` files + CSV + ICS to GitHub Pages on every push to `main`.

## Verification (MANDATORY)

A task is not done until the applicable steps have been EXECUTED — not listed, not suggested.

1. **CSV or validator change**: `python3 scripts/validate_csv.py` — must exit 0
2. **ICS script change**: `pip install -r requirements.txt && python3 scripts/generate_ics.py` — must write events.ics without error
3. **site/ change**: `python3 -m http.server -d site` + visual check with `playwright-cli` at http://localhost:8000

There are no tests, no lint, no build.

## Consistency Rules

- Any change to validation rules (communes, categories, formats) must land in all three places: `scripts/validate_csv.py`, `site/app.js`, and the README column table.
- Any change to visual tokens in `site/styles.css` (colors, radius, typography, elevation) must be mirrored in `DESIGN.md` — else the spec drifts from the code.
- `PRODUCT.md` defines the design intent (the *why*): sober, data-first, one category = one color, WCAG AA (contrast, `prefers-reduced-motion`, keyboard nav, French ARIA labels). `DESIGN.md` documents the *how*: the concrete design system (palette, type scale, components) in Google Stitch format.

## Access URLs

- **Site**: https://axelearning.github.io/reunion-events/
- **ICS feed**: https://axelearning.github.io/reunion-events/events.ics

## Path-Scoped Rules

- `.claude/rules/python.md` - Python style: naming, type hints, testing (loads for `**/*.py`)
