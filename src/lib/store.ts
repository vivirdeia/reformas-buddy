import { useEffect, useState, useCallback } from "react";
import type { DB, Obra, Usuario } from "./types";
import { createSeed, FASES } from "./seed";

const DB_KEY = "obria:db:v1";
const SESSION_KEY = "obria:session";
const EVT = "obria:change";

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch { /* ignore */ }
  const seed = createSeed();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}
export function saveDB(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(EVT));
}
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
