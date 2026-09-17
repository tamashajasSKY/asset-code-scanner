# asset-code-scanner
Mobile-friendly asset and barcode scanner with photo evidence, GPS data, master-list validation, local storage and Excel/CSV export. Includes Dell-specific Service Tag support.
# Eszköz- és vonalkódolvasó

Mobiltelefonra optimalizált, böngészőből használható alkalmazás eszközök vonalkódos azonosítóinak beolvasására, dokumentálására és exportálására.

Az alkalmazás több gyártó eszközeivel használható. Dell módban további Service Tag-, Express Service Code-, PPID- és támogatási funkciókat biztosít.

## Fő funkciók

- Azonosítók beolvasása élő kameraképről
- Beolvasás fényképről
- QR-, Data Matrix-, Code 128- és Code 39-kódok kezelése
- Fénykép forgatása, nagyítása és kicsinyítése
- Kézzel mozgatható és méretezhető beolvasási terület
- Manuális azonosítórögzítés fényképpel
- Korábban rögzített adatok módosítása
- Fényképek és GPS-koordináták tárolása
- Dell és nem Dell eszközök elkülönített kezelése
- Mesterlista betöltése Excel-fájlból
- Mesterlista-egyezés és eszköztípus-eltérés jelzése
- Excel-, CSV- és teljes ZIP-export
- A készüléken tárolt beolvasások védett törlése

## Dell-specifikus funkciók

Dell mód kiválasztásakor az alkalmazás további ellenőrzéseket és funkciókat biztosít:

- 7 karakteres Dell Service Tag felismerése
- Express Service Code átalakítása Service Tag értékre
- PPID-kódok elkülönítése a Service Tag értékektől
- Dokkolók SVC TAG / Code 128 vonalkódjának kezelése
- MyDell QR-kódok támogatása
- Dell támogatási és garanciaoldal megnyitása Service Tag alapján
- Szigorúbb Dell-azonosítóformátum-ellenőrzés

A Service Tag önmagában nem tartalmaz megbízható információt az eszköz típusáról. Az eszköztípus ellenőrzése a betöltött mesterlista megfelelő sora alapján történik.

## Nem Dell mód

Nem Dell módban az alkalmazás más gyártók olvasható vonalkódjait és azonosítóit is képes rögzíteni.

Ebben az üzemmódban:

- nem fut Dell Service Tag-formátumellenőrzés;
- tetszőleges olvasható vonalkód rögzíthető;
- a rekord külön „Nem Dell” jelölést kap;
- fénykép és GPS-adat ugyanúgy csatolható;
- az adatok Excel-, CSV- és ZIP-formátumban exportálhatók.

## Adattárolás

Az alkalmazás jelenlegi változata nem használ központi adatbázist vagy saját backendet.

A következő adatok a telefon vagy számítógép böngészőjének helyi tárhelyén maradnak:

- beolvasott azonosítók;
- eszközadatok;
- csatolt fényképek;
- GPS-koordináták;
- betöltött mesterlista;
- felhasználói beállítások.

Az adatok nem szinkronizálódnak automatikusan másik készülékre.

> A böngésző adatainak törlése, az alkalmazás tárhelyének ürítése vagy a készülék elvesztése adatvesztést okozhat. Rendszeres teljes ZIP-mentés javasolt.

## Mesterlista

A mesterlistának Excel-formátumúnak kell lennie, és tartalmaznia kell egy `Data` nevű munkalapot.

Az alkalmazás:

1. beolvassa a `Data` munkalapot;
2. azonosítja a Service Tag vagy eszközazonosító oszlopát;
3. összehasonlítja a beolvasott kódot a mesterlistával;
4. jelzi, hogy az eszköz szerepel-e a listában;
5. figyelmeztet, ha a kiválasztott eszköztípus eltér a mesterlistában szereplő típustól;
6. frissített Excel- vagy CSV-fájlt készít.

A korábbi beolvasások mesterlista-ellenőrzése később ismét lefuttatható.

## Használat telefonon

Az élő kamera használatához az alkalmazást HTTPS-kapcsolaton keresztül kell megnyitni.

1. Add meg a beolvasó nevét.
2. Válaszd ki az eszköz típusát.
3. Válaszd ki, hogy Dell vagy nem Dell eszközről van szó.
4. Indítsd el a kamerát.
5. Tartsd a vonalkódot a kijelölt területen belül.
6. Ha az élő beolvasás nem sikerül, készíts fényképet.
7. A fényképet szükség szerint forgasd vagy nagyítsd.
8. Húzd a beolvasási területet közvetlenül a kódra.

Dell dokkoló esetén a `SVC TAG` felirat melletti rövid vonalkódot kell megcélozni.

## Export és biztonsági mentés

Az alkalmazás az alábbi exportálási lehetőségeket biztosítja:

- Excel-munkafüzet
- CSV-fájl
- Teljes ZIP-mentés

A ZIP-mentés tartalmazhatja:

- a beolvasásokat JSON-formátumban;
- az Excel-exportot;
- a mesterlista helyi másolatát;
- a csatolt fényképeket;
- a GPS-adatokat.

A letöltött fájlok általában a telefon `Letöltések / Downloads` mappájába kerülnek.

## Helyi futtatás

A projekt Node.js-alapú fejlesztői környezetet használ.

A szükséges csomagok telepítése:

```bash
npm install
```

Fejlesztői környezet indítása:

```bash
npm run dev
```

Kiadási változat elkészítése:

```bash
npm run build
```

## Felhasznált technológiák

- HTML, CSS és JavaScript
- React / Next.js kompatibilis projektstruktúra
- ZXing vonalkódolvasó
- Barcode Detection API
- SheetJS
- JSZip
- LocalStorage
- EXIF GPS-adatok
- Böngészős helymeghatározás

## Ismert korlátozások

- A kamerás felismerés pontossága függ a telefon kamerájától, fókuszától, a megvilágítástól és a vonalkód méretétől.
- A nyomtatott szöveg automatikus OCR-felismerése még nem része az alkalmazásnak.
- A helyi adatok nem szinkronizálódnak más készülékekkel.
- A böngésző helyi tárhelyének kapacitása korlátozott.
- A Dell garanciaadatok automatikus lekérdezéséhez Dell TechDirect API-hozzáférés és biztonságos backend szükséges.
- A böngésző biztonsági szabályai miatt az alkalmazás nem írhat automatikusan tetszőleges telefonos mappába.
- GPS-adat csak EXIF-információból vagy engedélyezett helymeghatározással menthető.

## Tervezett fejlesztések

- OCR-alapú nyomtatott azonosító-felismerés
- Központi adatbázis
- Többkészülékes szinkronizálás
- Felhasználói bejelentkezés és jogosultságkezelés
- Offline működés
- PWA-telepítés
- Dell TechDirect Warranty Management API-integráció
- Automatikus konfliktus- és duplikációkezelés
- Fejlesztési, teszt- és éles környezet elkülönítése

## Adatvédelem

Az eszközazonosítók, fényképek, GPS-koordináták és mesterlisták érzékeny vállalati adatokat tartalmazhatnak.

Nyilvános repository-ba ne kerüljön:

- valódi eszközlista;
- exportált adatállomány;
- Service Tag-adatbázis;
- eszközcímkéről készült fénykép;
- GPS-adat;
- API-kulcs;
- jelszó vagy más hitelesítési adat.

A repository láthatóságát ezért kezdetben érdemes `Private` értékre állítani.

## Licenc

Belső vállalati használatra készült projekt. A licencelési és külső terjesztési feltételeket a repository nyilvánossá tétele előtt meg kell határozni.
