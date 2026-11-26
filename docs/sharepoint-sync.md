# SharePoint-szinkron beállítása

## Célerőforrások

Hozz létre a jóváhagyott SharePoint-webhelyen egy **Eszközbeolvasások** listát és egy külön fotómappát egy belső dokumentumtárban. A felhasználóknak írási jog kell mindkettőre, a nyilvántartás olvasói olvasási jogot kapjanak. A fotólink a meglévő SharePoint-jogosultságokat használja. A Graph a rekord **Létrehozta** mezőjében a Microsoft 365-fiókot rögzíti, a **Rögzítő** oszlop az alkalmazásban megadott név.

A listában az alábbi belső oszlopneveket használd. Beállítás után a megjelenített nevek magyarra átírhatók.

| Belső név | Típus | Tartalom |
| --- | --- | --- |
| `Title` | Egysoros szöveg, meglévő | Eszközazonosító |
| `ScannerId` | Egysoros szöveg, kötelező, egyedi és indexelt | Egyedi beolvasásazonosító |
| `ScannerRevision` | Egysoros szöveg | Feltöltött verzió azonosítója |
| `ScannerAssetKey` | Egysoros szöveg, indexelt | Egyező eszközök keresési kulcsa |
| `ScannerType`, `ScannerVendor` | Egysoros szöveg | Típus és gyártó |
| `ScannerSeat`, `ScannerAssignee`, `ScannerOperator` | Egysoros szöveg | Ülőhely, használó és rögzítő |
| `ScannerCaptured` | Dátum és idő | Beolvasás időpontja |
| `ScannerMethod`, `ScannerPpid`, `ScannerGps` | Egysoros szöveg | Beolvasási mód, PPID és koordináta |
| `ScannerNote`, `ScannerPhotoUrl` | Többsoros, egyszerű szöveg | Megjegyzés és a fotó címe |
| `ScannerConflict` | Igen/Nem, alapérték Nem | Másik ülőhelyhez vagy használóhoz rögzítették |

Kapcsold be a lista verziókövetését. Az azonos eszköz külön beolvasásai külön sorok. Az egyediséget a `ScannerId` biztosítja. A szinkron a másik ülőhely vagy használó észlelésekor jelöli az adott sort. A már jelzett eltérés ellenőrzését a listában kell kezelni.

## Microsoft Entra ID

1. Regisztrálj egy egyetlen tenantban használható **Single-page application** alkalmazást. A redirect URI az éles alkalmazás címe a `/sharepoint-redirect.html` útvonallal. A próbakörnyezetnek a tényleges saját HTTPS-címét regisztráld. A Microsoft dokumentációja szerint a redirect bridge oldalt COOP fejléc nélkül kell kiszolgálni.
2. Add hozzá a Microsoft Graph **delegált `Lists.SelectedOperations.Selected` és `Files.SelectedOperations.Selected`** jogosultságát, és kérj adminisztrátori jóváhagyást.
3. A tenant adminisztrátora adjon az alkalmazásnak `write` hozzáférést a kijelölt listára és a fotómappára. Az alkalmazás a bejelentkezett felhasználó SharePoint-jogosultságaival együtt kap hozzáférést. [Lista engedélyezése](https://learn.microsoft.com/en-us/graph/api/list-post-permissions?view=graph-rest-1.0) · [Mappa engedélyezése](https://learn.microsoft.com/en-us/graph/api/driveitem-post-permissions?view=graph-rest-1.0)
4. Töltsd ki a `public/sharepoint-config.json` fájlt. Az azonosítók és a lista megnyitási címe nyilvános klienskonfigurációs értékek. A böngészőnek kliensazonosító kell, kliensjelszó nélkül.

```json
{
  "enabled": true,
  "tenantId": "<Microsoft Entra tenant GUID>",
  "clientId": "<alkalmazás GUID>",
  "siteId": "<Graph összetett webhelyazonosító>",
  "listId": "<SharePoint lista GUID>",
  "driveId": "<fotómappa dokumentumtárának Graph drive azonosítója>",
  "photoFolderId": "<fotómappa Graph driveItem azonosítója>",
  "listUrl": "https://tenant.sharepoint.com/sites/eszkozok/Lists/Eszkozbeolvasasok/AllItems.aspx"
}
```

[Microsoft Graph Selected jogosultságok](https://learn.microsoft.com/en-us/graph/permissions-selected-overview) · [MSAL redirect bridge](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/redirect-bridge.md)

## Próba és Excel

1. Jelentkezz be két telefonról két jóváhagyott céges fiókkal. Mindkét telefonról ments egy új eszközt és fotót, majd ellenőrizd a sorokat és fotólinkeket a listában.
2. Az egyik telefonon kapcsold ki a hálózatot, és készíts beolvasást. Ellenőrizd a várakozó státuszt. Hálózat visszakapcsolása után ugyanahhoz a beolvasáshoz egyetlen sor tartozzon a közös listában.
3. Mindkét telefonon rögzítsd ugyanazt a próbaazonosítót eltérő ülőhelyhez. Mindkét sor maradjon meg, és a később észlelt soron jelenjen meg az eltérés. Próbáld ki egy már szinkronizált rekord helyi szerkesztését is.
4. A Microsoft Lists felületén válaszd az **Exportálás → Exportálás Excelbe** műveletet, majd mentsd a kapott munkafüzetet a közös dokumentumtárba. Az **Adatok → Az összes frissítése** művelet hozza be az új listatételeket. [Microsoft Lists Excel-export](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/export-to-excel-from-sharepoint-or-lists)

A felület az első sikeres kapcsolódás után felvett beolvasásokat küldi. A feltöltési sor ezen a böngészőprofilon marad, amíg a küldés sikeres. Az oldal újranyitása után a folytatáshoz ismét be kell jelentkezni. A munkamenet alatt a hálózat visszatérésekor a program újrapróbálja a küldést. A helyi lista törlése mellett a várakozó tételek a feltöltési sorban megmaradnak. A teljes böngészőtár törlése a feltöltési sort is eltávolítja.
