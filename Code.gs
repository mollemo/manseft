/**
 * Manse – kauden sivuston rajapinta (Google Apps Script)
 * ------------------------------------------------------
 * Yksi Google Sheet hoitaa koko kauden: ottelut + ottelutalkoot, muut talkoot,
 * tapahtumat, kyydit, tiedotteet, yhteystiedot, kentät ja asetukset.
 *
 * KÄYTTÖÖNOTTO
 * 1. Luo uusi Google Sheet ja avaa Laajennukset → Apps Script.
 * 2. Liitä tämä koko tiedosto Code.gs:n tilalle ja tallenna.
 * 3. Aja funktio  setup  kerran (yläpalkista valitse "setup" → Suorita) ja hyväksy oikeudet.
 *    → Kaikki välilehdet otsikkoriveineen ja pudotusvalikkoineen luodaan automaattisesti.
 *    (Myöhemmin saman voi ajaa Sheetin valikosta "Kausisivusto → Luo / korjaa välilehdet".)
 * 4. Ota käyttöön → Uusi käyttöönotto → Tyyppi: Verkkosovellus
 *      Suorita käyttäjänä: Minä   ·   Käyttöoikeus: Kuka tahansa
 * 5. Kopioi /exec-loppuinen osoite sivuston index.html:n kohtaan API_URL.
 *
 * Kun muutat tätä koodia myöhemmin: Ota käyttöön → Hallinnoi käyttöönottoja →
 * kynä → Versio: Uusi versio → Ota käyttöön. (Osoite pysyy samana.)
 */

var SHEETS = {
  "Ottelut":      ["ID", "Osio", "Pvm", "Klo", "Joukkueet", "Kenttä", "Sarja", "Koti/Vieras", "Tulos", "Pesistulokset", "Lisätiedot"],
  "Talkoot":      ["ID", "Osio", "Pvm", "Klo", "Loppu", "Tapahtuma", "Tehtävä", "Paikka", "Tarve", "Nimet", "Lisätiedot"],
  "Tapahtumat":   ["ID", "Osio", "Pvm", "Klo", "Loppu", "Otsikko", "Tyyppi", "Paikka", "Lisätiedot", "Linkki", "Kyydit"],
  "Kyydit":       ["ID", "KohdeID", "Kuljettaja", "Paikat", "Kyytiläiset", "Lähtö", "Lisätiedot"],
  "Tiedotteet":   ["Pvm", "Otsikko", "Teksti", "Näytä asti"],
  "Ohjeet":       ["Otsikko", "Teksti", "Linkki"],
  "Kentät":       ["Nimi", "Osoite", "Pinta"],
  "Asetukset":    ["Asetus", "Arvo", "Selite"]
};

var DEFAULT_SETTINGS = [
  ["Joukkue", "Manse F-tytöt", "Näkyy sivun otsikossa"],
  ["Osiot", "Aluesarja, Alueleiri, Valtakunnallinen leiri", "Etusivun osiot tässä järjestyksessä. Rivin osio valitaan Osio-sarakkeesta (Ottelut, Talkoot, Tapahtumat). Tyhjä Osio = Yleiset"],
  ["Ottelutalkoot osiossa", "Aluesarja", "Kotipelin talkoot ja vieraspelien kyydit tulevat vain tämän osion otteluihin. Tyhjä = kaikkiin otteluihin"],
  ["Kausi", "2027", "Vuosi. Käytetään, jos päivämäärä on kirjoitettu ilman vuotta (esim. 16.5.)"],
  ["Kotijoukkueen tunniste", "Manse", "Jos Joukkueet alkaa tällä sanalla, peli on kotipeli (ellei Koti/Vieras-sarakkeessa toisin lue)"],
  ["Kotipelin talkoot", "Kirjuri, Tulostaulu / ottelun vanhin, 2. tuomari, 3. tuomari, Takarajatuomari, Kioski 1, Kioski 2, Kentän piirtäjä", "Pilkulla erotettu lista. Jokaiselle tulee oma sarake Ottelut-välilehdelle. Kaksi samaa tehtävää = kaksi riviä (esim. Kioski 1, Kioski 2)"],
  ["Vieraspelin talkoot", "", "Pilkulla erotettu lista. Tyhjä = vieraspeleissä ei talkoita, vain kyydit"],
  ["Lukitut osiot", "Aluesarja", "Näiden osioiden talkoovuoroihin ei voi ilmoittautua sivustolla: talkoovastaava kirjoittaa nimet Sheetiin ja sivu näyttää ne. Pilkulla erotettu lista (esim. Aluesarja, Alueleiri, Valtakunnallinen leiri). Tyhjä = kaikki auki. Kyytejä voi aina sopia sivustolla"],
  ["Lukko", "AUKI", "AUKI = ilmoittautuminen sivustolla toimii. LUKITTU = mitään (myöskään kyytejä) ei voi muuttaa sivustolla"]
];

