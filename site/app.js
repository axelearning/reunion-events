"use strict";

// Minimal CSV parser (RFC 4180): quoted fields, embedded commas, "" escapes.
function parseCSV(text) {
  const rows = [[]];
  let field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { rows[rows.length - 1].push(field); field = ""; }
    else if (c === "\n") { rows[rows.length - 1].push(field); field = ""; rows.push([]); }
    else if (c !== "\r") field += c;
  }
  rows[rows.length - 1].push(field);
  return rows.filter(r => r.length > 1 || r[0] !== "");
}

// The CSV is editable by anyone via PR: all content is treated as hostile.
function esc(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function safeUrl(s) {
  try { return ["http:", "https:"].includes(new URL(s).protocol) ? s : null; }
  catch { return null; }
}

// One category → "signal" tokens (tinted background, text).
// Keep in sync with CATEGORIES in scripts/validate_csv.py.
const CATS = {
  Culture: { tint: "var(--Culture-bg)", fg: "var(--Culture-fg)" },
  Sport: { tint: "var(--Sport-bg)", fg: "var(--Sport-fg)" },
  Religieux: { tint: "var(--Religieux-bg)", fg: "var(--Religieux-fg)" },
  "Jour férié": { tint: "var(--Ferie-bg)", fg: "var(--Ferie-fg)" },
};
const catStyle = c => CATS[c] || { tint: "var(--muted)", fg: "var(--muted-fg)" };
// Outline pin for locations, same stroke vocabulary as the view-switcher icons.
const PIN = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M13 6.7C13 10 8 14 8 14S3 10 3 6.7a5 5 0 0 1 10 0Z"/><circle cx="8" cy="6.7" r="1.8"/></svg>';
const CAL = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/></svg>';
const communesLabel = c => c === "ALL" ? "Toute l'île" : c.split("|").join(", ");

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const WEEKDAYS = ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
const fmtFull = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtLong = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fmtShort = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const fmtDayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Range collapsed like the French usage: "du 7 au 9 août 2026", "du 22 mai au
// 7 juin 2026" — or with dash=true the compact "7 – 9 août 2026" for display next
// to an icon. The du/au form is kept for screen readers ("–" isn't spoken).
// Callers escape at interpolation.
function fmtRange(e, dash) {
  const d = new Date(e.date_debut + "T00:00:00");
  if (isNaN(d)) return e.date_debut;
  const f = e.date_fin && e.date_fin !== e.date_debut ? new Date(e.date_fin + "T00:00:00") : null;
  if (!f || isNaN(f)) return fmtFull.format(d);
  const start = d.getFullYear() !== f.getFullYear() ? fmtLong.format(d)
    : d.getMonth() !== f.getMonth() ? fmtDayMonth.format(d)
    : String(d.getDate());
  return dash ? `${start} – ${fmtLong.format(f)}` : `du ${start} au ${fmtLong.format(f)}`;
}

const now = new Date();
const todayIso = iso(now);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let all = [];
let shown = []; // events currently rendered in the list, indexed by data-i
let fCat = "", fCommune = "", fUpcoming = true;
let view = localStorage.getItem("view") === "cal" ? "cal" : "list";
let cursor = { y: now.getFullYear(), m: now.getMonth() };

// Category + commune filters, shared by both views.
function baseFiltered() {
  return all.filter(e =>
    (!fCat || e.categorie === fCat) &&
    (!fCommune || e.communes === "ALL" || e.communes.split("|").includes(fCommune)));
}
function eventsOn(key, list) {
  return list.filter(e => key >= e.date_debut && key <= (e.date_fin || e.date_debut));
}

function load() {
  document.getElementById("schedule").innerHTML = '<p class="empty">Chargement…</p>';
  fetch("reunion_events.csv")
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(text => {
      const rows = parseCSV(text.trim());
      const headers = rows[0];
      all = rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
      initFilters();
      render();
    })
    .catch(() => {
      view = "list"; // the error lives in #schedule; make sure it's the visible pane
      syncChrome();
      document.getElementById("schedule").innerHTML =
        '<p class="empty">Impossible de charger les données.<br><button id="retry">Réessayer</button></p>';
      document.getElementById("retry").onclick = load;
      document.getElementById("status").textContent = "Impossible de charger les données.";
    });
}

function initFilters() {
  const communes = [...new Set(all.flatMap(e => e.communes === "ALL" ? [] : e.communes.split("|")))].sort((a, b) => a.localeCompare(b, "fr"));
  const catSel = document.getElementById("cat");
  catSel.innerHTML = '<option value="">Toutes catégories</option>' +
    Object.keys(CATS).map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  document.getElementById("commune").innerHTML = '<option value="">Toute l\'île</option>' +
    communes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

  // Monday-first header, indexing the Sunday-first WEEKDAYS array.
  document.getElementById("weekdays").innerHTML = [1, 2, 3, 4, 5, 6, 0].map(i => `<div class="wd">${WEEKDAYS[i]}</div>`).join("");

  catSel.onchange = e => { fCat = e.target.value; e.target.classList.toggle("active", !!fCat); render(); };
  document.getElementById("commune").onchange = e => { fCommune = e.target.value; e.target.classList.toggle("active", !!fCommune); render(); };

  document.getElementById("prev").onclick = () => move(-1);
  document.getElementById("next").onclick = () => move(1);
  document.getElementById("today").onclick = () => {
    if (view === "list") scrollToNow();
    else { cursor = { y: now.getFullYear(), m: now.getMonth() }; render(); }
  };
  document.getElementById("v-list").onclick = () => setView("list");
  document.getElementById("v-cal").onclick = () => setView("cal");
}

function scrollToNow() {
  const target = document.querySelector(".row.today") || document.querySelector(".row:not(.past)");
  if (target) target.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
}

function setView(v) {
  view = v;
  try { localStorage.setItem("view", v); } catch {}
  render();
}

function move(delta) {
  const d = new Date(cursor.y, cursor.m + delta, 1);
  cursor = { y: d.getFullYear(), m: d.getMonth() };
  render();
}

// View chrome (body class, toggle state, visible pane) — safe to run before data loads.
function syncChrome() {
  const isCal = view === "cal";
  document.body.classList.toggle("cal-view", isCal);
  const vl = document.getElementById("v-list"), vc = document.getElementById("v-cal");
  vl.setAttribute("aria-checked", String(!isCal)); vl.tabIndex = isCal ? -1 : 0;
  vc.setAttribute("aria-checked", String(isCal)); vc.tabIndex = isCal ? 0 : -1;
  document.getElementById("schedule").hidden = isCal;
  document.getElementById("calendar").hidden = !isCal;
}

// Dispatch to the active view; swap the contextual controls with it.
function render() {
  syncChrome();
  if (view === "cal") renderCal();
  else { document.getElementById("today").hidden = fUpcoming; renderList(); }
}

function renderCal() {
  const { y, m } = cursor;
  const list = baseFiltered();
  document.getElementById("month").textContent = `${MONTHS[m]} ${y}`;
  const isCurrent = y === now.getFullYear() && m === now.getMonth();
  document.getElementById("today").hidden = isCurrent;

  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const count = Math.ceil((offset + daysInMonth) / 7) * 7;
  const days = document.getElementById("days");
  days.style.gridTemplateRows = `repeat(${count / 7}, minmax(72px, 1fr))`;

  let html = "";
  for (let i = 0; i < count; i++) {
    const d = new Date(y, m, 1 - offset + i);
    const key = iso(d);
    const inMonth = d.getMonth() === m;
    if (!inMonth) { html += '<div class="day out"></div>'; continue; }
    const evs = eventsOn(key, list);
    const cls = ["day", key < todayIso ? "past" : "", key === todayIso ? "today" : ""].join(" ").trim();
    const label = `${fmtFull.format(d)}, ${evs.length === 0 ? "aucun événement" : evs.length + " événement" + (evs.length > 1 ? "s" : "")}`;
    const chips = evs.slice(0, 3).map(e => {
      const s = catStyle(e.categorie);
      return `<span class="chip" style="--tint:${s.tint};--fg:${s.fg}" title="${esc(e.nom)}">${esc(e.nom)}</span>`;
    }).join("");
    const more = evs.length > 3 ? `<span class="more">+${evs.length - 3}</span>` : "";
    html += `<button class="${cls}" data-key="${key}" aria-label="${esc(label)}"` +
      `${key === todayIso ? ' aria-current="date"' : ""}>` +
      `<span class="daynum">${d.getDate()}</span><span class="chips">${chips}${more}</span></button>`;
  }
  days.innerHTML = html;
  document.getElementById("status").textContent = `Vue calendrier, ${MONTHS[m]} ${y}`;
}

function renderList() {
  const base = baseFiltered()
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut) || a.nom.localeCompare(b.nom, "fr"));
  const pastCount = base.filter(e => (e.date_fin || e.date_debut) < todayIso).length;
  const list = shown = fUpcoming ? base.filter(e => (e.date_fin || e.date_debut) >= todayIso) : base;
  // The fold lives at the top of the list, where the hidden events actually are.
  const s2 = pastCount > 1 ? "s" : "";
  const toggle = pastCount === 0 ? "" :
    `<button class="past-toggle" id="past-toggle" aria-expanded="${!fUpcoming}">` +
    (fUpcoming ? `Afficher les ${pastCount} événement${s2} passé${s2}` : `Masquer les ${pastCount} événement${s2} passé${s2}`) +
    "</button>";
  const schedule = document.getElementById("schedule");
  const n = list.length;
  document.getElementById("status").textContent =
    `Vue liste, ${n === 0 ? "aucun événement" : n + " événement" + (n > 1 ? "s" : "")}`;
  if (n === 0) {
    schedule.innerHTML = toggle + '<p class="empty">Aucun événement ne correspond à ces filtres.' +
      (fCat || fCommune ? '<br><button id="reset">Réinitialiser les filtres</button>' : "") + "</p>";
    const reset = document.getElementById("reset");
    if (reset) reset.onclick = () => {
      fCat = fCommune = "";
      for (const id of ["cat", "commune"]) {
        const s = document.getElementById(id);
        s.value = ""; s.classList.remove("active");
      }
      render();
    };
    return;
  }

  // Group by month (events are already sorted chronologically).
  const groups = [];
  let current = null;
  for (const e of list) {
    const d = new Date(e.date_debut + "T00:00:00");
    const gkey = `${d.getFullYear()}-${d.getMonth()}`;
    if (!current || current.gkey !== gkey) {
      current = { gkey, y: d.getFullYear(), m: d.getMonth(), items: [] };
      groups.push(current);
    }
    current.items.push(e);
  }

  let idx = 0;
  schedule.innerHTML = toggle + groups.map(g => {
    const c = g.items.length;
    const head = `<div class="month-head"><h2>${MONTHS[g.m]} ${g.y}</h2>` +
      `<span class="count">${c} événement${c > 1 ? "s" : ""}</span></div>`;
    const rows = g.items.map(e => {
      const i = idx++;
      const s = catStyle(e.categorie);
      const d = new Date(e.date_debut + "T00:00:00");
      const key = iso(d);
      // An ongoing multi-day event is not "past" (nor missed "today"): compare on its end date.
      const end = e.date_fin || key;
      const isToday = key <= todayIso && end >= todayIso;
      const cls = ["row", end < todayIso ? "past" : "", isToday ? "today" : ""].join(" ").trim();
      // Spelled-out range: screen readers get "du 22 mai au 7 juin", not "22 mai flèche 7 juin".
      const label = `${e.nom}, ${fmtRange(e)}, ${e.categorie}, ${communesLabel(e.communes)}`;
      const df = e.date_fin && e.date_fin !== e.date_debut && !isNaN(new Date(e.date_fin + "T00:00:00"))
        ? new Date(e.date_fin + "T00:00:00") : null;
      // Same month → compact "25–26" in the rail; across months "22–7" would mislead,
      // so the rail keeps the start day and the meta line says "→ 7 juin".
      const sameMonth = df && df.getMonth() === d.getMonth() && df.getFullYear() === d.getFullYear();
      const dayTxt = sameMonth ? `${d.getDate()}–${df.getDate()}` : d.getDate();
      const until = df && !sameMonth
        ? `<span class="until">→ ${esc(fmtShort.format(df))}</span><span class="sep">·</span>` : "";
      return `<li><button class="${cls}" data-i="${i}" aria-label="${esc(label)}"` +
        `${isToday ? ' aria-current="date"' : ""}>` +
        `<span class="when"><span class="wd">${WEEKDAYS[d.getDay()]}</span><span class="d">${dayTxt}</span></span>` +
        `<span class="body"><span class="title">${esc(e.nom)}</span>` +
        `<span class="meta">${until}<span class="loc-names">${PIN}${esc(communesLabel(e.communes))}</span></span></span>` +
        `<span class="badge" style="--tint:${s.tint};--fg:${s.fg}">${esc(e.categorie)}</span>` +
        `</button></li>`;
    }).join("");
    return `<section>${head}<ul class="rows">${rows}</ul></section>`;
  }).join("");
}

