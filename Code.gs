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
  "Leirit":       ["Osio", "Nimi", "Alkaa", "Päättyy", "Paikkakunta", "Lisätiedot", "Linkki"],
  "Ruokalista":   ["Osio", "Pvm", "Ateria", "Klo", "Ruoka", "Paikka"],
  "Ohjeet":       ["Osio", "Otsikko", "Teksti", "Linkki"],
  "Kentät":       ["Nimi", "Osoite", "Pinta"],
  "Pelaajat":     ["Pelaaja", "Lisätiedot"],
  "Asetukset":    ["Asetus", "Arvo", "Selite"]
};

var DEFAULT_SETTINGS = [
  ["Joukkue", "Manse F-tytöt", "Näkyy sivun otsikossa"],
  ["Osiot", "Aluesarja, Alueleiri, Valtakunnallinen leiri", "Etusivun osiot tässä järjestyksessä. Rivin osio valitaan Osio-sarakkeesta (Ottelut, Talkoot, Tapahtumat). Tyhjä Osio = Muut talkoot (esim. Sappee, lipunmyynti)"],
  ["Ottelutalkoot osiossa", "Aluesarja", "Kotipelin talkoot ja vieraspelien kyydit tulevat vain tämän osion otteluihin. Tyhjä = kaikkiin otteluihin"],
  ["Kausi", "2027", "Vuosi. Käytetään, jos päivämäärä on kirjoitettu ilman vuotta (esim. 16.5.)"],
  ["Kotijoukkueen tunniste", "Manse", "Jos Joukkueet alkaa tällä sanalla, peli on kotipeli (ellei Koti/Vieras-sarakkeessa toisin lue)"],
  ["Kotipelin talkoot", "Kirjuri, Tulostaulu / ottelun vanhin, 2. tuomari, 3. tuomari, Takarajatuomari, Kioski 1, Kioski 2, Kentän piirtäjä", "Pilkulla erotettu lista. Jokaiselle tulee oma sarake Ottelut-välilehdelle. Kaksi samaa tehtävää = kaksi riviä (esim. Kioski 1, Kioski 2)"],
  ["Vieraspelin talkoot", "", "Pilkulla erotettu lista. Tyhjä = vieraspeleissä ei talkoita, vain kyydit"],
  ["Leiripelin talkoot", "Kirjuri, Tulostaulu", "Leirien otteluiden (koti- ja vieraspelit) talkooroolit. Pilkulla erotettu lista. Tyhjä = ei talkoita"],
  ["Leiri etusivulla", "14", "Montako päivää ennen leirin alkua leirin painike korostetaan ja nostetaan etusivun ylimmäksi"],
  ["Lukko", "AUKI", "AUKI = kyytejä voi tarjota ja niihin voi liittyä sivustolla. LUKITTU = kyytejäkään ei voi muuttaa sivustolla"]
];

// Kauden leirit: kirjoitetaan Leirit-välilehdelle setupissa, jos välilehti on vielä tyhjä.
var DEFAULT_CAMPS = [
  { "Osio": "Alueleiri", "Nimi": "Alueleiri Loimaa", "Alkaa": new Date(2027, 5, 11), "Päättyy": new Date(2027, 5, 13), "Paikkakunta": "Loimaa" },
  { "Osio": "Valtakunnallinen leiri", "Nimi": "Naperoleiri Laitila", "Alkaa": new Date(2027, 7, 2), "Päättyy": new Date(2027, 7, 6), "Paikkakunta": "Laitila" }
];

// Kauden valmiiksi sovitut talkoot: kirjoitetaan Talkoot-välilehdelle setupissa, jos välilehti on vielä tyhjä.
var SAPPEE = { "Klo": "09:30", "Loppu": "14:00", "Tapahtuma": "Sappee", "Tehtävä": "Pysäköinnin ohjaus", "Paikka": "Sappee",
               "Tarve": 4, "Lisätiedot": "Vuoro päättyy viimeistään klo 15." };
var DEFAULT_TALKOOT = [
  merge_({ "Pvm": new Date(2027, 0, 3) }, SAPPEE),
  merge_({ "Pvm": new Date(2027, 1, 13) }, SAPPEE),
  merge_({ "Pvm": new Date(2027, 3, 3) }, SAPPEE)
];
function merge_(a, b) { Object.keys(b).forEach(function (k) { a[k] = b[k]; }); return a; }