// ─── Valikko ja välilehtien luonti ────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Kausisivusto")
    .addItem("Luo / korjaa välilehdet", "setup")
    .addToUi();
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    ensureHeaders_(sh, SHEETS[name]);
  });

  // Asetukset: lisää puuttuvat oletusrivit
  var set = ss.getSheetByName("Asetukset");
  var existing = set.getLastRow() > 1
    ? set.getRange(2, 1, set.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); })
    : [];
  DEFAULT_SETTINGS.forEach(function (row) {
    if (existing.indexOf(row[0]) === -1) set.appendRow(row);
  });
  set.setColumnWidth(1, 190); set.setColumnWidth(2, 280); set.setColumnWidth(3, 520);

  // Roolisarakkeet Ottelut-välilehdelle asetusten mukaan
  var settings = readSettings_();
  var ott = ss.getSheetByName("Ottelut");
  ensureHeaders_(ott, SHEETS["Ottelut"].concat(allRoles_(settings)));

  // Pudotusvalikot
  var kentat = ss.getSheetByName("Kentät");
  var hm = headerMap_(ott);
  var maxRows = Math.max(ott.getMaxRows() - 1, 1);
  ott.getRange(2, hm["Kenttä"] + 1, maxRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(kentat.getRange("A2:A"), true).setAllowInvalid(true).build());
  ott.getRange(2, hm["Koti/Vieras"] + 1, maxRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Koti", "Vieras"], true).setAllowInvalid(true).build());
  var tap = ss.getSheetByName("Tapahtumat");
  var th = headerMap_(tap);
  tap.getRange(2, th["Tyyppi"] + 1, Math.max(tap.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Harjoitus", "Turnaus", "Leiri", "Palaveri", "Varainhankinta", "Juhla", "Muu"], true).setAllowInvalid(true).build());
  tap.getRange(2, th["Kyydit"] + 1, Math.max(tap.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Kyllä"], true).setAllowInvalid(true).build());
  var osiot = splitList_(settings["Osiot"]);
  if (osiot.length) ["Ottelut", "Talkoot", "Tapahtumat"].forEach(function (name) {
    var sh = ss.getSheetByName(name), h = headerMap_(sh);
    sh.getRange(2, h["Osio"] + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(osiot, true).setAllowInvalid(true).build());
  });
  var lockRow = findSettingRow_(set, "Lukko");
  if (lockRow) set.getRange(lockRow, 2).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["AUKI", "LUKITTU"], true).build());

  SpreadsheetApp.getActiveSpreadsheet().toast("Välilehdet valmiina.", "Kausisivusto", 5);
}

function ensureHeaders_(sh, headers) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var current = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var hasAny = current.some(function (h) { return h; });
  var col = hasAny ? current.length : 0;
  headers.forEach(function (h) {
    if (current.indexOf(h) === -1) { col++; sh.getRange(1, col).setValue(h); }
  });
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold").setBackground("#F3D6D6");
  sh.setFrozenRows(1);
}

// ─── Lukeminen ───────────────────────────────────────────────────────────
function headerMap_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var hdr = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  hdr.forEach(function (h, i) { h = String(h).trim(); if (h && !(h in map)) map[h] = i; });
  return map;
}

function sheet_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("Välilehti puuttuu: " + name + " (aja setup)");
  return sh;
}

// Palauttaa rivit olioina { otsikko: arvo, _row: rivinumero }. Tyhjät rivit ohitetaan.
function readTable_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var hm = headerMap_(sh);
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var out = [];
  values.forEach(function (r, i) {
    if (!r.some(function (v) { return v !== "" && v !== null; })) return;
    var o = { _row: i + 2 };
    Object.keys(hm).forEach(function (h) { o[h] = r[hm[h]]; });
    out.push(o);
  });
  return out;
}

// Täyttää puuttuvat ID:t riveille, joilla on sisältöä.
function ensureIds_(name, prefix) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return;
  var hm = headerMap_(sh);
  if (!("ID" in hm)) return;
  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
  var idCol = hm["ID"];
  var changed = false;
  var ids = vals.map(function (r) {
    var id = String(r[idCol] || "").trim();
    var hasContent = r.some(function (v, i) { return i !== idCol && v !== "" && v !== null; });
    if (!id && hasContent) { id = prefix + Utilities.getUuid().slice(0, 8); changed = true; }
    return [id];
  });
  if (changed) sh.getRange(2, idCol + 1, n, 1).setValues(ids);
}