function openDialog(head, body) {
  const dlg = document.getElementById("detail");
  dlg.innerHTML = `<div class="dhead"><div>${head}</div>` +
    `<button class="close" aria-label="Fermer">✕</button></div>${body}`;
  dlg.querySelector(".close").onclick = () => dlg.close();
  dlg.showModal();
}

// Facts block: one icon-led line per fact (dates, place, link).
const eventBody = e => {
  const u = safeUrl(e.lien);
  const dashTxt = fmtRange(e, true), longTxt = fmtRange(e);
  const dates = dashTxt === longTxt ? esc(dashTxt)
    : `<span class="sr-only">${esc(longTxt)}</span><span aria-hidden="true">${esc(dashTxt)}</span>`;
  return '<ul class="facts">' +
    `<li>${CAL}<span>${dates}</span></li>` +
    `<li>${PIN}<span>${esc(communesLabel(e.communes))}</span></li>` +
    (u ? `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">site officiel ↗</a></li>` : "") +
    "</ul>";
};

// List rows open the event itself: its name is the title, its dates spelled out.
function openEvent(e) {
  const s = catStyle(e.categorie);
  openDialog(
    `<span class="badge" style="--tint:${s.tint};--fg:${s.fg}">${esc(e.categorie)}</span>` +
    `<h3 id="dtitle">${esc(e.nom)}</h3>`,
    `<div class="drow">${eventBody(e)}</div>`);
}

