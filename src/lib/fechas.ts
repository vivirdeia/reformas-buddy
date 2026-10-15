const p = (x: number) => String(x).padStart(2, "0");
export const isoLocal = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const hoyISO = () => isoLocal(new Date());
export const addDias = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return isoLocal(d); };
export const diaSemana = (iso: string) => new Date(iso + "T12:00:00").getDay();
/** Fecha+hora local sin zona, p. ej. 2026-10-15T08:00:00 */
export const ts = (iso: string, hhmm: string) => new Date(`${iso}T${hhmm}:00`).toISOString();
