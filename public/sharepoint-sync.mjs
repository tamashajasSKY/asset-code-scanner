import { GraphError, sharePointGraph } from "./sharepoint-graph.mjs";

const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const scopes = [
  "https://graph.microsoft.com/Lists.SelectedOperations.Selected",
  "https://graph.microsoft.com/Files.SelectedOperations.Selected"
];

function checkConfig(config) {
  const { tenantId, clientId, siteId, listId, driveId, photoFolderId, listUrl } = config;
  const url = new URL(listUrl);
  if (!uuid.test(tenantId) || !uuid.test(clientId) || !uuid.test(listId)
    || typeof siteId !== "string" || !/^[a-z\d.-]+\.sharepoint\.com,[a-f\d-]+,[a-f\d-]+$/i.test(siteId)
    || url.host !== siteId.split(",")[0] || url.protocol !== "https:" || url.username || url.password
    || !/^[a-z\d!_-]+$/i.test(driveId || "") || !/^[a-z\d_-]+$/i.test(photoFolderId || "")) {
    throw new Error("Érvénytelen SharePoint-beállítás.");
  }
  return config;
}

function openQueue(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("scans", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function queueTransaction(db, mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("scans", mode);
    const result = operation(transaction.objectStore("scans"));
    transaction.oncomplete = () => resolve(result.result);
    transaction.onabort = () => reject(transaction.error);
  });
}

function changeEntry(db, id, change) {
  return queueTransaction(db, "readwrite", store => {
    const request = store.get(id);
    request.onsuccess = () => {
      const next = change(request.result);
      if (next) store.put(next);
    };
    return request;
  });
}

