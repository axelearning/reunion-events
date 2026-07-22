#!/usr/bin/env python3
"""Valide le fichier reunion_events.csv.

Contrôles effectués sur chaque ligne :
  - date_debut : obligatoire, au format AAAA-MM-JJ et date réelle.
  - date_fin   : facultative ; si présente, format AAAA-MM-JJ, date réelle
                 et postérieure ou égale à date_debut.
  - nom        : obligatoire, non vide.
  - communes   : une ou plusieurs communes séparées par « | », chacune
                 appartenant aux 24 communes de La Réunion, ou la valeur
                 spéciale « ALL ».
  - categorie  : appartient à une liste fixe de catégories.
  - lien       : facultatif ; si présent, URL http(s) valide.

Sortie :
  - Un résumé lisible sur la sortie standard.
  - Sous GitHub Actions (variable GITHUB_ACTIONS=true), des annotations
    « ::error » pointant sur la ligne fautive du CSV, afin que les erreurs
    apparaissent directement dans la Pull Request.

Code de sortie : 0 si tout est valide, 1 sinon.
"""

from __future__ import annotations

import csv
import datetime
import os
import sys
from urllib.parse import urlparse

# Chemin du CSV : premier argument, sinon reunion_events.csv à la racine.
DEFAULT_CSV = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "reunion_events.csv",
)

EXPECTED_HEADER = ["date_debut", "date_fin", "nom", "communes", "categorie", "lien"]

# Les 24 communes de La Réunion.
COMMUNES = {
    "Les Avirons",
    "Bras-Panon",
    "Cilaos",
    "Entre-Deux",
    "L'Étang-Salé",
    "Petite-Île",
    "La Plaine-des-Palmistes",
    "Le Port",
    "La Possession",
    "Saint-André",
    "Saint-Benoît",
    "Saint-Denis",
    "Saint-Joseph",
    "Saint-Leu",
    "Saint-Louis",
    "Saint-Paul",
    "Saint-Philippe",
    "Saint-Pierre",
    "Sainte-Marie",
    "Sainte-Rose",
    "Sainte-Suzanne",
    "Salazie",
    "Le Tampon",
    "Trois-Bassins",
}

# Valeur spéciale : toute l'île est concernée.
ALL_COMMUNES = "ALL"

# Liste fixe des catégories existantes.
CATEGORIES = {
    "Culture",
    "Sport",
    "Religieux",
    "Jour férié",
}


