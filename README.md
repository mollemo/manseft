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
Rivin osio valitaan **Osio**-sarakkeesta Ottelut-, Talkoot- ja Tapahtumat-välilehdillä. Jos Osio on tyhjä, osio päätellään Sarja-/Tapahtuma-/Otsikko-tekstistä, ja muuten rivi näkyy kohdassa *Muut talkoot* (seuran yhteiset talkoot, esim. Sappee ja lipunmyynti edustusjoukkueen peleissä).
Ottelutalkoot (kotipelit) ja vieraspelien kyydit koskevat vain Asetusten *Ottelutalkoot osiossa* -kohdan osiota (oletus Aluesarja). Leirien talkoot kirjataan Talkoot-välilehdelle ja leirin kyydit Tapahtumat-riville (*Kyydit = Kyllä*).

**Talkoovuorot** jakaa talkoovastaava: nimet kirjoitetaan suoraan Sheetiin (Ottelut-välilehden roolisarakkeet ja Talkoot-välilehden Nimet-sarake) pelaajien niminä Pelaajat-listalta, ja sivu näyttää ne. Sivustolla voi ilmoittautua vain kyyteihin. *Lukko = LUKITTU* sulkee myös kyytien muokkauksen.

## Leirisivut
Alueleirillä ja Valtakunnallisella leirillä on oma leirisivu (kuten erillisillä leirisivustoilla): päiväkohtainen ohjelma, ruokalista, paikat, talkoot, kyydit ja leirin info.
Leirit eivät ole yläpalkissa. Ne löytyvät **☰-valikosta** ja etusivun painikkeista leirin loppuun asti. *Leiri etusivulla* -asetuksen verran päiviä ennen alkua (oletus 14) ja leirin aikana painike on korostettu ja ylimpänä. Leirisivulle voi myös jakaa suoran linkin, esim. `…/manseft/#leiri=Alueleiri`.

- **Leirit**-välilehti: Osio, Nimi, Alkaa, Päättyy, Paikkakunta, Lisätiedot (näkyy leirin Info-kohdassa), Linkki. Setup täyttää valmiiksi kauden 2027 leirit: **Alueleiri Loimaa 11.–13.6.2027** ja **Naperoleiri Laitila 2.–6.8.2027**.
- **Talkoot**-välilehdelle setup kirjoittaa valmiiksi Sappeen pysäköinninohjauksen 3.1., 13.2. ja 3.4.2027 (klo 9.30–14, enintään klo 15, 4 henkilöä / päivä).
- **Päivän ohjelma** kootaan automaattisesti: osion ottelut, Tapahtumat-rivit (esim. Tyyppi *Ohjelma* tai *Majoitus*), ruokailut ja talkoovuorot kellonajan mukaan.
- **Ruokalista**-välilehti: Osio, Pvm, Ateria (Aamupala/Lounas/Välipala/Päivällinen/Iltapala), Klo (esim. `07:00–09:00`), Ruoka, Paikka.
- **Leirin ohjeet** (esim. pakkauslista): Ohjeet-välilehdelle, Osio = leirin nimi. Ne näkyvät vain leirisivulla.
- Ruokalan, majoituksen ym. osoitteet Kentät-välilehdelle, niin niistä tulee karttalinkit.

## Toimii myös heikossa verkossa
Sivu tallentaa viimeksi haetut kauden tiedot puhelimeen (muutamia kymmeniä kilotavuja) ja `sw.js` sivun omat tiedostot (sivu, logo, kenttäkuva). Sivu aukeaa heti ja toimii ilman verkkoa; ylhäällä kerrotaan, milloin tiedot on haettu. Tuoreet tiedot haetaan aina, kun yhteys on olemassa. Kyytien tallentaminen vaatii verkon.

## Asennus puhelimen kotinäytölle
Sivu on asennettava verkkosovellus (`manifest.webmanifest`, kuvakkeet `icon-*.png` ja `apple-touch-icon.png`). ☰-valikon kohdassa **Asenna puhelimeen** on Androidille suora Asenna-nappi (kun selain tarjoaa asennusta) ja ohjeet sekä Androidille että iPhonelle. Asennettuna sivu aukeaa omasta Manse-kuvakkeestaan ilman selaimen palkkeja. Sovelluskauppaa tai tunnuksia ei tarvita.