// Calendar days keep the day dialog: that view's mental model is the day.
function openDay(key) {
  const evs = eventsOn(key, baseFiltered());
  const title = fmtFull.format(new Date(key + "T00:00:00"));
  const body = evs.length === 0
    ? '<p class="empty" style="padding:1rem">Aucun événement ce jour.</p>'
    : '<ul class="devlist">' + evs.map(e => {
        const s = catStyle(e.categorie);
        return `<li class="drow" style="display:block"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem">` +
          `<h4 style="margin:0;font-size:.95rem;font-weight:600">${esc(e.nom)}</h4>` +
          `<span class="badge" style="--tint:${s.tint};--fg:${s.fg}">${esc(e.categorie)}</span></div>` +
          eventBody(e) + `</li>`;
      }).join("") + "</ul>";
  openDialog(
    `<span class="label">${evs.length} événement${evs.length > 1 ? "s" : ""}</span>` +
    `<h3 id="dtitle" style="text-transform:capitalize">${esc(title)}</h3>`,
    body);
}

// Click on the backdrop → close.
document.getElementById("detail").addEventListener("click", e => {
  if (e.target.id === "detail") e.target.close();
});

// One delegated listener per container: survives re-renders, no per-row closures.
document.getElementById("schedule").addEventListener("click", e => {
  if (e.target.closest("#past-toggle")) {
    fUpcoming = !fUpcoming;
    render();
    document.getElementById("past-toggle")?.focus(); // re-render dropped the old node
    return;
  }
  const b = e.target.closest(".row");
  if (b) openEvent(shown[+b.dataset.i]);
});
document.getElementById("days").addEventListener("click", e => {
  const b = e.target.closest(".day");
  if (b && !b.classList.contains("out")) openDay(b.dataset.key);
});

// Radiogroup: arrow keys move between the two views.
document.querySelector(".views").addEventListener("keydown", e => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  e.preventDefault();
  const next = view === "cal" ? "list" : "cal";
  setView(next);
  document.getElementById(next === "cal" ? "v-cal" : "v-list").focus();
});

syncChrome(); // apply the stored view before the CSV resolves (no list flash)
load();