function readPhoto(photo) {
  if (!photo) return null;
  if (!/^data:image\/jpeg;base64,[a-z\d+/]+=*$/i.test(photo)) throw new Error("Nem támogatott fotóformátum.");
  const bytes = Uint8Array.from(atob(photo.split(",")[1]), c => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/jpeg" });
}

export async function startSharePointSync(panel, onChanged) {
  const base = new URL("./", import.meta.url);
  const configResponse = await fetch(new URL("sharepoint-config.json", base), { cache: "no-store" });
  if (!configResponse.ok) throw new Error("A SharePoint-beállítás nem tölthető be.");
  const config = await configResponse.json();
  if (!config.enabled) return null;
  panel.hidden = false;
  const status = panel.querySelector("#sharePointStatus");
  const connect = panel.querySelector("#sharePointConnect");
  const retry = panel.querySelector("#sharePointRetry");
  const disconnect = panel.querySelector("#sharePointDisconnect");
  const list = panel.querySelector("#sharePointList");
  try {
    checkConfig(config);
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("sharepoint-auth/msal-browser.min.js", base).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    const { PublicClientApplication } = window.msal;
    const identity = new PublicClientApplication({
      auth: { clientId: config.clientId, authority: "https://login.microsoftonline.com/" + config.tenantId, redirectUri: new URL("sharepoint-redirect.html", base).href },
      cache: { cacheLocation: "memoryStorage" }
    });
    await identity.initialize();
    const key = "asset-scanner:sharepoint:" + config.tenantId + ":" + config.clientId + ":" + config.listId;
    const db = await openQueue(key);
    const all = () => queueTransaction(db, "readonly", store => store.getAll());
    let account = null;
    let linkedAccount = localStorage.getItem(key);
    let state = new Map();
    let running = false;
    let message = "";
    let blockedUntil = 0;
    let connection = new AbortController();
    list.href = config.listUrl;
    list.hidden = false;
    connect.disabled = false;

    async function refresh() {
      const entries = await all();
      state = new Map(entries.map(entry => [entry.id, entry]));
      const pending = entries.filter(e => e.pending);
      const failed = pending.filter(e => e.error).length;
      status.textContent = [message || (account ? "Kapcsolódva a SharePointhoz." : "A szinkronhoz jelentkezz be céges Microsoft 365-fiókkal."),
        pending.length ? "Feltöltésre vár: " + pending.length + "." : "",
        failed ? "Ellenőrzést igényel: " + failed + "." : ""].filter(Boolean).join(" ");
      connect.hidden = !!account;
      disconnect.hidden = !account;
      retry.disabled = !account || running;
      onChanged();
    }

    function signIn() {
      connect.disabled = true;
      message = "Microsoft 365-bejelentkezés folyamatban…";
      refresh().catch(showFailure);
      const request = { scopes, prompt: "select_account" };
      const authentication = identity.loginPopup(request);
      return authentication.then(async result => {
        if (result.account.tenantId.toLowerCase() !== config.tenantId.toLowerCase()) throw new Error("Másik Microsoft 365-szervezethez tartozó fiók.");
        if (linkedAccount && linkedAccount !== result.account.homeAccountId) throw new Error("Ehhez a böngészőprofilhoz már másik Microsoft 365-fiók tartozik.");
        await sharePointGraph(config, result.accessToken).verify();
        localStorage.setItem(key, result.account.homeAccountId);
        linkedAccount = result.account.homeAccountId;
        account = result.account;
        message = "";
        return flush();
      }).catch(error => {
        message = error instanceof GraphError ? error.message : "A bejelentkezés nem sikerült. Ellenőrizd a fiókot és a felugró ablak engedélyét. Másik fiókhoz használj külön böngészőprofilt.";
      }).finally(() => {
        connect.disabled = false;
        return refresh();
      });
    }

    function showFailure() {
      status.textContent = "A szinkron állapota nem olvasható. Ellenőrizd a böngésző helyi tárhelyét.";
    }

    async function flush() {
      if (!account || !navigator.onLine || running || blockedUntil > Date.now()) return;
      if (navigator.locks) {
        return navigator.locks.request(key, { ifAvailable: true }, lock => lock ? drain() : undefined);
      }
      return drain();
    }

    async function drain() {
      if (!account || !navigator.onLine || running || blockedUntil > Date.now()) return;
      running = true;
      retry.disabled = true;
      const signal = connection.signal;
      try {
        let token;
        try {
          token = await identity.acquireTokenSilent({ account, scopes });
        } catch {
          if (!signal.aborted) {
            account = null;
            message = "A Microsoft 365-munkamenet lejárt. Jelentkezz be újra.";
          }
          return;
        }
        const graph = sharePointGraph(config, token.accessToken);
        for (const entry of await all()) {
          if (signal.aborted) break;
          if (!entry.pending || entry.retryAt > Date.now()) continue;
          try {
            const result = await graph.save(entry, signal);
            await changeEntry(db, entry.id, latest => {
              if (!latest) return null;
              if (latest.revision !== entry.revision) return { ...latest, remoteRevision: entry.revision };
              return { id: entry.id, revision: entry.revision, remoteRevision: entry.revision, pending: false, conflict: result.conflict };
            });
          } catch (error) {
            if (signal.aborted) break;
            const statusCode = error.status;
            if (statusCode === 401) { account = null; message = "Jelentkezz be újra a Microsoft 365-be."; break; }
            const temporary = !statusCode || [408, 429, 503, 504].includes(statusCode) || statusCode >= 500;
            const attempts = (entry.attempts || 0) + 1;
            const wait = Math.max(error.retryAfter || 0, Math.min(300000, 5000 * 2 ** Math.min(attempts, 6)));
            await changeEntry(db, entry.id, latest => latest?.revision === entry.revision ? {
              ...latest, attempts, retryAt: temporary ? Date.now() + wait : Number.MAX_SAFE_INTEGER,
              error: statusCode === 412 ? "A közös rekord időközben módosult." : error instanceof GraphError ? error.message : "A feltöltés megszakadt."
            } : null);
            if (statusCode === 429 || statusCode === 503) { blockedUntil = Date.now() + wait; break; }
          }
        }
      } finally {
        running = false;
        await refresh();
      }
    }

    connect.addEventListener("click", () => signIn().catch(showFailure));
    retry.addEventListener("click", async () => {
      try {
        for (const e of await all()) {
          if (e.pending && e.error) await changeEntry(db, e.id, latest => latest?.revision === e.revision ? { ...latest, retryAt: 0 } : null);
        }
        await flush();
      } catch { showFailure(); }
    });
    disconnect.addEventListener("click", async () => {
      connection.abort();
      connection = new AbortController();
      const signedIn = account;
      account = null;
      message = "A feltöltés szünetel. A várakozó tételek ezen az eszközön maradnak.";
      try { if (signedIn) await identity.clearCache({ account: signedIn }); await refresh(); } catch { showFailure(); }
    });
    window.addEventListener("online", () => flush().catch(showFailure));
    setInterval(() => flush().catch(showFailure), 15000);
    const cached = identity.getAllAccounts().find(a => a.homeAccountId === linkedAccount && a.tenantId.toLowerCase() === config.tenantId.toLowerCase());
    if (cached) account = cached;
    await refresh();
    flush().catch(showFailure);

    return {
      async stage(scan, isNew) {
        if (!linkedAccount) return;
        try {
          const { photo, ...fields } = scan;
          const image = readPhoto(photo);
          await changeEntry(db, scan.id, current => {
            if (!isNew && !current) return null;
            return {
              id: scan.id, revision: crypto.randomUUID(), remoteRevision: current?.remoteRevision,
              scan: fields, photo: image, pending: true, retryAt: 0
            };
          });
          await refresh();
          flush().catch(showFailure);
        } catch {
          status.textContent = "A beolvasás nem került a feltöltési sorba. A helyi listából exportálható.";
        }
      },
      label(id) {
        const e = state.get(id);
        if (!e) return "";
        if (e.pending) return e.error || "Feltöltésre vár";
        return e.conflict ? "Szinkronizálva · eltérő ülőhely vagy használó" : "Szinkronizálva";
      }
    };
  } catch (error) {
    status.textContent = "A SharePoint-szinkron nem indítható. Ellenőrizd a konfigurációt és a hozzáférést.";
    throw error;
  }
}
