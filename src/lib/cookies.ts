import { useSyncExternalStore } from "react";

/** Preferencias de cookies y recursos de terceros (solo en este navegador). */
export type Consentimiento = { terceros: boolean; fecha: string };
const KEY = "obria:cookies";
const EV = "obria:cookies";

export function leerConsentimiento(): Consentimiento | null {
  if (typeof window === "undefined") return null;
  try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as Consentimiento) : null; } catch { return null; }
}

export function guardarConsentimiento(terceros: boolean) {
  try { localStorage.setItem(KEY, JSON.stringify({ terceros, fecha: new Date().toISOString() })); } catch { /* sin espacio: se pregunta de nuevo */ }
  window.dispatchEvent(new Event(EV));
}

/** Abre el panel de configuración de cookies desde cualquier enlace. */
export const abrirCookies = () => window.dispatchEvent(new Event("obria:cookies-abrir"));

let cache: { raw: string | null; v: Consentimiento | null } = { raw: null, v: null };
function snap() {
  const raw = typeof window === "undefined" ? null : localStorage.getItem(KEY);
  if (raw !== cache.raw) cache = { raw, v: leerConsentimiento() };
  return cache.v;
}
function sub(cb: () => void) {
  window.addEventListener(EV, cb); window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EV, cb); window.removeEventListener("storage", cb); };
}
export const useConsentimiento = () => useSyncExternalStore(sub, snap, () => null);

export const FUENTES_URL = "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap";
