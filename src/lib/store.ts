import { useEffect, useState, useCallback } from "react";
import type { DB, Obra, Usuario } from "./types";
import { createSeed, FASES } from "./seed";

const DB_KEY = "obria:db:v1";
const SESSION_KEY = "obria:session";
const EVT = "obria:change";
const DB_VERSION = 2;

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) { const d = JSON.parse(raw) as DB; if (d.version === DB_VERSION) return d; }
  } catch { /* ignore */ }
  const seed = createSeed();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}
export function saveDB(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(EVT));
}
/** Aplica un cambio sobre la BD. Devuelve false si localStorage está lleno. */
export function mutate(fn: (db: DB) => void): boolean {
  const db = loadDB();
  fn(db);
  try { saveDB(db); return true; } catch { alert("No queda espacio en el dispositivo. Elimina alguna foto e inténtalo de nuevo."); return false; }
}
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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
export function resetDB() { saveDB(createSeed()); }

export function useDB() {
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => {
    const sync = () => setDb(loadDB());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return db;
}

export function useSession() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setUserId(localStorage.getItem(SESSION_KEY));
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  const login = useCallback((id: string) => { localStorage.setItem(SESSION_KEY, id); window.dispatchEvent(new Event(EVT)); }, []);
  const logout = useCallback(() => { localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event(EVT)); }, []);
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