## Sheetin välilehdet
| Välilehti | Mitä sinne kirjoitetaan |
|---|---|
| **Ottelut** | Pvm, Klo, Joukkueet (esim. `Manse – Kiri`), Kenttä (pudotusvalikko), Sarja, Tulos (Joukkueet-sarakkeen järjestyksessä, esim. `2-1`, tasajaksoissa ratkaisu sulkuihin `1-1 (2-3)`; sivu päättelee voiton/tappion), Pesistulokset (ottelun linkki pesistulokset.fi:stä; pelatulla ottelulla näkyy Pöytäkirja-linkkinä). Roolisarakkeisiin (Kirjuri…) talkoovastaava kirjoittaa nimet. Koti/Vieras päätellään joukkueista, mutta sen voi myös valita itse. |
| **Talkoot** | Muut talkoot: Pvm, Klo, Loppu, Tapahtuma, Tehtävä, Paikka, **Tarve** (montako tekijää) ja **Nimet** (talkoovastaava kirjoittaa, pilkulla erotettuna). |
| **Tapahtumat** | Harjoitukset, palaverit, turnaukset, leirit, juhlat. *Kyydit = Kyllä* tuo tapahtuman Kyydit-välilehdelle. Linkki-sarakkeeseen voi laittaa esim. leirisivun osoitteen. |
| **Kyydit** | Täyttyy sivustolta. Valmentaja voi muokata tai poistaa rivejä. |
| **Tiedotteet** | Näkyvät etusivulla *Näytä asti* -päivään saakka (tyhjä = aina). |
| **Ohjeet** | Sivun Ohjeet-välilehdelle: Otsikko, Teksti (rivinvaihdot säilyvät), Linkki. Järjestys = rivien järjestys. Jos otsikko on sama kuin talkoorooli (esim. *Kirjuri* tai *Kioski*, joka kattaa Kioski 1 ja Kioski 2), roolin viereen tulee ⓘ-linkki ohjeeseen. |
| **Pelaajat** | Joukkueen pelaajat, yksi rivi per pelaaja (esim. *Ella Virtanen*). Vuorot ja kyydit kirjataan pelaajan nimellä, eli nimi edustaa pelaajan perhettä. Sivun valinnat (Valitse pelaaja, kyydin kuljettaja ja kyytiläinen) käyttävät tätä listaa, ja Sheetin roolisarakkeissa ja kyytien kuljettajasarakkeessa on sama lista pudotusvalikkona. Kun lista on täytetty, kyytejä voi tarjota ja niihin liittyä vain listan nimillä. |
| **Kentät** | Nimi, Osoite, Pinta, Karttalinkki. Kirjoita osoite kokonaan (katu, postinumero, kaupunki). Siitä tulee karttalinkki kaikkialle, missä paikkaa käytetään, ja linkki avautuu puhelimen karttasovellukseen (iPhonella Apple Kartat, Androidilla Google Maps). Karttalinkki-sarakkeeseen voi liittää Google Mapsista jaetun linkin, jos osoite ei osu tarkasti oikeaan kohtaan (esim. iso urheilualue). Ottelujen Kenttä ja muiden välilehtien Paikka valitaan tämän listan nimistä. |
| **Asetukset** | Joukkueen nimi, kausi, **Osiot**, ottelutalkoiden osio, koti- ja vieraspelin talkooroolit, **leiripelin talkooroolit** (leirien koti- ja vieraspelit) sekä **Lukko** (AUKI / LUKITTU, koskee kyytejä). |

ID-sarakkeen täyttää skripti itse, joten jätä se tyhjäksi. Päivämäärän voi kirjoittaa muodossa `16.5.` tai päivämääränä.
Jos muutat talkoorooleja Asetuksissa, aja **Kausisivusto → Luo / korjaa välilehdet**, niin uudet roolisarakkeet syntyvät.
