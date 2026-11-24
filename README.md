# Manse – kauden sivusto

Yksi sivu koko kaudelle: ottelut, ottelutalkoot, muut talkoot, kyydit, tapahtumat, tiedotteet ja yhteystiedot.
Kaikki sisältö tulee yhdestä Google Sheetistä, joten koodiin ei tarvitse koskea kauden aikana.

## Käyttöönotto (n. 10 min)
1. Luo uusi Google Sheet → **Laajennukset → Apps Script** → liitä `Code.gs` → tallenna.
2. Valitse yläpalkista funktio **setup** → **Suorita** → hyväksy oikeudet. Välilehdet luodaan automaattisesti.
3. **Ota käyttöön → Uusi käyttöönotto → Verkkosovellus**: Suorita käyttäjänä *Minä*, käyttöoikeus *Kuka tahansa*.
4. Kopioi `/exec`-osoite `index.html`:n riville `const API_URL = "";`
5. Vie `index.html` ja `logo.png` uuteen GitHub-repoon ja laita GitHub Pages päälle (Settings → Pages → main).

## Sheetin välilehdet
| Välilehti | Mitä sinne kirjoitetaan |
|---|---|
| **Ottelut** | Pvm, Klo, Joukkueet (esim. `Manse – Kiri`), Kenttä (pudotusvalikko), Sarja, Tulos, Pesistulokset-linkki. Roolisarakkeet (Kirjuri…) täyttyvät sivustolta. Koti/Vieras päätellään joukkueista, mutta sen voi myös valita itse. |
| **Talkoot** | Muut talkoot: Pvm, Klo, Loppu, Tapahtuma, Tehtävä, Paikka, **Tarve** (montako tekijää). Nimet täyttyvät sivustolta. |
| **Tapahtumat** | Harjoitukset, palaverit, turnaukset, leirit, juhlat. *Kyydit = Kyllä* tuo tapahtuman Kyydit-välilehdelle. Linkki-sarakkeeseen voi laittaa esim. leirisivun osoitteen. |
| **Kyydit** | Täyttyy sivustolta. Valmentaja voi muokata tai poistaa rivejä. |
| **Tiedotteet** | Näkyvät etusivulla *Näytä asti* -päivään saakka (tyhjä = aina). |
| **Yhteystiedot**, **Kentät** | Info-välilehdelle. Kentän osoitteesta tulee karttalinkki kaikkialle, missä kenttää käytetään. |
| **Asetukset** | Joukkueen nimi, kausi, koti- ja vieraspelin talkooroolit sekä **Lukko** (AUKI / LUKITTU). |

ID-sarakkeen täyttää skripti itse, joten jätä se tyhjäksi. Päivämäärän voi kirjoittaa muodossa `16.5.` tai päivämääränä.
Jos muutat talkoorooleja Asetuksissa, aja **Kausisivusto → Luo / korjaa välilehdet**, niin uudet roolisarakkeet syntyvät.
