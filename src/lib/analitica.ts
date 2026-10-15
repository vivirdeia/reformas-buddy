import type { DB, Obra } from "./types";
import { avance } from "./store";
import { importeHito, vigente } from "./economia";
import { addDias, diaSemana, hoyISO } from "./fechas";

export const dd = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);

/** Días de desviación sobre el plan (positivo = retraso). */
export function desviacion(o: Obra, hoy = hoyISO()) {
  if (o.estado === "terminada") { const l = o.fases.at(-1)!; return l.finReal ? dd(l.finPrevisto, l.finReal) : 0; }
  const cur = o.fases.find((f) => f.estado !== "completada");
  if (!cur) return 0;
  const ini = cur.inicioReal ? dd(cur.inicioPrevisto, cur.inicioReal) : 0;
  return Math.max(0, ini, dd(cur.finPrevisto, hoy));
}
export const finEstimado = (o: Obra) => addDias(o.fechaFinPrevista, desviacion(o));

const horas = (f: { entrada: string; salida?: string | undefined }, now = Date.now()) => ((f.salida ? new Date(f.salida).getTime() : now) - new Date(f.entrada).getTime()) / 3600000;

export function oficioDe(db: DB, id: string) {
  const u = db.usuarios.find((x) => x.id === id);
  return u?.rol === "jefe_obra" ? "Jefe de obra" : u?.oficio ?? "Peón";
}

export function costeReal(db: DB, o: Obra) {
  const h = db.fichajes.filter((f) => f.obraId === o.id && f.salida);
  const manoObra = h.reduce((s, f) => s + horas(f) * (db.costeHora[oficioDe(db, f.userId)] ?? 20), 0);
  const total = manoObra + o.costes.materiales + o.costes.gremios;
  const av = Math.max(avance(o), 1) / 100;
  const proyectado = o.estado === "terminada" ? total : total / av;
  const v = vigente(o);
  const margen = v - proyectado;
  const pct = margen / v;
  return { manoObra, horas: h.reduce((s, f) => s + horas(f), 0), materiales: o.costes.materiales, gremios: o.costes.gremios, total, proyectado, vigente: v, margen, pct };
}
export const salud = (pct: number) => (pct >= 0.2 ? "ok" : pct >= 0.1 ? "warn" : "danger") as "ok" | "warn" | "danger";
export const SALUD_TXT = { ok: "text-ok", warn: "text-warn", danger: "text-danger" } as const;
export const SALUD_BG = { ok: "bg-ok", warn: "bg-warn", danger: "bg-danger" } as const;

export function lunes(iso = hoyISO()) { const d = diaSemana(iso); return addDias(iso, d === 0 ? -6 : 1 - d); }

export function horasDesde(db: DB, filtro: (f: DB["fichajes"][number]) => boolean, desde: string) {
  const now = Date.now();
  return db.fichajes.filter((f) => filtro(f) && f.entrada.slice(0, 10) >= desde).reduce((s, f) => s + horas(f, now), 0);
}

export function cobrosPorMes(db: DB, meses = 6) {
  const hoy = new Date();
  const out: { clave: string; label: string; total: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ clave, label: d.toLocaleDateString("es-ES", { month: "short" }), total: 0 });
  }
  db.obras.forEach((o) => o.pagos.forEach((h) => {
    if (h.estado !== "pagado" || !h.pagadoEn) return;
    const m = out.find((x) => x.clave === h.pagadoEn!.slice(0, 7));
    if (m) m.total += importeHito(o, h);
  }));
  return out;
}

export const kEuro = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: n >= 100000 ? "compact" : "standard", maximumFractionDigits: n >= 100000 ? 1 : 0 }).format(n);
