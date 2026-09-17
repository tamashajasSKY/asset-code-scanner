# Eszköz- és vonalkódolvasó

Mobiltelefonra optimalizált, böngészőből használható alkalmazás eszközök vonalkódos azonosítóinak beolvasására, dokumentálására és exportálására.

Az alkalmazás több gyártó eszközeivel használható. Dell módban további Service Tag-, Express Service Code-, PPID- és támogatási funkciókat biztosít.

## Fő funkciók

- élő kamerás és fényképes kódbeolvasás;
- QR-, Data Matrix-, Code 128- és Code 39-kódok kezelése;
- forgatható és nagyítható fénykép, kézzel kijelölhető beolvasási terület;
- manuális azonosítórögzítés fényképpel;
- a korábban rögzített adatok módosítása;
- fényképek és GPS-koordináták tárolása;
- Dell és nem Dell eszközök elkülönített kezelése;
- Excel-mesterlista betöltése a `Data` munkalapról;
- mesterlista-egyezés és eszköztípus-eltérés jelzése;
- Excel-, CSV- és teljes ZIP-export;
- a helyi beolvasások megerősítéssel védett törlése.

## Dell-specifikus funkciók

- 7 karakteres Dell Service Tag felismerése;
- Express Service Code átalakítása Service Tag értékre;
- PPID-kódok elkülönítése a Service Tag értékektől;
- dokkolók SVC TAG / Code 128 vonalkódjának kezelése;
- MyDell QR-kódok támogatása;
- Dell támogatási és garanciaoldal megnyitása;
- szigorúbb Dell-azonosítóformátum-ellenőrzés.

A Service Tag önmagában nem tartalmaz megbízható eszköztípus-információt. Az eszköztípus ellenőrzése a mesterlista megfelelő sora alapján történik.

## Nem Dell mód

Nem Dell módban más gyártók olvasható vonalkódjai is rögzíthetők. Ilyenkor nem fut Dell Service Tag-formátumellenőrzés, a rekord külön jelölést kap, de a fénykép-, GPS- és exportfunkciók továbbra is használhatók.

## Adattárolás

A jelenlegi változat nem használ központi adatbázist. A beolvasások, fényképek, GPS-koordináták, a betöltött mesterlista és a felhasználói beállítások a böngésző helyi tárhelyén maradnak.

> A böngésző adatainak törlése vagy a készülék elvesztése adatvesztést okozhat. Rendszeres teljes ZIP-mentés javasolt.

## Mesterlista

A mesterlistának Excel-formátumúnak kell lennie, és tartalmaznia kell egy `Data` nevű munkalapot. Az alkalmazás megkeresi az azonosító oszlopot, összehasonlítja a beolvasott kódokat a listával, jelzi az egyezést és az esetleges eszköztípus-eltérést, majd frissített Excel- vagy CSV-fájlt készíthet.

## Telefonos használat

Az élő kamera használatához HTTPS-kapcsolat szükséges.

1. Add meg a beolvasó nevét.
2. Válaszd ki az eszköz típusát és gyártóját.
3. Indítsd el a kamerát, és tartsd a kódot a kijelölt területen belül.
4. Ha az élő olvasás nem sikerül, készíts fényképet, majd forgasd, nagyítsd és jelöld ki a kódot.

Dell dokkolónál a `SVC TAG` felirat melletti rövid vonalkódot kell megcélozni.

## Fejlesztői környezet

Előfeltétel: Node.js 22 vagy újabb verzió.

```bash
npm install
npm run dev
```

Kiadási build:

```bash
npm run build
```

A projekt jelenleg `pnpm-lock.yaml` fájlt tartalmaz, ezért fejlesztéshez a pnpm használata javasolt:

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
```

## Fő technológiák

- HTML, CSS és JavaScript
- React / Next.js kompatibilis projektstruktúra
- ZXing és Barcode Detection API
- SheetJS az Excel-fájlokhoz
- JSZip a teljes mentéshez
- LocalStorage, EXIF GPS és böngészős helymeghatározás

## Ismert korlátozások

- A kamerás felismerés függ a telefon fókuszától, felbontásától és a megvilágítástól.
- A nyomtatott szöveg automatikus OCR-felismerése még nem része az alkalmazásnak.
- A helyi adatok nem szinkronizálódnak más készülékekkel.
- A Dell garanciaadatok automatikus lekérdezéséhez TechDirect API-hozzáférés és biztonságos backend szükséges.

## Tervezett fejlesztések

- OCR-alapú nyomtatott azonosító-felismerés;
- központi adatbázis és többkészülékes szinkronizálás;
- felhasználói bejelentkezés és jogosultságkezelés;
- offline működés és PWA-telepítés;
- Dell TechDirect Warranty Management API-integráció;
- fejlesztési, teszt- és éles környezet elkülönítése.

## Adatvédelem

Nyilvános repository-ba ne kerüljön valódi eszközlista, exportált adatállomány, címkefénykép, GPS-adat, API-kulcs vagy más hitelesítési adat. A repository-t kezdetben érdemes privátként létrehozni.

## Licenc

Belső vállalati használatra készült projekt. A licencelési és külső terjesztési feltételeket a repository nyilvánossá tétele előtt meg kell határozni.
