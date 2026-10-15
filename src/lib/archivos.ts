/**
 * Almacén local de archivos pesados (fotos/firmas en base64) en IndexedDB.
 * El JSON principal solo guarda referencias "idb:<id>". Nunca sale del navegador.
 */
const DB_NAME = "obria-archivos";
const STORE = "archivos";
export const REF = "idb:";
/** Cadenas data: más largas que esto se sacan del JSON principal. */
export const UMBRAL = 1500;

const cache = new Map<string, string>(); // ref -> dataURL
const inverso = new Map<string, string>(); // dataURL -> ref (deduplicación)
let listo: Promise<void> | null = null;

function abrir(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await abrir();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, modo);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { res(req ? req.result : undefined); db.close(); };
    t.onerror = () => { rej(t.error); db.close(); };
    t.onabort = () => { rej(t.error); db.close(); };
  });
}
const registrar = (ref: string, v: string) => { cache.set(ref, v); inverso.set(v, ref); };

/** Carga todos los archivos de IndexedDB en memoria (una vez). */
export function iniciarArchivos(): Promise<void> {
  if (!listo) listo = (async () => {
    try {
      const db = await abrir();
      await new Promise<void>((res, rej) => {
        const t = db.transaction(STORE, "readonly");
        const cur = t.objectStore(STORE).openCursor();
        cur.onsuccess = () => { const c = cur.result; if (c) { registrar(String(c.key), String(c.value)); c.continue(); } };
        t.oncomplete = () => { db.close(); res(); };
        t.onerror = () => { db.close(); rej(t.error); };
      });
    } catch { /* IndexedDB no disponible: se trabajará solo en memoria */ }
  })();
  return listo;
}

/** Vuelve a leer de IndexedDB las referencias que falten (p. ej. creadas en otra pestaña). */
export async function cargarFaltan(refs: string[]) {
  const faltan = refs.filter((r) => !cache.has(r));
  for (const r of faltan) {
    try { const v = await tx<string>("readonly", (s) => s.get(r)); if (typeof v === "string") registrar(r, v); } catch { /* */ }
  }
  return faltan.every((r) => cache.has(r));
}

let pendientes: Promise<unknown>[] = [];
/** Devuelve la referencia de un dataURL, guardándolo si es nuevo. */
export function externalizar(v: string): string {
  const ya = inverso.get(v);
  if (ya) return ya;
  const ref = `${REF}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  registrar(ref, v);
  pendientes.push(tx("readwrite", (s) => { s.put(v, ref); }).catch(() => window.dispatchEvent(new CustomEvent("obria:aviso", { detail: { tipo: "espacio" } }))));
  return ref;
}
export async function esperarEscrituras() { const p = pendientes; pendientes = []; await Promise.all(p); }

export const resolver = (ref: string) => cache.get(ref);
export const tieneRef = (ref: string) => cache.has(ref);

export function refsEn(texto: string): string[] {
  return Array.from(new Set(texto.match(/idb:[a-z0-9]+/g) ?? []));
}

/** Guarda un conjunto de archivos con sus ids exactos (importación). */
export async function guardarArchivos(map: Record<string, string>) {
  for (const [ref, v] of Object.entries(map)) registrar(ref, v);
  await tx("readwrite", (s) => { for (const [ref, v] of Object.entries(map)) s.put(v, ref); });
}

/** Borra los archivos que ya no referencia el JSON principal. */
export async function limpiarHuerfanos(vivos: Set<string>) {
  const muertos = Array.from(cache.keys()).filter((r) => !vivos.has(r));
  if (!muertos.length) return;
  muertos.forEach((r) => { const v = cache.get(r); cache.delete(r); if (v) inverso.delete(v); });
  try { await tx("readwrite", (s) => { muertos.forEach((r) => s.delete(r)); }); } catch { /* */ }
}

export function bytesArchivos(refs?: Set<string>) {
  let n = 0;
  cache.forEach((v, k) => { if (!refs || refs.has(k)) n += v.length; });
  return n;
}
export function archivosDe(refs: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  refs.forEach((r) => { const v = cache.get(r); if (v) out[r] = v; });
  return out;
}
