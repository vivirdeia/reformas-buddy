import { useEffect, useState, useCallback } from "react";
import type { DB, Obra, Usuario } from "./types";
import { createSeed, DB_VERSION, FASES } from "./seed";
import {
  iniciarArchivos, cargarFaltan, externalizar, resolver, refsEn, limpiarHuerfanos,
  esperarEscrituras, guardarArchivos, archivosDe, bytesArchivos, REF, UMBRAL,
} from "./archivos";

export const DB_KEY = "obria:db:v1";
const SESSION_KEY = "obria:session";
export const RESPALDO_KEY = "obria:db:respaldo-corrupto";
const EVT = "obria:change";
export const AVISO_EVT = "obria:aviso";
export { DB_VERSION };

export type Aviso = { tipo: "espacio" } | { tipo: "corrupto" };
export const avisar = (a: Aviso) => window.dispatchEvent(new CustomEvent(AVISO_EVT, { detail: a }));

/* ---------- Migraciones (nunca resembrar) ---------- */
/** Cada entrada transforma la BD desde la versión anterior a la indicada. Solo añade campos con valores por defecto. */
const MIGRACIONES: Record<number, (d: DB) => void> = {
  // v7: las fotos base64 salen del JSON a IndexedDB (lo hace serializar al guardar).
  7: () => {},
};
function normalizar(d: DB) {
  d.solicitudes ??= []; d.fichajes ??= []; d.tareas ??= []; d.usuarios ??= []; d.gremios ??= []; d.costeHora ??= {};
  d.obras.forEach((o) => {
    o.notas ??= []; o.incidencias ??= []; o.ordenesCambio ??= []; o.partesDiarios ??= []; o.hitos ??= [];
    o.documentos ??= []; o.antesDespues ??= []; o.pagos ??= []; o.costes ??= { materiales: 0, gremios: 0 };
  });
}
/** Aplica en orden las migraciones pendientes. Devuelve true si ha cambiado algo. */
export function migrar(d: DB): boolean {
  const desde = typeof d.version === "number" ? d.version : 1;
  for (let v = desde + 1; v <= DB_VERSION; v++) MIGRACIONES[v]?.(d);
  normalizar(d);
  if (desde < DB_VERSION) { d.version = DB_VERSION; return true; }
  return false;
}
const pareceDB = (d: unknown): d is DB =>
  !!d && typeof d === "object" && Array.isArray((d as DB).obras) && Array.isArray((d as DB).usuarios);

/* ---------- Serialización con archivos fuera ---------- */
const serializar = (db: DB) =>
  JSON.stringify(db, (_k, v) => (typeof v === "string" && v.startsWith("data:") && v.length > UMBRAL ? externalizar(v) : v));
const revivir = (raw: string) => JSON.parse(raw, (_k, v) => (typeof v === "string" && v.startsWith(REF) ? resolver(v) ?? "" : v)) as DB;

let memoria: DB | null = null; // copia en memoria si el navegador no deja guardar

function leerRaw() { try { return localStorage.getItem(DB_KEY); } catch { return null; } }

/** Lee la BD (con referencias a archivos sin resolver). Migra si hace falta. */
export function loadDB(): DB {
  const raw = leerRaw();
  if (raw) {
    let d: unknown = null;
    try { d = JSON.parse(raw); } catch { d = null; }
    if (pareceDB(d)) {
      if (migrar(d)) saveDB(d, false);
      return d;
    }
    // JSON corrupto: copia de respaldo antes de sustituir
    try { localStorage.removeItem(DB_KEY); localStorage.setItem(RESPALDO_KEY, raw); } catch { /* */ }
    try { localStorage.setItem("obria:aviso-corrupto", new Date().toISOString()); } catch { /* */ }
    if (typeof window !== "undefined") setTimeout(() => avisar({ tipo: "corrupto" }), 0);
  }
  if (memoria && !raw) return structuredClone(memoria);
  const seed = createSeed();
  saveDB(seed, false);
  return seed;
}

let gc: ReturnType<typeof setTimeout> | undefined;
/** Guarda la BD. Nunca lanza: si falta espacio avisa en la interfaz y devuelve false. */
export function saveDB(db: DB, notificar = true): boolean {
  let ok = true;
  try { localStorage.setItem(DB_KEY, serializar(db)); memoria = null; }
  catch { ok = false; memoria = structuredClone(db); avisar({ tipo: "espacio" }); }
  if (ok) {
    clearTimeout(gc);
    gc = setTimeout(async () => { await esperarEscrituras(); const r = leerRaw(); if (r) limpiarHuerfanos(new Set(refsEn(r))); }, 1500);
  }
  if (notificar) window.dispatchEvent(new Event(EVT));
  return ok;
}
/** Aplica un cambio sobre la BD. Devuelve false si no se ha podido guardar. */
export function mutate(fn: (db: DB) => void): boolean {
  const db = loadDB();
  fn(db);
  const ok = saveDB(db, false);
  if (ok) window.dispatchEvent(new Event(EVT));
  return ok;
}
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------- Copias de seguridad ---------- */
export function exportarCopia() {
  loadDB();
  const raw = leerRaw() ?? "{}";
  return JSON.stringify({ app: "obria", formato: 1, exportado: new Date().toISOString(), db: JSON.parse(raw), archivos: archivosDe(refsEn(raw)) });
}
/** Valida y aplica una copia. Lanza Error con mensaje legible si no es válida. */
export async function importarCopia(texto: string) {
  let c: { app?: string; db?: unknown; archivos?: Record<string, string> };
  try { c = JSON.parse(texto); } catch { throw new Error("El archivo no es un JSON válido."); }
  if (c.app !== "obria" || !pareceDB(c.db)) throw new Error("El archivo no es una copia de seguridad de Obria.");
  const db = c.db;
  if (typeof db.version === "number" && db.version > DB_VERSION) throw new Error("La copia es de una versión más nueva de Obria.");
  const archivos = c.archivos && typeof c.archivos === "object" ? c.archivos : {};
  const faltan = refsEn(JSON.stringify(db)).filter((r) => typeof archivos[r] !== "string");
  if (faltan.length) throw new Error(`A la copia le faltan ${faltan.length} archivos.`);
  await guardarArchivos(archivos);
  migrar(db);
  if (!saveDB(db)) throw new Error("No hay espacio suficiente para importar la copia.");
}
export function respaldoCorrupto() { try { return localStorage.getItem(RESPALDO_KEY); } catch { return null; } }
export function descartarRespaldo() { try { localStorage.removeItem(RESPALDO_KEY); localStorage.removeItem("obria:aviso-corrupto"); } catch { /* */ } }