// Lisää rivit välilehdelle otsikoiden mukaan, jos välilehdellä ei ole vielä yhtään riviä.
function seedRows_(sh, rows, dateCols) {
  if (sh.getLastRow() >= 2 || !rows.length) return;
  var hm = headerMap_(sh), width = sh.getLastColumn();
  rows.forEach(function (c) {
    var row = []; for (var i = 0; i < width; i++) row.push("");
    Object.keys(c).forEach(function (k) { if (k in hm) row[hm[k]] = c[k]; });
    sh.appendRow(row);
  });
  (dateCols || []).forEach(function (k) { if (k in hm) sh.getRange(2, hm[k] + 1, rows.length, 1).setNumberFormat("d.M.yyyy"); });
}

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
  // Pelaajat-välilehden lista pudotusvalikoksi roolisarakkeisiin ja kyytien kuljettajaan:
  // vuoro tai kyyti kirjataan aina pelaajan nimellä (perhe), jolloin nimet pysyvät samassa muodossa
  var nimet = ss.getSheetByName("Pelaajat").getRange("A2:A");
  var nameRule = SpreadsheetApp.newDataValidation().requireValueInRange(nimet, true).setAllowInvalid(true).build();
  allRoles_(settings).forEach(function (role) {
    if (role in hm) ott.getRange(2, hm[role] + 1, Math.max(ott.getMaxRows() - 1, 1), 1).setDataValidation(nameRule);
  });
  var kyy = ss.getSheetByName("Kyydit"), kh = headerMap_(kyy);
  kyy.getRange(2, kh["Kuljettaja"] + 1, Math.max(kyy.getMaxRows() - 1, 1), 1).setDataValidation(nameRule);
  var maxRows = Math.max(ott.getMaxRows() - 1, 1);
  ott.getRange(2, hm["Kenttä"] + 1, maxRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(kentat.getRange("A2:A"), true).setAllowInvalid(true).build());
  ott.getRange(2, hm["Koti/Vieras"] + 1, maxRows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Koti", "Vieras"], true).setAllowInvalid(true).build());
  var tap = ss.getSheetByName("Tapahtumat");
  var th = headerMap_(tap);
  tap.getRange(2, th["Tyyppi"] + 1, Math.max(tap.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Harjoitus", "Turnaus", "Leiri", "Ohjelma", "Majoitus", "Palaveri", "Varainhankinta", "Juhla", "Muu"], true).setAllowInvalid(true).build());
  tap.getRange(2, th["Kyydit"] + 1, Math.max(tap.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Kyllä"], true).setAllowInvalid(true).build());
  var osiot = splitList_(settings["Osiot"]);
  seedRows_(ss.getSheetByName("Leirit"), DEFAULT_CAMPS, ["Alkaa", "Päättyy"]);
  seedRows_(ss.getSheetByName("Talkoot"), DEFAULT_TALKOOT, ["Pvm"]);
  var rl = ss.getSheetByName("Ruokalista");
  rl.getRange(2, headerMap_(rl)["Ateria"] + 1, Math.max(rl.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["Aamupala", "Lounas", "Välipala", "Päivällinen", "Iltapala"], true).setAllowInvalid(true).build());
  if (osiot.length) ["Ottelut", "Talkoot", "Tapahtumat", "Leirit", "Ruokalista", "Ohjeet"].forEach(function (name) {
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


function allRoles_(settings) {
  var a = splitList_(settings["Kotipelin talkoot"]).concat(splitList_(settings["Vieraspelin talkoot"]), splitList_(settings["Leiripelin talkoot"]));
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
  var campRoles = splitList_(s["Leiripelin talkoot"]);
  // Leiriosiot: Leirit-välilehdellä mainitut tai nimessä "leiri"
  var campSecs = readTable_("Leirit").map(function (r) { return sectionOf_(r["Osio"], "", sections).toLowerCase(); });
  var isCampSec = function (sec) { sec = String(sec || "").toLowerCase(); return !!sec && (campSecs.indexOf(sec) !== -1 || /leiri/.test(sec)); };

  var games = readTable_("Ottelut").map(function (r) {
    var teams = str_(r["Joukkueet"]);
    var kv = str_(r["Koti/Vieras"]).toLowerCase();
    var home = kv ? kv.charAt(0) === "k" : (tag && teams.toLowerCase().indexOf(tag) === 0);
    var section = sectionOf_(r["Osio"], r["Sarja"], sections);
    var applies = !roleSec || section.toLowerCase() === roleSec;
    var camp = isCampSec(section);
    // Aluesarja: kotipelin roolit (vieraspeleissä kyydit). Leirit: leiripelin roolit sekä koti- että vieraspeleissä.
    var list = camp ? campRoles : applies ? (home ? homeRoles : awayRoles) : [];
    var roles = {};
    list.forEach(function (role) { roles[role] = str_(r[role]); });
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
    return { section: sectionOf_(r["Osio"], "", sections), title: str_(r["Otsikko"]), text: str_(r["Teksti"]), link: str_(r["Linkki"]) };
  }).filter(function (o) { return o.title || o.text; });

  // Leirit: osion päivät ja tiedot. Ruokalista: ateriat päivittäin.
  var camps = readTable_("Leirit").map(function (r) {
    return { section: sectionOf_(r["Osio"], "", sections), name: str_(r["Nimi"]), start: fmtDate_(r["Alkaa"], year), end: fmtDate_(r["Päättyy"], year),
             town: str_(r["Paikkakunta"]), info: str_(r["Lisätiedot"]), link: str_(r["Linkki"]) };
  }).filter(function (c) { return c.section; });
  var menu = readTable_("Ruokalista").map(function (r) {
    return { section: sectionOf_(r["Osio"], "", sections), date: fmtDate_(r["Pvm"], year), meal: str_(r["Ateria"]),
             time: r["Klo"] instanceof Date ? fmtTime_(r["Klo"]) : str_(r["Klo"]), food: str_(r["Ruoka"]), place: str_(r["Paikka"]) };
  }).filter(function (m) { return m.date && (m.meal || m.food); });
  var names = readTable_("Pelaajat").map(function (r) { return str_(r["Pelaaja"]); }).filter(function (n) { return n; });
  var fields = readTable_("Kentät").map(function (r) {
    return { name: str_(r["Nimi"]), address: str_(r["Osoite"]), surface: str_(r["Pinta"]) };
  }).filter(function (f) { return f.name; });

  return {
    ok: true,
    settings: { team: s["Joukkue"], season: s["Kausi"], homeTag: s["Kotijoukkueen tunniste"], homeRoles: homeRoles, awayRoles: awayRoles, campRoles: campRoles,
                sections: sections, roleSection: s["Ottelutalkoot osiossa"],
                campDays: parseInt(s["Leiri etusivulla"], 10) || 14 },
    locked: /^lukit/i.test(s["Lukko"] || ""),
    today: todayIso_(),
    games: games, talkoot: talkoot, events: events, rides: rides, news: news, ohjeet: ohjeet, fields: fields, camps: camps, menu: menu, names: names
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

  // Talkoovuorot jakaa talkoovastaava suoraan Sheetiin. Sivustolta voi ilmoittautua vain kyyteihin.
  if (b.action === "role" || b.action === "talkoo_add" || b.action === "talkoo_remove") {
    return { ok: false, error: "Talkoovuorot jakaa talkoovastaava. Sovi muutoksista hänen kanssaan." };
  }

  var ksh = sheet_("Kyydit"), khm = headerMap_(ksh);
  // Jos Pelaajat-välilehdellä on nimiä, kyytien nimet hyväksytään vain listalta
  var known = readTable_("Pelaajat").map(function (r) { return str_(r["Pelaaja"]).toLowerCase(); }).filter(function (n) { return n; });
  var listed = function (n) { return !known.length || known.indexOf(str_(n).toLowerCase()) !== -1; };

  if (b.action === "ride_add") {           // { target, driver, seats, depart, info }
    var driver = str_(b.driver).slice(0, 60);
    if (!driver || !str_(b.target)) return { ok: false, error: "Nimi puuttuu." };
    if (!listed(driver)) return { ok: false, error: "Valitse pelaaja listalta." };
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

  if (b.action === "ride_edit") {           // { id, seats, depart } – kyytiläiset säilyvät
    var cur = splitList_(ksh.getRange(krow, khm["Kyytiläiset"] + 1).getValue());
    var newSeats = Math.min(Math.max(parseInt(b.seats, 10) || 1, 1), 8);
    if (newSeats < cur.length) return { ok: false, error: "Kyydissä on jo " + cur.length + " pelaajaa, paikkoja ei voi olla vähemmän." };
    ksh.getRange(krow, khm["Paikat"] + 1).setValue(newSeats);
    ksh.getRange(krow, khm["Lähtö"] + 1).setValue(str_(b.depart).slice(0, 80));
    return { ok: true };
  }

  if (b.action === "ride_join" || b.action === "ride_leave") {   // { id, name }
    if (!name) return { ok: false, error: "Nimi puuttuu." };
    var pc = ksh.getRange(krow, khm["Kyytiläiset"] + 1);
    var pas = splitList_(pc.getValue());
    var seats = parseInt(ksh.getRange(krow, khm["Paikat"] + 1).getValue(), 10) || 0;
    if (b.action === "ride_join") {
      if (!listed(name)) return { ok: false, error: "Valitse pelaaja listalta." };
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
