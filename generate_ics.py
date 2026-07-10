#!/usr/bin/env python3
"""Génère un fichier ICS à partir de reunion_events.csv.

Chaque ligne du CSV devient un événement « toute la journée » (VALUE=DATE).
Le fuseau horaire est fixé à Indian/Reunion (UTC+4, sans heure d'été).

Usage :
    python3 generate_ics.py [source.csv] [sortie.ics]
"""

from __future__ import annotations

import csv
import sys
from datetime import date, datetime, timedelta, timezone
from hashlib import sha1
from pathlib import Path

TIMEZONE = "Indian/Reunion"
# La Réunion est à UTC+04:00 toute l'année (pas de changement d'heure).
UTC_OFFSET = "+0400"
PRODID = "-//reunion-events//Agenda La Reunion//FR"


def fold(line: str) -> str:
    """Replie une ligne à 75 octets, comme l'exige la RFC 5545 (section 3.1)."""
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    chunks = []
    while raw:
        # Ne pas couper au milieu d'un caractère multi-octets.
        cut = 75
        while cut > 0 and (raw[cut] & 0xC0) == 0x80:
            cut -= 1
        chunks.append(raw[:cut])
        raw = raw[cut:]
        if raw:
            raw = b" " + raw  # espace de continuation en début de ligne pliée
    return "\r\n".join(c.decode("utf-8") for c in chunks)


def escape_text(value: str) -> str:
    """Échappe les caractères réservés d'une valeur TEXT (RFC 5545, section 3.3.11)."""
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


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


def build_event(row: dict[str, str], stamp: str) -> list[str] | None:
    start = parse_date(row.get("date_debut", ""))
    if start is None:
        return None  # une date de début valide est obligatoire

    end = parse_date(row.get("date_fin", "")) or start
    if end < start:
        end = start
    # DTEND est exclusif pour un événement « toute la journée » : +1 jour.
    dtend = end + timedelta(days=1)

    summary = (row.get("nom", "") or "").strip()
    if not summary:
        return None

    description_parts = []
    if (row.get("categorie", "") or "").strip():
        description_parts.append(row["categorie"].strip())
    lien = (row.get("lien", "") or "").strip()
    if lien:
        description_parts.append(lien)

    lines = [
        "BEGIN:VEVENT",
        f"UID:{make_uid(row)}",
        f"DTSTAMP:{stamp}",
        f"DTSTART;VALUE=DATE:{start:%Y%m%d}",
        f"DTEND;VALUE=DATE:{dtend:%Y%m%d}",
        f"SUMMARY:{escape_text(summary)}",
    ]

    location = communes_label(row.get("communes", ""))
    if location:
        lines.append(f"LOCATION:{escape_text(location)}")
    if (row.get("categorie", "") or "").strip():
        lines.append(f"CATEGORIES:{escape_text(row['categorie'].strip())}")
    if description_parts:
        lines.append(f"DESCRIPTION:{escape_text(' — '.join(description_parts))}")
    if lien:
        lines.append(f"URL:{escape_text(lien)}")

    lines.append(f"X-WR-TIMEZONE:{TIMEZONE}")
    lines.append("TRANSP:TRANSPARENT")
    lines.append("END:VEVENT")
    return lines


def vtimezone() -> list[str]:
    """VTIMEZONE minimal pour Indian/Reunion (UTC+4 fixe, sans DST)."""
    return [
        "BEGIN:VTIMEZONE",
        f"TZID:{TIMEZONE}",
        "BEGIN:STANDARD",
        "DTSTART:19700101T000000",
        f"TZOFFSETFROM:{UTC_OFFSET}",
        f"TZOFFSETTO:{UTC_OFFSET}",
        "TZNAME:+04",
        "END:STANDARD",
        "END:VTIMEZONE",
    ]


def build_calendar(rows: list[dict[str, str]]) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODID}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Événements de La Réunion",
        f"X-WR-TIMEZONE:{TIMEZONE}",
    ]
    lines += vtimezone()
    for row in rows:
        event = build_event(row, stamp)
        if event:
            lines += event
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(line) for line in lines) + "\r\n"


def main(argv: list[str]) -> int:
    src = Path(argv[1]) if len(argv) > 1 else Path("reunion_events.csv")
    dst = Path(argv[2]) if len(argv) > 2 else Path("events.ics")

    with src.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    calendar = build_calendar(rows)
    dst.write_text(calendar, encoding="utf-8")

    count = calendar.count("BEGIN:VEVENT")
    print(f"{count} événement(s) écrit(s) dans {dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