function readSettings_() {
  var rows = readTable_("Asetukset");
  var s = {};
  rows.forEach(function (r) { s[String(r["Asetus"]).trim()] = String(r["Arvo"] == null ? "" : r["Arvo"]).trim(); });
  DEFAULT_SETTINGS.forEach(function (d) { if (!(d[0] in s)) s[d[0]] = d[1]; });
  return s;
}

function findSettingRow_(sh, key) {
  if (sh.getLastRow() < 2) return 0;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).trim() === key) return i + 2;
  return 0;
}

function splitList_(s) {
  return String(s || "").split(",").map(function (x) { return x.trim(); }).filter(function (x) { return x; });
}
// Osio: Osio-sarakkeen arvo, tai jos se on tyhjä, osio jonka nimi löytyy vararivistä (esim. Sarja-sarakkeesta).
function sectionOf_(explicit, fallback, sections) {
  var e = str_(explicit).toLowerCase(), f = str_(fallback).toLowerCase();
  for (var i = 0; i < sections.length; i++) if (e && sections[i].toLowerCase() === e) return sections[i];
  if (e) return "";
  for (var j = 0; j < sections.length; j++) if (f && f.indexOf(sections[j].toLowerCase()) !== -1) return sections[j];
  return "";
}

function rowSection_(sh, hm, row, fallbackCol, s) {
  var get = function (c) { return c in hm ? sh.getRange(row, hm[c] + 1).getValue() : ""; };
  return sectionOf_(get("Osio"), get(fallbackCol), splitList_(s["Osiot"]));
}
function sectionLocked_(sec, s) {
  var l = splitList_(s["Lukitut osiot"]).map(function (x) { return x.toLowerCase(); });
  return l.indexOf((sec || "Yleiset").toLowerCase()) !== -1;
}
var LOCKED_MSG = "Tämän osion talkoovuorot jakaa talkoovastaava. Ilmoittautuminen sivustolla on suljettu.";

function allRoles_(settings) {
  var a = splitList_(settings["Kotipelin talkoot"]).concat(splitList_(settings["Vieraspelin talkoot"]));
  return a.filter(function (x, i) { return a.indexOf(x) === i; });
}

// ─── Päivämäärät ja kellonajat ───────────────────────────────────────────
function tz_() { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || "Europe/Helsinki"; }

function fmtDate_(v, year) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz_(), "yyyy-MM-dd");
  var s = String(v || "").trim();
  if (!s) return "";
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + "-" + pad_(m[2]) + "-" + pad_(m[3]);
  m = s.match(/(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?/);
  if (m) {
    var y = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : (year || new Date().getFullYear());
    return y + "-" + pad_(m[2]) + "-" + pad_(m[1]);
  }
  return s;
}
function fmtTime_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz_(), "HH:mm");
  var s = String(v || "").trim();
  var m = s.match(/^(\d{1,2})[:.](\d{2})/);
  return m ? pad_(m[1]) + ":" + m[2] : s;
}
function pad_(n) { n = String(n); return n.length < 2 ? "0" + n : n; }
function todayIso_() { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd"); }
function str_(v) { return v == null ? "" : String(v).trim(); }

// ─── GET: kaikki sivuston data yhdellä haulla ────────────────────────────
function doGet() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    ensureIds_("Ottelut", "o");
    ensureIds_("Talkoot", "t");
    ensureIds_("Tapahtumat", "e");
  } finally { lock.releaseLock(); }
  return json_(buildPayload_());
}