export async function espacioUsado() {
  await iniciarArchivos();
  const raw = leerRaw() ?? "";
  let total = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; total += k.length + (localStorage.getItem(k)?.length ?? 0); } } catch { /* */ }
  let cuota: number | undefined;
  try { cuota = (await navigator.storage?.estimate?.())?.quota; } catch { /* */ }
  return { datos: raw.length, localTotal: total, localCuota: 5 * 1024 * 1024, archivos: bytesArchivos(new Set(refsEn(raw))), nArchivos: refsEn(raw).length, cuota };
}


export function useNow(ms = 1000) {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return n;
}
export const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
export function dur(ms: number, reloj = false) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const p = (x: number) => String(x).padStart(2, "0");
  return reloj ? `${p(h)}:${p(m)}:${p(ss)}` : `${h} h ${p(m)} min`;
}
export const msFichaje = (f: { entrada: string; salida?: string }, now = Date.now()) =>
  (f.salida ? new Date(f.salida).getTime() : now) - new Date(f.entrada).getTime();
export const fechaLarga = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
export function resetDB() { return saveDB(createSeed()); }

export function useDB() {
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => {
    let vivo = true;
    const sync = async () => {
      await iniciarArchivos();
      const obj = loadDB();
      const raw = leerRaw();
      if (!raw) { if (vivo) setDb(obj); return; }
      const refs = refsEn(raw);
      // Archivos creados en otra pestaña pueden tardar unos ms en llegar a IndexedDB
      for (let i = 0; i < 5 && !(await cargarFaltan(refs)); i++) await new Promise((r) => setTimeout(r, 200));
      if (vivo) setDb(revivir(raw));
    };
    const onStorage = (e: StorageEvent) => { if (e.key === DB_KEY || e.key === null) void sync(); };
    const onEvt = () => void sync();
    void sync();
    window.addEventListener(EVT, onEvt);
    window.addEventListener("storage", onStorage);
    return () => { vivo = false; window.removeEventListener(EVT, onEvt); window.removeEventListener("storage", onStorage); };
  }, []);
  return db;
}

export function useSession() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => { try { setUserId(localStorage.getItem(SESSION_KEY)); } catch { setUserId(null); } };
    const onStorage = (e: StorageEvent) => { if (e.key === SESSION_KEY || e.key === null) sync(); };
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", onStorage); };
  }, []);
  const login = useCallback((id: string) => { try { localStorage.setItem(SESSION_KEY, id); } catch { avisar({ tipo: "espacio" }); } window.dispatchEvent(new Event(EVT)); }, []);
  const logout = useCallback(() => { try { localStorage.removeItem(SESSION_KEY); } catch { /* */ } window.dispatchEvent(new Event(EVT)); }, []);
  return { userId, login, logout };
}

export function avance(o: Obra) {
  const done = o.fases.filter((f) => f.estado === "completada").length;
  const cur = o.fases.some((f) => f.estado === "en_curso" || f.estado === "bloqueada") ? 0.5 : 0;
  return Math.round(((done + cur) / o.fases.length) * 100);
}
export function faseActual(o: Obra) {
  const f = o.fases.find((x) => x.estado !== "completada");
  return f ? FASES.find((d) => d.tipo === f.tipo)!.nombre : "Entregada";
}
export const nombreFase = (t: string) => FASES.find((f) => f.tipo === t)?.nombre ?? t;
export const user = (db: DB, id?: string): Usuario | undefined => db.usuarios.find((u) => u.id === id);

export const euro = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
export const fecha = (iso?: string) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : "—";

export const ROL_LABEL: Record<Usuario["rol"], string> = { operario: "Operario", jefe_obra: "Jefe de obra", cliente: "Cliente", gerente: "Gerente" };
export const ESTADO_LABEL = { en_plazo: "En plazo", en_riesgo: "En riesgo", retrasada: "Retrasada", terminada: "Terminada" } as const;
export const SOL_LABEL = { nueva: "Nueva", contactada: "Contactada", visita: "Visita agendada", presupuestada: "Presupuestada", ganada: "Ganada", perdida: "Perdida" } as const;
