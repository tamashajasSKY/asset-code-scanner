const graphRoot = "https://graph.microsoft.com/v1.0";
const text = (value, limit = 255) => String(value ?? "").trim().slice(0, limit);
const normalize = value => text(value).normalize("NFKC").toLocaleUpperCase("hu-HU");

export function scanFields(scan, revision) {
  const identifier = text(scan.serviceTag);
  if (!identifier || !/^[a-z0-9-]{8,80}$/i.test(scan.id)) throw new Error("Érvénytelen eszköz- vagy beolvasásazonosító.");
  return {
    Title: identifier,
    ScannerId: scan.id,
    ScannerRevision: revision,
    ScannerAssetKey: text(normalize(scan.vendor || "Dell") + "|" + normalize(identifier)),
    ScannerType: text(scan.deviceType),
    ScannerVendor: text(scan.vendor),
    ScannerSeat: text(scan.seat),
    ScannerAssignee: text(scan.assignee),
    ScannerOperator: text(scan.scannedBy),
    ScannerCaptured: new Date(scan.timestamp).toISOString(),
    ScannerMethod: text(scan.source),
    ScannerNote: text(scan.note, 4000),
    ScannerPpid: text(scan.ppid),
    ScannerGps: scan.photoLocation ? [scan.photoLocation.latitude, scan.photoLocation.longitude].join(", ") : ""
  };
}

export class GraphError extends Error {
  constructor(status, retryAfter) {
    super("A SharePoint kérés sikertelen (" + status + ").");
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function sharePointGraph(config, token, fetchImpl = fetch) {
  const items = "/sites/" + encodeURIComponent(config.siteId) + "/lists/" + encodeURIComponent(config.listId) + "/items";
  const drive = "/drives/" + encodeURIComponent(config.driveId) + "/items/" + encodeURIComponent(config.photoFolderId);

  async function request(path, options = {}, signal) {
    const url = new URL(path.startsWith("https:") ? path : graphRoot + path);
    if (url.origin !== "https://graph.microsoft.com" || !url.pathname.startsWith("/v1.0/")) throw new Error("Érvénytelen Microsoft Graph cím.");
    const headers = new Headers(options.headers);
    headers.set("Authorization", "Bearer " + token);
    const response = await fetchImpl(url.href, {
      ...options, headers, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000), cache: "no-store", redirect: "error"
    });
    if (!response.ok) {
      const retry = response.headers.get("Retry-After");
      const delay = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 0;
      throw new GraphError(response.status, Math.max(0, delay || 0));
    }
    return response.status === 204 ? null : response.json();
  }

  function findPath(field, value) {
    const literal = "'" + value.replace(/'/g, "''") + "'";
    return items + "?" + new URLSearchParams({ "$filter": "fields/" + field + " eq " + literal, "$expand": "fields", "$top": "100" });
  }

  async function findOne(id, signal) {
    const result = await request(findPath("ScannerId", id), {}, signal);
    return result.value[0] || null;
  }

  async function hasSeatConflict(fields, signal) {
    const seat = normalize(fields.ScannerSeat);
    const person = normalize(fields.ScannerAssignee);
    if (!seat && !person) return false;
    let next = findPath("ScannerAssetKey", fields.ScannerAssetKey);
    while (next) {
      const result = await request(next, {}, signal);
      if (result.value.some(row => {
        const other = row.fields;
        if (other.ScannerId === fields.ScannerId) return false;
        const otherSeat = normalize(other.ScannerSeat), otherPerson = normalize(other.ScannerAssignee);
        return !!((seat && otherSeat && seat !== otherSeat) || (person && otherPerson && person !== otherPerson));
      })) return true;
      next = result["@odata.nextLink"];
    }
    return false;
  }

  return {
    async verify(signal) {
      await request(items + "?$top=1", {}, signal);
      await request(drive + "?$select=id,folder", {}, signal).then(result => {
        if (!result.folder) throw new Error("A megadott SharePoint-erőforrás nem fotómappa.");
      });
    },
    async save(entry, signal) {
      const fields = scanFields(entry.scan, entry.revision);
      let row = await findOne(entry.scan.id, signal);
      if (row && row.fields.ScannerRevision !== entry.revision && row.fields.ScannerRevision !== entry.remoteRevision) {
        throw new GraphError(412, 0);
      }
      if (row?.fields.ScannerRevision !== entry.revision) {
        if (entry.photo && !row?.fields?.ScannerPhotoUrl) {
          const filename = entry.scan.id + ".jpg";
          const file = await request(drive + ":/" + filename + ":/content", {
            method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: entry.photo
          }, signal);
          const photoUrl = new URL(file.webUrl);
          if (photoUrl.protocol !== "https:" || photoUrl.host !== new URL(config.listUrl).host) throw new Error("Érvénytelen SharePoint-fotóhivatkozás.");
          fields.ScannerPhotoUrl = text(photoUrl.href, 2000);
        }
        const json = { "Content-Type": "application/json" };
        if (row) {
          const etag = row.eTag || row["@odata.etag"];
          if (!etag) throw new GraphError(412, 0);
          await request(items + "/" + encodeURIComponent(row.id) + "/fields", {
            method: "PATCH", headers: { ...json, "If-Match": etag }, body: JSON.stringify(fields)
          }, signal);
        } else {
          try {
            row = await request(items, { method: "POST", headers: json, body: JSON.stringify({ fields }) }, signal);
          } catch (error) {
            if (!(error instanceof GraphError) || ![400, 409].includes(error.status)) throw error;
            row = await findOne(entry.scan.id, signal);
            if (!row) throw error;
            if (row.fields?.ScannerRevision !== entry.revision) throw new GraphError(412, 0);
          }
        }
      }
      const conflict = await hasSeatConflict(fields, signal);
      // A később észlelt eltérést az észlelő soron jelöljük a közös listában.
      if (conflict && !row.fields?.ScannerConflict) {
        const latest = await findOne(entry.scan.id, signal);
        const etag = latest?.eTag || latest?.["@odata.etag"];
        if (etag && latest.fields.ScannerRevision === entry.revision) {
          await request(items + "/" + encodeURIComponent(latest.id) + "/fields", {
            method: "PATCH", headers: { "Content-Type": "application/json", "If-Match": etag },
            body: JSON.stringify({ ScannerConflict: true })
          }, signal);
        }
      }
      return { conflict };
    }
  };
}