function buildPayload_() {
  var s = readSettings_();
  var year = s["Kausi"];
  var homeRoles = splitList_(s["Kotipelin talkoot"]);
  var awayRoles = splitList_(s["Vieraspelin talkoot"]);
  var tag = (s["Kotijoukkueen tunniste"] || "").toLowerCase();
  var sections = splitList_(s["Osiot"]);
  var roleSec = str_(s["Ottelutalkoot osiossa"]).toLowerCase();

  var games = readTable_("Ottelut").map(function (r) {
    var teams = str_(r["Joukkueet"]);
    var kv = str_(r["Koti/Vieras"]).toLowerCase();
    var home = kv ? kv.charAt(0) === "k" : (tag && teams.toLowerCase().indexOf(tag) === 0);
    var section = sectionOf_(r["Osio"], r["Sarja"], sections);
    var applies = !roleSec || section.toLowerCase() === roleSec;
    var roles = {};
    if (applies) (home ? homeRoles : awayRoles).forEach(function (role) { roles[role] = str_(r[role]); });
    return {
      id: str_(r["ID"]), section: section, rides: !home && applies, date: fmtDate_(r["Pvm"], year), time: fmtTime_(r["Klo"]),
      teams: teams, field: str_(r["Kenttä"]), series: str_(r["Sarja"]), home: !!home,
      result: str_(r["Tulos"]), link: str_(r["Pesistulokset"]), info: str_(r["Lisätiedot"]),
      roles: roles
    };
  }).filter(function (g) { return g.id && g.date; });

  var talkoot = readTable_("Talkoot").map(function (r) {
    return {
      id: str_(r["ID"]), section: sectionOf_(r["Osio"], r["Tapahtuma"], sections),
      date: fmtDate_(r["Pvm"], year), time: fmtTime_(r["Klo"]), end: fmtTime_(r["Loppu"]),
      event: str_(r["Tapahtuma"]), task: str_(r["Tehtävä"]), place: str_(r["Paikka"]),
      need: Math.max(parseInt(r["Tarve"], 10) || 1, 1), names: splitList_(r["Nimet"]), info: str_(r["Lisätiedot"])
    };
  }).filter(function (t) { return t.id && t.date; });

  var events = readTable_("Tapahtumat").map(function (r) {
    return {
      id: str_(r["ID"]), section: sectionOf_(r["Osio"], str_(r["Otsikko"]) + " " + str_(r["Tyyppi"]), sections),
      date: fmtDate_(r["Pvm"], year), time: fmtTime_(r["Klo"]), end: fmtTime_(r["Loppu"]),
      title: str_(r["Otsikko"]), type: str_(r["Tyyppi"]), place: str_(r["Paikka"]),
      info: str_(r["Lisätiedot"]), link: str_(r["Linkki"]), rides: /^k/i.test(str_(r["Kyydit"]))
    };
  }).filter(function (e) { return e.id && e.date; });

  var rides = readTable_("Kyydit").map(function (r) {
    return {
      id: str_(r["ID"]), target: str_(r["KohdeID"]), driver: str_(r["Kuljettaja"]),
      seats: Math.max(parseInt(r["Paikat"], 10) || 0, 0), passengers: splitList_(r["Kyytiläiset"]),
      depart: str_(r["Lähtö"]), info: str_(r["Lisätiedot"])
    };
  }).filter(function (k) { return k.id && k.target; });

  var news = readTable_("Tiedotteet").map(function (r) {
    return { date: fmtDate_(r["Pvm"], year), title: str_(r["Otsikko"]), text: str_(r["Teksti"]), until: fmtDate_(r["Näytä asti"], year) };
  }).filter(function (n) { return n.title || n.text; });

  // Ohjeet-välilehti: rivien järjestys = näyttöjärjestys. Otsikko, joka vastaa talkooroolia
  // (esim. "Kirjuri" tai "Kioski"), näkyy ⓘ-linkkinä roolin vieressä.
  var ohjeet = readTable_("Ohjeet").map(function (r) {
    return { title: str_(r["Otsikko"]), text: str_(r["Teksti"]), link: str_(r["Linkki"]) };
  }).filter(function (o) { return o.title || o.text; });
  var fields = readTable_("Kentät").map(function (r) {
    return { name: str_(r["Nimi"]), address: str_(r["Osoite"]), surface: str_(r["Pinta"]) };
  }).filter(function (f) { return f.name; });

  return {
    ok: true,
    settings: { team: s["Joukkue"], season: s["Kausi"], homeTag: s["Kotijoukkueen tunniste"], homeRoles: homeRoles, awayRoles: awayRoles,
                sections: sections, roleSection: s["Ottelutalkoot osiossa"], lockedSections: splitList_(s["Lukitut osiot"]) },
    locked: /^lukit/i.test(s["Lukko"] || ""),
    today: todayIso_(),
    games: games, talkoot: talkoot, events: events, rides: rides, news: news, ohjeet: ohjeet, fields: fields
  };
}