def parse_date(value: str) -> datetime.date | None:
    """Retourne la date si value est au format AAAA-MM-JJ, sinon None."""
    try:
        return datetime.datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def is_valid_url(value: str) -> bool:
    """Vérifie qu'il s'agit d'une URL http(s) avec un nom de domaine."""
    parsed = urlparse(value)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def validate_row(row: dict[str, str]) -> list[str]:
    """Valide une ligne et retourne la liste des messages d'erreur."""
    errors: list[str] = []

    # DictReader range les champs au-delà des 6 colonnes sous la clé None.
    extra_fields = row.get(None)
    if extra_fields:
        errors.append(f"trop de colonnes, valeur(s) en trop : {extra_fields}")

    date_debut_raw = (row.get("date_debut") or "").strip()
    date_fin_raw = (row.get("date_fin") or "").strip()
    nom = (row.get("nom") or "").strip()
    communes_raw = (row.get("communes") or "").strip()
    categorie = (row.get("categorie") or "").strip()
    lien = (row.get("lien") or "").strip()

    # date_debut : obligatoire + format.
    date_debut = None
    if not date_debut_raw:
        errors.append("date_debut est obligatoire")
    else:
        date_debut = parse_date(date_debut_raw)
        if date_debut is None:
            errors.append(
                f"date_debut « {date_debut_raw} » invalide (format attendu AAAA-MM-JJ)"
            )

    # date_fin : facultative ; si présente, format + cohérence.
    if date_fin_raw:
        date_fin = parse_date(date_fin_raw)
        if date_fin is None:
            errors.append(
                f"date_fin « {date_fin_raw} » invalide (format attendu AAAA-MM-JJ)"
            )
        elif date_debut is not None and date_fin < date_debut:
            errors.append(
                f"date_fin « {date_fin_raw} » antérieure à date_debut « {date_debut_raw} »"
            )

    # nom : obligatoire.
    if not nom:
        errors.append("nom est obligatoire")

    # communes : ALL ou liste de communes connues.
    if not communes_raw:
        errors.append("communes est obligatoire")
    elif communes_raw != ALL_COMMUNES:
        parts = communes_raw.split("|")
        for part in parts:
            commune = part.strip()
            if not commune:
                errors.append("communes contient une valeur vide (séparateur « | » en trop ?)")
            elif commune not in COMMUNES:
                errors.append(
                    f"commune inconnue « {commune} » "
                    f"(attendu : une des 24 communes ou « {ALL_COMMUNES} »)"
                )

    # categorie : liste fixe.
    if not categorie:
        errors.append("categorie est obligatoire")
    elif categorie not in CATEGORIES:
        errors.append(
            f"catégorie inconnue « {categorie} » "
            f"(attendu : {', '.join(sorted(CATEGORIES))})"
        )

    # lien : facultatif ; si présent, URL http(s).
    if lien and not is_valid_url(lien):
        errors.append(f"lien « {lien} » invalide (URL http(s) attendue)")

    return errors


def emit_annotation(csv_path: str, line: int, message: str) -> None:
    """Émet une annotation GitHub Actions pointant sur la ligne fautive."""
    # Les annotations n'aiment pas les sauts de ligne ; on aplatit.
    safe = message.replace("\n", " ")
    print(f"::error file={csv_path},line={line}::{safe}")


def main(argv: list[str]) -> int:
    csv_path = argv[1] if len(argv) > 1 else DEFAULT_CSV
    in_actions = os.environ.get("GITHUB_ACTIONS") == "true"

    if not os.path.exists(csv_path):
        print(f"Fichier introuvable : {csv_path}", file=sys.stderr)
        return 1

    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)

        if reader.fieldnames != EXPECTED_HEADER:
            message = (
                f"En-tête invalide. Attendu : {','.join(EXPECTED_HEADER)} — "
                f"trouvé : {','.join(reader.fieldnames or [])}"
            )
            print(f"❌ {message}")
            if in_actions:
                emit_annotation(csv_path, 1, message)
            return 1

        total = 0
        failed_rows = 0
        prev_date = None  # date_debut valide de la ligne précédente.
        prev_raw = None
        for row in reader:
            total += 1
            # line_num = ligne physique dans le fichier (en-tête = ligne 1).
            line = reader.line_num
            errors = validate_row(row)

            # Contrôle du tri croissant par date_debut (uniquement entre
            # lignes dont la date_debut est valide).
            date_debut_raw = (row.get("date_debut") or "").strip()
            date_debut = parse_date(date_debut_raw)
            if date_debut is not None:
                if prev_date is not None and date_debut < prev_date:
                    errors.append(
                        f"lignes non triées : date_debut « {date_debut_raw} » "
                        f"antérieure à la ligne précédente « {prev_raw} »"
                    )
                prev_date = date_debut
                prev_raw = date_debut_raw

            if errors:
                failed_rows += 1
                nom = (row.get("nom") or "").strip() or "(sans nom)"
                print(f"❌ Ligne {line} — {nom} :")
                for err in errors:
                    print(f"     • {err}")
                    if in_actions:
                        emit_annotation(csv_path, line, err)

    if failed_rows:
        print(f"\n{failed_rows} ligne(s) invalide(s) sur {total}.")
        return 1

    print(f"✅ {total} ligne(s) validée(s), aucune erreur.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
