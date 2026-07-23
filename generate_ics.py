#!/usr/bin/env python3
"""Génère un fichier ICS à partir de reunion_events.csv.

Chaque ligne du CSV devient un événement « toute la journée » (VALUE=DATE).
Le calendrier est publié pour le fuseau Indian/Reunion (UTC+4, sans heure d'été).

La génération s'appuie sur la bibliothèque `icalendar`, qui prend en charge
le pliage des lignes, l'échappement des valeurs TEXT et la conformité RFC 5545.

Usage :
    python3 generate_ics.py [source.csv] [sortie.ics]
"""

from __future__ import annotations

import csv
import sys
from datetime import date, datetime, timedelta, timezone
from hashlib import sha1
from pathlib import Path

from icalendar import Calendar, Event

TIMEZONE = "Indian/Reunion"
PRODID = "-//reunion-events//Agenda La Reunion//FR"


def parse_date(value: str) -> date | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def communes_label(value: str) -> str:
    value = (value or "").strip()
    if value == "ALL":
        return "Toute l'île"
    return ", ".join(part for part in value.split("|") if part)


def make_uid(row: dict[str, str]) -> str:
    seed = "|".join(
        (row.get(key, "") or "").strip()
        for key in ("date_debut", "date_fin", "nom")
    )
    digest = sha1(seed.encode("utf-8")).hexdigest()
    return f"{digest}@reunion-events"


def build_event(row: dict[str, str], stamp: datetime) -> Event | None:
    start = parse_date(row.get("date_debut", ""))
    if start is None:
        return None  # une date de début valide est obligatoire

    summary = (row.get("nom", "") or "").strip()
    if not summary:
        return None

    end = parse_date(row.get("date_fin", "")) or start
    if end < start:
        end = start
    # DTEND est exclusif pour un événement « toute la journée » : +1 jour.
    dtend = end + timedelta(days=1)

    event = Event()
    event.add("uid", make_uid(row))
    event.add("dtstamp", stamp)
    # Passer un `date` (et non un `datetime`) produit DTSTART;VALUE=DATE.
    event.add("dtstart", start)
    event.add("dtend", dtend)
    event.add("summary", summary)

    location = communes_label(row.get("communes", ""))
    if location:
        event.add("location", location)

    categorie = (row.get("categorie", "") or "").strip()
    if categorie:
        event.add("categories", [categorie])

    lien = (row.get("lien", "") or "").strip()

    description_parts = []
    if categorie:
        description_parts.append(categorie)
    if lien:
        description_parts.append(lien)
    if description_parts:
        event.add("description", " — ".join(description_parts))

    if lien:
        event.add("url", lien)

    event.add("transp", "TRANSPARENT")
    return event


def build_calendar(rows: list[dict[str, str]]) -> bytes:
    stamp = datetime.now(timezone.utc).replace(microsecond=0)

    cal = Calendar()
    cal.add("version", "2.0")
    cal.add("prodid", PRODID)
    cal.add("calscale", "GREGORIAN")
    cal.add("method", "PUBLISH")
    cal.add("x-wr-calname", "Événements de La Réunion")
    cal.add("x-wr-timezone", TIMEZONE)

    for row in rows:
        event = build_event(row, stamp)
        if event is not None:
            cal.add_component(event)

    return cal.to_ical()


def main(argv: list[str]) -> int:
    src = Path(argv[1]) if len(argv) > 1 else Path("reunion_events.csv")
    dst = Path(argv[2]) if len(argv) > 2 else Path("events.ics")

    with src.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    calendar = build_calendar(rows)
    dst.write_bytes(calendar)

    count = calendar.count(b"BEGIN:VEVENT")
    print(f"{count} événement(s) écrit(s) dans {dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