// ─── POST: ilmoittautumiset ──────────────────────────────────────────────
// Body (text/plain JSON): { action: "...", ... }
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var s = readSettings_();
    if (/^lukit/i.test(s["Lukko"] || "")) return json_({ ok: false, error: "Talkoolista on lukittu." });
    var res = handle_(body, s);
    return json_(res || { ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function handle_(b, s) {
  var name = str_(b.name).slice(0, 60);
  var today = todayIso_();
  var year = s["Kausi"];

  if (b.action === "role") {               // { id, role, name } – tyhjä name = poisto
    var sh = sheet_("Ottelut"), hm = headerMap_(sh);
    if (allRoles_(s).indexOf(b.role) === -1 || !(b.role in hm)) return { ok: false, error: "Tuntematon rooli." };
    var row = findRowById_(sh, hm, b.id);
    if (!row) return { ok: false, error: "Ottelua ei löytynyt." };
    if (sectionLocked_(rowSection_(sh, hm, row, "Sarja", s), s)) return { ok: false, error: LOCKED_MSG };
    if (fmtDate_(sh.getRange(row, hm["Pvm"] + 1).getValue(), year) < today) return { ok: false, error: "Ottelu on jo pelattu." };
    sh.getRange(row, hm[b.role] + 1).setValue(name);
    return { ok: true };
  }

  if (b.action === "talkoo_add" || b.action === "talkoo_remove") {   // { id, name }
    var sh2 = sheet_("Talkoot"), hm2 = headerMap_(sh2);
    var row2 = findRowById_(sh2, hm2, b.id);
    if (!row2) return { ok: false, error: "Talkoovuoroa ei löytynyt." };
    if (sectionLocked_(rowSection_(sh2, hm2, row2, "Tapahtuma", s), s)) return { ok: false, error: LOCKED_MSG };
    if (fmtDate_(sh2.getRange(row2, hm2["Pvm"] + 1).getValue(), year) < today) return { ok: false, error: "Vuoro on jo mennyt." };
    var cell = sh2.getRange(row2, hm2["Nimet"] + 1);
    var names = splitList_(cell.getValue());
    var need = Math.max(parseInt(sh2.getRange(row2, hm2["Tarve"] + 1).getValue(), 10) || 1, 1);
    if (!name) return { ok: false, error: "Nimi puuttuu." };
    if (b.action === "talkoo_add") {
      if (names.some(function (n) { return n.toLowerCase() === name.toLowerCase(); })) return { ok: true };
      if (names.length >= need) return { ok: false, error: "Vuoro ehti juuri täyttyä." };
      names.push(name);
    } else {
      names = names.filter(function (n) { return n !== name; });
    }
    cell.setValue(names.join(", "));
    return { ok: true };
  }

  var ksh = sheet_("Kyydit"), khm = headerMap_(ksh);

  if (b.action === "ride_add") {           // { target, driver, seats, depart, info }
    var driver = str_(b.driver).slice(0, 60);
    if (!driver || !str_(b.target)) return { ok: false, error: "Nimi puuttuu." };
    var rowVals = [];
    rowVals[khm["ID"]] = "k" + Utilities.getUuid().slice(0, 8);
    rowVals[khm["KohdeID"]] = str_(b.target);
    rowVals[khm["Kuljettaja"]] = driver;
    rowVals[khm["Paikat"]] = Math.min(Math.max(parseInt(b.seats, 10) || 1, 1), 8);
    rowVals[khm["Kyytiläiset"]] = "";
    rowVals[khm["Lähtö"]] = str_(b.depart).slice(0, 80);
    rowVals[khm["Lisätiedot"]] = str_(b.info).slice(0, 120);
    for (var i = 0; i < ksh.getLastColumn(); i++) if (rowVals[i] === undefined) rowVals[i] = "";
    ksh.appendRow(rowVals);
    return { ok: true };
  }

  var krow = findRowById_(ksh, khm, b.id);
  if (!krow) return { ok: false, error: "Kyytiä ei löytynyt." };

  if (b.action === "ride_remove") { ksh.deleteRow(krow); return { ok: true }; }

  if (b.action === "ride_join" || b.action === "ride_leave") {   // { id, name }
    if (!name) return { ok: false, error: "Nimi puuttuu." };
    var pc = ksh.getRange(krow, khm["Kyytiläiset"] + 1);
    var pas = splitList_(pc.getValue());
    var seats = parseInt(ksh.getRange(krow, khm["Paikat"] + 1).getValue(), 10) || 0;
    if (b.action === "ride_join") {
      if (pas.some(function (n) { return n.toLowerCase() === name.toLowerCase(); })) return { ok: true };
      if (pas.length >= seats) return { ok: false, error: "Kyyti ehti juuri täyttyä." };
      pas.push(name);
    } else {
      pas = pas.filter(function (n) { return n !== name; });
    }
    pc.setValue(pas.join(", "));
    return { ok: true };
  }

  return { ok: false, error: "Tuntematon toiminto." };
}

function findRowById_(sh, hm, id) {
  id = str_(id);
  if (!id || sh.getLastRow() < 2 || !("ID" in hm)) return 0;
  var ids = sh.getRange(2, hm["ID"] + 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (str_(ids[i][0]) === id) return i + 2;
  return 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
