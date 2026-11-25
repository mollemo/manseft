# Manse – kauden sivusto

Yksi sivu koko kaudelle: ottelut, ottelutalkoot, muut talkoot, kyydit, tapahtumat, tiedotteet ja yhteystiedot.
Kaikki sisältö tulee yhdestä Google Sheetistä, joten koodiin ei tarvitse koskea kauden aikana.

## Käyttöönotto (n. 10 min)
1. Luo uusi Google Sheet → **Laajennukset → Apps Script** → liitä `Code.gs` → tallenna.
2. Valitse yläpalkista funktio **setup** → **Suorita** → hyväksy oikeudet. Välilehdet luodaan automaattisesti.
3. **Ota käyttöön → Uusi käyttöönotto → Verkkosovellus**: Suorita käyttäjänä *Minä*, käyttöoikeus *Kuka tahansa*.
4. Kopioi `/exec`-osoite `index.html`:n riville `const API_URL = "";`
5. Vie `index.html` ja `logo.png` uuteen GitHub-repoon ja laita GitHub Pages päälle (Settings → Pages → main).

## Etusivun osiot
Etusivu on jaettu osioihin (oletuksena **Aluesarja**, **Alueleiri** ja **Valtakunnallinen leiri**). Jokaisen osion alla näkyvät sen ottelut, avoimet talkoovuorot, tapahtumat ja kyydit.
Rivin osio valitaan **Osio**-sarakkeesta Ottelut-, Talkoot- ja Tapahtumat-välilehdillä. Jos Osio on tyhjä, osio päätellään Sarja-/Tapahtuma-/Otsikko-tekstistä, ja muuten rivi näkyy kohdassa *Yleiset*.
Ottelutalkoot (kotipelit) ja vieraspelien kyydit koskevat vain Asetusten *Ottelutalkoot osiossa* -kohdan osiota (oletus Aluesarja). Leirien talkoot kirjataan Talkoot-välilehdelle ja leirin kyydit Tapahtumat-riville (*Kyydit = Kyllä*).

**Talkoovuorot** jakaa talkoovastaava: nimet kirjoitetaan suoraan Sheetiin (Ottelut-välilehden roolisarakkeet ja Talkoot-välilehden Nimet-sarake), ja sivu näyttää ne. Sivustolla voi ilmoittautua vain kyyteihin. *Lukko = LUKITTU* sulkee myös kyytien muokkauksen.

## Leirisivut
Alueleirillä ja Valtakunnallisella leirillä on oma leirisivu (kuten erillisillä leirisivustoilla): päiväkohtainen ohjelma, ruokalista, paikat, talkoot, kyydit ja leirin info.
Leirit eivät ole yläpalkissa. Ne löytyvät **☰-valikosta** ja etusivun painikkeista leirin loppuun asti. *Leiri etusivulla* -asetuksen verran päiviä ennen alkua (oletus 14) ja leirin aikana painike on korostettu ja ylimpänä. Leirisivulle voi myös jakaa suoran linkin, esim. `…/manseft/#leiri=Alueleiri`.

- **Leirit**-välilehti: Osio, Nimi, Alkaa, Päättyy, Paikkakunta, Lisätiedot (näkyy leirin Info-kohdassa), Linkki. Setup täyttää valmiiksi kauden 2027 leirit: **Alueleiri Loimaa 11.–13.6.2027** ja **Naperoleiri Laitila 2.–6.8.2027**.
- **Talkoot**-välilehdelle setup kirjoittaa valmiiksi Sappeen pysäköinninohjauksen 3.1., 13.2. ja 3.4.2027 (klo 9.30–14, enintään klo 15, 4 henkilöä / päivä).
- **Päivän ohjelma** kootaan automaattisesti: osion ottelut, Tapahtumat-rivit (esim. Tyyppi *Ohjelma* tai *Majoitus*), ruokailut ja talkoovuorot kellonajan mukaan.
- **Ruokalista**-välilehti: Osio, Pvm, Ateria (Aamupala/Lounas/Välipala/Päivällinen/Iltapala), Klo (esim. `07:00–09:00`), Ruoka, Paikka.
- **Leirin ohjeet** (esim. pakkauslista): Ohjeet-välilehdelle, Osio = leirin nimi. Ne näkyvät vain leirisivulla.
- Ruokalan, majoituksen ym. osoitteet Kentät-välilehdelle, niin niistä tulee karttalinkit.

## Sheetin välilehdet
| Välilehti | Mitä sinne kirjoitetaan |
|---|---|
| **Ottelut** | Pvm, Klo, Joukkueet (esim. `Manse – Kiri`), Kenttä (pudotusvalikko), Sarja, Tulos, Pesistulokset-linkki. Roolisarakkeisiin (Kirjuri…) talkoovastaava kirjoittaa nimet. Koti/Vieras päätellään joukkueista, mutta sen voi myös valita itse. |
| **Talkoot** | Muut talkoot: Pvm, Klo, Loppu, Tapahtuma, Tehtävä, Paikka, **Tarve** (montako tekijää) ja **Nimet** (talkoovastaava kirjoittaa, pilkulla erotettuna). |
| **Tapahtumat** | Harjoitukset, palaverit, turnaukset, leirit, juhlat. *Kyydit = Kyllä* tuo tapahtuman Kyydit-välilehdelle. Linkki-sarakkeeseen voi laittaa esim. leirisivun osoitteen. |
| **Kyydit** | Täyttyy sivustolta. Valmentaja voi muokata tai poistaa rivejä. |
| **Tiedotteet** | Näkyvät etusivulla *Näytä asti* -päivään saakka (tyhjä = aina). |
| **Ohjeet** | Sivun Ohjeet-välilehdelle: Otsikko, Teksti (rivinvaihdot säilyvät), Linkki. Järjestys = rivien järjestys. Jos otsikko on sama kuin talkoorooli (esim. *Kirjuri* tai *Kioski*, joka kattaa Kioski 1 ja Kioski 2), roolin viereen tulee ⓘ-linkki ohjeeseen. |
| **Kentät** | Ohjeet-välilehdelle. Kentän osoitteesta tulee karttalinkki kaikkialle, missä kenttää käytetään. |
| **Asetukset** | Joukkueen nimi, kausi, **Osiot**, ottelutalkoiden osio, koti- ja vieraspelin talkooroolit sekä **Lukko** (AUKI / LUKITTU, koskee kyytejä). |

ID-sarakkeen täyttää skripti itse, joten jätä se tyhjäksi. Päivämäärän voi kirjoittaa muodossa `16.5.` tai päivämääränä.
Jos muutat talkoorooleja Asetuksissa, aja **Kausisivusto → Luo / korjaa välilehdet**, niin uudet roolisarakkeet syntyvät.
